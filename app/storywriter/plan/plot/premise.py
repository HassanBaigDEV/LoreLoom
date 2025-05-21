# Generate the story premise
import logging
from turtle import title
from urllib import response

from torch import logit_, mode
from ...llm.deepseek import model
import uuid
from app.config.mongo import db, stories
from datetime import datetime
from bson import ObjectId
from fastapi.concurrency import run_in_threadpool
from app.utils.text_validation import retry_generation, get_logit_bias


async def generate_title(story_id: str) -> str:
    async def _generate() -> str:
        # Get story for genre
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError("Story not found")

        genre = story.get("genre", "")

        title_template = f"""<|im_start|>system
        You are tasked with generating creative and unique story titles. Your goal is to come up with an original and engaging title of just 1 line that fits the {genre} genre. The title must be a complete phrase that makes sense.
        **Instructions:**
        1. **Output only the title**—no explanations, labels, or extra text.
        2. **Ensure it is a single line** and a complete phrase.
        <|im_end|>
        
        <|im_start|>user
        Generate a creative and unique title for a {genre} story.
        **Only return the title as plain text.**
        <|im_end|>
        <|im_start|>assistant
        """
        full_response = model(title_template,
                      logit_bias=get_logit_bias())["choices"][0]["text"].strip()  # type: ignore
        lines = [line.strip() for line in full_response.strip().split("\n") if line.strip()]
        title_str = lines[-1] if lines else "Untitled"
        return {
            "title": title_str,
            "raw_response": full_response
        }

    result = await retry_generation(_generate)
    if not result:
        raise ValueError("Failed to generate a valid title after multiple attempts")

    try:
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"title": result["title"], "updated_at": datetime.utcnow()}},
        )
    except Exception as e:
        logging.error(f"Error updating story title: {e}")
    return result["raw_response"]


async def generate_premise(story_id: str, title: str) -> str:
    async def _generate() -> str:
        # Get story for genre
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError("Story not found")

        genre = story.get("genre", "")

        chatML_template = f"""<|im_start|>system
        You are a powerful AI that can generate creative and unique story premises. Your goal is to come up with an original and engaging premise that fits the {genre} genre. The premise must be a complete sentence that makes sense.
        You are tasked with generating creative and unique story premises for the {genre} genre. Your goal is to come up with an original and engaging premise that fits the {genre} genre. The premise must be a complete sentence that makes sense.
        **Instructions:**
        1. **Output only the premise**—no explanations, labels, or extra text.
        <|im_end|>
        <|im_start|>user
        Generate a creative and unique premise of a few lines (3-4) for a {genre} story with the title "{title}".<|im_end|>
        <|im_start|>assistant
        Premise:
        """

        premise = model(chatML_template,
                        logit_bias=get_logit_bias())
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


async def generate_title_with_context(
    genre: str, keywords: list, tone: str, complexity: float
) -> str:
    async def _generate()->str:
        prompt = f"""
        <|im_start|>system
        You are a powerful AI that can generate creative and unique story title. Your goal is to come up with an original and engaging title that fits the {genre} genre. The title must be a complete sentence that makes sense.
        You are tasked with generating creative and unique story title for the {genre} genre. Your goal is to come up with an original and engaging title that fits the {genre} genre. The title must be a complete sentence that makes sense.
        Only write the title for the story based on the user prompt and nothing else.
        Generate a {genre} story title that incorporates these keywords: {', '.join(keywords)}.
        Tone: {tone.capitalize()}
        Complexity level: {complexity*100}%
        Follow these rules:
        1. Length: {'Short (2-4 words)' if complexity < 0.4 else 'Medium (4-6 words)' if complexity < 0.7 else 'Long (6-8 words)'}
        2. Style: {'Simple' if complexity < 0.3 else 'Descriptive' if complexity < 0.7 else 'Epic'}
        3. Keywords used: At least {int(len(keywords)*complexity)} from provided list
        **Instructions:**
        1. **Output only the title**—no explanations, labels, or extra text.
        2. **Ensure it is a single line** and a complete phrase.
        <|im_end|>
        <|im_start|>user
        Generate a creative and unique title for a {genre} story.
        **Only return the title as plain text.**
        <|im_end|>
        <|im_start|>assistant
        """
        response = model(prompt,
                         logit_bias=get_logit_bias())
        return response["choices"][0]["text"].strip()
    title = await retry_generation(_generate)
    if not title:
        raise ValueError("Failed to generate a valid title after multiple attempts")
    return title
        
        
async def generate_premise_with_context(
    title: str, user_prompt: str, genre: str, complexity: float
) -> str:
    async def _generate() -> str:
        prompt = f"""
        <|im_start|>system
        You are a powerful AI that can generate creative and unique story premises. Your goal is to come up with an original and engaging premise that fits the {genre} genre. The premise must be a complete sentence that makes sense.
        You are tasked with generating creative and unique story premises for the {genre} genre. Your goal is to come up with an original and engaging premise that fits the {genre} genre. The premise must be a complete sentence that makes sense.
        Use the user prompt for context and expand it into a full story premise keeping in mind the following requirements:
        Only write the premise for the story based on the user prompt and nothing else.
        **Instructions:**
        1. **Output only the premise**—no explanations, labels, or extra text.
        
        Requirements:
        - Genre: {genre}
        - Title: {title}
        - Complexity: {complexity}/1.0
        - Length: {int(50 + complexity*150)} words
        - Include: {'Basic conflict' if complexity < 0.4 else 'Subplots' if complexity < 0.7 else 'Multiple arcs'}
        <|im_end|>
        <|im_start|>user
        "{user_prompt}""Only write the premise for the story based on the user prompt."
        <|im_end|>
        <|im_start|>assistant
        """
        response = model(prompt,
                         logit_bias=get_logit_bias())
        return response["choices"][0]["text"].strip()
    premise = await retry_generation(_generate)
    if not premise:
        raise ValueError("Failed to generate a valid premise after multiple attempts")
    return premise