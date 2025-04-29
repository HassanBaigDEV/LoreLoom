from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
import logging
from pydantic import BaseModel
from datetime import datetime

from app.storywriter.draft.main import DraftGenerator
from app.storywriter.draft.schema import GeneratedPassage
from app.config.mongo import stories, db
from app.storywriter.draft.passage_processor import PassageProcessor

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize passages collection
passages = db.passages


class Passage(BaseModel):
    passage_id: str
    story_id: str
    outline_point_id: str
    content: str
    summary: str
    mentioned_entities: List[str]
    created_at: datetime  # This ensures the date is parsed correctly

    # Custom class config for Pydantic to handle ObjectId
    class Config:
        json_encoders = {ObjectId: str}  # Convert ObjectId to string


def custom_jsonable_encoder(obj):
    if isinstance(obj, ObjectId):
        return str(obj)  # Convert ObjectId to string
    return jsonable_encoder(obj)


# get passage count
@router.get("/passages/{story_id}/count")
async def get_passage_count(story_id: str, user_id: str):
    """Get the total number of passages for a story"""
    try:
        # Validate story ownership
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            logger.error(f"Story {story_id} not found or unauthorized")
            return HTTPException(
                status_code=404, detail="Story not found or unauthorized"
            )
        # Get the total number of passages for the story
        count = await passages.count_documents({"story_id": story_id})
        return {"count": count}
    except Exception as e:
        logger.error(f"Error retrieving passage count: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.get("/passages/{story_id}", response_model=List[Passage])
async def get_story_passages(
    story_id: str, user_id: str, limit: int = 10, skip: int = 0
):
    """Get passages for a story with pagination"""
    try:
        # Validate story ownership
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            logger.error(f"Story {story_id} not found or unauthorized")
            raise HTTPException(
                status_code=404, detail="Story not found or unauthorized"
            )

        # Get passages with pagination
        cursor = passages.find({"story_id": story_id})
        cursor.sort("created_at", -1).skip(skip).limit(limit)

        # Convert the data into Pydantic models and handle serialization
        passages_list = await cursor.to_list(length=limit)

        # Use FastAPI's jsonable_encoder to handle serialization of non-serializable types
        return [
            jsonable_encoder(passage, custom_encoder={ObjectId: str})
            for passage in passages_list
        ]

    except Exception as e:
        logger.error(f"Error retrieving passages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/passage/{passage_id}")
async def get_passage(passage_id: str, user_id: str):
    """Get a specific passage by ID"""
    try:
        passage = await passages.find_one({"passage_id": passage_id})
        if not passage:
            logger.error(f"Passage {passage_id} not found")
            return HTTPException(status_code=404, detail="Passage not found")

        # Validate user has access to the story
        story = await stories.find_one(
            {"story_id": ObjectId(passage["story_id"]), "author": ObjectId(user_id)}
        )
        if not story:
            logger.error(f"Unauthorized access to passage {passage_id}")
            return HTTPException(status_code=403, detail="Unauthorized")

        return passage
    except Exception as e:
        logger.error(f"Error retrieving passage: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.get("/passage/outline/{outline_point_id}")
async def get_passage_by_outline_point(outline_point_id: str, user_id: str):
    """Get the passage associated with a specific outline point"""
    try:
        passage = await passages.find_one({"outline_point_id": outline_point_id})
        if not passage:
            logger.error(f"No passage found for outline point {outline_point_id}")
            return HTTPException(
                status_code=404, detail="No passage found for this outline point"
            )

        # Validate user has access to the story
        story = await stories.find_one(
            {"story_id": ObjectId(passage["story_id"]), "author": ObjectId(user_id)}
        )
        if not story:
            logger.error(
                f"Unauthorized access to passage for outline point {outline_point_id}"
            )
            return HTTPException(status_code=403, detail="Unauthorized")

        return passage
    except Exception as e:
        logger.error(f"Error retrieving passage: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.delete("/passage/{passage_id}")
async def delete_passage(passage_id: str, user_id: str):
    """Delete a specific passage"""
    try:
        passage = await passages.find_one({"passage_id": passage_id})
        if not passage:
            logger.error(f"Passage {passage_id} not found")
            return HTTPException(status_code=404, detail="Passage not found")

        # Validate user has access to the story
        story = await stories.find_one(
            {"story_id": ObjectId(passage["story_id"]), "author": ObjectId(user_id)}
        )
        if not story:
            logger.error(f"Unauthorized access to delete passage {passage_id}")
            return HTTPException(status_code=403, detail="Unauthorized")

        result = await passages.delete_one({"passage_id": passage_id})
        if result.deleted_count == 0:
            logger.error(f"Failed to delete passage {passage_id}")
            return HTTPException(status_code=500, detail="Failed to delete passage")

        return {"message": "Passage deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting passage: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.get("/outline-points/{story_id}")
async def get_outline_points(story_id: str, user_id: str):
    """Get all outline points for a story"""
    try:
        # Validate story ownership
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        # Ensure the outline is a list of dictionaries
        outline = story.get("outline", [])
        if not isinstance(outline, list) or not all(
            isinstance(event, dict) for event in outline
        ):
            raise HTTPException(
                status_code=500, detail="Outline data must be a list of dictionaries"
            )

        # Extract points from the outline
        def extract_points(outline_events: List[Dict]) -> List[Dict]:
            """Extract points from outline events array"""
            points = []
            for event in outline_events:
                points.append(
                    {
                        "id": event.get("number", ""),  # Use number as ID
                        "title": event.get("title", ""),
                        "description": event.get("description", ""),
                        "setting": event.get("setting", ""),
                        "estimated_duration": event.get("estimated_duration", ""),
                        "characters_involved": event.get("characters_involved", []),
                    }
                )
            return points

        outline_points = extract_points(outline)
        return outline_points

    except Exception as e:
        logger.error(f"Error retrieving outline points: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/test-llm")
async def test_llm():
    """Test if the LLM is working properly"""
    try:
        result = await DraftGenerator.test_llm()
        if result:
            return {"status": "success", "message": "LLM is working properly"}
        return {"status": "error", "message": "LLM test failed"}
    except Exception as e:
        logger.error(f"Error testing LLM: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.post("/prefer-passage/{story_id}")
async def prefer_passage(story_id: str, passage: Passage):
    """Save the preferred passage for a specific story"""
    try:
        # Validate story ownership (Optional but recommended security)

        story = await stories.find_one(
            {"story_id": ObjectId(story_id)}
        )
        if not story:
            logger.error(f"Story {story_id} not found")
            raise HTTPException(
                status_code=404, detail="Story not found or unauthorized"
            )

        # Prepare the passage document
        passage_document = {
            "passage_id": str(ObjectId()), 
            "story_id": story_id, 
            "outline_point_id": passage.outline_point_id,  
            "content": passage.content,  
            "summary": passage.summary,
            "mentioned_entities": passage.mentioned_entities,
            "created_at": datetime.now(),  
        }

        # Save the passage to the database
        result = await passages.insert_one(passage_document)

        # Initialize draft generator (optional step, depending on the requirement)
        draft_gen = DraftGenerator(story_id)

        return {
            "message": "Preferred passage saved successfully.",
            "passage_id": passage.passage_id  # Return the inserted passage_id if needed
        }

    except ValueError as ve:
        logger.error(f"ValueError: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error saving preferred passage: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error") 


@router.post("/generate-passages/{story_id}")
async def generate_passages(story_id: str, outline_point_id: str, user_id: str, num_variations: int = 3):
    """Generate multiple passage variations for a specific outline point"""
    try:
        # Validate story ownership
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            logger.error(f"Story {story_id} not found or unauthorized")
            return HTTPException(
                status_code=404, detail="Story not found or unauthorized"
            )

        # Initialize draft generator
        draft_gen = DraftGenerator(story_id)

        # Generate passages
        passages = await draft_gen.generate_passages(outline_point_id, num_variations)
        
        # return passages
        return {
            "passages": passages,
            "message": "Multiple passages generated successfully",
        }
    except ValueError as ve:
        logger.error(f"ValueError: {ve}")
        return HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error generating passages: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.post("/generate-passages-wS/{story_id}")
async def generate_passages_wS(story_id: str, outline_point_id: str, user_id: str, num_variations: int = 3):
    """Generate multiple passage variations for a specific outline point with Option for user """
    try:
        # Validate story ownership
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            logger.error(f"Story {story_id} not found or unauthorized")
            raise HTTPException(
                status_code=404, detail="Story not found or unauthorized"
            )

        # Initialize draft generator
        draft_gen = DraftGenerator(story_id)

        # Generate passages
        passages = await draft_gen.generate_passages_wS(outline_point_id, num_variations)
        
        return {
            "passages": passages,
            "message": "Multiple passages generated successfully"
        }

    except ValueError as ve:
        logger.error(f"ValueError: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error generating passages: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/generate-passage/{story_id}")
async def generate_passage(story_id: str, outline_point_id: str, user_id: str):
    """Generate a new passage for a specific outline point"""
    try:
        # Validate story ownership
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            logger.error(f"Story {story_id} not found or unauthorized")
            return HTTPException(
                status_code=404, detail="Story not found or unauthorized"
            )

        # Check if outline point exists
        if "outline" not in story or not story["outline"]:
            logger.error(f"No outline found for story {story_id}")
            return HTTPException(status_code=400, detail="Story outline not found")

        # Initialize draft generator
        draft_gen = DraftGenerator(story_id)

        # Generate passage
        passage = await draft_gen.generate_passage(outline_point_id)

        return passage
    except ValueError as ve:
        logger.error(f"ValueError: {ve}")
        return HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error generating passage: {e}")
        return HTTPException(status_code=500, detail=str(e))

# Add these new models
class PassageUpdateRequest(BaseModel):
    content: str
    user_id: Optional[str] = None


class RevisionResponse(BaseModel):
    revision_id: str
    passage_id: str
    content: str
    previous_content: str
    timestamp: datetime
    changes: Dict[str, str]
    affected_elements: List[str]
    user_id: Optional[str]


# Add these new endpoints
@router.put("/passage/{passage_id}")
async def update_passage(passage_id: str, update: PassageUpdateRequest):
    """Update a passage with new content and create revision"""
    try:
        # Get original passage
        # logger.debug(update.model_dump_json())
        passage = await passages.find_one({"passage_id": passage_id})
        if not passage:
            raise HTTPException(status_code=404, detail="Passage not found")

        # Create passage processor
        processor = PassageProcessor()

        # # Update passage
        # # print(passage)
        # # print passage json object
        # print(passage)

        updated_passage = await processor.update_passage(
            GeneratedPassage(**passage), update.content, update.user_id
        )

        if not updated_passage:
            raise HTTPException(status_code=500, detail="Failed to update passage")

        return jsonable_encoder(updated_passage)

    except Exception as e:
        logger.error(f"Error updating passage: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/passage/{passage_id}/history")
async def get_passage_history(passage_id: str):
    """Get revision history for a passage"""
    try:
        processor = PassageProcessor()
        history = await processor.get_passage_history(passage_id)
        return jsonable_encoder(history)
    except Exception as e:
        logger.error(f"Error getting passage history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/passage/{passage_id}/revert/{revision_id}")
async def revert_passage(passage_id: str, revision_id: str):
    """Revert a passage to a specific revision"""
    try:
        processor = PassageProcessor()
        revision_manager = processor.revision_manager

        reverted = await revision_manager.revert_to_revision(revision_id)
        if not reverted:
            raise HTTPException(status_code=404, detail="Revision not found")

        return jsonable_encoder(reverted)
    except Exception as e:
        logger.error(f"Error reverting passage: {e}")
        raise HTTPException(status_code=500, detail=str(e))
