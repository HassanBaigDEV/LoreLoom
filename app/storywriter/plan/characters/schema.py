# Pydantic character model
from typing import Optional, Dict, List, Literal
from pydantic import BaseModel, Field
import json


class Character(BaseModel):
    name: str
    type: Literal["character", "entity", "location"] = Field(
        default="character",
        description="Type of entity (character, entity, or location)",
    )
    role: str = Field(description="Role or function in the story")
    physicalAppearance: str
    behavioralPatterns: str
    genderAndSexualOrientation: str
    relationships: Dict
    likesAndDislikes: Dict[str, List[str]] = {"Likes": [], "Dislikes": []}

    # class Config:
    #     json_schema_extra = {"additionalProperties": False}


character_schema = json.dumps(Character.model_json_schema())
