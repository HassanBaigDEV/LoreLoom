import json
import logging
import re
from collections import deque
from typing import List, Dict
from datetime import datetime
from venv import logger
from bson import ObjectId

from ...llm.llama import model
from .schema import *
from app.config.mongo import stories

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ValidationError
from ....utils.text_validation import extract_and_parse_json

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Define the schema templates for prompts
OUTLINE_NODE_EXAMPLE = """
{
    "scene": {
        "location": "Physical location of the scene",
        "time_period": "Time of day or specific period",
        "atmosphere": "Mood and environmental details",
        "description": "Detailed description of the scene setting"
    },
    "event": {
        "action": "Main action or event that occurs",
        "purpose": "Story purpose or goal of this event",
        "consequences": ["List of results or effects"],
        "conflicts": ["List of challenges or obstacles"]
    },
    "entities": [
        {
            "name": "Character name",
            "role": "Role in this scene",
            "goal": "Character's objective",
            "emotional_state": "Character's emotional state"
        }
    ]
}
"""

STORY_STRUCTURE_EXAMPLE = """
{
    "acts": [
        {
            "title": "Name of the act",
            "summary": "Brief description of what happens",
            "purpose": "Story purpose of this act",
            "key_events": ["List of main events in this act"]
        }
    ]
}
"""

SCENE_EXAMPLE = """
{
    "scenes": [
        {
            "summary": "Description of what happens in the scene",
            "purpose": "Story purpose of this scene"
        }
    ]
}
"""


# Schema templates
NUMBERED_OUTLINE_EXAMPLE = """
[
      {{
            "number": "Event number (e.g., 1, 2, 3)",
            "title": "Brief event title",
            "description": "Detailed event description",
            "purpose": "Story purpose of this event",
            "characters_involved": ["List of characters involved"],
            "setting": "Location and time period",
            "estimated_duration": "Approximate scene length"
        }}
    
]
"""
OUTLINE_NODE_SCHEMA = json.dumps(OUTLINE_NODE.model_json_schema())
STORY_STRUCTURE_SCHEMA = json.dumps(STORY_STRUCTURE.model_json_schema())
SCENE_SCHEMA = json.dumps(SCENE.model_json_schema())


async def generate_node_details(node: OutlineNode, plan: dict) -> None:
    """Generate detailed scene, event, and entity information for a node."""
    prompt = f"""
    <|im_start|>system
    Generate detailed information for the following story event:
    "{node.text}"
    Example of a correctly formatted response:
    {OUTLINE_NODE_EXAMPLE}

    Based on:
    Premise: {plan['premise']}
    Setting: {plan['setting']}
    Characters: {json.dumps(plan['characters'], indent=2)}

    Provide a JSON response following this schema:
     Here's the JSON schema you must adhere to:\n<schema>\n{OUTLINE_NODE_SCHEMA}\n</schema>.
    <|im_end|>
    <|im_start|>assistant
    """

    try:
        response = model(prompt, max_tokens=512)
        response_text = response["choices"][0]["text"].strip()  # type: ignore
        details = extract_and_parse_json(response_text)

        if details:
            node.event = EventDetail(**details["event"])
            node.entities = [
                EntityInvolvement(**entity) for entity in details["entities"]
            ]
        else:
            logging.error("Details are None, cannot assign event and entities.")
            raise ValueError("Details are None, cannot assign event and entities.")
    except Exception as e:
        logging.error(f"Error generating node details: {e}")


