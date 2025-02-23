import re
import logging
from typing import Optional, Callable, Mapping, Dict
from functools import wraps
import tiktoken
import asyncio
import json

logger = logging.getLogger(__name__)


def is_complete_sentence(text: str) -> bool:
    """Check if text ends with a valid sentence ending."""
    # Strip whitespace and check if empty
    text = text.strip()
    if not text:
        return False

    # Check for proper sentence endings
    sentence_endings = [".", "!", "?", '"', "'"]
    return any(text.endswith(end) for end in sentence_endings)


async def retry_generation(generator_func, max_attempts: int = 3) -> Optional[str]:
    """Retry generation with validation"""
    for attempt in range(max_attempts):
        try:
            # Call the generator function and await if it's a coroutine
            result = await generator_func()

            if not result:
                logger.error(f"Empty result on attempt {attempt + 1}")
                continue

            if is_complete_sentence(result):
                return result
            else:
                logger.error(f"Incomplete sentence on attempt {attempt + 1}")

        except Exception as e:
            logger.error(f"Generation error on attempt {attempt + 1}: {str(e)}")

    return None


def get_logit_bias() -> Dict[str, float]:
    """Get logit bias to prevent unwanted tokens/phrases"""
    enc = tiktoken.get_encoding("cl100k_base")

    discouraged_phrases = [
        "variation 1:",
        "variation 2:",
        "variation 3:",
        "variation one:",
        "variation two:",
        "variation three:",
        "first variation:",
        "second variation:",
        "third variation:",
        "passage 1:",
        "passage 2:",
        "passage 3:",
        "version 1:",
        "version 2:",
        "version 3:",
    ]

    logit_bias: Dict[str, float] = {}
    for phrase in discouraged_phrases:
        tokens = enc.encode(phrase.lower())
        for token in tokens:
            logit_bias[str(token)] = float(-100)  # Cast explicitly to float

    return logit_bias


def extract_and_parse_json(text: str) -> Optional[dict]:
    """Robust JSON extraction and parsing with error handling."""
    try:
        # Remove markdown fences if present
        if "```json" in text:
            # Split off the part after "```json"
            text = text.split("```json", 1)[1]
        if "```" in text:
            # Remove everything after the closing fence
            text = text.split("```", 1)[0]

        # Trim leading/trailing whitespace
        text = text.strip()

        # Extract the substring from the first { to the last }
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            logger.error("No JSON brackets found")
            return None

        json_str = text[start : end + 1]
        # Remove problematic characters
        json_str = json_str.replace("\n", " ").replace('\\"', '"')

        # Handle common formatting issues
        json_str = json_str.replace("'", '"')  # Replace single quotes
        json_str = json_str.replace("True", "true").replace("False", "false")

        # Attempt to parse the JSON string directly without altering quotes
        return json.loads(json_str)

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        logger.debug(f"Problematic JSON string: {json_str}")
        return None
    except Exception as e:
        logger.error(f"Error parsing JSON: {e}")
        return None
