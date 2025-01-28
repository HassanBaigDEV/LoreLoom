import re
import logging
from typing import Optional, Callable, Mapping, Dict
from functools import wraps
import tiktoken

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


async def retry_generation(generate_func, max_attempts: int = 3) -> str:
    """Retry text generation with validation"""
    for attempt in range(max_attempts):
        try:
            text = await generate_func()
            if not text:
                logger.warning(f"Empty text generated on attempt {attempt + 1}")
                continue

            # Split into sentences and keep complete ones
            sentences = text.split(".")
            if len(sentences) > 1:
                complete_text = ".".join(sentences[:-1]) + "."
                return complete_text

            return text

        except Exception as e:
            logger.error(f"Generation error on attempt {attempt + 1}: {e}")

    return ""  # Return empty string if all attempts fail


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