async def generate_initial_outline(plan: dict) -> OutlineNode:
    """Generate the initial high-level plot structure."""
    outline_prompt = f"""
    <|im_start|>system
    Create a 5-act story structure based on:
    Premise: {plan['premise']}
    Setting: {plan['setting']}
    Characters: {json.dumps(plan['characters'], indent=2)}
    Example of a correctly formatted response:
    ```json
    {STORY_STRUCTURE_EXAMPLE}

    Here's the JSON schema you must adhere to:\n<schema>\n{STORY_STRUCTURE_SCHEMA}\n</schema>.<|im_end|>

    <|im_start|>assistant
    """

    try:
        response = model(outline_prompt, max_tokens=1024)
        response_text = response["choices"][0]["text"].strip()  # type: ignore
        structure = json.loads(response_text)

        root = OutlineNode(
            text="Story Root",
            event_type="root",
            scene=None,
            event=None,
            estimated_duration=None,
        )

        for act in structure["acts"]:
            act_node = OutlineNode(
                text=act["summary"],
                event_type="chapter",
                depth=1,
                event=EventDetail(
                    action=act["title"],
                    purpose=act["purpose"],
                    consequences=[],
                    conflicts=[],
                ),
                scene=None,
                estimated_duration=None,
            )
            root.children.append(act_node)

        return root
    except Exception as e:
        logging.error(f"Error generating initial outline: {e}")
        raise


async def generate_subevents(node: OutlineNode, plan: dict) -> List[str]:
    """Generate sub-events for a given plot point."""
    prompt = f"""
    <|im_start|>system
    Generate 3-4 specific scenes that occur during:
    "{node.text}"

    Example of a correctly formatted response:
    ```json
    {SCENE_EXAMPLE}

    Consider:
    - Scene setting: {node.scene.dict() if node.scene else 'Not set'}
    - Event details: {node.event.dict() if node.event else 'Not set'}
    - Characters involved: {[e.dict() for e in node.entities]}

    Here's the JSON schema you must adhere to:\n<schema>\n{SCENE_SCHEMA}\n</schema>.
    <|im_end|>
    <|im_start|>assistant
    """

    try:
        response = model(prompt, max_tokens=512)
        response_text = response["choices"][0]["text"].strip()  # type: ignore
        scenes = json.loads(response_text)
        return [scene["summary"] for scene in scenes["scenes"]]
    except Exception as e:
        logging.error(f"Error generating subevents: {e}")
        return []


class NumberedEvent(BaseModel):
    number: str = Field(..., description="Event number (e.g., 1, 2, 3)")
    title: Optional[str] = Field(None, description="Brief event title")
    description: Optional[str] = Field(None, description="Detailed event description")
    purpose: Optional[str] = Field(None, description="Story purpose of this event")
    characters_involved: List[str] = Field(
        default_factory=list, description="List of characters involved"
    )
    setting: Optional[str] = Field(None, description="Location and time period")
    estimated_duration: Optional[str] = Field(
        None, description="Approximate scene length"
    )

    class Config:
        json_schema_extra = {"additionalProperties": False}


class NUMBERED_OUTLINE(BaseModel):
    events: List[NumberedEvent]


NUMBERED_OUTLINE_SCHEMA = json.dumps(NumberedEvent.model_json_schema())


