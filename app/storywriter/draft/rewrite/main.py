from typing import List, Tuple, Dict
from app.storywriter.draft.schema import GeneratedPassage, PassageContext
from .evaluator import PassageEvaluator
from .improver import PassageImprover
import logging


logger = logging.getLogger(__name__)


class PassageRewriter:
    def __init__(self, story_id: str):
        self.story_id = story_id
        self.evaluator = PassageEvaluator()
        self.improver = PassageImprover()

    async def process_passages(
        self,
        passages: List[GeneratedPassage],
        context: PassageContext,
        improvement_threshold: float = 0.7,
    ) -> Tuple[GeneratedPassage, Dict[str, float]]:
        """Process multiple passages and return the best one with improvements if needed"""

        # Evaluate all passages
        passage_scores = []
        for passage in passages:
            scores = await self.evaluator.evaluate_passage(passage, context)
            passage_scores.append((passage, scores))

        # Sort by total score
        passage_scores.sort(key=lambda x: x[1]["total"], reverse=True)
        best_passage, best_scores = passage_scores[0]

        # If best passage needs improvement
        if best_scores["total"] < improvement_threshold:
            improvements = await self.improver.generate_improvements(
                best_passage, context, best_scores
            )

            # Generate improved version
            improved_content = await self.improver.apply_improvements(
                best_passage, context, improvements
            )

            # Create new passage with improvements
            best_passage.content = improved_content

            # Re-evaluate improved passage
            best_scores = await self.evaluator.evaluate_passage(best_passage, context)

        return best_passage, best_scores
