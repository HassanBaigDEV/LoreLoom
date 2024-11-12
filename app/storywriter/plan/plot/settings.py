import logging
import uuid
from ..llm import model
from app.config.mongo import db, stories
from datetime import datetime


async def generate_setting(story_id: uuid.UUID, title: str, premise: str) -> str:
    chatML_template = f"""
    <|im_start|>system
    You are tasked with generating a detailed setting for a story based on a given premise. Include the location, time period, and atmosphere.<|im_end|>
    <|im_start|>user
    Based on the Title:{title} and Premise: {premise}, generate a detailed setting including the location, time period, and atmosphere.<|im_end|>
    <|im_start|>assistant
    """

    setting = model(chatML_template, max_tokens=256)
    setting_str = setting["choices"][0]["text"].strip()  # type: ignore
    model.close()
    # embeddings = embed_model.get_text_embedding(setting_str)
    # store_story_part("setting", story_id, setting_str, embeddings)
    logging.debug(f"Generated Setting: {setting_str}")

    await stories.update_one(
        {"story_id": str(story_id)},
        {"$set": {"setting": setting_str, "updated_at": datetime.utcnow()}},
    )
    return setting_str
