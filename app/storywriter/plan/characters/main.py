# Pydantic character model
from typing import Optional, Dict, List
from pydantic import BaseModel
import json
import logging
from datetime import datetime
from uuid import UUID
from bson import ObjectId

from app.utils.text_validation import extract_and_parse_json

from ...llm.deepseek import model
from .schema import Character, character_schema
from app.config.mongo import db, stories
from jsonschema import validate, ValidationError


# Generate characters based on premise and setting
# async def generate_characters(story_id: str, premise: str, setting: str) -> List[Dict]:
#     # Get story for genre
#     story = await stories.find_one({"story_id": ObjectId(story_id)})
#     if not story:
#         raise ValueError("Story not found")

#     genre = story.get("genre", "")

#     chatML_template = f"""
#     <|im_start|>system
#     You are tasked with generating detailed character and entity descriptions for a {genre} story based on the given premise and setting. The output should be structured in a strict JSON format. Ensure that the descriptions are unique, creative, and fit well within the context of the provided premise and setting, while adhering to common character archetypes and tropes found in {genre} stories.

#     Example of a correctly formatted response:
#     ```json
#     [
#         {{
#             "name": "Ayla Windsong",
#             "type": "character",
#             "role": "Protagonist",
#             "physicalAppearance": "A lithe woman with sun-kissed skin, braided auburn hair, and piercing green eyes. She has a crescent-shaped scar on her left cheek.",
#             "behavioralPatterns": "Fiercely independent but deeply loyal to her close friends. She often acts impulsively but has a knack for thinking on her feet.",
#             "genderAndSexualOrientation": "Female, bisexual",
#             "relationships": {{
#                 "Alaric Frost": "Childhood friend and rival",
#                 "Ancient Temple": "Sacred place she guards",
#                 "Magic Staff": "Her trusted weapon and tool"
#             }},
#             "likesAndDislikes": {{
#                 "Likes": ["Exploring the unknown", "Playing the lute", "Collecting rare artifacts"],
#                 "Dislikes": ["Confinement", "Dishonesty", "Large crowds"]
#             }}
#         }},
#         {{
#             "name": "Ancient Temple of Whispers",
#             "type": "location",
#             "role": "Sacred Site",
#             "physicalAppearance": "A towering structure of weathered stone, covered in glowing runes and surrounded by mist.",
#             "behavioralPatterns": "The temple seems to respond to visitors' emotions, with its runes glowing brighter or dimmer.",
#             "genderAndSexualOrientation": "N/A",
#             "relationships": {{
#                 "Ayla Windsong": "Current Guardian",
#                 "Magic Staff": "Source of its power",
#                 "Dark Cultists": "Those who seek to corrupt it"
#             }},
#             "likesAndDislikes": {{
#                 "Likes": ["Pure magic", "Worthy guardians", "Ancient rituals"],
#                 "Dislikes": ["Dark magic", "Corruption", "Desecration"]
#             }}
#         }}
#     ]
#     ```
#     Use this as a guide to ensure your response meets expectations.<|im_end|>
#     <|im_start|>user
#     Based on the premise: {premise} and the setting: {setting}, generate a list of characters, entities, and locations (at least 5) detailing their attributes in JSON format.
#     Here's the JSON schema you must adhere to:\n<schema>\n{character_schema}\n</schema>.
#     <|im_end|>
#     <|im_start|>assistant
#     """

#     # print("chatML_template")
#     characters = model(chatML_template, max_tokens=4000)
#     characters_str = characters["choices"][0]["text"].strip()  # type: ignore
#     logging.debug(f"Generated Characters: {characters_str}")

#     characters_list = process_characters_json(characters_str)
#     await stories.update_one(
#         {"story_id": ObjectId(story_id)},
#         {"$set": {"characters": characters_list, "updated_at": datetime.utcnow()}},
#     )
#     return characters_list


