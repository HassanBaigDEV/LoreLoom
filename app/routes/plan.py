from re import M
from turtle import st
from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
from bson import ObjectId
from regex import P
from app.models.story import Story
from app.config.mongo import *
from datetime import datetime
import logging
from pydantic import BaseModel, Field, confloat

# Import the generator functions
from app.storywriter.plan.plot.premise import (
    generate_title,
    generate_premise,
    generate_title_with_context,
    generate_premise_with_context,
)
from app.storywriter.plan.plot.settings import (
    generate_setting,
    generate_setting_with_context,
)
from app.storywriter.plan.characters.main import (
    generate_characters,
    generate_character,
    regenerate_single_character,
)
from app.storywriter.plan.outline.main import (
    generate_full_outline,
    create_numbered_outline,
    regenerate_numbered_outline,
)
from app.storywriter.plan.characters.schema import Character

router = APIRouter()


# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# Add request models
class TitleUpdate(BaseModel):
    title: str


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


class GenerateCharactersRequest(BaseModel):
    num_characters: int


class OutlinePoint(BaseModel):
    number: int
    title: str
    description: str
    purpose: str
    setting: str
    characters_involved: List[str] = []
    estimated_duration: str = ""


class NewOutlinePoint(BaseModel):
    new_point: OutlinePoint
    position: Optional[int] = None


class CharacterDelete(BaseModel):
    character_name: str


class OutlinePointDelete(BaseModel):
    point_number: str


class OutlinePointRegenerate(BaseModel):
    point_number: str


class CharacterRegenerate(BaseModel):
    character_name: str


class OutlineRequest(BaseModel):
    max_depth: int = 2
    continue_from_previous: bool = False


class NewGenre(BaseModel):
    genre: str


class StoryCreationRequest(BaseModel):
    user_prompt: str = Field(..., min_length=10, max_length=1000)
    genre: str = Field(..., min_length=3, max_length=50)
    privacy: str = Field("private", pattern="^(private|public)$")
    tone: str
    story_complexity: float = 0.5
    keywords: list[str] = []


class StoryUpdate(BaseModel):
    title: Optional[str] = None
    genre: Optional[str] = None
    premise: Optional[str] = None
    setting: Optional[str] = None
    characters: Optional[List[Dict]] = None
    outline: Optional[List[Dict]] = None


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
            raise HTTPException(status_code=404, detail="Story not found")

        title = await generate_title(story_id)
        return title
    except ValueError as ve:
        logger.error(f"ValueError: {ve}")
        # raise HTTPException(status_code=400, detail="Invalid ID format")
        raise HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        logger.error(f"Exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))
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
        return HTTPException(status_code=500, detail="Unexpected error occoured")
    except Exception as e:
        # raise HTTPException(status_code=500, detail=str(e))
        logging.error(f"Exception: {e}")
        return HTTPException(status_code=500, detail="Unexpected error occoured")


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
                "$set": {"updated_at": datetime.now()},
            },
        )
        return {
            "message": "Character added successfully",
            "character": character.model_dump(),
        }
    except Exception as e:
        logger.error(f"Error adding character: {e}")
        return HTTPException(status_code=500, detail=str(e))


# @router.get("/generate-characters/{story_id}")
# async def generate_multiple_character(story_id: str, user_id: str ):
#     logging.info("Generating characters")
#     try:
#         story = await stories.find_one(
#             {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
#         )
#         if not story:
#             # raise HTTPException(status_code=404, detail="Story not found")
#             logging.error("Story not found")
#             return HTTPException(status_code=404, detail="Story not found")

#         if not story.get("premise") or not story.get("setting"):
#             # raise HTTPException(
#             #     status_code=400, detail="Premise and setting must be generated first"
#             # )
#             logging.error("Premise and setting must be generated first")
#             return HTTPException(
#                 status_code=400, detail="Premise and setting must be generated first"
#             )

#         # use generate_character

#         return characters
#     except ValueError:
#         # raise HTTPException(status_code=400, detail="Invalid ID format")
#         logging.error("Invalid ID format")
#         return HTTPException(status_code=400, detail="Invalid ID format")
#     except Exception as e:
#         # raise HTTPException(status_code=500, detail=str(e))
#         logging.error(f"Exception: {e}")
#         return HTTPException(status_code=500, detail=str(e))