async def regenerate_numbered_outline(
    story_id: str,
    point_index: int,
) -> List[Dict]:
    """Regenerate a specific numbered outline pobject and only replave the matching point["number"] object with newly generated one."the prompt will include past events as well as any events preceding the point_index(id any)"""
    try:
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError("Story not found")

        existing_outline = story.get("outline", [])
        if not isinstance(existing_outline, list):
            existing_outline = []

        new_events = []
        # as only one point so no need for the loop
        event_prompt = f"""
            <|im_start|>system
            You are an AI assistant helping a writer create a story outline. The writer has requested your help to generate a specific event for the story based on the given premise, setting, and characters. Each event should be unique, engaging, and contribute to the overall narrative. You only write json data based on the given schema.
            The output should be structured in a strict JSON format.
            <|im_end|>
            <|im_start|>user
            Generate event {point_index} for the story based on:
            Title: {story.get('title', '')}
            Premise: {story.get('premise', '')}
            Setting: {story.get('setting', '')}
            Characters: {json.dumps(story.get('characters', []), indent=2)}

            Previous events:
            {json.dumps(existing_outline, indent=2) if existing_outline else "None yet."}

            Example of a correctly formatted response:
             {{
        "number": "1",
        "title": "The Midnight Encounter",
        "description": "Ayla discovers an ancient artifact in the ruins of Shadowspire while Alaric, independently investigating the same location, confronts her. Their rivalry resurfaces as they realize they're both seeking the same mysterious relic. The tension escalates when the artifact begins to glow, forcing them to make a choice between competition and cooperation.",
        "purpose": "Establish the main characters' dynamic and introduce the central mystery",
        "characters_involved": ["Ayla Windsong", "Alaric Frost"],
        "setting": "Shadowspire Ruins, midnight during a new moon",
        "estimated_duration": "30 minutes"
    }}
            Generate the next outline event for the story.
            ###Instructions:
            response should only include json object that can directly be parsed.
            ###Schema:
            \n<schema>\n{NUMBERED_OUTLINE_SCHEMA}\n</schema>.
            <|im_end|>
            <|im_start|>assistant
            """

        try:
            response = await model._json(
                event_prompt,
                max_tokens=1024,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "NumberedOutline",
                        "strict": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "events": {
                                    "type": "array",
                                    "description": "List of events forming the numbered outline.",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "number": {
                                                "type": "string",
                                            },
                                            "title": {
                                                "type": "string",
                                                "description": "Brief event title.",
                                                "nullable": False,
                                            },
                                            "description": {
                                                "type": "string",
                                                "description": "Detailed event description.",
                                                "nullable": False,
                                            },
                                            "purpose": {
                                                "type": "string",
                                                "description": "Story purpose of this event.",
                                                "nullable": False,
                                            },
                                            "characters_involved": {
                                                "type": "array",
                                                "description": "List of characters/entity/locations involved in the event.",
                                                "items": {"type": "string"},
                                            },
                                            "setting": {
                                                "type": "string",
                                                "description": "Location and time period of the event.",
                                                "nullable": False,
                                            },
                                            "estimated_duration": {
                                                "type": "string",
                                                "description": "Approximate scene length.",
                                                "nullable": False,
                                            },
                                        },
                                        "required": [
                                            "number",
                                            "characters_involved",
                                            "description",
                                            "estimated_duration",
                                            "purpose",
                                            "setting",
                                            "title",
                                        ],
                                        "additionalProperties": False,
                                    },
                                }
                            },
                            "required": ["events"],
                            "additionalProperties": False,
                        },
                    },
                },
            )
            response_text = response["choices"][0]["text"]  # type:ignore
            print(f"Generated event {point_index}: {response_text}")

            try:
                event_data = extract_and_parse_json(response_text)
                # Maintain the original point number and position

                if event_data is not None:
                    event_data["number"] = str(point_index)
                    if event_data.get("number") != str(point_index):
                        logging.warning(
                            f"Event number mismatch. Expected {point_index}, got {event_data.get('number')}"
                        )

                        # event_data["number"] = str(point_index)

                    # replace the existing event with the new one in the mongo db
                    # to keep the order of the events same as the one in the original outline we create a copy of all the existing outline and replace the event with the same number as the one in the new event and then update the outline in the db with the new list
                    new_outline = existing_outline.copy()

                    for i, event in enumerate(new_outline):
                        if event["number"] == str(point_index):
                            new_outline[i] = event_data
                            break

                    await stories.update_one(
                        {"story_id": ObjectId(story_id)},
                        {
                            "$set": {
                                "outline": new_outline,
                                "updated_at": datetime.utcnow(),
                            },
                        },
                    )

            except json.JSONDecodeError as e:
                logging.error(f"Failed to parse event JSON: {e}")
                raise ValueError(f"Invalid event data format: {response_text}")

        except Exception as e:
            logging.error(f"Skipping invalid event {point_index}: {e}")
            raise

        return new_outline
    except Exception as e:
        logging.error(f"Error creating numbered outline: {e}")
        raise


