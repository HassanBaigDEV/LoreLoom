from typing import List, Dict, Optional
from app.storywriter.plan.db.vector import store_story_part, find_similar_parts
import logging

logger = logging.getLogger(__name__)


class PassageVectorStore:
    def __init__(self, story_id: str):
        self.story_id = story_id

    def store_passage(self, passage_id: str, content: str) -> bool:
        """Store passage content in vector store"""
        try:
            store_story_part("passage", self.story_id, passage_id, content)
            return True
        except Exception as e:
            logger.error(f"Failed to store passage in vector store: {e}")
            return False

    def find_similar_passages(self, query_text: str, top_n: int = 5) -> List[Dict]:
        """Find similar passages using vector similarity"""
        try:
            if not query_text:
                return []

            results = find_similar_parts("passage", self.story_id, query_text, top_n)
            if results is None:
                return []

            return [
                {
                    "id": str(r[0]),  # Ensure ID is string
                    "content": r[1],
                    "score": float(r[2]) if len(r) > 2 else 0.0,
                }
                for r in results
            ]
        except Exception as e:
            logger.error(f"Error finding similar passages: {e}")
            return []
