import logging
import json
import json5
from pydoc import classname
from typing import List, Dict, Optional, Tuple, Union
from bson import ObjectId
from pymongo import UpdateOne
from datetime import datetime
import asyncio
import re
import spacy
from typing import Set
from functools import wraps
import time
from pydantic import BaseModel, Field, ValidationError
from typing import Literal
from ..plan.db.vector import store_story_part, find_similar_parts
from ..llm.llama import model
from ..llm.gemini import model as gemini_model
from .schema import PassageContext, GeneratedPassage
from app.config.mongo import db, stories
from ..plan.characters.schema import character_schema
from ..plan.characters.schema import Character
from app.utils.text_validation import (
    retry_generation,
    is_complete_sentence,
    get_logit_bias,
    extract_and_parse_json,
)
from app.storywriter.draft.rewrite.main import PassageRewriter
from .passage_processor import PassageProcessor

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
rewriter = PassageRewriter()

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
        self.nlp = spacy.load("en_core_web_lg")  # Load spaCy model

    async def load_plan_data(self) -> Dict:
        """Load story plan data from MongoDB"""
        story = await stories.find_one({"story_id": ObjectId(self.story_id)})
        if not story:
            raise ValueError("Story not found")
        return story

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

    def prepare_prompt(self, context: PassageContext) -> str:
        """Prepare the prompt with dynamic weighting of context elements"""
        PRIORITY_MAP = {
            "current_outline": 1.0,
            "relevant_characters": 0.9,
            "previous_summaries": 0.7,
            "premise": 0.6,
            "setting": 0.5,
            "recent_passage": 0.4,
        }

        # Format the outline point details
        outline_details = context.current_outline
        outline_text = f"""
        Event Number: {outline_details.get('number')}
        Title: {outline_details.get('title')}
        Description: {outline_details.get('description')}
        Setting: {outline_details.get('setting')}
        Characters Involved: {', '.join(outline_details.get('characters_involved', []))}
        """

        # Create sections with dynamic weighting
        sections = {
            "Premise": context.premise,
            "Setting": context.setting,
            "Current Outline Point": outline_text,
            "Relevant Characters": self._format_characters(context.relevant_characters),
            "Recent Passage": context.recent_passage or "This is the first passage.",
            "Previous Context": self._format_summaries(context.previous_summaries),
        }

        # Sort sections by priority
        sorted_sections = sorted(
            sections.items(),
            key=lambda x: PRIORITY_MAP.get(x[0].lower().replace(" ", "_"), 0.5),
            reverse=True,
        )

        # Construct the prompt with clear separation
        prompt_sections = "\n\n".join(
            f"### {title} ###\n{content}" for title, content in sorted_sections
        )

        prompt = f"""
        <|im_start|>system
        You are a creative writer tasked with generating the next passage of a story. Write a detailed and engaging passage 
        that follows the outline point and maintains consistency with the story context.
        
        Story Context:
        {prompt_sections}
        
        Write a passage that:
        1. Advances the story according to the outline point
        2. Maintains consistency with previous events
        3. Develops the characters naturally
        4. Creates vivid and engaging scenes
        
        Write the passage now:
        <|im_end|>
        <|im_start|>assistant
        """

        return prompt

    @log_function_call
    async def _generate(self, prompt, **kwargs) -> str:
        response = gemini_model(
            prompt,
            **kwargs,
        )
        if not isinstance(response, dict) or "choices" not in response:
            return ""
        return response["choices"][0]["text"].strip()  # type: ignore

    @log_function_call
    async def generate_passage(self, outline_point_id: str) -> GeneratedPassage:
        """Generate a single passage with parallel character updates"""
        try:
            context = await self.retrieve_relevant_context(outline_point_id)
            prompt = self.prepare_prompt(context)

            # Generate passage text
            kwargs = {
                "temperature": 1.2,
                "top_p": 0.9,
                "frequency_penalty": 0.3,
            }
            passage_text = await retry_generation(
                lambda: self._generate(prompt, **kwargs)
            )
            if not passage_text:
                raise ValueError("Failed to generate valid passage")

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

    @classmethod
    async def test_llm(cls) -> bool:
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

    async def generate_passages(self, outline_point_id: str, num_variations: int = 3) -> List[GeneratedPassage]:
        """Generate multiple variations of a passage efficiently"""
        try:
            logger.info(f"Starting passage generation for outline point {outline_point_id}")
            context = await self.retrieve_relevant_context(outline_point_id)
            base_prompt = self.prepare_prompt(context)

            logit_bias = get_logit_bias()
            logger.info(f"Retrieved logit bias settings: {logit_bias}")

            raw_passages: List[str] = []
            generation_tasks = []

            logger.info(f"num_variations: {num_variations}")

            for i in range(num_variations):
                kwargs = {
                    "max_tokens": None,
                    "temperature": 1.2,
                    "top_p": 0.9,
                    "frequency_penalty": 0.3,
                }

                task = retry_generation(lambda: self._generate(base_prompt, **kwargs))
                generation_tasks.append(task)

            logger.info(f"Created {len(generation_tasks)} generation tasks")

            raw_passages_results = await asyncio.gather(*generation_tasks)
            raw_passages = [p for p in raw_passages_results if p]

            if not raw_passages:
                logger.error("Failed to generate valid passages after retries")
                raise ValueError("Failed to generate valid passages")

            logger.info(f"Split into {len(raw_passages)} raw passages")

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

            logger.info(f"Created {len(passage_tasks)} passage processing tasks")

            processed_passages = await asyncio.gather(*passage_tasks)
            passages = [p for p in processed_passages if p is not None]

            logger.info(f"Successfully processed {len(passages)} valid passages")

            if not passages:
                logger.error("No valid passages after processing")
                raise ValueError("Failed to generate any valid passages")

            logger.info("Starting passage evaluation")
            best_passage = await rewriter.rewrite(passages, context)
            logger.info(f"Selected best passage with ID {best_passage.passage_id}")

            update_tasks = [
                self._store_passage(best_passage),
                self._process_new_entities(best_passage, context),
                self._update_character_relevance(best_passage.mentioned_entities),
            ]
            await asyncio.gather(*update_tasks)
            logger.info("Finished updating character relevance")

            return passages

        except Exception as e:
            logger.error(f"Error generating passages: {e}", exc_info=True)  # Log traceback
            raise

    async def _quick_evaluate_passages(self, passages: List[GeneratedPassage], context: PassageContext) -> GeneratedPassage:
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
            outline_keywords = set(rewriter._extract_keywords(context.current_outline))
            passage_keywords = set(rewriter._extract_keywords(passage.content))
            relevance = (
                len(outline_keywords & passage_keywords) / len(outline_keywords)
                if outline_keywords
                else 0
            )
            score += relevance * 0.3

            # Readability score
            readability = rewriter._calculate_readability(passage.content)
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

    async def _process_new_entities(self, passage: GeneratedPassage, context: PassageContext, debug_mode: bool = False):
        """Process entities with deduplication, normalization, and selective debugging."""
        try:
            story = await stories.find_one({"story_id": ObjectId(self.story_id)})
            if not story:
                return

            def normalize_name(name: str) -> str:
                """Normalize entity names for consistent comparison."""
                name = re.sub(r'^\s*the\s+', '', name, flags=re.IGNORECASE)
                name = re.sub(r'\s+(of|in|at|on|by|for|with)\s*$', '', name, flags=re.IGNORECASE)
                return name.strip().lower()

            def deduplicate_entities(entities: List[str]) -> Set[str]:
                """Remove duplicate entities considering name normalization."""
                seen = set()
                deduped = set()
                for entity in sorted(set(entities), key=lambda x: -len(x)):
                    norm = normalize_name(entity)
                    if all(norm not in s and s not in norm for s in seen):  # Stronger check
                        seen.add(norm)
                        deduped.add(entity)
                return deduped
            
            def strip_leading_article(name: str) -> str:
                return re.sub(r'(?i)^\s*the\s+', '', name)

            raw_entities = passage.mentioned_entities
            deduped_entities = deduplicate_entities(raw_entities)
            logger.info(f"Found {len(deduped_entities)}  entities to process Deduped entities: {deduped_entities}")
            normalized_entities = [normalize_name(e) for e in deduped_entities]

            # Get existing character names
            existing_chars = {normalize_name(char["name"]) for char in story.get("characters", [])}
            logger.info(f"Found {len(existing_chars)} existing entities to process Existing: {existing_chars}")
            # Classify entities
            entity_types = await self._batch_classify_entities(
                {normalize_name(e) for e in deduped_entities}, 
                passage.content
            )
            normalized_entity_types = {normalize_name(key): typ for key, typ in entity_types.items()}

            # Filter valid entities (characters & locations)
            valid_entities = {
                strip_leading_article(orig_name): typ
                for orig_name in deduped_entities
                if (typ := normalized_entity_types.get(normalize_name(orig_name))) and typ in ('character', 'location', 'entity')
            }
            # Prepare validated entity list and update passage in DB.
            validated_entities = list(valid_entities.keys())
            await passage_collection.update_one(
                {"passage_id": passage.passage_id},
                {"$set": {"mentioned_entities": validated_entities}}
            )
            logger.info(f"Found {len(valid_entities)} valid entities to process")
            new_entities = [e for e in valid_entities if normalize_name(e) not in existing_chars]
            
            if new_entities:
                await self._process_new_characters(new_entities, passage.content, context, story, entity_types)
            existing_updates = [e for e in deduped_entities if normalize_name(e) in existing_chars]
            await self._update_existing_characters(existing_updates, passage.content)

        except Exception as e:
            logger.error(f"Error processing entities: {str(e)}", exc_info=True)

    async def _process_new_characters(self, entities, content, context, story, classified_types):
        """Enhanced character processing with validation and logging"""
        try:
            def normalize_name(name: str) -> str:
                """Normalize entity names for consistent comparison."""
                name = re.sub(r'^\s*the\s+', '', name, flags=re.IGNORECASE)
                name = re.sub(r'\s+(of|in|at|on|by|for|with)\s*$', '', name, flags=re.IGNORECASE)
                return name.strip().lower()
            
            logger.info(f"⏳ Processing {len(entities)} new character candidates ⏳")
            generated = await self._batch_generate_characters(entities, content, context, classified_types)
            
            if not generated:
                logger.warning("No characters generated in batch process")
                return

            validated = []
            existing_names = {normalize_name(c["name"]) for c in story.get("characters", [])}

            for char in generated:
                try:
                    # Clean and validate name
                    clean_name = re.sub(r'^\s*the\s+', '', char["name"], flags=re.IGNORECASE).strip()
                    if not clean_name:
                        logger.warning("Skipping empty character name")
                        continue

                    clean_name = clean_name[0].upper() + clean_name[1:]
                    norm_name = normalize_name(clean_name)

                    if norm_name in existing_names:
                        logger.info(f"Skipping duplicate: {clean_name}")
                        continue
                    
                    # VALIDATION MOVED TO BATCH GENERATION
                    validated_char = Character(**char).model_dump()
                    validated.append(validated_char)
                    existing_names.add(norm_name)
                    logger.info(f"--- New {char['type']} created: {clean_name} ---")
                    
                    #  Detailed success logging
                    logger.info(f"✅ CREATED {char['type'].upper()}: {clean_name} ✅")
                    logger.info(f"""📝 CHARACTER DETAILS 📝 :
                        {json.dumps({
                            "Role": char.get('role'),
                            "Type": char.get('type'),
                            "Appearance": char.get('physicalAppearance'),
                            "Relationships": char.get('relationships'),
                            "Likes/Dislikes": char.get('likesAndDislikes')
                        }, indent=2)}""")
                    
                except ValidationError as ve:
                    logger.error(f"Schema validation failed for {clean_name}: {ve.errors()}")
                    logger.error(f"❌ VALIDATION FAILED: {clean_name} ❌")
                    logger.info(f"Validation errors:\n{ve.json()}")
                except Exception as e:
                    logger.error(f"💥Unexpected error processing {clean_name}: {str(e)} 💥")

            # if validated:
            await stories.update_one(
                {"story_id": ObjectId(self.story_id)},
                {"$push": {"characters": {"$each": validated}}}
            )
            logger.info(f"--- Database updated with {len(validated)} new characters ---")
            logger.info(f"📥 DATABASE: Added {len(validated)} new characters")

        except Exception as e:
            logger.error(f"Character processing pipeline failed: {str(e)}", exc_info=True)
            logger.error(f"🔥 CRITICAL FAILURE: {str(e)}", exc_info=True)

    async def _update_existing_characters(self, entities, content):
        """Batch update existing characters."""
        try:
            updates = await asyncio.gather(*[
                self._update_character_description(entity, content)
                for entity in entities
            ])
        except Exception as e:
            logger.error(f"Character update failed: {str(e)}")
            
    async def _batch_classify_entities(self, entities: Set[str], passage: str) -> Dict[str, str]:
        """Classify entities with strict filtering."""
        prompt = f"""<|im_start|>system
        Classify entities as character/location/entity. Focus on:
        - Characters: Names of people, sentient beings, or significant roles (e.g., Guardian, Archivist)
        - Locations: Specific places (e.g., Atlantis, Shattered Palace)
        - Entity: Other tangible items (e.g., carnelian)
        Exclude:
        - Abstract concepts (e.g., 'Justice', 'Time')
        - Generic terms (e.g., 'Building', 'Vehicle')
        - Non-story-relevant items
        
        Return JSON array like: [{{"name":"Entity", "type":"character"}}]
        <|im_end|>
        <|im_start|>user
        Entities: {json.dumps(list(entities))}
        Passage: {passage[:1500]}
        <|im_end|>
        <|im_start|>assistant
        """
        
        try:
            response = model(prompt, temperature=0.3)
            response_text = response["choices"][0]["text"]
            
            # Call extract_parse_json to handle JSON extraction and parsing
            parsed_items = await self.extract_parse_json(response_text)
            
            if not parsed_items:  # Handles None or empty list
                return {}
            
            return {
                item["name"]: item["type"]
                for item in parsed_items
                if "name" in item and "type" in item
            }
        except Exception as e:
            logger.error(f"Classification failed: {str(e)}")
            return {}
        
    async def extract_parse_json(self, text: str) -> Optional[list]:
        """Extract and parse JSON from text, handling markdown code blocks."""
        try:
            # Improved regex to handle code blocks with optional language specifiers
            code_block_match = re.search(
                r"```(?:json)?\s*([\s\S]*?)\s*```", 
                text, 
                flags=re.IGNORECASE
            )
            
            if code_block_match:
                json_str = code_block_match.group(1)
                # Remove any remaining backticks that might be in the content
                json_str = json_str.replace('`', '')
            else:
                # Fallback: look for the first complete JSON structure
                json_candidates = re.findall(r'({.*}|[.*])', text, re.DOTALL)
                if json_candidates:
                    json_str = json_candidates[0]
                else:
                    logger.error("No JSON structure found in text")
                    return None

            # Clean whitespace and validate
            json_str = json_str.strip()
            if not json_str:
                return None

            logger.info(f"Extracted JSON string: {json_str}")
            
            # Parse with JSON5 (more forgiving)
            parsed = json5.loads(json_str)
            
            # Ensure we return a list
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                return [parsed]
            
            logger.error(f"Unexpected JSON type: {type(parsed)}")
            return None

        except (json.JSONDecodeError, ValueError) as je:
            logger.error(f"JSON error at line {je.lineno}: {je.msg}") #type: ignore
            logger.info(f"Invalid JSON content: {json_str}")
            logger.error(f"JSON decode error: {str(je)}")
            logger.info(f"Problem content: {json_str}")
            return None
        except Exception as e:
            logger.error(f"JSON parse error: {str(e)}")
            return None
          
    async def _generate_character_details(self, name, content):
            """Generate detailed character attributes with validation"""
            prompt = f"""<|im_start|>system
            Generate details for {name} based on {content} if nothing in content then based on {name}
            - physicalAppearance: 1-2 sentences, f"A distinct look unique to {name}."
            - behavioralPatterns: 2-3 traits, f"Typical behaviors associated with {name}."
            - genderAndSexualOrientation: f"Female, heterosexual"
            - relationships: Key connections
            - likesAndDislikes: 3 likes/dislikes
            
            Context: {content[:1000]}
            Return JSON only.<|im_end|>
            """
            response = await model._json(prompt, response_format={"type": "json_object"})
            raw_text = response["choices"][0]["text"]
            details  = await self.extract_parse_json(raw_text)
            
            return self._validate_character_details(details, name)

    async def _update_character_description(self, character_name: str, passage_text: str) -> None:
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
                You MUST maintain these rules:
                1. Keep character name EXACTLY as: {character_name}
                2. Only update fields with new information from this passage: {passage_text}
                Return only the entire json object following the schema below. Update the required fields only and keep the rest as is.
                the json object should be valid and follow the schema.
                ###Example of a correctly formatted response:
                  {{
                    "name": {character_name},
                    "type": "character",
                    "role": "Protagonist",
                    "physicalAppearance": "A striking figure with piercing blue eyes, shoulder-length chestnut hair, and a lean, athletic build. Alex's face is marked by a small scar above the left eyebrow, a memento from a past adventure.",
                    "behavioralPatterns": "Inquisitive and determined, Alex is not afraid to dig deep to uncover the truth. They are empathetic and fiercely loyal to those they care about, but can be impulsive and headstrong at times.",
                    "genderAndSexualOrientation": "Female, bisexual",
                    "relationships": {{
                        "Lila Blackwood": "Local librarian and confidante",
                        "Samuel Gray": "Enigmatic antique shop owner",
                        "Whispers of Millfield": "Mysterious forces driving Alex's quest"
                    }},
                    "likesAndDislikes": {{
                        "Likes": [
                        "Unsolved mysteries",
                        "Old books and artifacts",
                        "Long walks in nature"
                        ],
                        "Dislikes": [
                        "Deception",
                        "People who shy away from the truth",
                        "Crowded places"
                        ]
                    }}
                    }},
            
                ###Context:
                Character: {character_name}
                Recent events: {passage_text}
                ###Instructions:
                response should only include json object that can directly be parsed.
                ###Schema:
                \n<schema>\n{character_schema}\n</schema>


                <|im_end|>
                <|im_start|>assistant
                """

                logger.info(f"Generating updates for character: {character_name}")
                response = await model._json(
                    prompt,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": "Character",
                            "strict": True,
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "The name of the character/entity/location",
                                    },
                                    "type": {
                                        "type": "string",
                                        "description": "The type of entity. Must be one of: character, entity, or location.",
                                    },
                                    "role": {
                                        "type": "string",
                                        "description": "The role or function in the story",
                                    },
                                    "physicalAppearance": {
                                        "type": "string",
                                        "description": "The physical appearance of the character/entity/location",
                                    },
                                    "behavioralPatterns": {
                                        "type": "string",
                                        "description": "The behavioral patterns of the character/entity/location",
                                    },
                                    "genderAndSexualOrientation": {
                                        "type": "string",
                                        "description": "The gender and sexual orientation of the character/entity/location",
                                    },
                                    "relationships": {
                                        "type": "object",
                                        "description": "The relationships of the character/entity/location",
                                        "additionalProperties": {
                                            "type": "string",
                                            "description": "The relationship description",
                                        },
                                    },
                                    "likesAndDislikes": {
                                        "type": "object",
                                        "description": "The likes and dislikes of the character/entity/location",
                                        "properties": {
                                            "Likes": {
                                                "type": "array",
                                                "items": {"type": "string"},
                                                "description": "List of likes",
                                            },
                                            "Dislikes": {
                                                "type": "array",
                                                "items": {"type": "string"},
                                                "description": "List of dislikes",
                                            },
                                        },
                                        "required": ["Likes", "Dislikes"],
                                    },
                                },
                                "required": [
                                    "name",
                                    "type",
                                    "role",
                                    "physicalAppearance",
                                    "behavioralPatterns",
                                    "genderAndSexualOrientation",
                                    "relationships",
                                    "likesAndDislikes",
                                ],
                                "additionalProperties": False,
                            },
                        },
                    },
                )
                if not isinstance(response, dict) or "choices" not in response:
                    logger.error("Invalid model response")
                    return

                try:
                    raw_text = response["choices"][0]["text"]
                    updates = await self.extract_parse_json(raw_text)

                    if not updates or not isinstance(updates, list) or len(updates) == 0:
                        raise ValueError("Failed to parse valid JSON updates")

                    update_data = updates[0]  # Extract the first (and only) update
                    # After extracting update_data in _update_character_description:
                    if update_data.get("name", "").lower() != character_name.lower():
                        logger.error(f"Name mismatch: {update_data.get('name')} vs {character_name}")
                        logger.error(f"Model returned incorrect name: {update_data.get('name')} for {character_name}")
                        return
                    # Inside _update_character_description after parsing updates:
                    if update_data["name"].lower() != character_name.lower():
                        logger.error(f"Generated name '{update_data['name']}' does not match '{character_name}'")
                        return
                    
                    character_name = update_data.get("name")
                    if not character_name:
                        raise ValueError("Update data missing 'name' field")

                    # Find the character in the story's characters list
                    character = next(
                        (c for c in story["characters"] if c["name"].lower() == character_name.lower()),
                        None,
                    )
                    if character:
                        # Update the character locally
                        story["characters"] = [
                            update_data if c["name"].lower() == character_name.lower() else c
                            for c in story["characters"]
                        ]

                        # Update the character in the database
                        await stories.update_one(
                            {
                                "story_id": ObjectId(self.story_id),
                                "characters.name": {
                                    "$regex": f"^{character_name}$",
                                    "$options": "i",
                                },
                            },
                            {"$set": {"characters.$": update_data}},
                        )
                        logger.info(f"Successfully updated character: {character_name}")
                    else:
                        logger.error(f"Character {character_name} not found in story")
                except Exception as e:
                    logger.error(f"Error processing character update: {e}")
                    
            except Exception as e:
                logger.error(f"Failed to update character description: {e}")
            
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
        """Extract important keywords from text using spaCy"""
        if isinstance(text, dict):
            text = " ".join(str(v) for v in text.values())

        # Process the text with spaCy
        doc = self.nlp(text)

        # Extract keywords: nouns and proper nouns
        keywords = [
            token.text.lower()
            for token in doc
            if token.pos_ in {"NOUN", "PROPN"} and not token.is_stop and len(token) > 3
        ]

        return list(set(keywords))  # Return unique keywords

    def _calculate_readability(self, text: str) -> float:
        """
        Calculate a readability score using spaCy.
        Uses a simplified version of the Flesch Reading Ease score,
        normalized to a 0-1 scale where 1 is most readable.
        """
        try:
            doc = self.nlp(text)

            # Get sentences and words
            sentences = list(doc.sents)
            words = [
                token for token in doc if not token.is_punct and not token.is_space
            ]

            if not sentences or not words:
                return 0.0

                # Calculate metrics
            avg_sentence_length = len(words) / len(sentences)
            avg_word_length = sum(len(word.text) for word in words) / len(words)

            # Complex words are those with more than 2 syllables
            # Approximate syllables using character length and consonant clusters
            complex_words = sum(1 for word in words if len(word.text) > 6)
            complex_word_ratio = complex_words / len(words)

            # Calculate readability (simplified Flesch formula)
            # Higher score = more readable
            base_score = (
                206.835 - (1.015 * avg_sentence_length) - (84.6 * complex_word_ratio)
            )

            # Normalize to 0-1 range
            normalized_score = max(0.0, min(1.0, base_score / 100))

            return normalized_score

        except Exception as e:
            logger.error(f"Error calculating readability: {e}")
            return 0.0

    async def _evaluate_passages(self, passages: List[GeneratedPassage], context: PassageContext
    ) -> GeneratedPassage:
        """
        Enhanced evaluation of passages incorporating improved heuristics:
        - Length: Optimally around 500 words.
        - Coherence: Assessed via sentence-length uniformity (a proxy for smooth transitions).
        - Keyword Relevance: Overlap between context outline keywords and passage keywords.
        - Entity Coverage: Match between context entities and entities mentioned in the passage.
        - Readability: Based on average sentence length approaching an ideal target.

        We use the following weights:
        - Length: 15%
        - Coherence: 25%
        - Keyword Relevance: 25%
        - Entity Coverage: 15%
        - Readability: 20%
        """

        async def score_passage(
            passage: GeneratedPassage,
        ) -> Tuple[GeneratedPassage, float]:
            total_score = 0.0

            # Heuristic: Length Score (optimal at ~500 words)
            word_count = len(passage.content.split())
            length_score = max(0.0, 1.0 - abs(500 - word_count) / 500)
            total_score += length_score * 0.15

            # Coherence Score: using sentence-length uniformity
            coherence_score = rewriter.calculate_coherence_flow(passage.content)
            total_score += coherence_score * 0.25

            # Relevance Score: Keyword overlap between context and passage
            outline_keywords = set(self._extract_keywords(context.current_outline))
            passage_keywords = set(self._extract_keywords(passage.content))
            relevance_score = (
                len(outline_keywords & passage_keywords) / len(outline_keywords)
                if outline_keywords
                else 0.0
            )
            total_score += relevance_score * 0.25

            # Entity Coverage Score: Overlap of characters/entities
            outline_entities = set(
                context.current_outline.get("characters_involved", [])
            )
            passage_entities = set(passage.mentioned_entities)
            entity_score = (
                len(outline_entities & passage_entities) / len(outline_entities)
                if outline_entities
                else 0.0
            )
            total_score += entity_score * 0.15

            # Readability Score: existing heuristic based on average sentence length
            readability_score = rewriter._calculate_readability(passage.content)
            total_score += readability_score * 0.20

            return passage, total_score

        scored_passages = await asyncio.gather(*(score_passage(p) for p in passages))
        # Return the passage with the highest total score
        return max(scored_passages, key=lambda x: x[1])[0]

    def _calculate_coherence(self, text: str) -> float:
        """
        Calculate a simple coherence score based on the uniformity of sentence lengths.
        The idea is that passages with more consistent sentence lengths tend to flow more naturally.
        This heuristic computes the coefficient of variation (standard deviation divided by mean)
        and inverts it so that a lower variation yields a higher coherence score.
        """
        # Split text into sentences using period as a delimiter.
        sentences = [s.strip() for s in text.split(".") if s.strip()]
        if not sentences:
            return 0.0

        # Compute the number of words in each sentence.
        sentence_lengths = [len(s.split()) for s in sentences]
        if len(sentence_lengths) <= 1:
            return 1.0

        mean_length = sum(sentence_lengths) / len(sentence_lengths)
        variance = sum((l - mean_length) ** 2 for l in sentence_lengths) / (
            len(sentence_lengths) - 1
        )
        std_dev = variance**0.5

        # Coherence is high when the standard deviation is low relative to the mean.
        # We normalize to a score between 0 and 1.
        coherence = max(0.0, 1.0 - (std_dev / mean_length))
        return coherence

    def _validate_character_details(self, response, expected_name):
            """Ensure response matches expected character"""
            try:
                details = response[0]
                behavioralPatterns = details.get("behavioralPatterns", [])   
                if isinstance(behavioralPatterns, list):
                    behavioralPattern_str = "\n".join([f"{pattern}" for pattern in behavioralPatterns])
                else:
                    behavioralPattern_str = str(behavioralPatterns)

                    
                return (
                    details.get("physicalAppearance", ""),
                    behavioralPattern_str,
                    details.get("genderAndSexualOrientation", ""),
                    details.get("relationships", {}),
                    details.get("likesAndDislikes", {"Likes": [], "Dislikes": []})
                )
            except Exception as e:
                logger.error(f"Validation failed: {str(e)}")
                return (
                    "",
                    "N/A",
                    "N/A",
                    {},
                    {"Likes": [], "Dislikes": []}
                )
       
    async def _generate_character_role(self, name, content):
        """Generate role description with context"""
        prompt = f"""<|im_start|>system
        Determine {name}'s role based on:
        {content[:1000]}
        Return 1-2 words role description.<|im_end|>
        <|im_start|>user
        Describe {name}'s role<|im_end|>
        <|im_start|>assistant
        """
        response_format = {"type": "json", "schema": {"role_description": "string"}}
        result = await model._json(prompt, response_format=response_format, max_tokens=100)
        # Assuming the model returns a JSON object with a key "role_description"
        role_description = result["choices"][0]["text"].strip()
        return role_description

    async def _batch_generate_characters(self, entities, content, context, classified_types):
        """Batch generate characters with enhanced logging"""
        generated = []

        def normalize_name(name: str) -> str:
                """Normalize entity names for consistent comparison."""
                name = re.sub(r'^\s*the\s+', '', name, flags=re.IGNORECASE)
                name = re.sub(r'\s+(of|in|at|on|by|for|with)\s*$', '', name, flags=re.IGNORECASE)
                return name.strip().lower()
        
        for entity in entities:
            try:
                start_time = time.time()
                entity_type = classified_types.get(entity)
                
                logger.info(f"Generating base profile for: {entity} ({entity_type})")
                rol = await self._generate_character_role(entity, content)
                # Base character structure
                char_data = {
                    "name": entity,
                    "type": entity_type,
                    "role": rol,
                    "physicalAppearance": "",
                    "behavioralPatterns": "",
                    "genderAndSexualOrientation": "",
                    "relationships": {},
                    "likesAndDislikes": {"Likes": [], "Dislikes": []}
                }

                # Type-specific generation
                if entity_type == "character":
                    response = await self._generate_character_details(entity, content)
                elif entity_type in ("location", "entity"):
                    logger.info(f"Generating non-character details for {entity}")
                    response = await self._generate_entity_details(entity, content)

                if response:                
                    # Update with validated details
                    char_data.update(zip([
                        "physicalAppearance", "behavioralPatterns",
                        "genderAndSexualOrientation", "relationships",
                        "likesAndDislikes"
                    ], response))
                logger.info(f"Generating {entity_type} details for {entity} with data ")
                generated.append(char_data)

            except Exception as e:
                logger.error(f"Batch generation failed for {entity}: {str(e)}")
                logger.info(f"Failed entity context: {content[:200]}")
        
        return generated                

    async def _generate_entity_details(self, name, content):
        """Generate details for non-character entities."""
        prompt = f"""<|im_start|>system
        Describe {name} with:
        - PhysicalDescription: 1-2 sentences
        - Significance: Story importance
        - KeyFeatures: 3-5 points in string form
        Return JSON format.<|im_end|>
        <|im_start|>user
        Describe {name} based on: {content[:500]}<|im_end|>
        <|im_start|>assistant
        """
        
        response = await model._json(prompt, response_format={"type": "json_object"})
        raw_text = response["choices"][0]["text"]
        details = await self.extract_parse_json(raw_text)
        
        return self._validate_entity_details(details, name)

    def _validate_entity_details(self, response, expected_name):
        """Validate entity details structure and format to match character schema."""
        try:
            details = response[0]
            
            # Format physical appearance with sections separated by newlines
            physical_description = details.get("PhysicalDescription", "")
            significance = details.get("Significance", "")
            key_features = details.get("KeyFeatures", [])

            if isinstance(key_features, list):
                key_features_str = "\n".join([f"• {feature}" for feature in key_features])
            else:
                key_features_str = str(key_features)
            
            # Combine all descriptions with double newlines
            physical_appearance = (
                f"Physical Description: {physical_description}\n"
                f"Significance: {significance}\n"
                f"Key Features: {key_features_str}"
            )
            # Return with all required fields to match character schema
            return (
                physical_appearance,  # For "physicalAppearance"
                "NA",         # For "behavioralPatterns"
                "NA",     # For "genderAndSexualOrientation"
                details.get("relationships", {"The Archivist": "Astrid has a fascinating connection to the Archivist"}),
                details.get("likesAndDislikes", {"Likes": ["Navigating the complexities of the timestream"],
                                                "Dislikes": ["exploiting the power"]})
            )
        
        # except Exception as e:
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"JSON5 parse error: {str(e)}")
            logger.error(f"Invalid entity details: {str(e)}")
            # Return default values for all required fields
            return (
                "",
                "N/A",
                "N/A",
                {},
                {"Likes": [], "Dislikes": []}
            )   
 