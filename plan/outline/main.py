import json
import logging
import re
from collections import deque
from typing import List
import uuid

from ..plot.premise import generate_premise, generate_title
from ..plot.settings import generate_setting
from ..outline.schema import OutlineNode
from ..llm import model
from ..db.vector import find_similar_parts, store_story_part


# BFS-based outline expansion
def bfs_expand_outline(
    story_id: uuid.UUID, root: OutlineNode, plan: dict, max_depth: int = 3
):
    queue = deque([root])

    while queue:
        node = queue.popleft()

        if node.depth >= max_depth:
            continue  # Skip nodes if they have reached max depth

        # Expand the node by generating scene and entities
        generate_node_scene(node, plan)
        generate_node_entities(node, plan)

        # Generate children if node is not fully expanded
        if not node.children:
            subevents = generate_subevents(
                story_id, node, plan
            )  # Generate sub-events based on the current node
            for event in subevents:
                child_node = OutlineNode(
                    text=event, depth=node.depth + 1
                )  # Increment depth
                node.children.append(child_node)

        queue.extend(node.children)


# Vaguest-First expansion (assuming 'vagueness' means a node has less detailed information)
# def vaguest_first_expand_outline(root: OutlineNode, plan: dict, max_depth: int = 3):
#     nodes = deque([root])

#     while nodes:
#         # Sort nodes by 'vagueness' (e.g., shorter text considered more vague)
#         nodes = deque(
#             sorted(nodes, key=lambda x: len(x.text))
#         )  # Sort by vagueness (shorter text first)

#         node = nodes.popleft()

#         if node.depth >= max_depth:
#             continue  # Stop expanding if max depth is reached

#         # Expand the node by generating scene and entities
#         generate_node_scene(node, plan)
#         generate_node_entities(node, plan)

#         # Generate children for the vague node
#         if not node.children:
#             subevents = generate_subevents(node, plan)
#             for event in subevents:
#                 child_node = OutlineNode(
#                     text=event, depth=node.depth + 1
#                 )  # Increment depth
#                 node.children.append(child_node)

#         nodes.extend(node.children)

#         try:
#             # Save all data in outline.json
#             with open("../output/outline.json", "w") as f:
#                 json_data = root.model_dump()
#                 logging.debug(
#                     f"Writing the following data to outline.json: {json.dumps(json_data, indent=4)}"
#                 )
#                 f.write(json.dumps(json_data, indent=4))
#                 logging.info("Successfully wrote to outline.json")
#         except Exception as e:
#             logging.error(f"Failed to write to outline.json: {e}")


def vaguest_first_expand_outline(
    story_id: uuid.UUID, root: OutlineNode, plan: dict, max_depth: int = 3
):
    nodes = deque([root])

    # Track which nodes have been expanded using (text, depth) tuple
    expanded_nodes = set()

    while nodes:
        # Sort nodes by 'vagueness' (e.g., shorter text considered more vague)
        nodes = deque(sorted(nodes, key=lambda x: len(x.text)))  # Sort by vagueness

        node = nodes.popleft()

        # Skip if the node has already been expanded or reached max depth
        if node.depth >= max_depth or (node.text, node.depth) in expanded_nodes:
            continue  # Stop expanding if max depth is reached or already expanded

        # Expand the node by generating scene and entities
        generate_node_scene(node, plan)
        generate_node_entities(node, plan)

        # Mark the node as expanded
        expanded_nodes.add((node.text, node.depth))

        # Generate children for the vague node if it hasn't been expanded already
        if not node.children:
            subevents = generate_subevents(story_id, node, plan)
            if subevents:  # Only expand if there are valid subevents
                for event in subevents:
                    child_node = OutlineNode(
                        text=event, depth=node.depth + 1
                    )  # Increment depth
                    node.children.append(child_node)

        # Add new children to the deque for further processing
        nodes.extend(node.children)

        try:
            # Save all data in outline.json
            with open("../output/outline.json", "w") as f:
                json_data = root.model_dump()
                logging.debug(
                    f"Writing the following data to outline.json: {json.dumps(json_data, indent=4)}"
                )
                f.write(json.dumps(json_data, indent=4))
                logging.info("Successfully wrote to outline.json")
        except Exception as e:
            logging.error(f"Failed to write to outline.json: {e}")


