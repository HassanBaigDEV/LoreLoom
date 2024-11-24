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
            "type": "character",
            "role": "Protagonist",
            "physicalAppearance": "A lithe woman with sun-kissed skin, braided auburn hair, and piercing green eyes. She has a crescent-shaped scar on her left cheek.",
            "behavioralPatterns": "Fiercely independent but deeply loyal to her close friends. She often acts impulsively but has a knack for thinking on her feet.",
            "genderAndSexualOrientation": "Female, bisexual",
            "relationships": {{
                "Alaric Frost": "Childhood friend and rival",
                "Ancient Temple": "Sacred place she guards",
                "Magic Staff": "Her trusted weapon and tool"
            }},
            "likesAndDislikes": {{
                "Likes": ["Exploring the unknown", "Playing the lute", "Collecting rare artifacts"],
                "Dislikes": ["Confinement", "Dishonesty", "Large crowds"]
            }}
        }},
        {{
            "name": "Ancient Temple of Whispers",
            "type": "location",
            "role": "Sacred Site",
            "physicalAppearance": "A towering structure of weathered stone, covered in glowing runes and surrounded by mist.",
            "behavioralPatterns": "The temple seems to respond to visitors' emotions, with its runes glowing brighter or dimmer.",
            "genderAndSexualOrientation": "N/A",
            "relationships": {{
                "Ayla Windsong": "Current Guardian",
                "Magic Staff": "Source of its power",
                "Dark Cultists": "Those who seek to corrupt it"
            }},
            "likesAndDislikes": {{
                "Likes": ["Pure magic", "Worthy guardians", "Ancient rituals"],
                "Dislikes": ["Dark magic", "Corruption", "Desecration"]
            }}
        }}
    ]
    ```
    Use this as a guide to ensure your response meets expectations.<|im_end|>
    <|im_start|>user
    Based on the premise: {premise} and the setting: {setting}, generate a list of characters, entities, and locations (at least 5) detailing their attributes in JSON format.
    Here's the JSON schema you must adhere to:\n<schema>\n{character_schema}\n</schema>.
    <|im_end|>
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
        validated_characters = []
        for char_data in characters_list:
            character = Character(**char_data)
            validated_characters.append(character.model_dump())

        return characters_list
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON: {e}")
        return []
