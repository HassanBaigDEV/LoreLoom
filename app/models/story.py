from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID
from bson import ObjectId


class Story(BaseModel):
    story_id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    author: ObjectId  # Reference to users collection
    title: Optional[str] = None
    genre: Optional[str] = None
    privacy: Optional[str] = None
    premise: Optional[str] = None
    setting: Optional[str] = None
    characters: Optional[List[Dict]] = None
    outline: Optional[Dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str  # Convert ObjectId to string when serializing to JSON
        },
    }
