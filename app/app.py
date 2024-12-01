from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from bson import ObjectId
from fastapi import FastAPI, Depends, Query
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.middleware.cors import CORSMiddleware
from app.routes.plan import router as plan_router
from app.routes.draft import router as draft_router
import logging
from app.config.mongo import db  # Import the database connection

logging.basicConfig(level=logging.INFO)  # Set global log level to INFO

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter

# Add CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(plan_router, prefix="/plan", tags=["plan"])
app.include_router(draft_router, prefix="/draft", tags=["draft"])

stories = db["stories"]  # Define the stories collection
users = db["users"]  # Define the users collection


class Story(BaseModel):
    story_id: ObjectId = Field(default_factory=ObjectId)
    author: ObjectId  # Reference to users collection
    title: Optional[str] = None
    genre: Optional[str] = None
    premise: Optional[str] = None
    setting: Optional[str] = None
    characters: Optional[List[Dict]] = None
    outline: Optional[Dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,  # Convert ObjectId to string when serializing to JSON
        }


@app.post("/stories")
async def create_story(
    user_id: str = Query(..., description="User ID of the story author"),
    title: Optional[str] = None,
    genre: Optional[str] = None,
):
    story_id = ObjectId()

    # Create a Story instance
    story = Story(
        story_id=story_id,
        author=ObjectId(user_id),
        title=title,
        genre=genre,
    )

    # Insert the story into the database
    await stories.insert_one(story.dict(by_alias=True))

    # Add the story reference to the user's document
    await users.update_one({"_id": ObjectId(user_id)}, {"$push": {"stories": story_id}})

    # Return the response with serialized ObjectId fields
    return {
        "story_id": str(story_id),
        "author": str(user_id),
        "title": title,
        "genre": genre,
    }


@app.get("/healthcheck")
async def healthcheck():
    return {"status": "ok"}
