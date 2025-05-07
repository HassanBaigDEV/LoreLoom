from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from typing import List, Optional, Annotated
from pydantic import BaseModel, Field, AfterValidator
from bson import ObjectId
from datetime import datetime
from app.config.database import db
from pymongo.errors import OperationFailure
import logging
import base64
import io

# MongoDB Collection
stories_collection = db["stories"]
users_collection = db["users"]
passages_collection = db["passages"]

# FastAPI Router
story_router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Custom ObjectId type for validation
def validate_object_id(v: str) -> str:
    if not ObjectId.is_valid(v):
        raise ValueError(f"Invalid ObjectId: {v}")
    return str(v)


ObjectIdStr = Annotated[str, AfterValidator(validate_object_id)]


# Subschemas
class OutlineSegment(BaseModel):
    number: str
    title: str
    description: str
    purpose: str
    characters_involved: List[str]
    setting: str
    estimated_duration: str


class Character(BaseModel):
    name: str
    physicalAppearance: str
    behavioralPatterns: str
    genderAndSexualOrientation: str
    relationships: Optional[dict] = {}  # default to an empty dict
    likesAndDislikes: Optional[dict] = {}  # default to an empty dict
    relevance: Optional[float] = 0.0


# Main schemas
class StoryBase(BaseModel):
    author: ObjectIdStr
    story_id: Optional[ObjectIdStr] = None  # default to None if missing
    title: str
    premise: Optional[str]
    setting: Optional[str]
    outline: Optional[List[OutlineSegment]] = []
    characters: Optional[List[Character]] = []
    genre: str
    privacy: str
    author_name: Optional[str] = ""
    collaborators: Optional[List[str]] = []  # List of collaborator IDs as strings
    cover_image: Optional[str] = None  # Base64 encoded image

    # ...

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat(),
        }


class StoryCreate(StoryBase):
    """Schema for story creation."""

    pass


class StoryResponse(StoryBase):
    """Schema for story response."""

    id: ObjectIdStr = Field(alias="_id")
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class Passage(BaseModel):
    passage_id: str
    story_id: str
    outline_point_id: str
    content: str
    summary: str
    mentioned_entities: List[str]
    created_at: datetime

    class Config:
        json_encoders = {ObjectId: str}


# Collaboration request models
class CollaboratorRequest(BaseModel):
    """Request model for collaborator operations"""

    user_id: str
    collaborator_id: str


class CollaboratorEmailRequest(BaseModel):
    """Request model for collaborator operations by email"""

    user_id: str
    email: str


class CollaboratorResponse(BaseModel):
    """Response model for collaborator operations"""

    success: bool = True
    message: str = "Operation completed successfully"
    collaborators: List[dict] = []


# Helper function to convert MongoDB documents to JSON-compatible dicts
def objectid_to_str(doc):
    """Converts a MongoDB document ObjectId to string."""
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if "author" in doc:
        doc["author"] = str(doc["author"])
    if "story_id" in doc:
        doc["story_id"] = str(doc["story_id"])
    if "collaborators" in doc and doc["collaborators"]:
        doc["collaborators"] = [str(collab_id) for collab_id in doc["collaborators"]]
    return doc


# Endpoints
@story_router.get("/stories", response_model=List[StoryResponse])
async def get_stories(author: Optional[str] = None, genre: Optional[str] = None):
    """
    Retrieve a list of stories, optionally filtered by author or genre.
    """
    query = {}
    if author:
        query["author"] = ObjectId(author)
    # if genre:
    #     query["genre"] = genre

    stories = await stories_collection.find(query).to_list(length=100)

    response = []
    for story in stories:
        # Convert MongoDB document to dictionary first
        story_dict = dict(story)
        # Apply ObjectId conversions
        story_dict = objectid_to_str(story_dict)
        response.append(story_dict)

    return response


