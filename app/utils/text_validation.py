import re
import logging
from typing import Optional, Callable, Mapping, Dict
from functools import wraps
import tiktoken
import asyncio
import json5

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


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


import re
import json5
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def extract_and_parse_json(text: str) -> Optional[dict]:
    """Extract and parse JSON from text, handling markdown code blocks if present."""
    try:
        # Attempt to extract JSON content from a markdown code block.
        # This regex looks for code fences with optional "json" after the backticks.
        # code_block_match = re.search(
        #     r"```(?:json)?\s*(\{.*\})\s*```", text, flags=re.DOTALL | re.IGNORECASE
        # )
        # if code_block_match:
        #     json_str = code_block_match.group(1)
        # else:
            # Fallback: locate the first JSON object in the text.
        start = text.find("{")
        end = text.rfind("}")
        logger.debug(text)
        logger.debug(f"JSON start: {start}, end: {end}")
        if start == -1 or end == -1 or start >= end:
            logger.error("No JSON structure found in the text.")
            return None
        json_str = text[start : end + 1]
        

        # Clean up the extracted JSON string.
        json_str = json_str.strip()
        logger.debug(f"Extracted JSON string: {json_str}")
        if json_str.count("{") != json_str.count("}") or json_str.count("[") != json_str.count("]"):
            logger.error("Mismatched brackets detected in JSON string.")
            return None

        # Parse the JSON string using JSON5 for added flexibility.
        parsed = json5.loads(json_str)
        return parsed if isinstance(parsed, dict) else None

    except Exception as e:
        logger.error(f"JSON parse error: {str(e)}")
        # logger.debug(f"Problematic content: {json_str}")
        return None
