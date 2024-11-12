# Pydantic character model
from typing import Optional, Dict, List
from pydantic import BaseModel
import json


class Character(BaseModel):
    name: str
    physicalAppearance: str
    behavioralPatterns: str
    genderAndSexualOrientation: str
    relationships: dict
    likesAndDislikes: Dict[str, List[str]] = {"Likes": [], "Dislikes": []}

    class Config:
        json_schema_extra = {"additionalProperties": False}


character_schema = json.dumps(Character.model_json_schema())
