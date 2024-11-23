from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class PassageContext(BaseModel):
    """Context information for generating a story passage"""

    premise: str
    setting: str
    relevant_characters: List[Dict]
    previous_summaries: List[str]
    recent_passage: Optional[str]
    current_outline: Dict


class GeneratedPassage(BaseModel):
    """A generated story passage with metadata"""

    passage_id: str = Field(..., description="Unique identifier for the passage")
    story_id: str = Field(..., description="ID of the parent story")
    outline_point_id: str = Field(
        ..., description="ID of the corresponding outline point"
    )
    content: str = Field(..., description="The actual passage text")
    summary: str = Field(..., description="Summary of the passage")
    mentioned_entities: List[str] = Field(
        default_factory=list, description="Characters mentioned in the passage"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CharacterUpdate(BaseModel):
    """Updates to a character's description and state"""

    character_id: str
    name: str
    current_description: str
    recent_developments: List[str]
    relevance_score: float
    last_mentioned: datetime


class PassageSummary(BaseModel):
    """Summary of a story passage"""

    passage_id: str
    summary: str
    key_events: List[str]
    mentioned_characters: List[str]
    created_at: datetime
