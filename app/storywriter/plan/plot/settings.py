import logging
from urllib import response
import uuid
from ...llm.llama import model
from app.config.mongo import db, stories
from datetime import datetime
from bson import ObjectId
from app.utils.text_validation import retry_generation, get_logit_bias


async def generate_setting(story_id: str, title: str, premise: str) -> str:
    async def _generate() -> str:
        # Get story for genre
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError("Story not found")

        genre = story.get("genre", "")

        chatML_template = f"""
        <|im_start|>system
        You are a powerful AI that can generate creative and unique story settings. Your goal is to come up with an original and engaging setting that fits the {genre} genre. The setting must be a complete paragraph that makes sense.
        You are tasked with generating a detailed setting for a {genre} story based on a given premise. Include the location, time period, and atmosphere that would be appropriate for this genre. Ensure the description ends with a complete sentence.
        You will only write the setting description and not the title or premise or anything else.
        <|im_end|>
        <|im_start|>user
        Based on the Title: {title} and Premise: {premise}, generate a detailed setting including the location, time period, and atmosphere appropriate for a {genre} story.
        Only include the setting description and do not include the title or premise or anything else.<|im_end|>
        <|im_end|>
        <|im_start|>assistant
        """

        setting = model(chatML_template, logit_bias=get_logit_bias())
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


async def generate_setting_with_context(
    title: str, premise: str, genre: str, tone: str, keywords: list
) -> str:
    async def _generate() -> str:
        prompt = f"""
        <|im_start|>system
        You are a powerful AI that can generate creative and unique story settings. Your goal is to come up with an original and engaging setting that fits the {genre} genre. The setting must be a complete paragraph that makes sense.
        Create a {genre} story setting that supports this premise:
        "{premise}"
        You are tasked with generating a detailed setting for a {genre} story based on a given premise. Include the location, time period, and atmosphere that would be appropriate for this genre. Ensure the description ends with a complete sentence.<|im_end|>
        
        Requirements:
        - Title: {title}
        - Tone: {tone}
        - Must include: {', '.join(keywords[:3])}
        - Optional: {', '.join(keywords[3:])}
        - Sensory details: Focus on {['sight', 'sound', 'smell'][hash(tone)%3]}
        <|im_end|>
        <|im_start|>user
        Based on the Title: {title} and Premise: {premise}, generate a detailed setting including the location, time period, and atmosphere appropriate for a {genre} story
        <|im_end|>
        <|im_start|>assistant
        """
        response = model(prompt, logit_bias=get_logit_bias())
        return response["choices"][0]["text"].strip()

    setting = await retry_generation(_generate)
    if not setting:
        raise ValueError("Failed to generate a valid setting after multiple attempts")

    return setting
