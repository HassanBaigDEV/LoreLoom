import json
import logging
import re
from collections import deque
from typing import List, Dict
from datetime import datetime
from bson import ObjectId

from ..llm import model
from .schema import *
from app.config.mongo import stories


from typing import List, Optional
from pydantic import BaseModel, Field


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
    ```json
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
        details = json.loads(response_text)

        node.scene = SceneDetail(**details["scene"])
        node.event = EventDetail(**details["event"])
        node.entities = [EntityInvolvement(**entity) for entity in details["entities"]]
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


async def create_numbered_outline(
    story_id: str, num_events: int, continue_from_previous: bool = False
) -> List[Dict]:
    """Create a numbered outline for a specified number of events."""
    try:
        # Fetch the existing story document
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError("Story not found")

        # Initialize the outline
        outline: List[Dict] = []
        start_index = 1

        if continue_from_previous and "outline" in story:
            existing_outline = story.get("outline", [])
            if isinstance(existing_outline, list):
                outline = existing_outline
                start_index = len(outline) + 1
        # Generate new events
        for i in range(start_index, start_index + num_events):
            event_prompt = f"""
            <|im_start|>system
            You are an AI assistant helping a writer create a story outline. The writer has requested your help to generate a numbered outline for their story. Your task is to generate a specific event for the story based on the given premise, setting, and characters. Each event should be unique, engaging, and contribute to the overall narrative. You only write json data based on the given schema.
            The output should be structured in a strict JSON format.
            <|im_end|>
            <|im_start|>user
            Generate event {i} for the story based on:
            Title: {story.get('title', '')}
            Premise: {story.get('premise', '')}
            Setting: {story.get('setting', '')}
            Characters: {json.dumps(story.get('characters', []), indent=2)}

            Previous events:
            {json.dumps(outline, indent=2) if outline else "None yet."}

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
    
    
            ```

            Here's the JSON schema you must adhere to:\n<schema>\n{NUMBERED_OUTLINE_SCHEMA}\n</schema>.
            Generate the next outline event for the story.
            <|im_end|>
            <|im_start|>assistant
            """

            try:
                response = model(event_prompt, max_tokens=1024)
                response_text = response["choices"][0]["text"]  # type:ignore
                print(f"Generated event {i}: {response_text}")
                
                try:
                    event_data = json.loads(response_text)
                    outline.append(event_data)
                except json.JSONDecodeError as e:
                    logging.error(f"Failed to parse event JSON: {e}")
                    raise ValueError(f"Invalid event data format: {response_text}")

            except Exception as e:
                logging.error(f"Error generating event {i}: {e}")
                raise ValueError("Event generation failed")
                # Add a simple placeholder if generation fails
                # outline.append(f"{i}. [Event generation failed]")

        # Save the updated outline
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"outline": outline, "updated_at": datetime.utcnow()}},
        )

        return outline
    except Exception as e:
        logging.error(f"Error creating numbered outline: {e}")
        raise


async def generate_full_outline(
    story_id: str,
    max_depth: int = 2,
) -> OutlineNode:
    """Generate a complete story outline."""
    story = await stories.find_one({"story_id": ObjectId(story_id)})
    if not story:
        raise ValueError("Story not found")

    plan = {
        "premise": story.get("premise", ""),
        "setting": story.get("setting", ""),
        "characters": story.get("characters", []),
    }

    root_node = await generate_initial_outline(plan)
    expanded_nodes = set()
    nodes_to_expand = deque([(node, 1) for node in root_node.children])

    MAX_NODES = 4  # Add a reasonable limit
    node_count = 0

    while nodes_to_expand and node_count < MAX_NODES:
        current_node, depth = nodes_to_expand.popleft()
        node_count += 1

        if depth >= max_depth or current_node in expanded_nodes:
            continue

        await generate_node_details(current_node, plan)
        expanded_nodes.add(current_node)

        subevents = await generate_subevents(current_node, plan)
        if not subevents:  # Add explicit check for empty subevents
            continue

        for event in subevents:
            child_node = OutlineNode(
                text=event,
                depth=depth + 1,
                event_type="scene" if depth + 1 == max_depth else "chapter",
                scene=None,
                event=None,
                estimated_duration=None,
            )
            current_node.children.append(child_node)
            nodes_to_expand.append((child_node, depth + 1))

    try:
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {
                "$set": {
                    "outline": root_node.model_dump(),
                    "updated_at": datetime.utcnow(),
                }
            },
        )
    except Exception as e:
        logging.error(f"Error saving outline to database: {e}")
        raise

    return root_node
