# Generate the story premise
import logging
from ..llm import model
import uuid
from app.config.mongo import db, stories
from datetime import datetime
from bson import ObjectId
from fastapi.concurrency import run_in_threadpool


async def generate_title(story_id: str) -> str:
    title_template = """<|im_start|>system
    You are tasked with generating creative and unique story titles. Your goal is to come up with an original and engaging title of just 1 line.<|im_end|>
    <|im_start|>user
    Generate a creative and unique title for a story.<|im_end|>
    <|im_start|>assistant
    Title:
    """
    # title = await run_in_threadpool(lambda: model(title_template, max_tokens=32))
    title = model(title_template, max_tokens=32)
    # close_model()

    _title = title["choices"][0]["text"].strip()  # type: ignore
    title_str = _title.strip()  # Clean any leading/trailing whitespace

    logging.debug(f"Generated Title: {title_str}")
    logging.debug(f"Story ID: {ObjectId(story_id)}")

    # Update story document

    try:
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"title": title_str, "updated_at": datetime.utcnow()}},
        )
    except Exception as e:
        logging.error(f"Error updating story title: {e}")
    return title_str


async def generate_premise(story_id: str, title: str) -> str:
    chatML_template = f"""<|im_start|>system
    You are tasked with generating creative and unique story premises. Your goal is to come up with an original and engaging premise.<|im_end|>
    <|im_start|>user
    Generate a creative and unique and premise for a story with Title:{title}.<|im_end|>
    <|im_start|>assistant
    Premise:
    """

    logging.debug(f"Generating premise for story: {model}")
    premise = model(chatML_template, max_tokens=128)
    _premise = premise["choices"][0]["text"].strip()  # type: ignore
    model.close()
    premise_str = _premise.strip()

    # Update story document
    await stories.update_one(
        {"story_id": ObjectId(story_id)},
        {"$set": {"premise": premise_str, "updated_at": datetime.utcnow()}},
    )
    return premise_str
