from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID
from bson import ObjectId


class StoryResponse(BaseModel):
    _id: str  # MongoDB's _id field
    id: str  # Alias for _id
    story_id: str
    author: str
    title: Optional[str] = None
    genre: Optional[str] = None
    privacy: Optional[str] = None
    premise: Optional[str] = None
    setting: Optional[str] = None
    characters: Optional[List[Dict]] = None
    outline: Optional[List[Dict]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    cover_image: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