@router.post("/generate-characters/{story_id}")
async def generate_multiple_characters(
    story_id: str, user_id: str, request: GenerateCharactersRequest
):
    try:
        characters = []
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        for _ in range(request.num_characters):
            character = await generate_character(story_id)
            characters.append(character)

        logger.debug(f"Generated {len(characters)} characters", characters)
        return {"characters": characters}
    except Exception as e:
        logging.error(f"Error generating characters: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate-character/{story_id}")
async def get_character(story_id: str, user_id: str):
    try:
        # Convert story_id and user_id to ObjectId
        story_id_obj = ObjectId(story_id)
        user_id_obj = ObjectId(user_id)

        # Check if story exists and belongs to user
        story = await stories.find_one(
            {"story_id": story_id_obj, "author": user_id_obj}
        )
        if not story:
            logging.error("Story not found")
            return HTTPException(status_code=404, detail="Story not found")

        character = await generate_character(story_id)
        return character
    except ValueError as ve:
        logging.error(f"ValueError: {ve}")
        return HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        logging.error(f"Exception: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.post("/generate-outline/{story_id}")
async def get_full_outline(
    story_id: str, user_id: str, outline_request: OutlineRequest = Body(...)
):
    logging.info(
        "Generating full outline",
        story_id,
        user_id,
        outline_request.max_depth,
        outline_request.continue_from_previous,
    )
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            logging.error("Story not found")
            return HTTPException(status_code=404, detail="Story not found")

        if not all(
            key in story for key in ["title", "premise", "setting", "characters"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Title, premise, setting, and characters must be generated first",
            )

        outline = await create_numbered_outline(
            story_id,
            num_events=outline_request.max_depth,
            continue_from_previous=outline_request.continue_from_previous,
        )
        return outline

    except ValueError:
        logging.error("Invalid ID format")
        return HTTPException(
            status_code=400, detail="Invalid ID format or story not found"
        )
    except Exception as e:
        logging.error(f"Exception: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.put("/update-title/{story_id}")
async def edit_title(story_id: str, user_id: str, data: TitleUpdate):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"title": data.title, "updated_at": datetime.now()}},
        )
        return {"message": "Title updated successfully", "title": data.title}
    except Exception as e:
        logger.error(f"Error updating title: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.put("/update-premise/{story_id}")
async def edit_premise(story_id: str, user_id: str, data: PremiseUpdate):
    try:
        logger.info(f"Updating premise for story {story_id} with new premise: {data.new_premise}")
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"premise": data.new_premise, "updated_at": datetime.now()}},
        )
        return {"message": "Premise updated successfully", "premise": data.new_premise}
    except Exception as e:
        logger.error(f"Error updating premise: {e}")
        return HTTPException(status_code=500, detail=str(e))



@router.put("/update-setting/{story_id}")
async def edit_setting(story_id: str, user_id: str, data: SettingUpdate):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"setting": data.new_setting, "updated_at": datetime.now()}},
        )
        return {"message": "Setting updated successfully", "setting": data.new_setting}
    except Exception as e:
        logger.error(f"Error updating setting: {e}")
        return HTTPException(status_code=500, detail=str("Unexpected error occoured"))


