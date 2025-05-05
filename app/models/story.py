from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID
from bson import ObjectId


class Story(BaseModel):
    story_id: ObjectId = Field(default_factory=ObjectId)
    author: ObjectId  # Reference to users collection
    collaborators: List[ObjectId] = Field(
        default_factory=list
    )  # List of user IDs who can collaborate
    title: Optional[str] = ""
    genre: Optional[str] = ""
    privacy: Optional[str] = ""
    premise: Optional[str] = ""
    setting: Optional[str] = ""
    characters: Optional[List[Dict]] = []
    outline: Optional[List[Dict]] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str  # Convert ObjectId to string when serializing to JSON
        },
    }