def generate_subevents(story_id: uuid.UUID, node: OutlineNode, plan: dict) -> List[str]:
    print("Generating subevents...")

    # Check if similar subevents already exist in the database
    try:
        similar_subevents = find_similar_parts(
            part_name="subevents", story_id=story_id, text=node.text
        )
        if similar_subevents:
            logging.info("Using similar subevents from the database.")
            return [
                subevent[0] for subevent in similar_subevents
            ]  # Return the first column (text)
    except Exception as e:
        logging.warning(f"Failed to retrieve similar subevents: {e}")

    # Proceed with generating subevents using the AI model if no similar parts were found
    outline_prompt = f"""
    <|im_start|>system
    You are tasked with generating subevents for a story based on the premise, setting, and characters. Generate subevents for the event: "{node.text}".<|im_end|>
    <|im_start|>user
    Based on the premise: {plan['premise']}, the setting: {plan['setting']}, and characters: {plan['characters']}, generate subevents for the event: "{node.text}".<|im_end|>
    <|im_start|>assistant
    """

    try:
        response = model(outline_prompt, max_tokens=512)

        if not response or not response["choices"]:  # type: ignore
            logging.error("Model response is invalid or empty.")
            return []

        subevents_text = response["choices"][0]["text"].strip()  # type: ignore

        if not subevents_text:
            logging.error("Generated subevents text is empty.")
            return []

        subevents = re.split(r"\n\d+\.\s", subevents_text)[1:]
        if not subevents:
            logging.warning(
                "Subevents format not recognized, returning as single event."
            )
            return [subevents_text]  # Return the whole text as one event if split fails

        # Store the generated subevents in the database for future use
        try:
            for subevent in subevents:
                store_story_part(
                    part_name="subevents",
                    story_id=story_id,
                    part_text=subevent,
                    text=node.text,
                )
        except Exception as e:
            logging.error(f"Failed to store generated subevents: {e}")

        return subevents

    except Exception as e:
        logging.error(f"Failed to generate subevents: {e}")
        return []


# Generate initial outline layer (top-level arcs)
def generate_initial_outline(plan: dict) -> OutlineNode:
    preferred_max_children = 3
    outline_prompt = f"""
    <|im_start|>system
    You are tasked with generating the top-level outline nodes (1 line each) for a story based on the premise, setting, and characters. Generate {preferred_max_children} high-level events.<|im_end|>
    <|im_start|>user
    Based on the premise: {plan['premise']}, the setting: {plan['setting']}, and characters: {plan['characters']},\n\nWrite a very brief, high-level outline for this story, in the format:\n\n1. [PLOT EVENT 1]\n\n2. [PLOT EVENT 2]\n\n3. etc.\n\n
    Each high-level plot event should be no more than 20 words.<|im_end|>
    <|im_start|>assistant
    """

    try:
        response = model(outline_prompt, max_tokens=512)
        # model.close()
        initial_outline_text = response["choices"][0]["text"].strip()  # type: ignore
        logging.debug(f"Initial Outline: {initial_outline_text}")
    except Exception as e:
        logging.error(f"Failed to generate an initial outline: {e}")
        raise ValueError("Failed to generate a valid initial outline.")

    # Try splitting with numbering first
    subevents = re.split(r"\n\s*\d+\.\s*", initial_outline_text)

    # Fallback: If regex splitting fails (i.e., the result is a single chunk), try splitting by newlines
    if len(subevents) == 1:
        logging.debug("Numbered format not found, falling back to newline splitting.")
        subevents = initial_outline_text.split("\n")

    # Remove any empty strings from the list and strip whitespace
    subevents = [event.strip() for event in subevents if event.strip()]

    if not subevents:
        logging.error("No valid subevents found in the AI response.")
        raise ValueError("Failed to generate a valid initial outline.")

    print("subevents", subevents)

    root_node = OutlineNode(text="")

    # Create child nodes for each event
    for event in subevents:
        child_node = OutlineNode(text=event)
        root_node.children.append(child_node)

    return root_node


