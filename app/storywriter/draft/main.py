import logging
import json
from typing import List, Dict, Optional, Tuple, Union
from bson import ObjectId
import tiktoken
from pymongo import UpdateOne
from datetime import datetime
import asyncio

from ..plan.db.vector import store_story_part, find_similar_parts
from ..llm import model
from .schema import PassageContext, GeneratedPassage
from app.config.mongo import db, stories
from ..plan.characters.schema import character_schema
from ..plan.outline.schema import (
    OutlineNode,
)
from ..plan.characters.schema import Character
from app.utils.text_validation import (
    retry_generation,
    is_complete_sentence,
    get_logit_bias,
)
from .rewrite.main import PassageRewriter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize tokenizer for token counting
tokenizer = tiktoken.get_encoding("cl100k_base")

# Initialize passages collection
passage_collection = db.passages


class DraftGenerator:
    def __init__(self, story_id: str, max_tokens: int = 4096):
        self.story_id = story_id
        self.character_relevance: Dict[str, float] = {}
        self.max_tokens = max_tokens
        self.token_buffer = 512  # Reserve tokens for the response

    async def load_plan_data(self) -> Dict:
        """Load story plan data from MongoDB"""
        story = await stories.find_one({"story_id": ObjectId(self.story_id)})
        if not story:
            raise ValueError("Story not found")
        return story

    def _find_outline_point(
        self, outline: OutlineNode, point_id: str
    ) -> Optional[OutlineNode]:
        """Recursively find an outline point by ID"""
        if outline.text == point_id:
            return outline

        for child in outline.children:
            result = self._find_outline_point(child, point_id)
            if result:
                return result
        return None

    async def retrieve_relevant_context(self, outline_point_id: str) -> PassageContext:
        """Retrieve relevant context for the current outline point"""
        story = await self.load_plan_data()

        try:
            # Find specific outline point
            outline = story.get("outline", [])
            current_point = next(
                (
                    point
                    for point in outline
                    if str(point.get("number")) == outline_point_id
                ),
                None,
            )
            if not current_point:
                raise ValueError(f"Outline point {outline_point_id} not found")

            # Get characters from outline point first
            character_contexts = await self._get_outline_characters(current_point)

            # Get recent passages
            recent_passages = await self._get_recent_passages()

            # Add relevant characters from recent passages
            if recent_passages:
                recent_passage_text = recent_passages[0]["content"]
                additional_chars = await self._get_relevant_characters(
                    recent_passage_text
                )

                # Add only characters not already included
                existing_names = {char["name"] for char in character_contexts}
                character_contexts.extend(
                    char
                    for char in additional_chars
                    if char["name"] not in existing_names
                )

            return PassageContext(
                premise=story.get("premise", ""),
                setting=story.get("setting", ""),
                genre=story.get("genre", ""),
                relevant_characters=character_contexts,
                previous_summaries=(
                    [p.get("summary", "") for p in recent_passages]
                    if recent_passages
                    else []
                ),
                recent_passage=recent_passages[0]["content"] if recent_passages else "",
                current_outline=current_point,
            )
        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            raise ValueError(f"Failed to retrieve context: {e}")

    async def _get_recent_passages(self, limit: int = 3) -> List[Dict]:
        """Get recent passages with batch query"""
        pipeline = [
            {"$match": {"story_id": self.story_id}},
            {"$sort": {"created_at": -1}},
            {"$limit": limit},
        ]
        return await passage_collection.aggregate(pipeline).to_list(length=limit)

    async def _get_all_characters(self) -> List[Dict]:
        """Get all characters from the story when there are no previous passages"""
        try:
            story = await stories.find_one({"story_id": ObjectId(self.story_id)})
            if not story or "characters" not in story:
                return []

            characters = []
            for char_data in story["characters"]:
                character = Character(**char_data)
                characters.append(
                    {
                        "name": character.name,
                        "description": character.physicalAppearance,
                        "behavior": character.behavioralPatterns,
                        "relationships": character.relationships,
                        "relevance": 1.0,  # Equal initial relevance for all characters
                    }
                )
            return characters
        except Exception as e:
            logger.error(f"Error getting all characters: {e}")
            return []

    async def _get_relevant_characters(self, context_text: str) -> List[Dict]:
        """Get and format relevant character descriptions including entities and locations"""
        try:
            # Handle empty context text case
            if not context_text:
                return await self._get_all_characters()

            character_contexts = find_similar_parts(
                "character", self.story_id, context_text, top_n=5
            )

            if not character_contexts:
                return await self._get_all_characters()

            # Get full character details from MongoDB
            characters = []
            for ctx in character_contexts:
                char_name = ctx[0]
                char_doc = await stories.find_one(
                    {"story_id": ObjectId(self.story_id), "characters.name": char_name},
                    {"characters.$": 1},
                )

                if char_doc and char_doc.get("characters"):
                    char_data = char_doc["characters"][0]
                    character = Character(**char_data)
                    characters.append(
                        {
                            "name": character.name,
                            "type": character.type,
                            "role": character.role,
                            "description": character.physicalAppearance,
                            "behavior": character.behavioralPatterns,
                            "relationships": character.relationships,
                            "relevance": self.character_relevance.get(
                                character.name, 0
                            ),
                        }
                    )

            return characters
        except Exception as e:
            logger.error(f"Error getting relevant characters: {e}")
            # Fallback to getting all characters if vector search fails
            return await self._get_all_characters()

    def _count_tokens(self, text: str) -> int:
        """Count tokens in a text string"""
        return len(tokenizer.encode(text))

    def _truncate_to_fit(self, sections: List[Tuple[str, str]], max_tokens: int) -> str:
        """Truncate sections to fit within token limit while preserving priority"""
        total_tokens = 0
        result_parts = []

        for section_name, content in sections:
            tokens = self._count_tokens(content)
            if total_tokens + tokens <= max_tokens:
                result_parts.append(f"{section_name}:\n{content}")
                total_tokens += tokens
            else:
                # Truncate this section to fit
                available_tokens = max_tokens - total_tokens
                if (
                    available_tokens > 50
                ):  # Only include if we can fit meaningful content
                    truncated = tokenizer.decode(
                        tokenizer.encode(content)[:available_tokens]
                    )
                    result_parts.append(f"{section_name}:\n{truncated}...")
                break

        return "\n\n".join(result_parts)

    def prepare_prompt(self, context: PassageContext) -> str:
        """Prepare the prompt with token management"""
        available_tokens = self.max_tokens - self.token_buffer

        # Log the context for debugging
        logger.info(f"Context for prompt generation: {context.model_dump_json()}")

        # Format the outline point details
        outline_details = context.current_outline
        outline_text = f"""
        Event Number: {outline_details.get('number')}
        Title: {outline_details.get('title')}
        Description: {outline_details.get('description')}
        Setting: {outline_details.get('setting')}
        Characters Involved: {', '.join(outline_details.get('characters_involved', []))}
        """

        # Prioritize sections by importance
        sections = [
            ("Premise", context.premise),
            ("Setting", context.setting),
            ("Current Outline Point", outline_text),
            (
                "Relevant Characters",
                self._format_characters(context.relevant_characters),
            ),
            (
                "Recent Passage",
                (
                    context.recent_passage
                    if context.recent_passage
                    else "This is the first passage."
                ),
            ),
            ("Previous Context", self._format_summaries(context.previous_summaries)),
        ]

        content = self._truncate_to_fit(sections, available_tokens)

        prompt = f"""
        <|im_start|>system
        You are a creative writer tasked with generating the next passage of a story. Write a detailed and engaging passage 
        that follows the outline point and maintains consistency with the story context.
        
        Story Context:
        {content}
        
        Write a passage that:
        1. Advances the story according to the outline point
        2. Maintains consistency with previous events
        3. Develops the characters naturally
        4. Creates vivid and engaging scenes
        
        Write the passage now:
        <|im_end|>
        <|im_start|>assistant
        """

        # Log the final prompt for debugging
        logger.debug(f"Generated prompt: {prompt}")

        return prompt

    async def _update_character_description(
        self, character_name: str, passage_text: str
    ) -> None:
        """Update character description based on new developments"""
        prompt = f"""
        <|im_start|>system
        You are a creative writer tasked with analyzing a passage and extracting new character development details.
        <|im_end|>
        <|im_start|>user
        Analyze the following passage and extract new character development details for {character_name}:
        
        {passage_text}
        
        Return a JSON object with:
        1. physicalAppearance: Updated physical description
        2. behavioralPatterns: Updated behavior patterns
        3. relationships: Updated relationships with other characters
        4. likesAndDislikes: Updated preferences
        example of a correctly formatted response:
         {{
            "name": "Ayla Windsong",
            "physicalAppearance": "A lithe woman with sun-kissed skin, braided auburn hair, and piercing green eyes. She has a crescent-shaped scar on her left cheek.",
            "behavioralPatterns": "Fiercely independent but deeply loyal to her close friends. She often acts impulsively but has a knack for thinking on her feet.",
            "genderAndSexualOrientation": "Female, bisexual",
            "relationships": {{
                "Alaric Frost": "Childhood friend and rival",
                "Kaela Rune": "Mentor and confidant"
            }},
            "likesAndDislikes": {{
                "Likes": ["Exploring the unknown", "Playing the lute", "Collecting rare artifacts"],
                "Dislikes": ["Confinement", "Dishonesty", "Large crowds"]
            }}
        }}
        Here's the JSON schema you must adhere to:\n<schema>\n{character_schema}\n</schema>
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            response = model(prompt, max_tokens=256)
            response_text = response["choices"][0]["text"].strip()  # type: ignore
            updates = json.loads(response_text)

            # Create Character object to validate updates
            char_updates = Character(name=character_name, **updates)

            # Batch update character description
            await stories.update_one(
                {
                    "story_id": ObjectId(self.story_id),
                    "characters.name": character_name,
                },
                {"$set": {"characters.$": char_updates.model_dump()}},
            )
        except Exception as e:
            logger.error(f"Failed to update character description: {e}")

    async def _update_character_relevance(self, mentioned_entities: List[str]):
        """Update character relevance scores and descriptions"""
        MENTION_BOOST = 0.2
        DECAY_RATE = 0.1

        try:
            # Prepare batch updates
            updates = []

            # Decay all scores
            for char in self.character_relevance:
                self.character_relevance[char] *= 1 - DECAY_RATE
                updates.append(
                    UpdateOne(
                        {"story_id": ObjectId(self.story_id), "characters.name": char},
                        {
                            "$set": {
                                "characters.$.relevance": self.character_relevance[char]
                            }
                        },
                    )
                )

            # Boost mentioned characters
            for entity in mentioned_entities:
                if entity not in self.character_relevance:
                    self.character_relevance[entity] = 0
                self.character_relevance[entity] += MENTION_BOOST
                updates.append(
                    UpdateOne(
                        {
                            "story_id": ObjectId(self.story_id),
                            "characters.name": entity,
                        },
                        {
                            "$set": {
                                "characters.$.relevance": self.character_relevance[
                                    entity
                                ]
                            }
                        },
                    )
                )

            # Execute batch update
            if updates:
                await stories.bulk_write(updates)
        except Exception as e:
            logger.error(f"Error updating character relevance: {e}")

    async def generate_passage(self, outline_point_id: str) -> GeneratedPassage:
        try:
            context = await self.retrieve_relevant_context(outline_point_id)
            prompt = self.prepare_prompt(context)

            async def _generate_passage() -> str:
                response = model(
                    prompt,
                    max_tokens=1024,
                    temperature=0.7,
                    top_p=0.9,
                    stream=False,
                )
                passage_text = response["choices"][0]["text"] if response.get("choices") else ""  # type: ignore
                return passage_text

            passage_text = await retry_generation(_generate_passage)
            if not passage_text:
                raise ValueError(
                    "Failed to generate a valid passage after multiple attempts"
                )

            # Generate summary with validation
            async def _generate_summary() -> str:
                summary_prompt = f"""
                <|im_start|>system
                Summarize in one complete sentence:
                {passage_text[:500]}
                <|im_end|>
                <|im_start|>assistant
                """
                summary_response = model(
                    summary_prompt,
                    max_tokens=128,
                    temperature=0.5,
                    stream=False,
                )
                return summary_response["choices"][0]["text"] if summary_response.get("choices") else ""  # type: ignore

            summary = await retry_generation(_generate_summary)
            if not summary:
                summary = "Summary generation failed."

            # Create and store passage
            passage = GeneratedPassage(
                passage_id=str(ObjectId()),
                story_id=self.story_id,
                outline_point_id=outline_point_id,
                content=passage_text,
                summary=summary,
                mentioned_entities=await self._extract_entities(passage_text),
            )

            await self._store_passage(passage)
            return passage

        except Exception as e:
            logger.error(f"Error generating passage: {e}")
            raise

    async def _extract_entities(self, passage_text: str) -> List[str]:
        """Extract and validate character names and entities from passage text"""
        # First extraction
        prompt = f"""
        <|im_start|>system
        You are an expert at identifying character names and important entities in story text.
        Analyze this passage and list all character names and significant entities (like magical artifacts, important locations, etc).
        Return only the names/entities as a comma-separated list.
        
        Example output format:
        John Smith, Sarah Jones, The Crystal Cave, Ancient Sword of Light
        
        Passage to analyze:
        {passage_text}
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            response = model(prompt, max_tokens=256, temperature=0.3)
            if not isinstance(response, dict) or "choices" not in response:
                logger.error("Invalid response format from entity extraction model")
                return []

            entities_text = response["choices"][0]["text"].strip()  # type: ignore
            potential_entities = [
                entity.strip()
                for entity in entities_text.split(",")
                if entity.strip() and len(entity.strip()) > 1
            ]

            # Validate each entity
            validation_prompt = f"""
            <|im_start|>system
            Verify if these entities actually appear in the passage. Return only valid entities as a comma-separated list.
            
            Passage:
            {passage_text}
            
            Potential entities to verify:
            {', '.join(potential_entities)}
            
            For each entity, verify:
            1. It is explicitly mentioned in the passage
            2. It is a significant character, location, or object
            3. It is not a common noun or general reference
            
            Return only the verified entities, comma-separated.
            <|im_end|>
            <|im_start|>assistant
            """

            validation_response = model(
                validation_prompt, max_tokens=256, temperature=0.2
            )
            if (
                not isinstance(validation_response, dict)
                or "choices" not in validation_response
            ):
                return potential_entities  # Fallback to unvalidated entities

            validated_text = validation_response["choices"][0]["text"].strip()  # type: ignore
            validated_entities = [
                entity.strip()
                for entity in validated_text.split(",")
                if entity.strip() and len(entity.strip()) > 1
            ]

            logger.info(f"Validated entities: {validated_entities}")
            return validated_entities

        except Exception as e:
            logger.error(f"Error extracting entities: {e}")
            return []

    async def _store_passage(self, passage: GeneratedPassage):
        """Store the passage in MongoDB and vector store"""
        try:
            # Store in MongoDB
            passage_dict = passage.model_dump()
            await passage_collection.insert_one(passage_dict)

            # Store in vector store for similarity search
            store_story_part("passage", self.story_id, passage.content, passage.content)
        except Exception as e:
            logger.error(f"Failed to store passage: {e}")
            raise

    def _format_characters(self, characters: List[Dict]) -> str:
        """Format character descriptions for the prompt"""
        try:
            formatted_chars = []
            for char in characters:
                char_desc = [
                    f"- {char['name']} ({char.get('type', 'character')} - {char.get('role', 'Unknown')}):",
                    f"  Physical: {char.get('description', '')}",
                    f"  Behavior: {char.get('behavior', '')}",
                    "  Relationships:",
                ]

                # Safely handle relationships
                relationships = char.get("relationships", {})
                if relationships:
                    for rel_name, rel_desc in relationships.items():
                        char_desc.append(f"    - {rel_name}: {rel_desc}")

                formatted_chars.append("\n".join(char_desc))

            return (
                "\n\n".join(formatted_chars)
                if formatted_chars
                else "No character information available."
            )
        except Exception as e:
            logger.error(f"Error formatting characters: {e}")
            return "Error retrieving character information."

    def _format_summaries(self, summaries: List[str]) -> str:
        """Format previous summaries for the prompt"""
        try:
            return "\n".join([f"- {summary}" for summary in summaries])
        except Exception as e:
            logger.error(f"Error formatting summaries: {e}")
            return ""

    @classmethod
    async def test_llm(cls):
        """Test if the LLM is working properly"""
        try:
            test_prompt = """
            <|im_start|>system
            Generate a simple test response.
            <|im_end|>
            <|im_start|>assistant
            """

            logger.info("Testing LLM with simple prompt...")
            response = model(test_prompt, max_tokens=100)
            logger.info(f"Test response: {response}")

            if not isinstance(response, dict) or "choices" not in response:
                logger.error(f"Test failed - unexpected response format: {response}")
                return False

            text = response["choices"][0]["text"].strip()
            logger.info(f"Test successful - generated text: {text}")
            return bool(text)
        except Exception as e:
            logger.error(f"LLM test failed: {e}")
            return False

    async def generate_passages(
        self, outline_point_id: str, num_variations: int = 3
    ) -> List[GeneratedPassage]:
        """Generate multiple variations of a passage efficiently"""
        try:
            context = await self.retrieve_relevant_context(outline_point_id)
            base_prompt = self.prepare_prompt(context)

            # Batch generate multiple variations in a single prompt
            batch_prompt = f"""
            <|im_start|>system
            Generate {num_variations} unique story passages based on the context.
            Each passage should be a complete scene that advances the story.
            Use [PASSAGE_END] to separate passages.
            Do not include any variation numbers or labels.
            
            Context and Requirements:
            {base_prompt}
            
            Begin generating passages:
            <|im_end|>
            <|im_start|>assistant
            """

            # Get logit bias
            logit_bias = get_logit_bias()

            response = model(
                batch_prompt,
                max_tokens=1024 * num_variations,
                logit_bias=logit_bias,
                temperature=0.7,
                frequency_penalty=0.3,  # Reduce repetition
                presence_penalty=0.3,  # Encourage diversity
            )
            if not isinstance(response, dict) or "choices" not in response:
                raise ValueError("Invalid response from LLM")

            # Split variations and process them
            raw_passages = response["choices"][0]["text"].split("[PASSAGE_END]")  # type: ignore
            passages = []

            # Process passages in parallel
            async def process_passage(passage_text: str) -> Optional[GeneratedPassage]:
                if not passage_text.strip():
                    return None

                try:
                    # Generate summary and extract entities in parallel
                    summary_task = self._generate_summary(passage_text)
                    entities_task = self._extract_entities(passage_text)

                    summary, entities = await asyncio.gather(
                        summary_task, entities_task
                    )

                    return GeneratedPassage(
                        passage_id=str(ObjectId()),
                        story_id=self.story_id,
                        outline_point_id=outline_point_id,
                        content=passage_text.strip(),
                        summary=summary or "Summary generation failed.",
                        mentioned_entities=entities,
                    )
                except Exception as e:
                    logger.error(f"Error processing passage: {e}")
                    return None

            # Process all passages concurrently
            passage_tasks = [
                process_passage(text)
                for text in raw_passages[:num_variations]
                if text.strip()
            ]
            processed_passages = await asyncio.gather(*passage_tasks)
            passages = [p for p in processed_passages if p is not None]

            if not passages:
                raise ValueError("Failed to generate any valid passages")

            # Quick evaluation without LLM calls
            best_passage = await self._quick_evaluate_passages(passages, context)

            # Store passages
            store_tasks = []
            for passage in passages:
                passage_dict = passage.model_dump()
                passage_dict["is_best"] = passage.passage_id == best_passage.passage_id
                store_tasks.append(passage_collection.insert_one(passage_dict))

            await asyncio.gather(*store_tasks)

            # Process new entities for best passage only
            await self._process_new_entities(best_passage, context)

            return passages

        except Exception as e:
            logger.error(f"Error generating passages: {e}")
            raise

    async def _quick_evaluate_passages(
        self, passages: List[GeneratedPassage], context: PassageContext
    ) -> GeneratedPassage:
        """Evaluate passages using heuristics instead of LLM calls"""

        async def score_passage(
            passage: GeneratedPassage,
        ) -> Tuple[GeneratedPassage, float]:
            score = 0.0

            # Length score (prefer medium-length passages)
            words = len(passage.content.split())
            length_score = (
                1.0 - abs(500 - words) / 500
            )  # Optimal length around 500 words
            score += length_score * 0.2

            # Entity coverage score
            outline_chars = set(context.current_outline.get("characters_involved", []))
            passage_chars = set(passage.mentioned_entities)
            coverage = (
                len(outline_chars & passage_chars) / len(outline_chars)
                if outline_chars
                else 0
            )
            score += coverage * 0.3

            # Keyword relevance score
            outline_keywords = set(self._extract_keywords(context.current_outline))
            passage_keywords = set(self._extract_keywords(passage.content))
            relevance = (
                len(outline_keywords & passage_keywords) / len(outline_keywords)
                if outline_keywords
                else 0
            )
            score += relevance * 0.3

            # Readability score
            readability = self._calculate_readability(passage.content)
            score += readability * 0.2

            return passage, score

        # Score all passages concurrently
        scored_passages = await asyncio.gather(
            *[score_passage(passage) for passage in passages]
        )

        # Return the passage with the highest score
        return max(scored_passages, key=lambda x: x[1])[0]

    def _extract_keywords(self, text: Union[str, Dict]) -> List[str]:
        """Extract important keywords from text"""
        if isinstance(text, dict):
            text = " ".join(str(v) for v in text.values())

        # Simple keyword extraction (can be improved)
        words = text.lower().split()
        stopwords = {
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
        }
        return [w for w in words if w not in stopwords and len(w) > 3]

    def _calculate_readability(self, text: str) -> float:
        """Calculate a simple readability score"""
        sentences = text.split(".")
        words = text.split()

        if not sentences or not words:
            return 0.0

        avg_sentence_length = len(words) / len(sentences)
        # Prefer sentences between 10-20 words
        return 1.0 - abs(15 - avg_sentence_length) / 15

    async def _generate_summary(self, text: str) -> Optional[str]:
        """Generate a summary for a passage"""
        prompt = f"""
        <|im_start|>system
        Summarize in one complete sentence:
        {text[:500]}
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            response = model(prompt, max_tokens=128, temperature=0.5)
            if not isinstance(response, dict) or "choices" not in response:
                return None
            return response["choices"][0]["text"].strip()  # type: ignore
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return None

    async def _process_new_entities(
        self, passage: GeneratedPassage, context: PassageContext
    ):
        """Process and add new entities found in the passage"""
        try:
            # Get existing character names
            story = await stories.find_one({"story_id": ObjectId(self.story_id)})
            if not story:
                return

            existing_chars = {char["name"] for char in story.get("characters", [])}

            # Find new entities
            new_entities = set(passage.mentioned_entities) - existing_chars
            if not new_entities:
                return
            logger.info(f"New entities: {new_entities}")
            # Generate character profiles for new entities
            new_characters = []
            for entity in new_entities:
                # Validate entity's role in the passage
                role_prompt = f"""
                <|im_start|>system
                You are a story analyzer determining entity types.
                Analyze this entity and classify it as exactly one of these types: character, location, or object.
                
                Entity: {entity}
                Passage: {passage.content}
                
                Rules:
                1. Only respond with one word: "character", "location", or "object"
                2. No punctuation or additional text
                3. No explanations
                
                Classification:
                <|im_end|>
                <|im_start|>assistant
                """

                # Create logit bias to restrict output
                allowed_tokens = {
                    "character": 1.0,
                    "location": 1.0,
                    "object": 1.0,
                }
                discouraged_tokens = {
                    "://": -100.0,
                    "http": -100.0,
                    "https": -100.0,
                    ".": -100.0,
                    ",": -100.0,
                    ":": -100.0,
                    "/": -100.0,
                }

                # Encode tokens
                enc = tiktoken.get_encoding("cl100k_base")
                logit_bias = {}

                # Add bias for allowed tokens
                for word, bias in allowed_tokens.items():
                    tokens = enc.encode(word)
                    for token in tokens:
                        logit_bias[str(token)] = bias

                # Add bias against unwanted tokens
                for word, bias in discouraged_tokens.items():
                    tokens = enc.encode(word)
                    for token in tokens:
                        logit_bias[str(token)] = bias

                role_response = model(
                    role_prompt,
                    max_tokens=1,
                    temperature=0.1,
                    logit_bias=logit_bias,
                    stop=["\n", ".", ",", ":", "/"],  # Stop on any punctuation
                )

                if (
                    not isinstance(role_response, dict)
                    or "choices" not in role_response
                ):
                    continue

                entity_type = role_response["choices"][0]["text"].strip().lower()  # type: ignore
                logger.info(f"Entity type for {entity}: {entity_type}")

                if entity_type in ["character", "location", "object"]:
                    char_data = await self._generate_new_character(
                        entity, entity_type, passage.content, context
                    )
                    if char_data:
                        new_characters.append(char_data)
            logger.info(f"New characters: {new_characters}")
            if new_characters:
                # Add new characters to the story
                await stories.update_one(
                    {"story_id": ObjectId(self.story_id)},
                    {
                        "$push": {"characters": {"$each": new_characters}},
                        "$set": {"updated_at": datetime.utcnow()},
                    },
                )
                logger.info(f"Added {len(new_characters)} new characters to the story")

        except Exception as e:
            logger.error(f"Error processing new entities: {e}")

    async def _generate_new_character(
        self,
        entity_name: str,
        entity_type: str,
        passage_content: str,
        context: PassageContext,
    ) -> Optional[Dict]:
        """Generate a new character entry based on passage context"""
        prompt = f"""
        <|im_start|>system
        Generate a detailed description for a new {entity_type} discovered in the story.
        Use the story context and passage to ensure consistency.
        
        Story Genre: {context.genre}
        Story Premise: {context.premise}
        Setting: {context.setting}
        Current Passage: {passage_content}
        Entity Name: {entity_name}
        Entity Type: {entity_type}
        
        Generate a character profile in JSON format following this schema:
        {character_schema}
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            response = model(prompt, max_tokens=1024)
            if not isinstance(response, dict) or "choices" not in response:
                return None

            char_data = json.loads(response["choices"][0]["text"].strip())  # type: ignore

            # Validate with Character model
            character = Character(**char_data)
            return character.model_dump()
        except Exception as e:
            logger.error(f"Error generating new character {entity_name}: {e}")
            return None

    async def _get_outline_characters(self, outline_point: Dict) -> List[Dict]:
        """Get character details for characters mentioned in the outline point"""
        try:
            characters_involved = outline_point.get("characters_involved", [])
            story = await stories.find_one({"story_id": ObjectId(self.story_id)})
            if not story:
                return []

            outline_characters = []
            for char_name in characters_involved:
                char_data = next(
                    (
                        char
                        for char in story.get("characters", [])
                        if char["name"] == char_name
                    ),
                    None,
                )
                if char_data:
                    outline_characters.append(
                        {
                            "name": char_data["name"],
                            "description": char_data["physicalAppearance"],
                            "behavior": char_data["behavioralPatterns"],
                            "relationships": char_data["relationships"],
                            "relevance": 1.0,  # High relevance as they're directly involved
                        }
                    )

            return outline_characters
        except Exception as e:
            logger.error(f"Error getting outline characters: {e}")
            return []
