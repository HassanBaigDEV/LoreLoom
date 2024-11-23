import logging
import json
from typing import List, Dict, Optional, Tuple
from bson import ObjectId
import tiktoken
from pymongo import UpdateOne

from ..plan.db.vector import store_story_part, find_similar_parts
from ..plan.llm import model, get_llm_response_text
from .schema import PassageContext, GeneratedPassage
from app.config.mongo import db, stories
from ..plan.characters.schema import character_schema
from ..plan.outline.schema import (
    OutlineNode,
)
from ..plan.characters.schema import Character

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize tokenizer for token counting
tokenizer = tiktoken.get_encoding("cl100k_base")

# Initialize passages collection
passages = db.passages


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
            # Find specific outline point in array
            outline = story.get("outline", [])
            if not outline:
                raise ValueError("No outline found in story")

            # Find the specific outline point by number
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

            # Get recent passages with batch query
            recent_passages = await self._get_recent_passages()

            # Get relevant character descriptions
            # Only try to get similar passages if we have previous passages
            character_contexts = []
            if recent_passages:
                recent_passage_text = recent_passages[0]["content"]
                character_contexts = await self._get_relevant_characters(
                    recent_passage_text
                )
            else:
                # If no previous passages, get all characters from the story
                character_contexts = await self._get_all_characters()

            return PassageContext(
                premise=story.get("premise", ""),
                setting=story.get("setting", ""),
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
        return await passages.aggregate(pipeline).to_list(length=limit)

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
                    {"characters.$": 1}
                )

                if char_doc and char_doc.get("characters"):
                    char_data = char_doc["characters"][0]
                    character = Character(**char_data)
                    characters.append({
                        "name": character.name,
                        "type": character.type,
                        "role": character.role,
                        "description": character.physicalAppearance,
                        "behavior": character.behavioralPatterns,
                        "relationships": character.relationships,
                        "relevance": self.character_relevance.get(character.name, 0)
                    })

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
        """Generate a story passage for the given outline point"""
        try:
            # Get context and create prompt
            context = await self.retrieve_relevant_context(outline_point_id)
            prompt = self.prepare_prompt(context)

            # Generate the passage text with optimized parameters
            response = model(
                prompt,
                max_tokens=1024,  # Reduced max tokens
                temperature=0.7,  # Add temperature for better generation
                top_p=0.9,  # Add top_p for faster sampling
                stream=False,  # Disable streaming for faster response
            )

            # Direct access to response
            passage_text = (
                response["choices"][0]["text"]
                if response.get("choices")
                else "Failed to generate passage text."
            )

            # Quick summary generation with reduced tokens
            summary_prompt = f"""
            <|im_start|>system
            Summarize in one sentence:
            {passage_text[:500]}  # Only summarize first 500 chars
            <|im_end|>
            <|im_start|>assistant
            """

            summary_response = model(
                summary_prompt,
                max_tokens=128,  # Reduced tokens for summary
                temperature=0.5,  # Lower temperature for more focused summary
                stream=False,
            )
            summary = (
                summary_response["choices"][0]["text"]
                if summary_response.get("choices")
                else "Summary not available."
            )

            # Simple entity extraction without JSON parsing
            entity_prompt = f"""
            <|im_start|>system
            List character names from text, comma-separated:
            {passage_text[:500]}
            <|im_end|>
            <|im_start|>assistant
            """

            entity_response = model(
                entity_prompt, max_tokens=128, temperature=0.3, stream=False
            )

            # Simple string splitting for entities
            entity_text = (
                entity_response["choices"][0]["text"]
                if entity_response.get("choices")
                else ""
            )
            mentioned_entities = [
                name.strip() for name in entity_text.split(",") if name.strip()
            ]

            # Create and store passage
            passage = GeneratedPassage(
                passage_id=str(ObjectId()),
                story_id=self.story_id,
                outline_point_id=outline_point_id,
                content=passage_text,
                summary=summary,
                mentioned_entities=mentioned_entities,
            )

            # Store in MongoDB
            await passages.insert_one(passage.model_dump())

            # Update character relevance in background
            try:
                await self._update_character_relevance(mentioned_entities)
            except Exception as e:
                logger.error(f"Character relevance update failed: {e}")

            return passage

        except Exception as e:
            logger.error(f"Error generating passage: {e}")
            return GeneratedPassage(
                passage_id=str(ObjectId()),
                story_id=self.story_id,
                outline_point_id=outline_point_id,
                content="Failed to generate passage.",
                summary="Generation failed",
                mentioned_entities=[],
            )

    async def _store_passage(self, passage: GeneratedPassage):
        """Store the passage in MongoDB and vector store"""
        try:
            # Store in MongoDB
            passage_dict = passage.model_dump()
            await passages.insert_one(passage_dict)

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
                    f"- {char['name']} ({char['type']} - {char['role']}):",
                    f"  Physical: {char['description']}",
                    f"  Behavior: {char['behavior']}",
                    "  Relationships:"
                ]

                for rel_name, rel_desc in char["relationships"].items():
                    char_desc.append(f"    - {rel_name}: {rel_desc}")

                formatted_chars.append("\n".join(char_desc))

            return "\n\n".join(formatted_chars)
        except Exception as e:
            logger.error(f"Error formatting characters: {e}")
            return ""

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