@router.put("/update-character/{story_id}")
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
            {"story_id": ObjectId(story_id), "characters.name": data.character_name},
            {
                "$set": {
                    "characters.$": character.model_dump(),
                    "updated_at": datetime.now(),
                }
            },
        )
        return {
            "message": "Character updated successfully",
            "character": character.model_dump(),
        }
    except Exception as e:
        logger.error(f"Error updating character: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.put("/update-outline-point/{story_id}")
async def edit_outline_point(story_id: str, user_id: str, data: OutlinePointUpdate):
    try:
        logger.info(f"Editing outline point: {data}")
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        # Update the specific outline point
        await stories.update_one(
            {"story_id": ObjectId(story_id), "outline.number": data.point_number},
            {
                "$set": {
                    "outline.$": data.updated_point,
                    "updated_at": datetime.now(),
                }
            },
        )
        return {
            "message": "Outline point updated successfully",
            "outline_point": data.updated_point,
        }
    except Exception as e:
        logger.error(f"Error updating outline point: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.post("/add-outline-point/{story_id}")
async def add_outline_point(story_id: str, user_id: str, data: NewOutlinePoint):
    try:
        # log all the data
        logging.info(f"story_id: {story_id}, user_id: {user_id}, data: {data}")
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        outline = story.get("outline", [])

        # Convert the new_point to dict and ensure number is string
        new_point_dict = data.new_point.model_dump()
        new_point_dict["number"] = str(new_point_dict["number"])

        # If position is specified, insert at that position
        if data.position is not None and data.position <= len(outline):
            outline.insert(data.position, new_point_dict)
            # Renumber the outline points
            for i, point in enumerate(outline, 1):
                point["number"] = str(i)
        else:
            # Add to the end
            new_point_dict["number"] = str(len(outline) + 1)
            outline.append(new_point_dict)

        # Update the entire outline
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"outline": outline, "updated_at": datetime.now()}},
        )
        return {
            "message": "Outline point added successfully",
            "outline_point": new_point_dict,
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
                "$set": {"updated_at": datetime.now()},
            },
        )
        return {"message": f"Character {data.character_name} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting character: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-outline/{story_id}")
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
            {"$set": {"outline": outline, "updated_at": datetime.now()}},
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
            return HTTPException(
                status_code=404, detail=f"Character {character_name} not found"
            )

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
            "genre": story.get("genre"),
            "title": story.get("title"),
            "premise": story.get("premise"),
            "setting": story.get("setting"),
            "characters": story.get("characters", []),
            "outline": story.get("outline", []),
        }
    except Exception as e:
        logger.error(f"Error retrieving story elements: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.post("/regenerate-outline-point/{story_id}")
async def regenerate_outline_point(
    story_id: str, user_id: str, data: OutlinePointRegenerate
):
    try:
        # log the request
        logging.info(
            f"Regenerating outline point: story_id={story_id}, point_number={data.point_number}"
        )

        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        # Get the current outline
        outline = story.get("outline", [])

        # Find the index of the point to regenerate
        point_index = None
        for i, point in enumerate(outline):
            if point["number"] == data.point_number:
                point_index = i + 1
                break

        if point_index is None:
            return HTTPException(
                status_code=404, detail=f"Outline point {data.point_number} not found"
            )

        # Generate new point using the outline generation function
        # new_point = await create_numbered_outline(
        #     story_id,
        #     num_events=1,
        #     continue_from_previous=True,  # This will help maintain narrative flow
        # )
        new_point = await regenerate_numbered_outline(story_id, point_index)

        if not new_point:
            return HTTPException(
                status_code=500, detail="Failed to generate new outline point"
            )

        # Maintain the original point number and position
        # new_point[0]["number"] = data.point_number

        # Update the outline with the new point
        # outline[point_index] = new_point[0]

        # # Update the story with the modified outline
        # await stories.update_one(
        #     {"story_id": ObjectId(story_id)},
        #     {
        #         "$set": {
        #             "outline": outline,
        #             "updated_at": datetime.now(),
        #         }
        #     },
        # )

        return {
            "message": "Outline point regenerated successfully",
            "outline_point": new_point,
        }
    except Exception as e:
        logger.error(f"Error regenerating outline point: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.post("/regenerate-character/{story_id}")
async def regenerate_character(story_id: str, user_id: str, data: CharacterRegenerate):
    try:
        # log the request
        logging.info(
            f"Regenerating character: story_id={story_id}, character_name={data.character_name}"
        )

        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        # Get the current characters
        characters = story.get("characters", [])

        # Find the index of the character to regenerate
        char_index = next(
            (
                i
                for i, char in enumerate(characters)
                if char["name"].lower() == data.character_name.lower()
            ),
            None,
        )

        if char_index is None:
            return HTTPException(
                status_code=404, detail=f"Character {data.character_name} not found"
            )

        try:
            # Generate new character using the single character regeneration function
            new_character = await regenerate_single_character(
                story_id, data.character_name
            )

            # Update the characters list with the new character
            characters[char_index] = new_character

            # Update the story with the modified characters list
            await stories.update_one(
                {"story_id": ObjectId(story_id)},
                {
                    "$set": {
                        "characters": characters,
                        "updated_at": datetime.now(),
                    }
                },
            )

            return {
                "message": "Character regenerated successfully",
                "characters": characters,
            }
        except ValueError as ve:
            return HTTPException(status_code=500, detail=str(ve))

    except Exception as e:
        logger.error(f"Error regenerating character: {e}")
        return HTTPException(status_code=500, detail=str(e))


@router.post("/add-genre/{story_id}")
async def add_genre(story_id: str, user_id: str, data: NewGenre):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")
        # set the genre field of the story and update the story
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"genre": data.genre, "updated_at": datetime.now()}},
        )
        return {"message": "Genre added successfully", "genre": data.genre}
    except Exception as e:
        logger.error(f"Error adding genre: {e}")
        return HTTPException(
            status_code=500, detail=str("An unexpected error occurred")
        )