async def generate_characters(story_id: str, num_characters: int) -> List[Dict]:
    """Generate characters/entities with strict schema validation and efficient updates."""
    # Fetch story to get genre
    story = await stories.find_one({"story_id": ObjectId(story_id)})
    if not story:
        raise ValueError("Story not found")

    genre = story.get("genre", "")
    premise = story.get("premise", "")
    setting = story.get("setting", "")
    existing_characters = story.get("characters", [])

    chatML_template = f"""
    <|im_start|>system
    You are an AI designed to generate character descriptions for {genre} stories.
    Ensure output adheres to this **strict JSON schema**:
    ###Example of a correctly formatted response:
    [
        {
            "name": "string",
            "type": "string", // Must be one of ["character", "entity", "location"]
            "role": "string",
            "physicalAppearance": "string",
            "behavioralPatterns": "string",
            "genderAndSexualOrientation": "string",
            "relationships": {
                "string": "string",
                "string": "string"
            },
            "likesAndDislikes": {
                "Likes": ["string", "string", ...],
                "Dislikes": ["string", "string", ...]
            }
        },
        {
            "name": "string",
            "type": "string",
            "role": "string",
            "physicalAppearance": "string",
            "behavioralPatterns": "string",
            "genderAndSexualOrientation": "string",
            "relationships": {
                "string": "string",
                "string": "string"
            },
            "likesAndDislikes": {
                "Likes": ["string", "string", ...],
                "Dislikes": ["string", "string", ...]
            }
        }
    ]
    ```

    Example valid response:
    [
      {{
        "name": "The Archivist",
        "type": "character",
        "role": "main character",
        "physicalAppearance": "An elderly man with piercing blue eyes and a long, white beard.",
        "behavioralPatterns": "Methodical and patient, with an insatiable curiosity for knowledge.",
        "genderAndSexualOrientation": "Male, heterosexual",
        "relationships": {{
          "The Scribe": "Long-time partner and confidant"
        }},
        "likesAndDislikes": {{
          "Likes": ["Ancient texts", "Tea made from rare herbs"],
          "Dislikes": ["Distractions", "Impulsive actions"]
        }}
      }}
    ]
    **Instructions:**
    1. **Do NOT modify or omit any schema keys.**  
    2. **Ensure all values are contextually relevant** to the story's premise, setting, and existing character data.  
    3. **Avoid generic or repetitive descriptions**—make each entity unique and engaging.  
    4. **Strictly output valid JSON only.** No extra text, explanations, or formatting errors.

    Now, generate a list of  new **character, entity, or location** based on the following details:

    Generate exactly {num_characters} characters/entities based on:
    Premise: {premise}
    Setting: {setting}
    Existing Characters: {existing_characters}
    <|im_end|>
    <|im_start|>assistant
    """

    try:
        # Enforce structured JSON response from AI
        characters_response = model._json(
            chatML_template,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "type": {
                                "type": "string",
                                "enum": ["character", "entity", "location"],
                            },
                            "role": {"type": "string"},
                            "physicalAppearance": {"type": "string"},
                            "behavioralPatterns": {"type": "string"},
                            "genderAndSexualOrientation": {"type": "string"},
                            "relationships": {
                                "type": "object",
                                "additionalProperties": {"type": "string"},
                            },
                            "likesAndDislikes": {
                                "type": "object",
                                "properties": {
                                    "Likes": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                    },
                                    "Dislikes": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                    },
                                },
                                "required": ["Likes", "Dislikes"],
                            },
                        },
                        "required": [
                            "name",
                            "type",
                            "role",
                            "physicalAppearance",
                            "behavioralPatterns",
                            "genderAndSexualOrientation",
                            "relationships",
                            "likesAndDislikes",
                        ],
                    },
                },
            },
        )

        # Validate response format
        if (
            not isinstance(characters_response, dict)
            or "choices" not in characters_response
        ):
            logging.error("Invalid AI model response")
            raise ValueError("Invalid AI response format")

        characters_list = characters_response["choices"][0]["text"]

        # Convert string to JSON
        try:
            characters_list = json.loads(characters_list)
            
            if not isinstance(characters_list, list):
                raise ValueError("Generated characters must be a list.")
        except json.JSONDecodeError as e:
            logging.error(f"Error parsing AI response JSON: {e}")
            raise ValueError("Failed to parse JSON response from AI")

        # Update only necessary fields instead of replacing everything
        # await stories.update_one(
        #     {"story_id": ObjectId(story_id)},
        #     {"$set": {"characters": characters_list, "updated_at": datetime.utcnow()}},
        # )

        return characters_list

    except Exception as e:
        logging.error(f"Error generating characters: {e}")
        raise


# Process characters JSON stringapp/storywritercharacters/main.py
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


