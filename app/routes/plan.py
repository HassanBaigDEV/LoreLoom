from re import M
from turtle import st
from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Optional
from bson import ObjectId
from app.models.story import Story
from app.config.mongo import stories
from datetime import datetime
import logging
from pydantic import BaseModel

# Import the generator functions
from app.storywriter.plan.plot.premise import generate_title, generate_premise
from app.storywriter.plan.plot.settings import generate_setting
from app.storywriter.plan.characters.main import generate_characters
from app.storywriter.plan.outline.main import (
    generate_full_outline,
    create_numbered_outline,
)
from app.storywriter.plan.characters.schema import Character

router = APIRouter()


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Add request models
class TitleUpdate(BaseModel):
    new_title: str

class PremiseUpdate(BaseModel):
    new_premise: str

class SettingUpdate(BaseModel):
    new_setting: str

class CharacterUpdate(BaseModel):
    character_name: str
    updated_character: Dict

class OutlinePointUpdate(BaseModel):
    point_number: str
    updated_point: Dict

class NewCharacter(BaseModel):
    new_character: Dict

class NewOutlinePoint(BaseModel):
    new_point: Dict
    position: Optional[int] = None

class CharacterDelete(BaseModel):
    character_name: str

class OutlinePointDelete(BaseModel):
    point_number: str


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


@router.put("/edit-title/{story_id}")
async def edit_title(story_id: str, user_id: str, data: TitleUpdate):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"title": data.new_title, "updated_at": datetime.utcnow()}}
        )
        return {"message": "Title updated successfully", "title": data.new_title}
    except Exception as e:
        logger.error(f"Error updating title: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.put("/edit-premise/{story_id}")
async def edit_premise(story_id: str, user_id: str, data: PremiseUpdate):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"premise": data.new_premise, "updated_at": datetime.utcnow()}}
        )
        return {"message": "Premise updated successfully", "premise": data.new_premise}
    except Exception as e:
        logger.error(f"Error updating premise: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.put("/edit-setting/{story_id}")
async def edit_setting(story_id: str, user_id: str, data: SettingUpdate):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"setting": data.new_setting, "updated_at": datetime.utcnow()}}
        )
        return {"message": "Setting updated successfully", "setting": data.new_setting}
    except Exception as e:
        logger.error(f"Error updating setting: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.put("/edit-character/{story_id}")
async def edit_character(story_id: str, user_id: str, data: CharacterUpdate):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        # Validate the updated character data using the Character model
        character = Character(**data.updated_character)
        
        # Update the specific character in the characters array
        await stories.update_one(
            {
                "story_id": ObjectId(story_id),
                "characters.name": data.character_name
            },
            {
                "$set": {
                    "characters.$": character.model_dump(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return {
            "message": "Character updated successfully",
            "character": character.model_dump()
        }
    except Exception as e:
        logger.error(f"Error updating character: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.put("/edit-outline-point/{story_id}")
async def edit_outline_point(story_id: str, user_id: str, data: OutlinePointUpdate):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        # Update the specific outline point
        await stories.update_one(
            {
                "story_id": ObjectId(story_id),
                "outline.number": data.point_number
            },
            {
                "$set": {
                    "outline.$": data.updated_point,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return {
            "message": "Outline point updated successfully",
            "outline_point": data.updated_point
        }
    except Exception as e:
        logger.error(f"Error updating outline point: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.post("/add-character/{story_id}")
async def add_character(story_id: str, user_id: str, data: NewCharacter):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        # Validate the new character data
        character = Character(**data.new_character)
        
        # Add the new character to the characters array
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {
                "$push": {"characters": character.model_dump()},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return {
            "message": "Character added successfully",
            "character": character.model_dump()
        }
    except Exception as e:
        logger.error(f"Error adding character: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.post("/add-outline-point/{story_id}")
async def add_outline_point(story_id: str, user_id: str, data: NewOutlinePoint):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        outline = story.get("outline", [])
        
        # If position is specified, insert at that position
        if data.position is not None and data.position <= len(outline):
            outline.insert(data.position, data.new_point)
            # Renumber the outline points
            for i, point in enumerate(outline, 1):
                point["number"] = str(i)
        else:
            # Add to the end
            data.new_point["number"] = str(len(outline) + 1)
            outline.append(data.new_point)

        # Update the entire outline
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {
                "$set": {
                    "outline": outline,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return {
            "message": "Outline point added successfully",
            "outline_point": data.new_point
        }
    except Exception as e:
        logger.error(f"Error adding outline point: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-character/{story_id}")
async def delete_character(story_id: str, user_id: str, data: CharacterDelete):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        # Remove the character from the characters array
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {
                "$pull": {"characters": {"name": data.character_name}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return {"message": f"Character {data.character_name} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting character: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-outline-point/{story_id}")
async def delete_outline_point(story_id: str, user_id: str, data: OutlinePointDelete):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        outline = story.get("outline", [])
        # Remove the point and renumber remaining points
        outline = [point for point in outline if point["number"] != data.point_number]
        for i, point in enumerate(outline, 1):
            point["number"] = str(i)

        # Update the entire outline
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {
                "$set": {
                    "outline": outline,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return {"message": f"Outline point {data.point_number} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting outline point: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.get("/title/{story_id}")
async def get_existing_title(story_id: str, user_id: str):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        title = story.get("title")
        if not title:
            return HTTPException(status_code=404, detail="Title not found")

        return {"title": title}
    except Exception as e:
        logger.error(f"Error retrieving title: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.get("/premise/{story_id}")
async def get_existing_premise(story_id: str, user_id: str):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        premise = story.get("premise")
        if not premise:
            return HTTPException(status_code=404, detail="Premise not found")

        return {"premise": premise}
    except Exception as e:
        logger.error(f"Error retrieving premise: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.get("/setting/{story_id}")
async def get_existing_setting(story_id: str, user_id: str):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        setting = story.get("setting")
        if not setting:
            return HTTPException(status_code=404, detail="Setting not found")

        return {"setting": setting}
    except Exception as e:
        logger.error(f"Error retrieving setting: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.get("/characters/{story_id}")
async def get_existing_characters(story_id: str, user_id: str):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        characters = story.get("characters", [])
        return {"characters": characters}
    except Exception as e:
        logger.error(f"Error retrieving characters: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.get("/character/{story_id}/{character_name}")
async def get_specific_character(story_id: str, user_id: str, character_name: str):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        characters = story.get("characters", [])
        character = next(
            (char for char in characters if char["name"] == character_name), None
        )
        
        if not character:
            return HTTPException(status_code=404, detail=f"Character {character_name} not found")

        return {"character": character}
    except Exception as e:
        logger.error(f"Error retrieving character: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.get("/outline/{story_id}")
async def get_existing_outline(story_id: str, user_id: str):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        outline = story.get("outline", [])
        return {"outline": outline}
    except Exception as e:
        logger.error(f"Error retrieving outline: {e}")
        return HTTPException(status_code=500, detail=str(e))

@router.get("/story-elements/{story_id}")
async def get_all_story_elements(story_id: str, user_id: str):
    """Get all story elements in a single request"""
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        return {
            "title": story.get("title"),
            "premise": story.get("premise"),
            "setting": story.get("setting"),
            "characters": story.get("characters", []),
            "outline": story.get("outline", [])
        }
    except Exception as e:
        logger.error(f"Error retrieving story elements: {e}")
        return HTTPException(status_code=500, detail=str(e))
