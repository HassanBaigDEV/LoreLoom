from fastapi import APIRouter, HTTPException
from typing import List, Dict
from bson import ObjectId
from app.models.story import Story
from app.config.mongo import stories
from datetime import datetime

# Import the generator functions
from app.storywriter.plan.plot.premise import generate_title, generate_premise
from app.storywriter.plan.plot.settings import generate_setting
from app.storywriter.plan.characters.main import generate_characters
from app.storywriter.plan.outline.main import generate_full_outline

router = APIRouter()


@router.get("/generate-title/{story_id}")
async def get_title(story_id: str, user_id: str):
    try:
        # Check if story exists and belongs to user
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        title = await generate_title(story_id)
        return title
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate-premise/{story_id}")
async def get_premise(story_id: str, user_id: str):
    try:
        # Check if story exists and belongs to user
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        if not story.get("title"):
            raise HTTPException(status_code=400, detail="Title must be generated first")

        premise = await generate_premise(story_id, story["title"])
        return premise
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        if not story.get("premise") or not story.get("setting"):
            raise HTTPException(
                status_code=400, detail="Premise and setting must be generated first"
            )

        characters = await generate_characters(
            story_id, story["premise"], story["setting"]
        )
        return characters
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate-full-outline/{story_id}")
async def get_full_outline(
    story_id: str,
    user_id: str,
    max_depth: int = 2,
    expansion_method: str = "vaguest_first",
):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        if not all(
            key in story for key in ["title", "premise", "setting", "characters"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Title, premise, setting, and characters must be generated first",
            )

        root_node = await generate_full_outline(
            story_id,
            max_depth,
            expansion_method=expansion_method,
            premise=story["premise"],
            setting=story["setting"],
            characters=story["characters"],
        )

        return root_node.model_dump()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