async def regenerate_single_character(story_id: str, character_name: str) -> Dict:
    # Get story for genre
    story = await stories.find_one({"story_id": ObjectId(story_id)})
    if not story:
        raise ValueError("Story not found")

    genre = story.get("genre", "")
    premise = story.get("premise", "")
    setting = story.get("setting", "")
    existing_characters = story.get("characters", [])
    # find the character by name
    character_schema = None
    character = next(
        (
            char
            for char in existing_characters
            if char.get("name").lower() == character_name.lower()
        ),
        None,
    )
    if not character:
        return {"error": "Character not found"}
    else:
        character_schema = json.dumps(character, indent=4)

    chatML_template = f"""
    <|im_start|>system
    You are tasked with regenerating a single character for a {genre} story while maintaining their original name. The output should be a single character description in JSON format that fits well within the context of the provided premise and setting.
    
    Example of a correctly formatted response:
    {{
        "name": "{character_name}",
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
    }}
    <|im_end|>
    <|im_start|>user
    Based on the ###premise: {premise} and the 
    ###setting: {setting},
    ###Existing Character Data: {character_schema},
    ###Character Name: {character_name},
    ###Already existing data on the character: {character},
    Instruction: Regenerate the character named "{character_name}" with new traits and characteristics while maintaining their name. Use this JSON schema:\n<schema>\n{character_schema}\n</schema>.
    <|im_end|>
    <|im_start|>assistant
    """

    try:
        response = await model._json(
            chatML_template,
            max_tokens=2000,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "type": {
                                "type": "string",
                                "enum": ["character", "entity", "location"],
                            },
                            "role": {"type": "string"},
                            "physicalAppearance": {"type": "string"},
                            "behavioralPatterns": {"type": "string"},
                            "genderAndSexualOrientation": {"type": "string"},
                            "relationships": {
                                "type": "object",
                                "additionalProperties": {"type": "string"},
                            },
                            "likesAndDislikes": {
                                "type": "object",
                                "properties": {
                                    "Likes": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                    },
                                    "Dislikes": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                    },
                                },
                                "required": ["Likes", "Dislikes"],
                            },
                        },
                        "required": [
                            "name",
                            "type",
                            "role",
                            "physicalAppearance",
                            "",
                            "",
                            "relationships",
                            "",
                        ],
                    },
                },
            },
        )
        character_str = response["choices"][0]["text"].strip()  # type: ignore
        logging.debug(f"Regenerated Character: {character_str}")
    except Exception as e:
        logging.error(f"Error regenerating character: {e}")
        raise ValueError("Failed to regenerate character")

    try:
        character_dict = extract_and_parse_json(character_str)
        if not character_dict:
            raise ValueError("Failed to extract and parse JSON response")
        # make sure the name is the same as the original character
        character_dict["name"] = character_name
        character = Character(**character_dict)
        return character.model_dump()
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON: {e}")
        raise ValueError("Failed to generate valid character JSON")
    except Exception as e:
        logging.error(f"Error validating character: {e}")
        raise ValueError("Failed to validate generated character")