async def create_numbered_outline(
    story_id: str,
    num_events: int,
    continue_from_previous: bool = False,
) -> List[Dict]:
    """Create a numbered outline for a specified number of events."""
    try:
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError("Story not found")

        existing_outline = []
        if continue_from_previous:
            existing_outline = story.get("outline", [])
            if not isinstance(existing_outline, list):
                existing_outline = []

        new_events = []
        start_index = len(existing_outline) + 1
        end_index = start_index + num_events - 1
        logger.info(f"Creating numbered outline from {start_index} to {end_index}")

        for i in range(start_index, end_index + 1):
            event_prompt = f"""
            <|im_start|>system
            You are a powerful AI that can generate creative and unique story events.
            You only write json data based on the given schema.
            You only output valid structered json data.
            You don't need to include the title, premise, setting, or characters in your response.
            You are an AI assistant helping a writer create a story outline. The writer has requested your help to generate a numbered outline for their story. Your task is to generate a specific event for the story based on the given premise, setting, and characters. Each event should be unique, engaging, and contribute to the overall narrative. You only write json data based on the given schema.
            The output should be structured in a strict JSON format. Only include the json object that can directly be parsed, and nothing else.
            <|im_end|>
            <|im_start|>user
            Generate event {i} for the story based on:
            Title: {story.get('title', '')}
            Premise: {story.get('premise', '')}
            Setting: {story.get('setting', '')}
            Characters: {json.dumps(story.get('characters', []), indent=2)}

            Previous events:
            {json.dumps(existing_outline, indent=2) if existing_outline else "None yet."}

            Example of a correctly formatted response:
            
           
    {{
        "number": "1",
        "title": "The Midnight Encounter",
        "description": "Ayla discovers an ancient artifact in the ruins of Shadowspire while Alaric, independently investigating the same location, confronts her. Their rivalry resurfaces as they realize they're both seeking the same mysterious relic. The tension escalates when the artifact begins to glow, forcing them to make a choice between competition and cooperation.",
        "purpose": "Establish the main characters' dynamic and introduce the central mystery",
        "characters_involved": ["Ayla Windsong", "Alaric Frost"],
        "setting": "Shadowspire Ruins, midnight during a new moon",
        "estimated_duration": "30 minutes"
    }}
    
    

            Generate the next outline event for the story.
            ###Instructions:
            response should only include json object that can directly be parsed.
            ###Schema:
            \n<schema>\n{NUMBERED_OUTLINE_SCHEMA}\n</schema>.
            <|im_end|>
            <|im_start|>user
            Generate event {i+1} for the story based on:
            ###Title: {story.get('title', '')}
            ###Premise: {story.get('premise', '')}
            ###Setting: {story.get('setting', '')}
            ###Characters: {json.dumps(story.get('characters', []), indent=2)}
            Only include the json object that can directly be parsed, and nothing else.
            <|im_start|>assistant
            """

            try:
                response = await model._json(
                    event_prompt,
                    max_tokens=1024,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": "NumberedOutline",
                            "strict": True,
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "events": {
                                        "type": "array",
                                        "description": "List of events forming the numbered outline.",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "number": {
                                                    "type": "string",
                                                    "description": "Event number.",
                                                },
                                                "title": {
                                                    "type": "string",
                                                    "description": "Brief event title.",
                                                    "nullable": False,
                                                },
                                                "description": {
                                                    "type": "string",
                                                    "description": "Detailed event description.",
                                                    "nullable": False,
                                                },
                                                "purpose": {
                                                    "type": "string",
                                                    "description": "Story purpose of this event.",
                                                    "nullable": False,
                                                },
                                                "characters_involved": {
                                                    "type": "array",
                                                    "description": "List of characters/entity/locations involved in the event.",
                                                    "items": {"type": "string"},
                                                },
                                                "setting": {
                                                    "type": "string",
                                                    "description": "Location and time period of the event.",
                                                    "nullable": False,
                                                },
                                                "estimated_duration": {
                                                    "type": "string",
                                                    "description": "Approximate scene length.",
                                                    "nullable": False,
                                                },
                                            },
                                            "required": [
                                                "number",
                                                "characters_involved",
                                                "description",
                                                "estimated_duration",
                                                "purpose",
                                                "setting",
                                                "title",
                                            ],
                                            "additionalProperties": False,
                                        },
                                    }
                                },
                                "required": ["events"],
                                "additionalProperties": False,
                            },
                        },
                    },
                    temperature=0.5,
                )
                response_text = response["choices"][0]["text"]  # type:ignore
                print(f"Generated event {i}: {response_text}")

                try:
                    event_data = extract_and_parse_json(response_text)
                    if event_data is not None:
                        if event_data.get("number") != str(i):
                            logging.warning(
                                f"Event number mismatch. Expected {i}, got {event_data.get('number')}"
                            )
                            event_data["number"] = str(i)

                        new_events.append(event_data)
                except json.JSONDecodeError as e:
                    logging.error(f"Failed to parse event JSON: {e}")
                    raise ValueError(f"Invalid event data format: {response_text}")

            except Exception as e:
                logging.error(f"Skipping invalid event {i}: {e}")
                continue

        if new_events:
            # await stories.update_one(
            #     {"story_id": ObjectId(story_id)},
            #     {
            #         "$push": {"outline": {"$each": new_events}},
            #         "$set": {"updated_at": datetime.now()},
            #     },
            # )
            # fetych the existing outline if its none then fetch and empty array
            existing_outline = story.get("outline") or []
            # append the new events to the existing outline
            new_outline = existing_outline + new_events
            # update the outline in the database
            await stories.update_one(
                {"story_id": ObjectId(story_id)},
                {
                    "$set": {"outline": new_outline, "updated_at": datetime.now()},
                },
            )

        return existing_outline + new_events
    except Exception as e:
        logging.error(f"Error creating numbered outline: {e}")
        raise


