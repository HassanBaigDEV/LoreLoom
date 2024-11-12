import json
import logging
from .outline.main import generate_full_outline
import uuid


if __name__ == "__main__":
    story_id = uuid.uuid4()

    outline = generate_full_outline(
        story_id, max_depth=2, expansion_method="vaguest_first"
    )
    logging.info(f"Final Outline: {json.dumps(outline.model_dump(), indent=4)}")
