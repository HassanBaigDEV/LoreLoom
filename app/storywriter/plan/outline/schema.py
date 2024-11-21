from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime


class SceneDetail(BaseModel):
    """Detailed information about a scene's setting and atmosphere"""

    location: str = Field(
        ..., description="Physical location where the scene takes place"
    )
    time_period: str = Field(..., description="Time of day or specific period")
    atmosphere: str = Field(..., description="Mood and environmental details")
    description: str = Field(
        ..., description="Detailed description of the scene setting"
    )


class EventDetail(BaseModel):
    """Information about what happens in the scene"""

    action: str = Field(..., description="Main action or event that occurs")
    purpose: str = Field(..., description="Story purpose or goal of this event")
    consequences: List[str] = Field(
        default_factory=list, description="Results or effects of this event"
    )
    conflicts: List[str] = Field(
        default_factory=list, description="Challenges or obstacles faced"
    )


class EntityInvolvement(BaseModel):
    """Details about an entity's involvement in the scene"""

    name: str = Field(..., description="Name of the character or entity")
    role: str = Field(..., description="Role in this specific scene")
    goal: str = Field(..., description="Character's objective in this scene")
    emotional_state: str = Field(..., description="Character's emotional state")


class OutlineNode(BaseModel):
    """A node in the story outline representing a scene or chapter"""

    text: str = Field(..., description="Brief summary of the scene/chapter")
    event_type: str = Field(
        default="scene", description="Type: chapter, scene, or action"
    )
    scene: Optional[SceneDetail] = Field(None, description="Scene setting details")
    event: Optional[EventDetail] = Field(None, description="Event details")
    entities: List[EntityInvolvement] = Field(
        default_factory=list, description="Characters involved"
    )
    children: List["OutlineNode"] = Field(
        default_factory=list, description="Sub-events or scenes"
    )
    depth: int = Field(default=0, description="Depth in outline tree")
    estimated_duration: Optional[str] = Field(
        None, description="Estimated scene length"
    )

    def __eq__(self, other):
        if isinstance(other, OutlineNode):
            return self.text == other.text and self.depth == other.depth
        return False

    def __hash__(self):
        return hash((self.text, self.depth))

    def model_dump(self, *args, **kwargs) -> Dict:
        return {
            "text": self.text,
            "event_type": self.event_type,
            "scene": self.scene.dict() if self.scene else None,
            "event": self.event.dict() if self.event else None,
            "entities": [entity.dict() for entity in self.entities],
            "children": [child.model_dump(*args, **kwargs) for child in self.children],
            "depth": self.depth,
            "estimated_duration": self.estimated_duration,
        }

    class Config:
        json_schema_extra = {
            "example": {
                "text": "The protagonist discovers a mysterious artifact",
                "event_type": "scene",
                "scene": {
                    "location": "Ancient temple ruins",
                    "time_period": "Late afternoon",
                    "atmosphere": "Tense and mysterious",
                    "description": "Crumbling stone walls with strange symbols...",
                },
                "event": {
                    "action": "Discovery of an ancient artifact",
                    "purpose": "Introduce the main plot device",
                    "consequences": ["Awakens ancient magic", "Attracts enemies"],
                    "conflicts": ["Temple traps", "Rival archaeologists"],
                },
                "entities": [
                    {
                        "name": "Sarah",
                        "role": "Discoverer",
                        "goal": "Find the artifact",
                        "emotional_state": "Excited and cautious",
                    }
                ],
                "depth": 1,
                "estimated_duration": "1 chapter",
            }
        }


class Scene(BaseModel):
    location: str = Field(..., description="Physical location of the scene")
    time_period: str = Field(..., description="Time of day or specific period")
    atmosphere: str = Field(..., description="Mood and environmental details")
    description: str = Field(
        ..., description="Detailed description of the scene setting"
    )


class Event(BaseModel):
    action: str = Field(..., description="Main action or event that occurs")
    purpose: str = Field(..., description="Story purpose or goal of this event")
    consequences: List[str] = Field(
        default_factory=list, description="List of results or effects"
    )
    conflicts: List[str] = Field(
        default_factory=list, description="List of challenges or obstacles"
    )


class Entity(BaseModel):
    name: str = Field(..., description="Character name")
    role: str = Field(..., description="Role in this scene")
    goal: str = Field(..., description="Character's objective")
    emotional_state: str = Field(..., description="Character's emotional state")


class OUTLINE_NODE(BaseModel):
    scene: Scene
    event: Event
    entities: List[Entity]


class Act(BaseModel):
    title: str = Field(..., description="Name of the act")
    summary: str = Field(..., description="Brief description of what happens")
    purpose: str = Field(..., description="Story purpose of this act")
    key_events: List[str] = Field(
        default_factory=list, description="List of main events in this act"
    )


class STORY_STRUCTURE(BaseModel):
    acts: List[Act]


class SceneDetailOutline(BaseModel):
    summary: str = Field(..., description="Description of what happens in the scene")
    purpose: str = Field(..., description="Story purpose of this scene")


class SCENE(BaseModel):
    scenes: List[SceneDetailOutline]