# async def generate_full_outline(
#     story_id: str,
#     max_depth: int = 2,
# ) -> OutlineNode:
#     """Generate a complete story outline."""
#     story = await stories.find_one({"story_id": ObjectId(story_id)})
#     if not story:
#         raise ValueError("Story not found")

#     plan = {
#         "premise": story.get("premise", ""),
#         "setting": story.get("setting", ""),
#         "characters": story.get("characters", []),
#     }

#     root_node = await generate_initial_outline(plan)
#     expanded_nodes = set()
#     nodes_to_expand = deque([(node, 1) for node in root_node.children])

#     MAX_NODES = 4  # Add a reasonable limit
#     node_count = 0

#     while nodes_to_expand and node_count < MAX_NODES:
#         current_node, depth = nodes_to_expand.popleft()
#         node_count += 1

#         if depth >= max_depth or current_node in expanded_nodes:
#             continue

#         await generate_node_details(current_node, plan)
#         expanded_nodes.add(current_node)

#         subevents = await generate_subevents(current_node, plan)
#         if not subevents:  # Add explicit check for empty subevents
#             continue

#         for event in subevents:
#             child_node = OutlineNode(
#                 text=event,
#                 depth=depth + 1,
#                 event_type="scene" if depth + 1 == max_depth else "chapter",
#                 scene=None,
#                 event=None,
#                 estimated_duration=None,
#             )
#             current_node.children.append(child_node)
#             nodes_to_expand.append((child_node, depth + 1))

#     try:
#         await stories.update_one(
#             {"story_id": ObjectId(story_id)},
#             {
#                 "$set": {
#                     "outline": root_node.model_dump(),
#                     "updated_at": datetime.utcnow(),
#                 }
#             },
#         )
#     except Exception as e:
#         logging.error(f"Error saving outline to database: {e}")
#         raise

#     return root_node

# async def generate_full_outline(
#     story_id: str,
#     max_depth: int = 2,
# ) -> OutlineNode:
#     """Generate a complete story outline with proper schema."""
#     story = await stories.find_one({"story_id": ObjectId(story_id)})
#     if not story:
#         raise ValueError("Story not found")

#     plan = {
#         "premise": story.get("premise", ""),
#         "setting": story.get("setting", ""),
#         "characters": story.get("characters", []),
#     }

#     root_node = await generate_initial_outline(plan)
#     expanded_nodes = set()
#     nodes_to_expand = deque([(node, 1) for node in root_node.children])

#     MAX_NODES = 4  # Limit the expansion to prevent excessive depth
#     node_count = 0

#     while nodes_to_expand and node_count < MAX_NODES:
#         current_node, depth = nodes_to_expand.popleft()
#         node_count += 1

#         if depth >= max_depth or current_node in expanded_nodes:
#             continue

#         await generate_node_details(current_node, plan)
#         expanded_nodes.add(current_node)

#         subevents = await generate_subevents(current_node, plan)
#         if not subevents:
#             continue

