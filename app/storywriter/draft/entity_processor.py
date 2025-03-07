import logging
import json
from typing import Dict, List
from ..llm.llama import model
from pydantic import BaseModel, Field
from typing import Literal

logger = logging.getLogger(__name__)


class CharacterClassificationSchema(BaseModel):
    name: str
    classification: Literal["character", "location", "object"] = Field(
        default="character",
        description="Type of entity (character, entity, or location)",
    )


class EntityProcessor:
    @staticmethod
    async def batch_classify_entities(
        entities: set[str], passage_content: str
    ) -> Dict[str, str]:
        """Classify multiple entities in a single LLM call"""
        schema = CharacterClassificationSchema.model_json_schema()

        batch_prompt = f"""
        <|im_start|>system
        You are an expert story analyzer. Classify each entity as either "character", "location", or "object" based on the passage context.
        Return a valid JSON object following the given schema exactly.
        <|im_end|>
        <|im_start|>user
        Entities to classify:
        {json.dumps(list(entities))}
        
        Passage context:
        {passage_content[:1000]}
        
        Here's the JSON schema you must adhere to:\n<schema>\n{schema}\n</schema>
        
        Example response:
        [{{"name":"TheArchivist", "classification":"character"}}, {{"name":"AtlantisLibrary", "classification":"location"}}]
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            response = model(
                batch_prompt,
                max_tokens=256,
            )
            if not isinstance(response, dict) or "choices" not in response:
                return {}

            response_text = response["choices"][0]["text"].strip()  # type: ignore
            logger.info(f"Entity classification response: {response_text}")

            try:
                classifications = json.loads(response_text)
                logger.info(f"Classifications: {classifications}")
                return {
                    item["name"]: item["classification"]
                    for item in classifications
                    if isinstance(item, dict)
                    and "name" in item
                    and "classification" in item
                }
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON response: {e}")
                return {}

        except Exception as e:
            logger.error(f"Error classifying entities: {e}")
            return {}

    @staticmethod
    def prioritize_entities(entity_types: Dict[str, str]) -> Dict[str, str]:
        """Filter and prioritize entities based on type"""
        priorities = {"character": 3, "location": 2, "object": 1}
        prioritized = sorted(
            entity_types.items(), key=lambda x: priorities.get(x[1], 0), reverse=True
        )
        top_entities = dict(prioritized[:5])
        characters = {
            name: type_ for name, type_ in entity_types.items() if type_ == "character"
        }
        return {**characters, **top_entities}
