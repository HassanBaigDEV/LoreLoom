import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel

from .schema import GeneratedPassage
from app.config.mongo import db

logger = logging.getLogger(__name__)


class PassageRevision(BaseModel):
    revision_id: str
    passage_id: str
    story_id: str
    content: str
    previous_content: str
    timestamp: datetime
    changes: Dict[str, str]  # Tracks specific changes made
    affected_elements: List[str]  # IDs of affected story elements
    user_id: Optional[str] = None


class RevisionManager:
    def __init__(self):
        self.revision_collection = db.passage_revisions
        self.passage_collection = db.passages

    async def create_revision(
        self, passage: GeneratedPassage, new_content: str, user_id: Optional[str] = None
    ) -> PassageRevision:
        """Create a new revision for a passage"""
        try:
            revision = PassageRevision(
                revision_id=str(ObjectId()),
                passage_id=passage.passage_id,
                story_id=passage.story_id,
                content=new_content,
                previous_content=passage.content,
                timestamp=datetime.utcnow(),
                changes=self._analyze_changes(passage.content, new_content),
                affected_elements=await self._identify_affected_elements(
                    passage, new_content
                ),
                user_id=user_id,
            )

            # Store revision
            await self.revision_collection.insert_one(revision.model_dump())

            # Update passage with new content
            await self.passage_collection.update_one(
                {"passage_id": passage.passage_id},
                {"$set": {"content": new_content, "updated_at": datetime.utcnow()}},
            )

            return revision

        except Exception as e:
            logger.error(f"Error creating revision: {e}")
            raise

    def _analyze_changes(self, old_content: str, new_content: str) -> Dict[str, str]:
        """Analyze the differences between old and new content"""
        changes = {}

        # Basic change analysis (can be enhanced with more sophisticated diff algorithms)
        if len(new_content) > len(old_content):
            changes["type"] = "addition"
        elif len(new_content) < len(old_content):
            changes["type"] = "deletion"
        else:
            changes["type"] = "modification"

        # Add more detailed analysis as needed
        return changes

    async def _identify_affected_elements(
        self, passage: GeneratedPassage, new_content: str
    ) -> List[str]:
        """Identify story elements affected by the changes"""
        affected_elements: List[str] = []  # Check for character mentions
        old_chars = set(passage.mentioned_entities)
        # You'll need to implement entity extraction for new content
        # new_chars = set(await extract_entities(new_content))

        # Add affected character IDs
        affected_elements.extend(list(old_chars))

        return affected_elements

    async def get_revision_history(self, passage_id: str) -> List[PassageRevision]:
        """Get the revision history for a passage"""
        try:
            revisions = (
                await self.revision_collection.find({"passage_id": passage_id})
                .sort("timestamp", -1)
                .to_list(length=None)
            )

            return [PassageRevision(**rev) for rev in revisions]
        except Exception as e:
            logger.error(f"Error getting revision history: {e}")
            return []

    async def revert_to_revision(self, revision_id: str) -> Optional[PassageRevision]:
        """Revert a passage to a specific revision"""
        try:
            revision = await self.revision_collection.find_one(
                {"revision_id": revision_id}
            )
            if not revision:
                return None

            revision_obj = PassageRevision(**revision)

            # Create new revision for the revert
            current_passage = await self.passage_collection.find_one(
                {"passage_id": revision_obj.passage_id}
            )
            if not current_passage:
                return None

            return await self.create_revision(
                GeneratedPassage(**current_passage),
                revision_obj.content,
                revision_obj.user_id,
            )

        except Exception as e:
            logger.error(f"Error reverting revision: {e}")
            return None