@router.put("/update-genre/{story_id}")
async def update_genre(story_id: str, user_id: str, data: NewGenre):
    try:
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")
        # set the genre field of the story and update the story
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"genre": data.genre, "updated_at": datetime.now()}},
        )
        return {"message": "Genre updated successfully", "genre": data.genre}
    except Exception as e:
        logger.error(f"Error updating genre: {e}")
        return HTTPException(
            status_code=500, detail=str("An unexpected error occurred")
        )


@router.post("/create-story/{user_id}")
async def create_story(user_id: str, request: StoryCreationRequest):
    """Create a new story with AI-generated elements"""
    try:
        # Validate user exists
        if not await users.find_one({"_id": user_id}):
            raise HTTPException(status_code=404, detail="User not found")

        # Generate story elements
        story_data = {
            "author": ObjectId(user_id),
            "created_at": datetime.now(),
            "privacy": request.privacy,
            "genre": request.genre,
            "tone": request.tone,
            "complexity": request.story_complexity,
            "keywords": request.keywords,
        }

        # Generate title with genre and keywords context
        title = await generate_title_with_context(
            request.genre, request.keywords, request.tone, request.story_complexity
        )
        story_data["title"] = title

        # Generate premise with complexity weighting
        premise = await generate_premise_with_context(
            title, request.user_prompt, request.genre, request.story_complexity
        )
        story_data["premise"] = premise

        # Generate setting with tone consideration
        setting = await generate_setting_with_context(
            title, premise, request.genre, request.tone, request.keywords
        )
        story_data["setting"] = setting
        story_id = ObjectId()

        story = Story(
            story_id=story_id,
            author=ObjectId(user_id),
            title=title,
            premise=premise,
            setting=setting,
            genre=request.genre,
            privacy=request.privacy,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        # Insert into database
        await stories.insert_one(story.model_dump(by_alias=True))

        return {
            "story_id": str(story.story_id),
            "title": title,
            "premise": premise,
            "setting": setting,
        }

    except Exception as e:
        logger.error(f"Story creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update-story/{story_id}")
async def update_story(story_id: str, user_id: str, story_data: StoryUpdate):
    try:
        # Validate story exists and belongs to user
        story = await stories.find_one(
            {"story_id": ObjectId(story_id), "author": ObjectId(user_id)}
        )
        if not story:
            return HTTPException(status_code=404, detail="Story not found")

        # Prepare update data
        update_data = {"updated_at": datetime.now()}
        
        # Add only the fields that are provided in the request
        if story_data.title is not None:
            update_data["title"] = story_data.title
        if story_data.genre is not None:
            update_data["genre"] = story_data.genre
        if story_data.premise is not None:
            update_data["premise"] = story_data.premise
        if story_data.setting is not None:
            update_data["setting"] = story_data.setting
        if story_data.characters is not None:
            update_data["characters"] = story_data.characters
        if story_data.outline is not None:
            update_data["outline"] = story_data.outline

        # Update the story
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": update_data}
        )

        return {
            "message": "Story updated successfully",
            "story_data": story_data.model_dump(exclude_none=True)
        }
    except Exception as e:
        logger.error(f"Error updating story: {e}")
        return HTTPException(status_code=500, detail=str(e))
