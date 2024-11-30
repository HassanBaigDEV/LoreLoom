import re
import logging
from typing import Optional, Callable
from functools import wraps

logger = logging.getLogger(__name__)

def is_complete_sentence(text: str) -> bool:
    """Check if text ends with a valid sentence ending."""
    # Strip whitespace and check if empty
    text = text.strip()
    if not text:
        return False
    
    # Check for proper sentence endings
    sentence_endings = ['.', '!', '?', '"', "'"]
    return any(text.endswith(end) for end in sentence_endings)

async def retry_generation(
    generate_func: Callable,
    max_retries: int = 3,
    *args,
    **kwargs
) -> Optional[str]:
    """
    Retry generation until a valid sentence is produced or max retries is reached.
    """
    for attempt in range(max_retries):
        try:
            result = await generate_func(*args, **kwargs)
            if isinstance(result, str) and is_complete_sentence(result):
                return result
            logger.warning(f"Generated text did not end properly on attempt {attempt + 1}")
        except Exception as e:
            logger.error(f"Generation error on attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                raise
    
    return None 