@story_router.get("/pStories", response_model=List[StoryResponse])
async def get_pstories():
    """
    Retrieve a list of public stories with author's name.
    """
    query = {"privacy": "public"}

    # Fetch stories from the database
    stories = await stories_collection.find(query).to_list(length=100)

    stories_with_author = []
    for story in stories:
        # Convert to dict first for easier manipulation
        story_dict = dict(story)

        # Convert ObjectIds to strings using helper
        story_dict = objectid_to_str(story_dict)

        # Get author ID from already converted string
        author_id = story_dict.get("author")

        if author_id:
            # Now we can query with string ID
            author = await users_collection.find_one({"_id": author_id})
            story_dict["author_name"] = (
                author.get("username", "Unknown Author") if author else "Unknown Author"
            )
        else:
            story_dict["author_name"] = "Unknown Author"

        stories_with_author.append(story_dict)

    return stories_with_author


# Endpoint to fetch story planning
@story_router.get("/stories/{story_id}/planning", response_model=StoryResponse)
async def get_story_planning(story_id: ObjectIdStr):
    """
    Retrieve planning data for a specific story.
    """
    story = await stories_collection.find_one({"_id": ObjectId(story_id)})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    return objectid_to_str(story)


# Endpoints
@story_router.get("/passages", response_model=List[Passage])
async def get_passages(author: Optional[str] = None):
    """
    Retrieve a list of passages for stories, filtered by author.
    First fetches stories, then gets passages for each story.
    """
    # First get stories based on author filter
    story_query = {}
    if author:
        story_query["author"] = ObjectId(author)

    stories = await stories_collection.find(story_query).to_list(length=100)
    story_ids = [str(story["story_id"]) for story in stories]

    # Fetch passages for these stories
    passages_query = {"story_id": {"$in": story_ids}}
    passages = await passages_collection.find(passages_query).to_list(length=100)
    response = []
    for passage in passages:
        passage_dict = dict(passage)
        passage_dict = objectid_to_str(passage_dict)
        response.append(passage_dict)

    return response


# @story_router.post("/stories", response_model=StoryResponse)
# async def create_story(story: StoryCreate):
#     """
#     Create a new story.
#     """
#     story_data = story.dict()
#     story_data["created_at"] = datetime.utcnow()
#     story_data["updated_at"] = datetime.utcnow()
#     result = await stories_collection.insert_one(story_data)
#     created_story = await stories_collection.find_one({"_id": result.inserted_id})
#     return objectid_to_str(created_story)


@story_router.get("/stories/{story_id}", response_model=StoryResponse)
async def get_story_by_id(story_id: str):
    """
    Retrieve a story by its ID.
    """
    try:
        story = await stories_collection.find_one({"story_id": ObjectId(story_id)})
        if not story:
            logger.error(f"Story not found with ID: {story_id}")
            raise HTTPException(status_code=404, detail="Story not found")

        # Ensure author field is properly converted to string
        story_dict = objectid_to_str(story)
        logger.info(
            f"Successfully retrieved story: {story_dict.get('title', 'Untitled')}"
        )

        return story_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving story: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid story ID: {str(e)}")


@story_router.get("/stories/{story_id}/access", response_model=dict)
async def check_story_access(story_id: str, user_id: str):
    """
    Check if a user has access to a story (either as author or collaborator).
    """
    try:
        print(f"[DEBUG] Checking access for story: {story_id}, user: {user_id}")

        # Convert IDs to ObjectId
        story_oid = ObjectId(story_id)
        user_oid = ObjectId(user_id)
        user_str = str(user_oid)

        print(f"[DEBUG] Converted to ObjectIds - Story: {story_oid}, User: {user_oid}")

        # Get the story
        story = await stories_collection.find_one({"_id": story_oid})
        if not story:
            print(f"[DEBUG] Story not found with ID: {story_id}")
            return {"has_access": False}

        print(f"[DEBUG] Found story: {story.get('title', 'Unknown title')}")
        print(f"[DEBUG] Story author: {story.get('author')}")
        print(f"[DEBUG] Story collaborators: {story.get('collaborators', [])}")

        # Check if user is the author
        if story.get("author") == user_oid:
            print(f"[DEBUG] Access GRANTED - User is the author")
            return {"has_access": True, "role": "author"}

        # Check if user is a collaborator - convert to strings for proper comparison
        if "collaborators" in story:
            collaborators = story.get("collaborators", [])
            print(f"[DEBUG] Checking collaborators: {collaborators}")

            for collab in collaborators:
                collab_str = str(collab)
                print(
                    f"[DEBUG] Comparing collaborator {collab_str} with user {user_str}"
                )
                if collab_str == user_str:
                    print(f"[DEBUG] Access GRANTED - User is a collaborator")
                    return {"has_access": True, "role": "collaborator"}

        # If story is public, check that
        if story.get("privacy") == "public":
            print(f"[DEBUG] Access GRANTED - Story is public")
            return {"has_access": True, "role": "reader"}

        print(f"[DEBUG] Access DENIED - User is not author or collaborator")
        return {"has_access": False}
    except Exception as e:
        print(f"Error checking story access: {e}")
        return {"has_access": False, "error": str(e)}


