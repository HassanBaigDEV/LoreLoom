import logging
import uuid
from ...llm.llama import model
from app.config.mongo import db, stories
from datetime import datetime
from bson import ObjectId
from app.utils.text_validation import retry_generation


async def generate_setting(story_id: str, title: str, premise: str) -> str:
    async def _generate() -> str:
        # Get story for genre
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError("Story not found")
        
        genre = story.get("genre", "")
        
        chatML_template = f"""
        <|im_start|>system
        You are tasked with generating a detailed setting for a {genre} story based on a given premise. Include the location, time period, and atmosphere that would be appropriate for this genre. Ensure the description ends with a complete sentence.<|im_end|>
        <|im_start|>user
        Based on the Title: {title} and Premise: {premise}, generate a detailed setting including the location, time period, and atmosphere appropriate for a {genre} story.<|im_end|>
        <|im_start|>assistant
        """

        setting = model(chatML_template, max_tokens=512)
        setting_str = setting["choices"][0]["text"].strip()  # type: ignore
        return setting_str

    result = await retry_generation(_generate)
    if not result:
        raise ValueError("Failed to generate a valid setting after multiple attempts")

    await stories.update_one(
        {"story_id": ObjectId(story_id)},
        {"$set": {"setting": result, "updated_at": datetime.utcnow()}},
    )
    return result
