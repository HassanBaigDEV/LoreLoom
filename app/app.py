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
from app.routes.collaboration import router as collaboration_router
from app.routes.collaboration_websocket import router as websocket_router
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
app.include_router(collaboration_router, tags=["collaboration"])
app.include_router(websocket_router, tags=["websocket"])

stories = db["stories"]  # Define the stories collection
users = db["users"]  # Define the users collection


class Story(BaseModel):
    story_id: ObjectId = Field(default_factory=ObjectId)
    author: ObjectId  # Reference to users collection
    collaborators: List[ObjectId] = Field(default_factory=list)  # List of collaborators
    title: Optional[str] = ""
    genre: Optional[str] = ""
    privacy: Optional[str] = ""
    premise: Optional[str] = ""
    setting: Optional[str] = ""
    characters: Optional[List[Dict]] = []
    outline: Optional[List[Dict]] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

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
    privacy: Optional[str] = None,
):
    story_id = ObjectId()

    # Create a Story instance
    story = Story(
        story_id=story_id,
        author=ObjectId(user_id),
        title=title,
        genre=genre,
        privacy=privacy,
    )

    # Insert the story into the database
    await stories.insert_one(story.model_dump(by_alias=True))

    # Add the story reference to the user's document
    await users.update_one({"_id": user_id}, {"$push": {"stories": story_id}})

    # Return the response with serialized ObjectId fields
    return {
        "story_id": str(story_id),
        "author": str(user_id),
        "title": title,
        "genre": genre,
        "privacy": privacy,
    }


@app.get("/healthcheck")
async def healthcheck():
    return {"status": "ok"}
