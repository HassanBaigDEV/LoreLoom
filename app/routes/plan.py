from re import M
from turtle import st
from fastapi import APIRouter, HTTPException
from typing import List, Dict
from bson import ObjectId
from app.models.story import Story
from app.config.mongo import stories
from datetime import datetime
import logging

# Import the generator functions
from app.storywriter.plan.plot.premise import generate_title, generate_premise
from app.storywriter.plan.plot.settings import generate_setting
from app.storywriter.plan.characters.main import generate_characters
from app.storywriter.plan.outline.main import (
    generate_full_outline,
    create_numbered_outline,
)

router = APIRouter()


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@router.get("/generate-title/{story_id}")
async def get_title(story_id: str, user_id: str):
    try:
        # Convert story_id and user_id to ObjectId
        story_id_obj = ObjectId(story_id)
        user_id_obj = ObjectId(user_id)

        # Check if story exists and belongs to user
        story = await stories.find_one(
            {"story_id": story_id_obj, "author": user_id_obj}
        )
        if not story:
            # raise HTTPException(status_code=404, detail="Story not found")
            logging.error("Story not found")
            return HTTPException(status_code=404, detail="Story not found")

        title = await generate_title(story_id)
        return title
    except ValueError as ve:
        logger.error(f"ValueError: {ve}")
        # raise HTTPException(status_code=400, detail="Invalid ID format")
        return HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        logger.error(f"Exception: {e}")
        return HTTPException(status_code=500, detail=str(e))
        # raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate-premise/{story_id}")
async def get_premise(story_id: str, user_id: str):
    try:
        # Check if story exists and belongs to user
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            # raise HTTPException(status_code=404, detail="Story not found")
            logging.error("Story not found")
            return HTTPException(status_code=404, detail="Story not found")

        if not story.get("title"):
            # raise HTTPException(status_code=400, detail="Title must be generated first")
            logging.error("Title must be generated first")
            return HTTPException(
                status_code=400, detail="Title must be generated first"
            )

        premise = await generate_premise(story_id, story["title"])
        return premise
    except ValueError:
        # raise HTTPException(status_code=400, detail="Invalid ID format")
        logging.error("Invalid ID format")
        return HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        # raise HTTPException(status_code=500, detail=str(e))
        logging.error(f"Exception: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.get("/generate-setting/{story_id}")
async def get_setting(story_id: str, user_id: str):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        if not story.get("title") or not story.get("premise"):
            raise HTTPException(
                status_code=400, detail="Title and premise must be generated first"
            )

        setting = await generate_setting(story_id, story["title"], story["premise"])
        return setting
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate-characters/{story_id}")
async def get_characters(story_id: str, user_id: str):
    logging.info("Generating characters")
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            # raise HTTPException(status_code=404, detail="Story not found")
            logging.error("Story not found")
            return HTTPException(status_code=404, detail="Story not found")

        if not story.get("premise") or not story.get("setting"):
            # raise HTTPException(
            #     status_code=400, detail="Premise and setting must be generated first"
            # )
            logging.error("Premise and setting must be generated first")
            return HTTPException(
                status_code=400, detail="Premise and setting must be generated first"
            )

        characters = await generate_characters(
            story_id, story["premise"], story["setting"]
        )
        return characters
    except ValueError:
        # raise HTTPException(status_code=400, detail="Invalid ID format")
        logging.error("Invalid ID format")
        return HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        # raise HTTPException(status_code=500, detail=str(e))
        logging.error(f"Exception: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.get("/generate-full-outline/{story_id}")
async def get_full_outline(
    story_id: str,
    user_id: str,
    max_depth: int = 2,
    continue_from_previous: bool = False,
):
    logging.info(
        "Generating full outline", story_id, user_id, max_depth, continue_from_previous
    )
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            # raise HTTPException(status_code=404, detail="Story not found")
            logging.error("Story not found")
            return HTTPException(status_code=404, detail="Story not found")

        if not all(
            key in story for key in ["title", "premise", "setting", "characters"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Title, premise, setting, and characters must be generated first",
            )

        # root_node = await generate_full_outline(
        #     story_id,
        #     max_depth,
        # )

        # # return root_node.model_dump()
        # outline = await create_numbered_outline(
        #     story_id,
        #     num_events=max_depth,
        #     continue_from_previous=continue_from_previous,
        # )
        # return outline
        # return root_node.model_dump()
        outline = await create_numbered_outline(
            story_id,
            num_events=max_depth,
            continue_from_previous=continue_from_previous,
        )
        return outline

    except ValueError:
        # raise HTTPException(status_code=400, detail="Invalid ID format")
        logging.error("Invalid ID format")
        return HTTPException(
            status_code=400, detail="Invalid ID format or story not found"
        )
    except Exception as e:
        # raise HTTPException(status_code=500, detail=str(e))
        logging.error(f"Exception: {e}")
        return HTTPException(status_code=500, detail=str(e))
