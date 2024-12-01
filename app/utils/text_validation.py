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


async def retry_generation(
    generate_func: Callable, max_retries: int = 3, *args, **kwargs
) -> Optional[str]:
    """
    Retry generation until a valid sentence is produced or max retries is reached.
    """
    for attempt in range(max_retries):
        try:
            result = await generate_func(*args, **kwargs)
            if isinstance(result, str) and is_complete_sentence(result):
                return result
            logger.warning(
                f"Generated text did not end properly on attempt {attempt + 1}"
            )
        except Exception as e:
            logger.error(f"Generation error on attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                raise

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
