from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
import logging
from pydantic import BaseModel
from datetime import datetime
import json

from app.storywriter.draft.main import DraftGenerator
from app.storywriter.draft.schema import GeneratedPassage
from app.config.mongo import stories, db
from app.storywriter.draft.passage_processor import PassageProcessor
from app.utils.websocket_auth import websocket_manager

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
async def get_passage_count(story_id: str):
    """Get the total number of passages for a story"""
    try:
        # Validate story ownership
        story = await stories.find_one({"story_id": ObjectId(story_id)})
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
        story = await stories.find_one({"story_id": ObjectId(story_id)})
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

        story = await stories.find_one({"story_id": ObjectId(story_id)})
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
            "passage_id": passage.passage_id,  # Return the inserted passage_id if needed
        }

    except ValueError as ve:
        logger.error(f"ValueError: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error saving preferred passage: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/generate-passages/{story_id}")
async def generate_passages(
    story_id: str, outline_point_id: str, user_id: str, num_variations: int = 3
):
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
async def generate_passages_wS(
    story_id: str, outline_point_id: str, user_id: str, num_variations: int = 3
):
    """Generate multiple passage variations for a specific outline point with Option for user"""
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
        passages = await draft_gen.generate_passages_wS(
            outline_point_id, num_variations
        )

        return {
            "passages": passages,
            "message": "Multiple passages generated successfully",
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
    user_id: str
    content: str


class RevisionResponse(BaseModel):
    revision_id: str
    passage_id: str
    content: str
    previous_content: str
    timestamp: datetime
    changes: Dict[str, str]
    affected_elements: List[str]
    user_id: Optional[str]


class PassageLockRequest(BaseModel):
    user_id: str


# Add these new endpoints
@router.put("/passage/{passage_id}")
async def update_passage(passage_id: str, update: PassageUpdateRequest):
    """Update a passage with new content and create revision"""
    try:
        # First check if the passage exists
        passage = await passages.find_one({"passage_id": passage_id})
        if not passage:
            raise HTTPException(status_code=404, detail="Passage not found")

        # Check if passage is locked by someone else
        if passage.get("locked_by") and passage["locked_by"] != update.user_id:
            raise HTTPException(
                status_code=403,
                detail=f"Passage is currently being edited by another user",
            )

        # Continue with the existing update logic
        processor = PassageProcessor()

        # # Update passage
        updated_passage = await processor.update_passage(
            GeneratedPassage(**passage), update.content, update.user_id
        )

        if not updated_passage:
            raise HTTPException(status_code=500, detail="Failed to update passage")

        # Release the lock after update
        await passages.update_one(
            {"passage_id": passage_id}, {"$set": {"locked_by": None, "locked_at": None}}
        )

        return jsonable_encoder(updated_passage)
    except Exception as e:
        logger.error(f"Error updating passage: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating passage: {str(e)}")


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


@router.post("/passage/{passage_id}/lock")
async def lock_passage(passage_id: str, request: PassageLockRequest):
    """Lock a passage for editing"""
    try:
        # Find the passage
        passage = await passages.find_one({"passage_id": passage_id})
        if not passage:
            logger.error(f"Passage {passage_id} not found")
            raise HTTPException(status_code=404, detail="Passage not found")

        # Check if already locked
        if passage.get("locked_by") and passage.get("locked_at"):
            # If locked by this user, refresh the lock
            if passage["locked_by"] == request.user_id:
                result = await passages.update_one(
                    {"passage_id": passage_id},
                    {"$set": {"locked_at": datetime.utcnow()}},
                )
                return {
                    "status": "refreshed",
                    "message": "Lock refreshed successfully",
                    "locked_by": request.user_id,
                }

            # If locked by someone else, check if lock is stale (older than 5 minutes)
            if (
                passage["locked_at"]
                and (datetime.utcnow() - passage["locked_at"]).total_seconds() > 300
            ):
                # Lock is stale, take over
                result = await passages.update_one(
                    {"passage_id": passage_id},
                    {
                        "$set": {
                            "locked_by": request.user_id,
                            "locked_at": datetime.utcnow(),
                        }
                    },
                )
                return {
                    "status": "acquired",
                    "message": "Lock acquired successfully (previous lock was stale)",
                    "locked_by": request.user_id,
                }
            else:
                # Lock is active by another user
                return {
                    "status": "denied",
                    "message": "Passage is currently being edited by another user",
                    "locked_by": passage["locked_by"],
                }

        # Not locked, acquire lock
        result = await passages.update_one(
            {"passage_id": passage_id},
            {"$set": {"locked_by": request.user_id, "locked_at": datetime.utcnow()}},
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to acquire lock")

        return {
            "status": "acquired",
            "message": "Lock acquired successfully",
            "locked_by": request.user_id,
        }

    except Exception as e:
        logger.error(f"Error locking passage: {e}")
        raise HTTPException(status_code=500, detail=f"Error locking passage: {str(e)}")


@router.post("/passage/{passage_id}/unlock")
async def unlock_passage(passage_id: str, request: PassageLockRequest):
    """Release a lock on a passage"""
    try:
        # Find the passage
        passage = await passages.find_one({"passage_id": passage_id})
        if not passage:
            logger.error(f"Passage {passage_id} not found")
            raise HTTPException(status_code=404, detail="Passage not found")

        # Get the story_id for WebSocket broadcasting
        story_id = passage.get("story_id")
        if not story_id:
            logger.error(f"Passage {passage_id} has no story_id")
            raise HTTPException(status_code=500, detail="Passage has no story_id")

        # Check if the passage is already unlocked
        if passage.get("locked_by") is None and passage.get("locked_at") is None:
            logger.info(f"Passage {passage_id} is already unlocked")

            # Even if already unlocked, send the WebSocket notification to ensure UI consistency
            try:
                # Get username from MongoDB for better UI experience
                user = await db.users.find_one({"_id": ObjectId(request.user_id)})
                username = (
                    user.get("username", request.user_id) if user else request.user_id
                )

                # Send WebSocket notification
                await websocket_manager.broadcast(
                    story_id,
                    {
                        "type": "passage_unlock",
                        "section": passage_id,
                        "username": username,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    exclude=None,  # Send to all clients including sender
                )
                logger.info(
                    f"Sent WebSocket unlock notification for already unlocked passage {passage_id}"
                )
            except Exception as ws_error:
                logger.error(
                    f"Failed to send WebSocket notification for unlock: {ws_error}"
                )

            return {"message": "Passage was already unlocked", "status": "success"}

        # Check if locked by this user
        if passage.get("locked_by") and passage.get("locked_by") != request.user_id:
            logger.warning(
                f"Unauthorized unlock attempt for passage {passage_id} by user {request.user_id}"
            )
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to unlock this passage",
            )

        # Release the lock
        result = await passages.update_one(
            {"passage_id": passage_id}, {"$set": {"locked_by": None, "locked_at": None}}
        )

        if result.modified_count == 0:
            # Check if the passage is now in the expected state (unlocked)
            updated_passage = await passages.find_one({"passage_id": passage_id})
            if (
                updated_passage
                and updated_passage.get("locked_by") is None
                and updated_passage.get("locked_at") is None
            ):
                logger.info(
                    f"Passage {passage_id} lock was already in the expected state"
                )
                unlock_success = True
            else:
                logger.error(f"Failed to release lock for passage {passage_id}")
                raise HTTPException(status_code=500, detail="Failed to release lock")
        else:
            unlock_success = True

        # If unlock was successful, send WebSocket notification
        if unlock_success:
            try:
                # Get username from MongoDB for better UI experience
                user = await db.users.find_one({"_id": ObjectId(request.user_id)})
                username = (
                    user.get("username", request.user_id) if user else request.user_id
                )

                # Send WebSocket notification
                await websocket_manager.broadcast(
                    story_id,
                    {
                        "type": "passage_unlock",
                        "section": passage_id,
                        "username": username,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    exclude=None,  # Send to all clients including sender
                )
                logger.info(
                    f"Sent WebSocket unlock notification for passage {passage_id}"
                )
            except Exception as ws_error:
                logger.error(
                    f"Failed to send WebSocket notification for unlock: {ws_error}"
                )

        logger.info(f"Lock released successfully for passage {passage_id}")
        return {"message": "Lock released successfully", "status": "success"}

    except Exception as e:
        logger.error(f"Error unlocking passage: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error unlocking passage: {str(e)}"
        )


@router.get("/passage/{passage_id}/lock-status")
async def get_passage_lock_status(passage_id: str):
    """Get the current lock status of a passage"""
    try:
        # Find the passage
        passage = await passages.find_one({"passage_id": passage_id})
        if not passage:
            logger.error(f"Passage {passage_id} not found")
            raise HTTPException(status_code=404, detail="Passage not found")

        # Check lock status
        locked_by = passage.get("locked_by")
        locked_at = passage.get("locked_at")

        # If locked, check if the lock is stale (older than 5 minutes)
        is_stale = False
        if locked_by and locked_at:
            if (datetime.utcnow() - locked_at).total_seconds() > 300:
                is_stale = True

                # Automatically release stale locks
                await passages.update_one(
                    {"passage_id": passage_id},
                    {"$set": {"locked_by": None, "locked_at": None}},
                )
                locked_by = None
                locked_at = None
                logger.info(
                    f"Automatically released stale lock for passage {passage_id}"
                )

                # Get story_id for WebSocket broadcast
                story_id = passage.get("story_id")
                if story_id:
                    try:
                        # Try to get username
                        user = None
                        if passage.get("locked_by"):
                            user = await db.users.find_one(
                                {"_id": ObjectId(passage["locked_by"])}
                            )
                        username = (
                            user.get("username", passage["locked_by"])
                            if user
                            else passage["locked_by"]
                        )

                        # Send WebSocket notification about the released lock
                        await websocket_manager.broadcast(
                            story_id,
                            {
                                "type": "passage_unlock",
                                "section": passage_id,
                                "username": username,
                                "timestamp": datetime.utcnow().isoformat(),
                                "stale": True,
                            },
                            exclude=None,  # Send to all clients
                        )
                        logger.info(
                            f"Sent WebSocket notification for stale lock release on {passage_id}"
                        )
                    except Exception as ws_error:
                        logger.error(
                            f"Failed to send WebSocket notification for stale lock release: {ws_error}"
                        )

        # Return the lock status
        response = {
            "passage_id": passage_id,
            "locked_by": locked_by,
            "locked_at": locked_at.isoformat() if locked_at else None,
            "is_locked": bool(locked_by and not is_stale),
            "is_stale": is_stale,
        }

        return response

    except Exception as e:
        logger.error(f"Error getting passage lock status: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error getting passage lock status: {str(e)}"
        )