def generate_node_scene(node: OutlineNode, plan: dict) -> None:
    outline_prompt = f"""
    <|im_start|>system
    You are tasked with generating a detailed scene for a story based on the premise, setting, and characters. Include the key entities involved in the scene using no more than 10 words .<|im_end|>
    <|im_start|>user
    Based on the premise: {plan['premise']}, the setting: {plan['setting']}, and characters: {plan['characters']}. For the event: "{node.text} , Please suggest a setting where it might take place using no more than 10 words".<|im_end|>
    <|im_start|>assistant
    """
    try:
        response = model(outline_prompt, max_tokens=512)
        scene_text = response["choices"][0]["text"].strip()  # type: ignore

        logging.debug(f"Generated Scene for Node: {scene_text}")

        # Validation: Ensure the response is non-empty
        if not scene_text:
            raise ValueError("Generated scene is empty.")

        # Trim the scene to 10 words if it exceeds the limit
        word_list = scene_text.split()
        # if len(word_list) > 10:
        #     logging.warning(
        #         f"Scene exceeds 10 words: {scene_text}. Trimming to 10 words."
        #     )
        #     scene_text = " ".join(word_list[:10])

        node.scene = scene_text

    except Exception as e:
        logging.error(f"Error generating scene for node {node.text}: {e}")
        # Optionally set a fallback value or handle retry logic here
        node.scene = "Unknown setting"


def generate_node_entities(node: OutlineNode, plan: dict) -> None:
    outline_prompt = f"""
    <|im_start|>system
    You are tasked with generating a list of key entities for a story based on the premise, setting, and characters. These entities could be objects, characters, or abstract concepts.<|im_end|>
    <|im_start|>user
    Based on the premise: {plan['premise']}, the setting: {plan['setting']}, and Characters and Entities: {plan['characters']}. Please list  characters or entities (using their names from the Characters and Entities list above) that appear in "event: {node.text} with scene: {node.scene} " in a comma-separated list. End the list early if there is only one character mentioned.<|im_end|>
    <|im_start|>assistant
    """
    try:
        response = model(outline_prompt, max_tokens=512)

        # Ensure the response structure is valid

        entities_text = response["choices"][0]["text"].strip()  # type: ignore

        if not entities_text:
            raise ValueError("Generated entities list is empty.")

        logging.debug(f"Generated Entities for Node: {entities_text}")

        # Validation: Check for empty or malformed responses
        if not entities_text:
            raise ValueError("Generated entities list is empty.")

        # Split the entities by comma and strip whitespace from each entity
        entities_list = [
            entity.strip() for entity in entities_text.split(",") if entity.strip()
        ]

        # Ensure we have valid entities
        if not entities_list:
            raise ValueError("No valid entities found in the generated response.")

        # Assign the valid entities to the node
        node.entities = entities_list

    except Exception as e:
        logging.error(f"Error generating entities for node {node.text}: {e}")
        # Set fallback entities or handle retry logic here
        node.entities = ["Unknown entities"]


