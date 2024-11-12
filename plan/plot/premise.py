# Generate the story premise
import logging
from ..llm import model
import uuid


# def generate_premise() -> str:
#     chatML_template = """<|im_start|>system
#     You are tasked with generating creative and unique story premises. Your goal is to come up with an original and engaging premise.<|im_end|>
#     <|im_start|>user
#     Generate a creative and unique premise for a story.<|im_end|>
#     <|im_start|>assistant
#     """

#     premise = model(chatML_template, max_tokens=128)
#     premise_str = premise["choices"][0]["text"].strip()  # type: ignore
#     logging.debug(f"Generated Premise: {premise_str}")
#     return premise_str


def generate_title(story_id: uuid.UUID) -> str:
    title_template = """<|im_start|>system
    You are tasked with generating creative and unique story titles. Your goal is to come up with an original and engaging title.<|im_end|>
    <|im_start|>user
    Generate a creative and unique title for a story.<|im_end|>
    <|im_start|>assistant
    Title:
    """
    title = model(title_template, max_tokens=32)
    _title = title["choices"][0]["text"].strip()  # type: ignore
    model.close()
    title_str = _title.strip()  # Clean any leading/trailing whitespace

    # embeddings = embed_model.get_text_embedding(title_str)
    # store_story_part("title", story_id, title_str, embeddings)

    logging.debug(f"Generated Title: {title_str}")
    return title_str


def generate_premise(story_id: uuid.UUID, title: str) -> str:
    # generate title

    chatML_template = f"""<|im_start|>system
    You are tasked with generating creative and unique story premises. Your goal is to come up with an original and engaging premise.<|im_end|>
    <|im_start|>user
    Generate a creative and unique and premise for a story with Title:{title}.<|im_end|>
    <|im_start|>assistant
    Premise:
    """

    # Generate the premise
    premise = model(chatML_template, max_tokens=128)
    _premise = premise["choices"][0]["text"].strip()  # type: ignore
    model.close()
    premise_str = _premise.strip()  # Clean the premise as well

    # logging.debug(f"Generated Premise: {premise_str}")

    # embeddings = embed_model.get_text_embedding(premise_str)

    # print("ewrwerewrewr")
    # print(embeddings[:5])

    # logging.debug(f"Embeddings: {embeddings}")
    # (Add your logic to save embeddings to pgvector here)
    # store_story_part("premise", story_id, premise_str, embeddings)

    return premise_str
