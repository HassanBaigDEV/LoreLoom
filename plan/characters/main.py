# Pydantic character model
from typing import Optional, Dict, List
from pydantic import BaseModel
import json
import logging

from ..llm import model
from .schema import Character, character_schema


# Generate characters based on premise and setting
def generate_characters(premise: str, setting: str) -> List[Dict]:
    chatML_template = f"""
    <|im_start|>system
    You are tasked with generating detailed character descriptions based on a given premise and setting. The output should be structured in a strict JSON format.<|im_end|>
    <|im_start|>user
    Based on the premise: {premise} and the setting: {setting}, generate a list of main characters (at least 3) detailing their attributes in JSON format.
    Here's the json schema you must adhere to:\n<schema>\n{character_schema}\n</schema>.<|im_end|>
    <|im_start|>assistant
    """
    print("chatML_template")
    characters = model(chatML_template, max_tokens=4000)
    characters_str = characters["choices"][0]["text"].strip()  # type: ignore
    logging.debug(f"Generated Characters: {characters_str}")

    return process_characters_json(characters_str)


# Process characters JSON string
def process_characters_json(characters_json: str) -> List[Dict]:
    try:
        characters_list = json.loads(characters_json)
        return characters_list
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON: {e}")
        return []
