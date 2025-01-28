import logging
import json
from pydoc import classname
from typing import List, Dict, Optional, Tuple, Union
from bson import ObjectId
import tiktoken
from pymongo import UpdateOne
from datetime import datetime
import asyncio
import re
import spacy
from typing import Set
from functools import wraps
import time
from pydantic import BaseModel, Field
from typing import Literal

from ..plan.db.vector import store_story_part, find_similar_parts
from ..llm_colab import model
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
from .passage_processor import PassageProcessor
from .entity_processor import EntityProcessor

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize tokenizer for token counting
tokenizer = tiktoken.get_encoding("cl100k_base")

# Initialize passages collection
passage_collection = db.passages


# Add this decorator for function logging
def log_function_call(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        logger.info(f"Starting {func.__name__}")
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            elapsed = time.time() - start_time
            logger.info(f"Completed {func.__name__} in {elapsed:.2f}s")
            return result
        except Exception as e:
            logger.error(f"Failed {func.__name__}: {str(e)}")
            raise

    return wrapper


# Add this for LLM call logging
def log_llm_call(prompt: str, **kwargs) -> Dict:
    logger.info(f"Starting LLM call with params: {kwargs}")
    start_time = time.time()
    try:
        response = model(prompt, **kwargs)
        elapsed = time.time() - start_time
        logger.info(f"Completed LLM call in {elapsed:.2f}s")
        return response  # type: ignore
    except Exception as e:
        logger.error(f"Failed LLM call: {str(e)}")
        raise


class DraftGenerator:
    def __init__(self, story_id: str, max_tokens: int = 4096):
        self.story_id = story_id
        self.character_relevance: Dict[str, float] = {}
        self.max_tokens = max_tokens
        self.token_buffer = 512  # Reserve tokens for the response
        self.nlp = spacy.load("en_core_web_sm")  # Load spaCy model

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
        try:
            # Get current character data
            story = await stories.find_one(
                {"story_id": ObjectId(self.story_id), "characters.name": character_name}
            )
            if not story:
                logger.info(f"Character {character_name} not found in story")
                return

            prompt = f"""
            <|im_start|>system
            Update character profile based on recent events.
            Return only the updated fields, excluding the name field.
            
            Character: {character_name}
            Recent events: {passage_text[:500]}
            <|im_end|>
            <|im_start|>assistant
            """

            logger.info(f"Generating updates for character: {character_name}")
            response = model(prompt, max_tokens=256)
            if not isinstance(response, dict) or "choices" not in response:
                logger.error("Invalid model response")
                return

            try:
                updates = json.loads(response["choices"][0]["text"].strip())  # type: ignore

                # Remove name field if present to avoid duplication
                updates.pop("name", None)

                # Create character object with existing name
                character = Character(name=character_name, **updates)

                logger.info(f"Updating character {character_name} with new details")
                await stories.update_one(
                    {
                        "story_id": ObjectId(self.story_id),
                        "characters.name": character_name,
                    },
                    {
                        "$set": {
                            f"characters.$.{k}": v
                            for k, v in character.model_dump().items()
                            if k != "name"  # Skip name field in updates
                        }
                    },
                )
                logger.info(f"Successfully updated character: {character_name}")

            except Exception as e:
                logger.error(f"Error parsing character update: {e}")

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

    @log_function_call
    async def generate_passage(self, outline_point_id: str) -> GeneratedPassage:
        """Generate a single passage with parallel character updates"""
        try:
            context = await self.retrieve_relevant_context(outline_point_id)
            prompt = self.prepare_prompt(context)

            # Generate passage text
            async def _generate() -> str:
                response = model(
                    prompt,
                    max_tokens=1024,
                    temperature=0.7,
                    top_p=0.9,
                )
                if not isinstance(response, dict) or "choices" not in response:
                    return ""
                return response["choices"][0]["text"].strip()  # type: ignore

            passage_text = await retry_generation(_generate)
            if not passage_text:
                raise ValueError("Failed to generate valid passage")

            # Generate summary with validation
            # async def _generate_summary() -> str:
            #     summary_prompt = f"""
            #     <|im_start|>system
            #     Summarize in one complete sentence:
            #     {passage_text[:500]}
            #     <|im_end|>
            #     <|im_start|>assistant
            #     """
            #     summary_response = model(
            #         summary_prompt,
            #         max_tokens=128,
            #         temperature=0.5,
            #         stream=False,
            #     )
            #     return summary_response["choices"][0]["text"] if summary_response.get("choices") else ""  # type: ignore

            # summary = await retry_generation(_generate_summary)

            summary_task = self._generate_summary(passage_text)
            entities_task = self._extract_entities(passage_text)
            summary, entities = await asyncio.gather(summary_task, entities_task)

            # if not summary:
            #     summary = await retry_generation(_generate_summary)
            # if not entities:
            #     entities = await retry_generation(self._extract_entities(passage_text))

            # Create and store passage
            passage = GeneratedPassage(
                passage_id=str(ObjectId()),
                story_id=self.story_id,
                outline_point_id=outline_point_id,
                content=passage_text,
                summary=summary or "Summary generation failed.",
                mentioned_entities=entities or [],
            )

            # Run all updates in parallel
            update_tasks = [
                self._store_passage(passage),
                self._process_new_entities(passage, context),
                self._update_character_relevance(entities),
            ]
            await asyncio.gather(*update_tasks)

            return passage

        except Exception as e:
            logger.error(f"Error generating passage: {e}")
            raise

    @log_function_call
    async def _extract_entities(self, passage_text: str) -> List[str]:
        """Extract entities using spaCy NER"""
        try:
            # Process text with spaCy
            doc = self.nlp(passage_text)

            # Extract named entities
            entities: Set[str] = set()

            # Entity types we're interested in
            relevant_types = {
                "PERSON",  # For characters
                "GPE",  # For locations
                "LOC",  # For locations
                "FAC",  # For facilities/buildings
                "ORG",  # For organizations
                "PRODUCT",  # For objects/artifacts
                "WORK_OF_ART",  # For artifacts/books
            }

            for ent in doc.ents:
                if ent.label_ in relevant_types:
                    # Clean and normalize entity text
                    clean_text = ent.text.strip()
                    if clean_text and len(clean_text) > 1:  # Avoid single characters
                        entities.add(clean_text)

            # Convert to list and sort for consistency
            return sorted(list(entities))

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
            logger.debug(
                f"Starting passage generation for outline point {outline_point_id}"
            )
            context = await self.retrieve_relevant_context(outline_point_id)
            logger.debug("Retrieved context for prompt generation")

            base_prompt = self.prepare_prompt(context)
            logger.debug("Prepared base prompt")

            # Batch generate multiple variations in a single prompt
            batch_prompt = f"""
            <|im_start|>system
            You are an expert story writer. Generate multiple variations of a passage based on the given context.
            Context:
            {base_prompt}
            Return a list of passages, each on a new line,ending with [PASSAGE_END].
            <|im_end|>
            <|im_start|>assistant
            """

            # Get logit bias
            logit_bias = get_logit_bias()
            logger.debug("Retrieved logit bias settings")

            async def _generate() -> str:
                logger.debug("Calling model to generate passages")
                response = model(
                    batch_prompt,
                    max_tokens=1024 * num_variations,
                    logit_bias=logit_bias,
                    temperature=0.7,
                    frequency_penalty=0.3,  # Reduce repetition
                    presence_penalty=0.3,  # Encourage diversity
                )
                if not isinstance(response, dict) or "choices" not in response:
                    logger.error("Model response was invalid")
                    return ""
                return response["choices"][0]["text"].strip()  # type: ignore

            # Add retry logic for generation like in generate_passage
            raw_text = await retry_generation(_generate)
            if not raw_text:
                logger.error("Failed to generate valid passages after retries")
                raise ValueError("Failed to generate valid passages")

            logger.debug("Successfully generated raw passages")
            raw_passages = raw_text.split("[PASSAGE_END]")
            logger.debug(f"Split into {len(raw_passages)} raw passages")

            # Process passages using PassageProcessor
            logger.debug("Starting parallel passage processing")
            passage_tasks = [
                PassageProcessor.process_passage(
                    text,
                    self.story_id,
                    outline_point_id,
                    self._generate_summary,
                    self._extract_entities,
                )
                for text in raw_passages[:num_variations]
                if text.strip()
            ]

            processed_passages = await asyncio.gather(*passage_tasks)
            passages = [p for p in processed_passages if p is not None]
            logger.debug(f"Successfully processed {len(passages)} valid passages")

            if not passages:
                logger.error("No valid passages after processing")
                raise ValueError("Failed to generate any valid passages")

            logger.debug("Starting passage evaluation")
            best_passage = await self._quick_evaluate_passages(passages, context)
            logger.debug(f"Selected best passage with ID {best_passage.passage_id}")

            # Store passages using PassageProcessor
            logger.debug("Storing passages in database")
            await PassageProcessor.store_passages(passages, best_passage)

            # Process new entities for best passage only
            logger.debug("Processing entities for best passage")
            await self._process_new_entities(best_passage, context)
            await self._update_character_relevance(best_passage.mentioned_entities)
            logger.debug("Finished updating character relevance")

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
        """Process entities, updating existing ones and creating new ones"""
        try:
            # Get existing characters
            story = await stories.find_one({"story_id": ObjectId(self.story_id)})
            if not story:
                return

            existing_chars = {char["name"] for char in story.get("characters", [])}

            # Split entities into existing and new
            existing_entities = set(passage.mentioned_entities) & existing_chars
            new_entities = set(passage.mentioned_entities) - existing_chars
            logger.info(f"Existing entities: {existing_entities}")
            logger.info(f"New entities: {new_entities}")

            # Update existing characters in parallel
            update_tasks = [
                self._update_character_description(entity, passage.content)
                for entity in existing_entities
            ]

            # Process new entities only if they exist
            if new_entities:
                # Classify and prioritize new entities
                entity_types = await self._batch_classify_entities(
                    new_entities, passage.content
                )
                priority_entities = self._prioritize_entities(entity_types)

                if priority_entities:
                    # Generate profiles for new characters
                    new_characters = await self._batch_generate_characters(
                        priority_entities, passage.content, context
                    )

                    if new_characters:
                        # Add required role field and validate
                        validated_characters = []
                        for char in new_characters:
                            if "role" not in char:
                                char["role"] = "Supporting Character"
                            try:
                                validated_char = Character(**char)
                                validated_characters.append(validated_char.model_dump())
                            except Exception as e:
                                logger.error(f"Character validation error: {e}")
                                continue

                        if validated_characters:
                            # if any character with the same name already exist, update them, append the rest
                            await stories.update_one(
                                {"story_id": ObjectId(self.story_id)},
                                {
                                    "$push": {
                                        "characters": {"$each": validated_characters}
                                    },
                                    "$set": {"updated_at": datetime.utcnow()},
                                },
                            )
                            logger.info(
                                f"Added {len(validated_characters)} new characters"
                            )

            # Wait for all updates to complete
            if update_tasks:
                await asyncio.gather(*update_tasks)
                logger.info(f"Updated {len(update_tasks)} existing characters")

        except Exception as e:
            logger.error(f"Error processing entities: {e}")

    async def _batch_classify_entities(
        self, entities: set[str], passage_content: str
    ) -> Dict[str, str]:
        """Classify multiple entities in a single LLM call"""

        # Define schema for entity classification
        class CharacterClassificationSchema(BaseModel):
            name: str
            classification: Literal["character", "location", "object"] = Field(
                default="character",
                description="Type of entity (character, entity, or location)",
            )

        schema = CharacterClassificationSchema.model_json_schema()

        entities_list = list(entities)
        batch_prompt = f"""
        <|im_start|>system
        You are an expert story analyzer. Classify each entity as either "character", "location", or "object" based on the passage context.
        Return a valid JSON object following the given schema exactly.
        <|im_end|>
        <|im_start|>user
        Entities to classify:
        {json.dumps(entities_list)}
        
        Passage context:
        {passage_content[:1000]}
        
        Here's the JSON schema you must adhere to:\n<schema>\n{schema}\n</schema>
        
        Example response:
        [{{"name":"TheArchivist", "classification":"character"}}, {{"name":"AtlantisLibrary", "classification":"location"}}]
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            response = model(
                batch_prompt,
                max_tokens=256,
            )
            if not isinstance(response, dict) or "choices" not in response:
                return {}

            response_text = response["choices"][0]["text"].strip()  # type: ignore
            logger.info(f"Entity classification response: {response_text}")

            try:
                classifications = json.loads(response_text)
                logger.info(f"Classifications: {classifications}")
                # Convert list of dicts to dict format
                return {
                    item["name"]: item["classification"]
                    for item in classifications
                    if isinstance(item, dict)
                    and "name" in item
                    and "classification" in item
                }
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON response: {e}")
                return {}

        except Exception as e:
            logger.error(f"Error classifying entities: {e}")
            return {}

    def _prioritize_entities(self, entity_types: Dict[str, str]) -> Dict[str, str]:
        """Filter and prioritize entities based on type"""
        # Priority weights
        priorities = {"character": 3, "location": 2, "object": 1}

        # Sort entities by priority
        prioritized = sorted(
            entity_types.items(), key=lambda x: priorities.get(x[1], 0), reverse=True
        )

        # Take top 5 entities or all if less
        top_entities = dict(prioritized[:5])

        # Always include characters
        characters = {
            name: type_ for name, type_ in entity_types.items() if type_ == "character"
        }

        return {**characters, **top_entities}

    async def _batch_generate_characters(
        self,
        priority_entities: Dict[str, str],
        passage_content: str,
        context: PassageContext,
    ) -> List[Dict]:
        """Generate character profiles in batch"""
        batch_prompt = f"""
        <|im_start|>system
        Generate character profiles for multiple entities in JSON format.
        
        Story Context:
        Genre: {context.genre}
        Premise: {context.premise}
        Setting: {context.setting}
        
        Entities to profile:
        {json.dumps(priority_entities)}
        
        Recent passage:
        {passage_content[:1000]}
        
        Return a list of character profiles following this schema:
        \n<schema>
        {character_schema}
        </schema>\n
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            response = model(batch_prompt, max_tokens=2048, temperature=0.7)
            if not isinstance(response, dict) or "choices" not in response:
                return []

            profiles = json.loads(response["choices"][0]["text"].strip())  # type: ignore

            # Validate profiles
            validated_profiles = []
            for profile in profiles:
                try:
                    character = Character(**profile)
                    validated_profiles.append(character.model_dump())
                except Exception as e:
                    logger.error(f"Error validating profile: {e}")

            return validated_profiles
        except Exception as e:
            logger.error(f"Error generating character profiles: {e}")
            return []

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
