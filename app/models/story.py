from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID
from bson import ObjectId


class StoryResponse(BaseModel):
    id: str
    title: str
    author_id: Optional[str] = None
    genre: Optional[str] = None
    privacy: Optional[str] = None
    premise: Optional[str] = None
    setting: Optional[str] = None
    characters: Optional[List[Dict]] = None
    outline: Optional[List[Dict]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Add any other fields that match your story structure
