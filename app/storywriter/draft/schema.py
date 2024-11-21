from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from bson import ObjectId

from app.storywriter.plan.characters.schema import Character


# class StoryContext(BaseModel):
#     title: str
#     premise: str
#     setting: str
#     characters: List[Dict]
#     outline: List[str]
#     current_entities: Dict[str, str] = Field(default_factory=dict)


# class DraftPassage(BaseModel):
#     outline_point_id: str
#     content: str
#     entities: Dict[str, str]
#     created_at: datetime = Field(default_factory=datetime.utcnow)


# class Draft(BaseModel):
#     story_id: str
#     passages: List[DraftPassage]
#     context: StoryContext
#     updated_at: datetime = Field(default_factory=datetime.utcnow)

#     model_config = {"arbitrary_types_allowed": True, "json_encoders": {ObjectId: str}}


class PassageGeneration(BaseModel):
    content: str
    entities: Dict[str, str]
    quality_score: float

class DraftPassage(BaseModel):
    content: str
    entities: Dict[str, str]

class StoryContext(BaseModel):
    title: str
    premise: str
    setting: str
    characters: List[Character]
    outline: List[str]

class Draft(BaseModel):
    story_id: str
    passages: List[DraftPassage]
    context: StoryContext
    updated_at: datetime