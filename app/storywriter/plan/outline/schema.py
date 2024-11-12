from typing import List, Optional
from pydantic import BaseModel


# Pydantic outline node model
class OutlineNode(BaseModel):
    text: str
    scene: Optional[str] = ""
    entities: List[str] = []
    children: List["OutlineNode"] = []
    depth: int = 0

    def __eq__(self, other):
        if isinstance(other, OutlineNode):
            return self.text == other.text and self.depth == other.depth
        return False

    def __hash__(self):
        return hash(
            (self.text, self.depth)
        )  # Create a hash based on the text and depth

    def model_dump(self):
        return {
            "text": self.text,
            "scene": self.scene,
            "entities": self.entities,
            "children": [child.model_dump() for child in self.children],
            "depth": self.depth,
        }

    class Config:
        json_schema_extra = {"additionalProperties": False}