# Generate single character based on premise and setting
async def generate_character(story_id: str) -> Dict:
    """Generate a single character/entity with strict schema validation and efficient updates."""

    # Fetch story to get genre
    story = await stories.find_one({"story_id": ObjectId(story_id)})
    if not story:
        raise ValueError("Story not found")

    genre = story.get("genre", "")
    premise = story.get("premise", "")
    setting = story.get("setting", "")
    outline = story.get("outline", None)

    # fetch existing character data
    existing_characters = story.get("characters", [])
    character_data = existing_characters if existing_characters else None


    chatML_template = f"""
    <|im_start|>system
    You are a powerful AI that only outputs valid structured JSON data.
    You are a powerful AI that can generate creative and unique character descriptions for a {genre} story. Your goal is to come up with an original and engaging character that fits the {genre} genre. The character must be a complete description that makes sense.
    You are an AI designed to generate a single character description for a {genre} story.
    Ensure the output adheres to this **strict JSON schema** and make sure to not have any mismatched brackets specially around  or quotes:
    ###Example of a correctly formatted response:
    {{
        "name": "string",
        "type": "string", // Must be one of ["character", "entity", "location"]
        "role": "string",
        "physicalAppearance": "string",
        "behavioralPatterns": "string",
        "genderAndSexualOrientation": "string",
        "relationships": {{
            "string": "string",
            "string": "string"
        }},
        "likesAndDislikes": {{
            "Likes": ["string", "string", ...],
            "Dislikes": ["string", "string", ...]
        }}
    }}
    Example valid response:
    [
      {{
        "name": "The Archivist",
        "type": "character",
        "role": "main character",
        "physicalAppearance": "An elderly man with piercing blue eyes and a long, white beard.",
        "behavioralPatterns": "Methodical and patient, with an insatiable curiosity for knowledge.",
        "genderAndSexualOrientation": "Male, heterosexual",
        "relationships": {{
          "The Scribe": "Long-time partner and confidant"
        }},
        "likesAndDislikes": {{
          "Likes": ["Ancient texts", "Tea made from rare herbs"],
          "Dislikes": ["Distractions", "Impulsive actions"]
        }}
      }}
    ]
    **Instructions:**
    1. **Do NOT modify or omit any schema keys.**  
    2. **Ensure all values are contextually relevant** to the story's premise, setting, and existing character data.  
    3. **Avoid generic or repetitive descriptions**—make each entity unique and engaging.  
    4. **Strictly output valid JSON only.** No extra text, explanations, or formatting errors.
    5. Ensure this character is completely different from any existing characters/entities/locations listed above. Avoid repeating names, descriptions, or traits.


    Now, generate a single new **character, entity, or location** based on the following details:

    Generate a completely new single character/entity/location based on:
    ###Premise: {premise}
    ###Setting: {setting}
    ###Outline: {outline}
    ###Existing Character/entitylocation Data: {character_data}
    <|im_end|>
    <|im_start|>user
    Based on the premise and setting, generate a single new (should not match existing one in name and data should be unique) character or entity or location in JSON format.
    ###Premise: {premise}
    ###Setting: {setting}
    ###Outline: {outline}
    ###Existing Character/entitylocation Data: {character_data}
    Only output json data and nothing else.<|im_end|>
    <|im_start|>assistant
    """

    try:
        # ✅ Await the AI response
        character_response = await model._json(
            chatML_template,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "type": "object",
                    "strict": True,
                    "properties": {
                        "name": {"type": "string"},
                        "type": {
                            "type": "string",
                            "enum": ["character", "entity", "location"],
                        },
                        "role": {"type": "string"},
                        "physicalAppearance": {"type": "string"},
                        "behavioralPatterns": {"type": "string"},
                        "genderAndSexualOrientation": {"type": "string"},
                        "relationships": {
                            "type": "object",
                            "additionalProperties": {"type": "string"},
                        },
                        "likesAndDislikes": {
                            "type": "object",
                            "properties": {
                                "Likes": {"type": "array", "items": {"type": "string"}},
                                "Dislikes": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                            },
                            "required": ["Likes", "Dislikes"],
                        },
                    },
                    "required": [
                        "name",
                        "type",
                        "role",
                        "physicalAppearance",
                        "relationships",
                        "likesAndDislikes",
                    ],
                },
            },
            temperature=0.5,
        )

        # ✅ Validate AI response
        if not isinstance(character_response, dict):
            logging.error("Invalid AI model response format")
            raise ValueError("Invalid AI response format")

        # ✅ Use response directly if it's already a dictionary
        # character_data = character_response
        response = character_response["choices"][0]["text"].strip()  # type: ignore
        character_data = extract_and_parse_json(text=response)

        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "type": {"type": "string", "enum": ["character", "entity", "location"]},
                "role": {"type": "string"},
                "physicalAppearance": {"type": "string"},
                "behavioralPatterns": {"type": "string"},
                "genderAndSexualOrientation": {"type": "string"},
                "relationships": {
                    "type": "object",
                    "additionalProperties": {"type": "string"},
                },
                "likesAndDislikes": {
                    "type": "object",
                    "properties": {
                        "Likes": {"type": "array", "items": {"type": "string"}},
                        "Dislikes": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["Likes", "Dislikes"],
                },
            },
            "required": [
                "name",
                "type",
                "role",
                "physicalAppearance",
                "relationships",
            ],
        }

        if not character_data:
            raise ValueError("Failed to extract and parse JSON response")
        try:
            validate(instance=character_data, schema=schema)
        except ValidationError as e:
            logging.error(f"JSON schema validation error: {e}")
            raise

        new_character = character_data

        # ✅ Update database safely
        # appeand the new character to the existing list

        existing_characters = story.get("characters") or []
        
        existing_characters.append(new_character)
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"characters": existing_characters, "updated_at": datetime.now()}},
        )
        # await stories.update_one(
        #     {"story_id": ObjectId(story_id)},
        #     {"$set": {"character": character_data, "updated_at": datetime.utcnow()}},
        # )

        return character_data

    except Exception as e:
        logging.error(f"Error generating character: {e}")
        raise
