import json
import logging
import re
from collections import deque
from typing import List, Dict
import uuid
from datetime import datetime
from bson import ObjectId

from ..plot.premise import generate_premise, generate_title
from ..plot.settings import generate_setting
from ..outline.schema import OutlineNode
from ..llm import model
from app.config.mongo import stories


def generate_node_details(node: OutlineNode, plan: dict) -> None:
    """Generate additional details for a node including scene, entities, goals, and conflicts."""
    prompt = f"""
    <|im_start|>system
    You are tasked with generating detailed scene information for a story event. 
    Based on the premise: {plan['premise']}, setting: {plan['setting']}, and the current event: "{node.text}",
    provide the following details in JSON format:
    {{
        "scene": "brief description of the location/setting",
        "entities": ["list", "of", "involved", "characters"],
        "goals": ["main", "character", "objectives"],
        "conflicts": ["obstacles", "or", "challenges"]
    }}
    Keep each field concise but specific.
    <|im_end|>
    <|im_start|>assistant
    """

    try:
        response = model(prompt, max_tokens=256)
        details = json.loads(response["choices"][0]["text"].strip())  # type: ignore

        node.scene = details["scene"]
        node.entities = details["entities"]
        node.goals = details["goals"]
        node.conflicts = details["conflicts"]
    except Exception as e:
        logging.error(f"Error generating node details: {e}")


def generate_initial_outline(plan: dict) -> OutlineNode:
    """Generate the initial high-level plot structure."""
    outline_prompt = f"""
    <|im_start|>system
    You are tasked with generating the main plot points for a story. Create exactly 5 major plot points following the classic story structure:
    1. Inciting Incident
    2. Rising Action
    3. Midpoint
    4. Climactic Build-up
    5. Resolution
    
    Based on:
    Premise: {plan['premise']}
    Setting: {plan['setting']}
    Characters: {plan['characters']}
    
    Provide the plot points in a numbered list, each point should be one clear sentence.
    <|im_end|>
    <|im_start|>assistant
    """

    try:
        response = model(outline_prompt, max_tokens=512)
        plot_points = re.split(r"\n\d+\.\s*", response["choices"][0]["text"].strip())  # type: ignore
        plot_points = [p.strip() for p in plot_points if p.strip()]

        root = OutlineNode(text="Story Root", event_type="root")
        for i, point in enumerate(plot_points, 1):
            node = OutlineNode(text=point, depth=1, event_type="chapter")
            root.children.append(node)

        return root
    except Exception as e:
        logging.error(f"Error generating initial outline: {e}")
        raise


def generate_subevents(story_id: str, node: OutlineNode, plan: dict) -> List[str]:
    """Generate sub-events for a given plot point."""
    prompt = f"""
    <|im_start|>system
    Generate 3-4 specific scenes or events that occur during this plot point:
    "{node.text}"
    
    Consider:
    - Premise: {plan['premise']}
    - Setting: {plan['setting']}
    - Characters: {plan['characters']}
    - Current Scene: {node.scene}
    - Involved Characters: {', '.join(node.entities)}
    
    Provide the scenes in a numbered list, each being one clear sentence.
    <|im_end|>
    <|im_start|>assistant
    """

    try:
        response = model(prompt, max_tokens=512)
        subevents = re.split(r"\n\d+\.\s*", response["choices"][0]["text"].strip())  # type: ignore
        return [event.strip() for event in subevents if event.strip()]
    except Exception as e:
        logging.error(f"Error generating subevents: {e}")
        return []


async def generate_full_outline(
    story_id: str,
    max_depth: int = 2,
    expansion_method: str = "vaguest_first",
    premise: str = "",
    setting: str = "",
    characters: list = [],
) -> OutlineNode:
    """Generate a complete story outline using the specified expansion method."""
    plan = {"premise": premise, "setting": setting, "characters": characters}

    # Generate initial outline structure
    root_node = generate_initial_outline(plan)

    # Track expanded nodes to avoid duplicates
    expanded_nodes = set()
    nodes_to_expand = deque([(node, 1) for node in root_node.children])

    while nodes_to_expand:
        current_node, depth = nodes_to_expand.popleft()

        if depth >= max_depth or current_node in expanded_nodes:
            continue

        # Generate details for current node
        generate_node_details(current_node, plan)
        expanded_nodes.add(current_node)

        # Generate and add sub-events
        subevents = generate_subevents(story_id, current_node, plan)
        for event in subevents:
            child_node = OutlineNode(
                text=event,
                depth=depth + 1,
                event_type="scene" if depth + 1 == max_depth else "chapter",
            )
            current_node.children.append(child_node)
            nodes_to_expand.append((child_node, depth + 1))

    # Save the outline to MongoDB
    try:
        await stories.update_one(
            {"story_id": str(story_id)},
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


async def create_numbered_outline(
    story_id: str, num_events: int, continue_from_previous: bool = False
) -> List[str]:
    """Create a numbered outline for a specified number of events."""
    try:
        # Fetch the existing story document
        story = await stories.find_one({"story_id": ObjectId(story_id)})
        if not story:
            raise ValueError("Story not found")

        # Initialize the outline
        outline = []

        # if continue_from_previous and "outline" in story:
        #     # If continuing from the previous outline, extract existing events
        #     existing_outline = story["outline"]
        #     outline = [
        #         f"{i + 1}. {node['text']}"
        #         for i, node in enumerate(existing_outline["children"])
        #     ]
        if continue_from_previous and "outline" in story:
            # If continuing from the previous outline, extract existing events
            existing_outline = story["outline"]

            if isinstance(existing_outline, dict) and "children" in existing_outline:
                # If it's a dictionary with a "children" key
                outline = [
                    f"{i + 1}. {node['text']}"
                    for i, node in enumerate(existing_outline["children"])
                ]
            elif isinstance(existing_outline, list):
                # If it's already a list of events
                outline = [
                    f"{i + 1}. {node}" for i, node in enumerate(existing_outline)
                ]
        # ChatML template with a few-shot example using '\n' delimiter
        chatML_template = """
        <|im_start|>system
        You are tasked with generating a numbered outline for a story based on prior context. 
        Each event must be concise, logically connected, and unique. Output events separated by newlines (\n).
        Example Outline:
        1. The villagers discover strange glowing crystals in the nearby forest.
        2. A young boy touches a crystal and gains mysterious powers.
        3. The village elder warns of an ancient prophecy tied to the crystals.
        <|im_end|>
        """

        # Generate new events
        for i in range(len(outline) + 1, len(outline) + num_events + 1):
            # Construct the prompt dynamically
            event_prompt = (
                chatML_template + "<|im_start|>user\n"
                f"Generate event {i} for the story. Previous events:\n"
                + ("\n".join(outline) if outline else "None yet.")
                + "\n<|im_end|>\n"
                "<|im_start|>assistant\n"
            )

            response = model(event_prompt, max_tokens=128)
            event_description = response["choices"][0]["text"].strip()  # type: ignore

            # Ensure the output is split correctly by '\n'
            new_events = event_description.split("\n")
            for event in new_events:
                if event.strip():  # Avoid empty lines
                    # outline.append(f"{len(outline) + 1}. {event.strip()}")
                    outline.append(f"{event.strip()}")

        # Save the updated outline back to the database
        await stories.update_one(
            {"story_id": ObjectId(story_id)},
            {"$set": {"outline": outline, "updated_at": datetime.utcnow()}},
        )

        return outline
    except Exception as e:
        logging.error(f"Error creating numbered outline: {e}")
        raise
