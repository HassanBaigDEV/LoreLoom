import logging
from typing import Optional, Dict, List
from pydantic import BaseModel
from llama_cpp import Llama
import json
import re
import heapq
from collections import deque
import os


# Configure logging
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


def initialize_model():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.abspath(
            os.path.join(
                current_dir,
                "../../../models/Hermes-3-Llama-3.1-8B-GGUF/Hermes-3-Llama-3.1-8B.Q4_K_M.gguf",
            )
        )

        logger.info(f"Initializing LLM with model path: {model_path}")

        if not os.path.exists(model_path):
            logger.error(f"Model file not found at: {model_path}")
            raise FileNotFoundError(f"Model file not found at: {model_path}")

        llm = Llama(
            model_path=model_path,
            n_ctx=8096,
            verbose=True,
        )
        logger.info("LLM initialized successfully")
        return llm
    except Exception as e:
        logger.error(f"Failed to initialize LLM: {e}")
        raise


# Initialize the model
try:
    model = initialize_model()
except Exception as e:
    logger.error(f"Failed to initialize model: {e}")
    raise

# # Function to initialize or reload the model
# def load_model() -> Llama:
#     global model
#     return


# def close_model():
#     global model
#     if model is not None:
#         model.close()
#         model = None


# Add this helper function
def get_llm_response_text(response) -> str:
    """Extract text from LLM response safely."""
    if hasattr(response, "choices") and len(response.choices) > 0:
        if hasattr(response.choices[0], "text"):
            return response.choices[0].text.strip()
    return ""
