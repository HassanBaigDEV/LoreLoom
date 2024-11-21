# Pydantic character model
from typing import Optional, Dict, List
from pydantic import BaseModel
import json
import logging
from datetime import datetime
from uuid import UUID
from bson import ObjectId

from ..llm import model
from .schema import Character, character_schema
from app.config.mongo import db, stories


# Generate characters based on premise and setting
async def generate_characters(story_id: str, premise: str, setting: str) -> List[Dict]:
    chatML_template = f"""
    <|im_start|>system
    You are tasked with generating detailed character descriptions based on a given premise and setting. The output should be structured in a strict JSON format. Ensure that the descriptions are unique, creative, and fit well within the context of the provided premise and setting.
    
    Example of a correctly formatted response:
    ```json
    [
        {{
            "name": "Ayla Windsong",
            "physicalAppearance": "A lithe woman with sun-kissed skin, braided auburn hair, and piercing green eyes. She has a crescent-shaped scar on her left cheek.",
            "behavioralPatterns": "Fiercely independent but deeply loyal to her close friends. She often acts impulsively but has a knack for thinking on her feet.",
            "genderAndSexualOrientation": "Female, bisexual",
            "relationships": {{
                "Alaric Frost": "Childhood friend and rival",
                "Kaela Rune": "Mentor and confidant"
            }},
            "likesAndDislikes": {{
                "Likes": ["Exploring the unknown", "Playing the lute", "Collecting rare artifacts"],
                "Dislikes": ["Confinement", "Dishonesty", "Large crowds"]
            }}
        }},
        {{
            "name": "Alaric Frost",
            "physicalAppearance": "A tall man with silver-streaked black hair, a chiseled jawline, and sharp blue eyes. He wears a tattered cloak and carries a well-worn longsword.",
            "behavioralPatterns": "Reserved and calculating, often preferring strategy over brute force. However, he has a hidden temper that flares when his loved ones are threatened.",
            "genderAndSexualOrientation": "Male, heterosexual",
            "relationships": {{
                "Ayla Windsong": "Rival with lingering respect",
                "Kaela Rune": "Former mentor"
            }},
            "likesAndDislikes": {{
                "Likes": ["Strategizing battles", "Meditating by the river", "Reading old manuscripts"],
                "Dislikes": ["Arrogance", "Losing control", "Loud environments"]
            }}
        }}
    ]
    ```
    Use this as a guide to ensure your response meets expectations.<|im_end|>
    <|im_start|>user
    Based on the premise: {premise} and the setting: {setting}, generate a list of main characters (at least 3) detailing their attributes in JSON format.
    Here's the JSON schema you must adhere to:\n<schema>\n{character_schema}\n</schema>.<|im_end|>
    <|im_start|>assistant
"""

    # print("chatML_template")
    characters = model(chatML_template, max_tokens=4000)
    characters_str = characters["choices"][0]["text"].strip()  # type: ignore
    logging.debug(f"Generated Characters: {characters_str}")

    characters_list = process_characters_json(characters_str)
    await stories.update_one(
        {"story_id": ObjectId(story_id)},
        {"$set": {"characters": characters_list, "updated_at": datetime.utcnow()}},
    )
    return characters_list


# Process characters JSON stringapp/storywriter/plan/characters/main.py
def process_characters_json(characters_json: str) -> List[Dict]:
    try:
        characters_list = json.loads(characters_json)
        return characters_list
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON: {e}")
        return []
