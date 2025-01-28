# Generate the story premise
import logging
from ...llm_colab import model
import uuid
from app.config.mongo import db, stories
from datetime import datetime
from bson import ObjectId
from fastapi.concurrency import run_in_threadpool
from app.utils.text_validation import retry_generation


async def generate_title(story_id: str) -> str:
    async def _generate() -> str:
        # Get story for genre
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError("Story not found")

        genre = story.get("genre", "")

        title_template = f"""<|im_start|>system
        You are tasked with generating creative and unique story titles. Your goal is to come up with an original and engaging title of just 1 line that fits the {genre} genre. The title must be a complete phrase that makes sense.<|im_end|>
        <|im_start|>user
        Generate a creative and unique title for a {genre} story.<|im_end|>
        <|im_start|>assistant
        Title:
        """
        title = model(title_template, max_tokens=32)
        title_str = title["choices"][0]["text"].strip()  # type: ignore
        return title_str

    result = await retry_generation(_generate)
    if not result:
        raise ValueError("Failed to generate a valid title after multiple attempts")

    try:
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"title": result, "updated_at": datetime.utcnow()}},
        )
    except Exception as e:
        logging.error(f"Error updating story title: {e}")
    return result


async def generate_premise(story_id: str, title: str) -> str:
    async def _generate() -> str:
        # Get story for genre
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError("Story not found")

        genre = story.get("genre", "")

        chatML_template = f"""<|im_start|>system
        You are tasked with generating creative and unique story premises for the {genre} genre. Your goal is to come up with an original and engaging premise that ends with a complete sentence.<|im_end|>
        <|im_start|>user
        Generate a creative and unique premise for a {genre} story with Title: {title}.<|im_end|>
        <|im_start|>assistant
        Premise:
        """

        premise = model(chatML_template, max_tokens=128)
        premise_str = premise["choices"][0]["text"].strip()  # type: ignore
        return premise_str

    result = await retry_generation(_generate)
    if not result:
        raise ValueError("Failed to generate a valid premise after multiple attempts")

    await stories.update_one(
        {"story_id": ObjectId(story_id)},
        {"$set": {"premise": result, "updated_at": datetime.utcnow()}},
    )
    return result
