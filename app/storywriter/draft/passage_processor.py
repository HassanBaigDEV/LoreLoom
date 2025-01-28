import logging
import asyncio
from typing import List, Dict, Optional
from bson import ObjectId
from datetime import datetime

from .schema import PassageContext, GeneratedPassage
from app.config.mongo import db, stories
from app.utils.text_validation import is_complete_sentence
from ..plan.db.vector import store_story_part
from ..llm_colab import model
from .revision_manager import RevisionManager

logger = logging.getLogger(__name__)
passage_collection = db.passages


class PassageProcessor:
    def __init__(self):
        self.revision_manager = RevisionManager()

    @staticmethod
    async def process_passage(
        passage_text: str,
        story_id: str,
        outline_point_id: str,
        summary_generator,
        entity_extractor,
    ) -> Optional[GeneratedPassage]:
        """Process a single passage text into a GeneratedPassage object"""
        if not passage_text.strip():
            return None

        try:
            # Split into sentences
            sentences = passage_text.split(".")
            # Check if last sentence is complete
            if len(sentences) > 1 and not is_complete_sentence(sentences[-1]):
                complete_text = ".".join(sentences[:-1]) + "."
            else:
                complete_text = passage_text

            # Generate summary and extract entities in parallel
            summary_task = summary_generator(complete_text)
            entities_task = entity_extractor(complete_text)

            summary, entities = await asyncio.gather(summary_task, entities_task)

            return GeneratedPassage(
                passage_id=str(ObjectId()),
                story_id=story_id,
                outline_point_id=outline_point_id,
                content=complete_text.strip(),
                summary=summary or "Summary generation failed.",
                mentioned_entities=entities,
            )
        except Exception as e:
            logger.error(f"Error processing passage: {e}")
            return None

    @staticmethod
    async def store_passages(
        passages: List[GeneratedPassage], best_passage: GeneratedPassage
    ) -> None:
        """Store passages in MongoDB and vector store"""
        store_tasks = []
        for passage in passages:
            if passage:  # Check if passage exists
                passage_dict = passage.model_dump()
                passage_dict["is_best"] = passage.passage_id == best_passage.passage_id
                store_tasks.append(passage_collection.insert_one(passage_dict))

                # Only create task if store_story_part returns a coroutine
                vector_store_task = store_story_part(
                    "passage",
                    passage.story_id,
                    passage.content,
                    passage.content,
                )
                if vector_store_task is not None:
                    store_tasks.append(asyncio.create_task(vector_store_task))

        await asyncio.gather(*store_tasks)

    async def update_passage(
        self, passage: GeneratedPassage, new_content: str, user_id: Optional[str] = None
    ) -> Optional[GeneratedPassage]:
        """Update a passage with new content and create revision"""
        try:
            # Create revision
            revision = await self.revision_manager.create_revision(
                passage, new_content, user_id
            )

            # Update passage object
            updated_passage = GeneratedPassage(
                **passage.model_dump(), content=new_content
            )

            return updated_passage

        except Exception as e:
            logger.error(f"Error updating passage: {e}")
            return None

    async def get_passage_history(self, passage_id: str) -> List[Dict]:
        """Get revision history for a passage"""
        try:
            revisions = await self.revision_manager.get_revision_history(passage_id)
            return [rev.model_dump() for rev in revisions]
        except Exception as e:
            logger.error(f"Error getting passage history: {e}")
            return []
