import logging
import os
from llama_cpp import Llama

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def initialize_model():
    try:
        model_path = os.getenv("MODEL_PATH")
        if not model_path:
            raise ValueError("MODEL_PATH environment variable not set")

        logger.info(f"Initializing LLM with model path: {model_path}")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at: {model_path}")

        llm = Llama(
            model_path=model_path,
            n_ctx=8096,
            n_gpu_layers=-1,  # Use all GPU layers
            verbose=False,
        )
        logger.info("LLM initialized successfully with GPU support")
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
