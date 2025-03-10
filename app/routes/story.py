from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Annotated
from pydantic import BaseModel, Field, AfterValidator
from bson import ObjectId
from datetime import datetime
from app.config.database import db

# MongoDB Collection
stories_collection = db["stories"]

users_collection = db["users"]

# FastAPI Router
story_router = APIRouter()


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


# Helper function to convert MongoDB documents to JSON-compatible dicts
def objectid_to_str(doc):
    """Converts a MongoDB document ObjectId to string."""
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if "author" in doc:
        doc["author"] = str(doc["author"])
    if "story_id" in doc:
        doc["story_id"] = str(doc["story_id"])
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


# @story_router.get("/stories/{story_id}", response_model=StoryResponse)
# async def get_story_by_id(story_id: str):
#     """
#     Retrieve a story by its ID.
#     """
#     try:
#         story = await stories_collection.find_one({"_id": ObjectId(story_id)})
#         if not story:
#             raise HTTPException(status_code=404, detail="Story not found")
#         return objectid_to_str(story)
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid story ID")


# @story_router.put("/stories/{story_id}", response_model=StoryResponse)
# async def update_story(story_id: str, story: StoryCreate):
#     """
#     Update an existing story by its ID.
#     """
#     try:
#         story_data = story.dict()
#         story_data["updated_at"] = datetime.utcnow()
#         result = await stories_collection.update_one(
#             {"_id": ObjectId(story_id)}, {"$set": story_data}
#         )
#         if result.modified_count == 0:
#             raise HTTPException(status_code=404, detail="Story not found or no changes made")

#         updated_story = await stories_collection.find_one({"_id": ObjectId(story_id)})
#         return objectid_to_str(updated_story)
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid story ID")


# @story_router.delete("/stories/{story_id}")
# async def delete_story(story_id: str):
#     """
#     Delete a story by its ID.
#     """
#     try:
#         result = await stories_collection.delete_one({"_id": ObjectId(story_id)})
#         if result.deleted_count == 0:
#             raise HTTPException(status_code=404, detail="Story not found")
#         return {"message": "Story deleted successfully"}
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid story ID")