@story_router.get(
    "/stories/{story_id}/collaborators", response_model=CollaboratorResponse
)
async def get_story_collaborators(story_id: str, user_id: str = Query(...)):
    """
    Get all collaborators for a story.
    """
    try:
        # Convert IDs to ObjectId
        story_oid = ObjectId(story_id)
        user_oid = ObjectId(user_id)
        user_str = str(user_oid)

        # Get the story
        story = await stories_collection.find_one({"_id": story_oid})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        # Check if user has access to view collaborators
        if story.get("author") != user_oid:
            # Check if user is a collaborator using string comparison
            is_collaborator = False
            if "collaborators" in story:
                for collab in story["collaborators"]:
                    if str(collab) == user_str:
                        is_collaborator = True
                        break

            if not is_collaborator:
                raise HTTPException(
                    status_code=403,
                    detail="You don't have permission to view collaborators",
                )

        # Get list of collaborator IDs
        collaborator_ids = story.get("collaborators", [])

        # Fetch collaborator information
        collaborators = []
        for collab_id in collaborator_ids:
            user = await users_collection.find_one({"_id": collab_id})
            if user:
                # Convert to dictionary and remove sensitive fields
                user_dict = {
                    "_id": str(user["_id"]),
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "email": user.get("email", ""),
                }
                collaborators.append(user_dict)

        return {"success": True, "collaborators": collaborators}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting collaborators: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get collaborators: {str(e)}"
        )


