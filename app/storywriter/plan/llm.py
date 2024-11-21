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

# Get the absolute path to the model
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.abspath(
    os.path.join(
        current_dir,
        "../../../models/Hermes-3-Llama-3.1-8B-GGUF/Hermes-3-Llama-3.1-8B.Q4_K_M.gguf",
    )
)

# Load the Llama model globally

model = Llama(
    model_path=model_path,
    n_ctx=8096,
    verbose=True,
)

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
    if hasattr(response, 'choices') and len(response.choices) > 0:
        if hasattr(response.choices[0], 'text'):
            return response.choices[0].text.strip()
    return ""