# Main function to generate the full outline
def generate_full_outline(
    story_id: uuid.UUID, max_depth: int = 2, expansion_method="vaguest_first"
) -> OutlineNode:
    # title = generate_title(story_id)
    # premise = generate_premise(story_id, title)
    # setting = generate_setting(story_id, title, premise)

    # characters = generate_characters(stoty_id, title, premise, setting)

    
    premise = """
    In a distant future where humanity has colonized several planets, a group of rebels discovers an ancient artifact with the power to control time. They must navigate a web of political intrigue, form unlikely alliances, and uncover secrets about their own pasts, all while evading a ruthless government agent who seeks the artifact for his own sinister plans. The fate of multiple worlds hangs in the balance as they race against time to unlock the artifact's true potential.
    """
    setting = """
    # Title: Chronos: The Shattered Temporal Veil

    # Location: The Nexus System (A collection of planets, moons, and asteroids in the far reaches of the Milky Way)

    # Time Period: 24th Century

    # Atmosphere: The Nexus System is a vast and diverse collection of celestial bodies, each with its own unique environment. From the lush, tropical jungles of Veridis Prime to the frozen wastelands of Terra Nova, the system is a testament to humanity's adaptability and resilience. The atmosphere is a blend of futuristic technology and ancient mystery, as the remnants of a long-lost civilization intertwine with the present-day societies. The Nexus System is also a place of political tension, as various factions vie for control of the artifact and the power it represents.

    # Political Landscape: The Nexus System is governed by a coalition of planetary governments, known as the Council of Nexus. However, this coalition is fragile, with many members harboring their own agendas. The most powerful of these factions is the
    # """
    characters = [
        {
            "name": "Lyra Novak",
            "physicalAppearance": "Tall and lean, with piercing blue eyes and shoulder-length silver hair. Her skin is marked with the scars of numerous battles, but she carries herself with an air of confidence and grace.",
            "behavioralPatterns": "A natural leader, Lyra is quick-witted and adaptable. She is always looking for solutions and is not afraid to make tough decisions. Her loyalty to her team and her determination to protect the artifact are unwavering.",
            "genderAndSexualOrientation": "Female, bisexual",
            "relationships": {
                "Alliance": "Forms an unlikely alliance with the enigmatic time traveler, Zephyr.",
                "Rival": "Is in constant competition with the ruthless government agent, Cyrus Blackwell.",
            },
            "likesAndDislikes": {
                "Likes": [
                    "Adventure",
                    "Her crew",
                    "The artifact's potential",
                    "Puzzle-solving",
                ],
                "Dislikes": ["Deceit", "Authoritarianism", "Loss of control"],
            },
        },
        {
            "name": "Zephyr",
            "physicalAppearance": "Zephyr is a mysterious figure with hair that shimmers in an array of colors and eyes that seem to change with the light. His body is adorned with intricate markings that suggest a connection to the temporal energy.",
            "behavioralPatterns": "Zephyr is a calm and intuitive being. He possesses a deep understanding of the artifact's power and the secrets it holds. His actions are guided by a higher purpose, but his true motives remain hidden.",
            "genderAndSexualOrientation": "Genderfluid, asexual",
            "relationships": {
                "Mentor": "Mentors Lyra and helps her understand the complexities of time manipulation.",
                "Confidant": "Shares a close bond with the empathic technician, Iris.",
            },
            "likesAndDislikes": {
                "Likes": [
                    "Ancient mysteries",
                    "The natural order of time",
                    "Knowledge",
                ],
                "Dislikes": ["Violence", "Haste", "Lack of self-awareness"],
            },
        },
        {
            "name": "Cyrus Blackwell",
            "physicalAppearance": "Cyrus is a formidable figure with chiseled features, dark hair, and piercing black eyes. His muscular build and imposing presence make him a formidable adversary.",
            "behavioralPatterns": "Cyrus is ruthless and cunning, driven by a thirst for power and a desire to control his own destiny. He is willing to do whatever it takes to obtain the artifact, even if it means sacrificing others.",
            "genderAndSexualOrientation": "Male, heterosexual",
            "relationships": {
                "Rival": "Is in constant competition with Lyra Novak.",
                "Underling": "Commands a loyal group of agents, each with their own skills and specialties.",
            },
            "likesAndDislikes": {
                "Likes": ["Power", "Control", "Manipulation"],
                "Dislikes": ["Weakness", "Emotions", "Limitations"],
            },
        },
    ]

    plan = {
        "premise": premise,
        "setting": setting,
        "characters": characters,
    }

    root_node = generate_initial_outline(plan)

    # Choose expansion method
    if expansion_method == "bfs":
        bfs_expand_outline(story_id, root_node, plan, max_depth)
    elif expansion_method == "vaguest_first":
        vaguest_first_expand_outline(story_id, root_node, plan, max_depth)

    try:
        # Save all data in outline.json
        with open("outline.json", "w") as f:
            json_data = root_node.model_dump()
            logging.debug(
                f"Writing the following data to outline.json: {json.dumps(json_data, indent=4)}"
            )
            f.write(json.dumps(json_data, indent=4))
            logging.info("Successfully wrote to outline.json")
    except Exception as e:
        logging.error(f"Failed to write to outline.json: {e}")

    # Expand the outline to the desired depth using DFS
    # for node in root_outline.children:
    #     expand_outline_node(node, depth=1, max_depth=max_depth, plan=plan)
    #     break
    # expand_outline_node_vfs(root_node, max_depth, plan)

    return root_node