@story_router.post(
    "/stories/{story_id}/collaborators", response_model=CollaboratorResponse
)
async def add_story_collaborator(story_id: str, request: CollaboratorRequest):
    """
    Add a collaborator to a story by user ID.
    """
    try:
        print(f"[DEBUG] Adding collaborator to story {story_id}")
        print(
            f"[DEBUG] Author ID: {request.user_id}, Collaborator ID: {request.collaborator_id}"
        )

        # Convert IDs to ObjectId
        story_oid = ObjectId(story_id)
        user_oid = ObjectId(request.user_id)
        collaborator_oid = ObjectId(request.collaborator_id)

        print(
            f"[DEBUG] Converted to ObjectIds - Story: {story_oid}, User: {user_oid}, Collaborator: {collaborator_oid}"
        )

        # Get the story
        story = await stories_collection.find_one({"_id": story_oid})
        if not story:
            print(f"[DEBUG] Story not found with ID: {story_id}")
            raise HTTPException(status_code=404, detail="Story not found")

        print(f"[DEBUG] Found story: {story.get('title', 'Unknown title')}")
        print(f"[DEBUG] Current collaborators: {story.get('collaborators', [])}")

        # Check if user is the author
        if story.get("author") != user_oid:
            print(f"[DEBUG] User {request.user_id} is not the author of the story")
            raise HTTPException(
                status_code=403, detail="Only the author can add collaborators"
            )

        # Check if collaborator exists
        collaborator = await users_collection.find_one({"_id": collaborator_oid})
        if not collaborator:
            print(f"[DEBUG] Collaborator not found with ID: {request.collaborator_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # Check if already a collaborator
        already_collaborator = False
        collaborators = story.get("collaborators", [])
        for collab in collaborators:
            if str(collab) == str(collaborator_oid):
                already_collaborator = True
                break

        if already_collaborator:
            print(f"[DEBUG] User {request.collaborator_id} is already a collaborator")
            return {"success": True, "message": "User is already a collaborator"}

        # Add collaborator
        print(f"[DEBUG] Adding collaborator {collaborator_oid} to story {story_id}")
        result = await stories_collection.update_one(
            {"_id": story_oid}, {"$addToSet": {"collaborators": collaborator_oid}}
        )

        print(
            f"[DEBUG] Update result - matched: {result.matched_count}, modified: {result.modified_count}"
        )

        if result.modified_count == 0:
            if result.matched_count > 0:
                print(
                    f"[DEBUG] Story matched but not modified (collaborator might already be added)"
                )
            else:
                print(
                    f"[DEBUG] Failed to add collaborator - story not found or access denied"
                )
                raise HTTPException(
                    status_code=500, detail="Failed to add collaborator"
                )

        # Get updated list of collaborators
        updated_story = await stories_collection.find_one({"_id": story_oid})
        print(
            f"[DEBUG] Updated collaborators: {updated_story.get('collaborators', [])}"
        )
        collaborator_ids = updated_story.get("collaborators", [])

        # Format collaborator info for response
        collaborators = []
        for collab_id in collaborator_ids:
            user = await users_collection.find_one({"_id": collab_id})
            if user:
                user_dict = {
                    "_id": str(user["_id"]),
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "email": user.get("email", ""),
                }
                collaborators.append(user_dict)

        return {
            "success": True,
            "message": "Collaborator added successfully",
            "collaborators": collaborators,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding collaborator: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to add collaborator: {str(e)}"
        )


@story_router.post(
    "/stories/{story_id}/collaborators/email", response_model=CollaboratorResponse
)
async def add_story_collaborator_by_email(
    story_id: str, request: CollaboratorEmailRequest
):
    """
    Add a collaborator to a story by email.
    """
    try:
        # Convert IDs to ObjectId
        story_oid = ObjectId(story_id)
        user_oid = ObjectId(request.user_id)

        # Get the story
        story = await stories_collection.find_one({"_id": story_oid})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        # Check if user is the author
        if story.get("author") != user_oid:
            raise HTTPException(
                status_code=403, detail="Only the author can add collaborators"
            )

        # Find the user by email
        collaborator = await users_collection.find_one({"email": request.email})
        if not collaborator:
            raise HTTPException(
                status_code=404, detail="User with this email not found"
            )

        collaborator_oid = collaborator["_id"]

        # Check if already a collaborator
        if "collaborators" in story and collaborator_oid in story["collaborators"]:
            return {"success": True, "message": "User is already a collaborator"}

        # Add collaborator
        result = await stories_collection.update_one(
            {"_id": story_oid}, {"$addToSet": {"collaborators": collaborator_oid}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to add collaborator")

        # Get updated list of collaborators
        updated_story = await stories_collection.find_one({"_id": story_oid})
        collaborator_ids = updated_story.get("collaborators", [])

        # Format collaborator info for response
        collaborators = []
        for collab_id in collaborator_ids:
            user = await users_collection.find_one({"_id": collab_id})
            if user:
                user_dict = {
                    "_id": str(user["_id"]),
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "email": user.get("email", ""),
                }
                collaborators.append(user_dict)

        return {
            "success": True,
            "message": "Collaborator added successfully",
            "collaborators": collaborators,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding collaborator by email: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to add collaborator: {str(e)}"
        )


@story_router.delete(
    "/stories/{story_id}/collaborators", response_model=CollaboratorResponse
)
async def remove_story_collaborator(story_id: str, request: CollaboratorRequest):
    """
    Remove a collaborator from a story by user ID.
    """
    try:
        # Convert IDs to ObjectId
        story_oid = ObjectId(story_id)
        user_oid = ObjectId(request.user_id)
        collaborator_oid = ObjectId(request.collaborator_id)

        # Get the story
        story = await stories_collection.find_one({"_id": story_oid})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        # Check if user is the author
        if story.get("author") != user_oid:
            raise HTTPException(
                status_code=403, detail="Only the author can remove collaborators"
            )

        # Remove collaborator
        result = await stories_collection.update_one(
            {"_id": story_oid}, {"$pull": {"collaborators": collaborator_oid}}
        )

        if result.modified_count == 0:
            return {
                "success": True,
                "message": "User is not a collaborator or removal not needed",
            }

        # Get updated list of collaborators
        updated_story = await stories_collection.find_one({"_id": story_oid})
        collaborator_ids = updated_story.get("collaborators", [])

        # Format collaborator info for response
        collaborators = []
        for collab_id in collaborator_ids:
            user = await users_collection.find_one({"_id": collab_id})
            if user:
                user_dict = {
                    "_id": str(user["_id"]),
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "email": user.get("email", ""),
                }
                collaborators.append(user_dict)

        return {
            "success": True,
            "message": "Collaborator removed successfully",
            "collaborators": collaborators,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error removing collaborator: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to remove collaborator: {str(e)}"
        )


@story_router.delete(
    "/stories/{story_id}/collaborators/email", response_model=CollaboratorResponse
)
async def remove_story_collaborator_by_email(
    story_id: str, request: CollaboratorEmailRequest
):
    """
    Remove a collaborator from a story by email.
    """
    try:
        # Convert IDs to ObjectId
        story_oid = ObjectId(story_id)
        user_oid = ObjectId(request.user_id)

        # Get the story
        story = await stories_collection.find_one({"_id": story_oid})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        # Check if user is the author
        if story.get("author") != user_oid:
            raise HTTPException(
                status_code=403, detail="Only the author can remove collaborators"
            )

        # Find user by email
        collaborator = await users_collection.find_one({"email": request.email})
        if not collaborator:
            raise HTTPException(
                status_code=404, detail="User with this email not found"
            )

        collaborator_oid = collaborator["_id"]

        # Remove collaborator
        result = await stories_collection.update_one(
            {"_id": story_oid}, {"$pull": {"collaborators": collaborator_oid}}
        )

        if result.modified_count == 0:
            return {
                "success": True,
                "message": "User is not a collaborator or removal not needed",
            }

        # Get updated list of collaborators
        updated_story = await stories_collection.find_one({"_id": story_oid})
        collaborator_ids = updated_story.get("collaborators", [])

        # Format collaborator info for response
        collaborators = []
        for collab_id in collaborator_ids:
            user = await users_collection.find_one({"_id": collab_id})
            if user:
                user_dict = {
                    "_id": str(user["_id"]),
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "email": user.get("email", ""),
                }
                collaborators.append(user_dict)

        return {
            "success": True,
            "message": "Collaborator removed successfully",
            "collaborators": collaborators,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error removing collaborator by email: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to remove collaborator: {str(e)}"
        )


@story_router.put("/stories/{story_id}", response_model=StoryResponse)
async def update_story(story_id: str, story: StoryCreate):
    try:
        # Find existing story by story_id
        existing_story = await stories_collection.find_one({"story_id": ObjectId(story_id)})
        if not existing_story:
            logger.error(f"Story not found with ID: {story_id}")
            raise HTTPException(status_code=404, detail="Story not found")

        story_oid = existing_story["story_id"]

        # Dump incoming story data
        story_data = story.model_dump(exclude_unset=True)
        story_data["updated_at"] = datetime.now()

        story_data.pop("story_id", None)
        story_data.pop("author", None)
        # Force author and story_id fields to stay ObjectId
        story_data["author"] = ObjectId(existing_story["author"])
        story_data["story_id"] = ObjectId(existing_story["story_id"])
        story_data["collaborators"] = [
            ObjectId(collab) for collab in existing_story.get("collaborators", [])
        ]

        logger.info(f"Updating story {story_id} with data: {story_data}")

        result = await stories_collection.update_one(
            {"story_id": story_oid}, {"$set": story_data}
        )

        if result.modified_count == 0 and not result.matched_count:
            raise HTTPException(status_code=404, detail="Story not found or no changes made")

        updated_story = await stories_collection.find_one({"story_id": story_oid})

        # Update references in passages if title changed
        if "title" in story_data:
            try:
                await passages_collection.update_many(
                    {"story_id": story_oid},
                    {"$set": {"story_title": story_data["title"]}},
                )
            except Exception as e:
                logger.error(f"Error updating passages with new story title: {e}")

        logger.info(f"Successfully updated story: {updated_story.get('title', 'Untitled')}")
        return objectid_to_str(updated_story)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating story: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to update story: {str(e)}")

@story_router.put("/stories/{story_id}/privacy", response_model=StoryResponse)
async def update_story_privacy(story_id: str, data: dict):
    """
    Update only the privacy setting of an existing story by its ID.
    """
    try:
        if "privacy" not in data:
            raise HTTPException(status_code=400, detail="Privacy setting is required")

        if data["privacy"] not in ["private", "public"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid privacy setting (must be 'private' or 'public')",
            )

        existing_story = await stories_collection.find_one(
            {"story_id": ObjectId(story_id)}
        )
        if not existing_story:
            raise HTTPException(status_code=404, detail="Story not found")

        update_data = {"privacy": data["privacy"], "updated_at": datetime.now()}

        result = await stories_collection.update_one(
            {"story_id": ObjectId(story_id)}, {"$set": update_data}
        )

        if result.modified_count == 0 and not result.matched_count:
            raise HTTPException(status_code=404, detail="Story not found")

        # Return the updated story
        updated_story = await stories_collection.find_one(
            {"story_id": ObjectId(story_id)}
        )
        return objectid_to_str(updated_story)

    except Exception as e:
        print(f"Error updating story privacy: {e}")
        raise HTTPException(status_code=400, detail="Failed to update story privacy")


@story_router.get("/collaborative/stories", response_model=List[StoryResponse])
async def get_collaborative_stories(author: Optional[str] = None):
    """
    Retrieve a list of stories where the user is a collaborator but not the author.
    """
    try:
        query = {}

        if author:
            author_oid = ObjectId(author)
            query = {"collaborators": author_oid, "author": {"$ne": author_oid}}
        else:
            query = {"collaborators": {"$exists": True, "$ne": []}}

        stories = await stories_collection.find(query).to_list(length=100)
        response = []

        for story in stories:
            story_dict = dict(story)
            story_dict = objectid_to_str(story_dict)

            try:
                author_user = await users_collection.find_one(
                    {"_id": ObjectId(story_dict["author"])}
                )
                if author_user:
                    first_name = author_user.get("first_name", "")
                    last_name = author_user.get("last_name", "")
                    story_dict["author_name"] = f"{first_name} {last_name}".strip()
                else:
                    story_dict["author_name"] = "Unknown Author"
            except Exception as ex:
                print(f"Error fetching author details for {story_dict['author']}: {ex}")
                story_dict["author_name"] = "Unknown Author"

            response.append(story_dict)

        return response

    except OperationFailure as e:
        print(f"Database operation failed: {e}")
        raise HTTPException(status_code=500, detail="Database operation failed")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch stories: {str(e)}"
        )


# Endpoint for uploading cover image
@story_router.post("/upload-cover", response_model=dict)
async def upload_cover_image(file: UploadFile = File(...), story_id: str = Form(...)):
    """
    Upload a cover image for a story and store it as base64 string.
    """
    try:
        # Validate story exists
        story = await stories_collection.find_one({"story_id": ObjectId(story_id)})

        if not story:
            logger.error(f"Story not found with ID: {story_id}")
            raise HTTPException(status_code=404, detail="Story not found")

        # Ensure the file is an image
        content_type = file.content_type
        if not content_type or not content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, detail="File must be an image (JPEG, PNG, WEBP)"
            )

        # Read the file content
        contents = await file.read()

        # Encode the image to base64
        base64_image = base64.b64encode(contents).decode("utf-8")

        # Create the data URI format
        image_uri = f"data:{content_type};base64,{base64_image}"

        # Update the story with the base64 image data
        update_result = await stories_collection.update_one(
            {"story_id": story["story_id"]},
            {"$set": {"cover_image": image_uri, "updated_at": datetime.now()}},
        )

        if update_result.modified_count == 0:
            logger.warning(f"Cover image not updated in database for story {story_id}")

        logger.info(
            f"Successfully uploaded cover image for story: {story.get('title', 'Untitled')}"
        )
        return {
            "success": True,
            "url": image_uri,
            "message": "Cover image uploaded successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading cover image: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error uploading cover image: {str(e)}"
        )
