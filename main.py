import json
import logging
import uuid
import uvicorn
import logging


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)  # Set global log level to INFO
    uvicorn.run("app.app:app", host="localhost", port=7777, reload=True)
# story_id = uuid.uuid4()

# outline = generate_full_outline(
#     story_id, max_depth=2, expansion_method="vaguest_first"
# )
# logging.info(f"Final Outline: {json.dumps(outline.model_dump(), indent=4)}")
