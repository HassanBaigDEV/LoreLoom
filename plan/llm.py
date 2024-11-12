import logging
from typing import Optional, Dict, List
from pydantic import BaseModel
from llama_cpp import Llama
import json
import re
import heapq
from collections import deque


# Configure logging
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Load the Llama model globally
model = Llama(
    model_path="D:/LMStudio/models/NousResearch/Hermes-3-Llama-3.1-8B-GGUF/Hermes-3-Llama-3.1-8B.Q4_K_M.gguf",
    n_ctx=8096,
    verbose=True,  # Verbose is required to pass to the callback manager
)
