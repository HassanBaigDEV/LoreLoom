import logging
import os
from llama_cpp import Llama
import torch

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

        # Check CUDA availability
        gpu_layers = 35  # Number of layers to offload to GPU
        # if not torch.cuda.is_available():
        #     logger.warning("CUDA not available, falling back to CPU")
        #     gpu_layers = 0

        llm = Llama(
            model_path=model_path,
            n_ctx=8096,
            n_gpu_layers=gpu_layers,
            n_threads=8,
            offload_kqv=True,
            verbose=True,
            n_batch=512,
            main_gpu=0,
            tensor_split=None,  # Auto-configure tensor split
            seed=-1,  # Random seed
            use_mlock=False,
            use_mmap=True,
            embedding=True,  # Enable embedding mode
        )

        if gpu_layers > 0:
            print(f"LLM initialized successfully with {gpu_layers} GPU layers")
        else:
            print("LLM initialized successfully in CPU-only mode")

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