#         for idx, event in enumerate(subevents, start=1):
#             child_node = OutlineNode(
#                 number=str(idx),
#                 title=event.get("title", "Untitled Event"),
#                 description=event.get("description", "No description available"),
#                 purpose=event.get("purpose", ""),
#                 characters_involved=event.get("characters_involved", []),
#                 setting=event.get("setting", plan.get("setting", "")),
#                 estimated_duration=event.get("estimated_duration", "Unknown"),
#                 depth=depth + 1,
#                 event_type="scene" if depth + 1 == max_depth else "chapter",
#                 scene=None,
#                 event=None,
#             )
#             current_node.children.append(child_node)
#             nodes_to_expand.append((child_node, depth + 1))

#     try:
#         await stories.update_one(
#             {"story_id": ObjectId(story_id)},
#             {
#                 "$set": {
#                     "outline": root_node.model_dump(),
#                     "updated_at": datetime.utcnow(),
#                 }
#             },
#         )
#     except Exception as e:
#         logging.error(f"Error saving outline to database: {e}")
#         raise

#     return root_node


# Define strict schema for an Outline Node
class OutlineNodeSchema(BaseModel):
    number: str
    title: str
    description: str
    purpose: str
    characters_involved: List[str]
    setting: str
    estimated_duration: str
    depth: int
    event_type: str
    children: List["OutlineNodeSchema"] = []


async def generate_full_outline(story_id: str, max_depth: int = 2) -> OutlineNode:
    """Generate a complete story outline with schema validation and error handling."""

    try:
        # Fetch story data
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError(f"Story with ID {story_id} not found.")

        plan = {
            "premise": story.get("premise", ""),
            "setting": story.get("setting", ""),
            "characters": story.get("characters", []),
        }

        # Generate the root node
        root_node = await generate_initial_outline(plan)
        expanded_nodes = set()
        nodes_to_expand = deque([(node, 1) for node in root_node.children])

        MAX_NODES = 4  # Prevent excessive expansion
        node_count = 0

        while nodes_to_expand and node_count < MAX_NODES:
            current_node, depth = nodes_to_expand.popleft()
            node_count += 1

            if depth >= max_depth or current_node in expanded_nodes:
                continue

            try:
                await generate_node_details(current_node, plan)
                expanded_nodes.add(current_node)

                subevents = await generate_subevents(current_node, plan)
                if not subevents:
                    continue

                for idx, event in enumerate(subevents, start=1):
                    try:
                        if isinstance(event, dict):
                            child_node = OutlineNodeSchema(
                                number=str(idx),
                                title=event.get("title", "Untitled Event"),
                                description=event.get(
                                    "description", "No description available"
                                ),
                                purpose=event.get("purpose", ""),
                                characters_involved=event.get(
                                    "characters_involved", []
                                ),
                                setting=event.get("setting", plan.get("setting", "")),
                                estimated_duration=event.get(
                                    "estimated_duration", "Unknown"
                                ),
                                depth=depth + 1,
                                event_type=(
                                    "scene" if depth + 1 == max_depth else "chapter"
                                ),
                                children=[],
                            )
                        current_node.children.append(child_node)  # type: ignore
                        nodes_to_expand.append((child_node, depth + 1))  # type: ignore
                    except ValidationError as e:
                        logging.error(f"Invalid event structure: {e}")
                        continue

            except Exception as e:
                logging.error(f"Error processing node at depth {depth}: {e}")
                continue

        # Convert to JSON before saving
        try:
            serialized_outline = root_node.model_dump()
            json.dumps(serialized_outline)  # Ensures it's valid JSON

            # Update the outline in MongoDB
            await stories.update_one(
                {"story_id": ObjectId(story_id)},
                {
                    "$set": {
                        "outline": serialized_outline,
                        "updated_at": datetime.utcnow(),
                    }
                },
            )
            logging.info(f"Successfully updated outline for story {story_id}")

        except Exception as e:
            logging.error(f"Error saving outline to database: {e}")
            raise

        return root_node

    except Exception as e:
        logging.error(f"Failed to generate outline: {e}")
        raise
