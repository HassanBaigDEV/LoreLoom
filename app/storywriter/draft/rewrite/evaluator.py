from typing import Dict, List, Tuple
from app.storywriter.draft.schema import GeneratedPassage, PassageContext
from app.storywriter.plan.llm import model
import logging

logger = logging.getLogger(__name__)


class PassageEvaluator:
    def __init__(self):
        self.evaluation_criteria = {
            "coherence": {
                "weight": 0.35,
                "aspects": [
                    "continuity",
                    "character_consistency",
                    "logical_flow",
                    "tone_consistency",
                ],
            },
            "relevance": {
                "weight": 0.35,
                "aspects": [
                    "outline_adherence",
                    "character_usage",
                    "setting_accuracy",
                    "theme_consistency",
                ],
            },
            "style": {
                "weight": 0.30,
                "aspects": ["repetition", "perspective", "dialogue_balance", "pacing"],
            },
        }

    async def evaluate_passage(
        self, passage: GeneratedPassage, context: PassageContext
    ) -> Dict[str, float]:
        """Evaluate a passage across all criteria"""
        scores = {}

        # Evaluate coherence
        scores["coherence"] = await self._evaluate_aspect(
            passage,
            context,
            "coherence",
            self.evaluation_criteria["coherence"]["aspects"],
        )

        # Evaluate relevance
        scores["relevance"] = await self._evaluate_aspect(
            passage,
            context,
            "relevance",
            self.evaluation_criteria["relevance"]["aspects"],
        )

        # Evaluate style
        scores["style"] = await self._evaluate_aspect(
            passage, context, "style", self.evaluation_criteria["style"]["aspects"]
        )

        # Calculate weighted total
        total = sum(
            scores[aspect] * self.evaluation_criteria[aspect]["weight"]
            for aspect in scores
        )

        scores["total"] = total
        return scores

    async def _evaluate_aspect(
        self,
        passage: GeneratedPassage,
        context: PassageContext,
        aspect: str,
        criteria: List[str],
    ) -> float:
        """Evaluate a specific aspect of the passage"""
        prompt = self._create_evaluation_prompt(passage, context, aspect, criteria)

        try:
            response = model(prompt, max_tokens=8)
            score = float(response["choices"][0]["text"].strip())  # type: ignore
            return min(max(score, 0.0), 1.0)
        except Exception as e:
            logger.error(f"Error evaluating {aspect}: {e}")
            return 0.0

    def _create_evaluation_prompt(
        self,
        passage: GeneratedPassage,
        context: PassageContext,
        aspect: str,
        criteria: List[str],
    ) -> str:
        """Create evaluation prompt for specific aspect"""
        criteria_text = "\n".join(f"- {criterion}" for criterion in criteria)

        return f"""
        <|im_start|>system
        You are an expert editor evaluating the {aspect} of a story passage.
        Rate this passage on a scale of 0.0 to 1.0 based on these criteria:
        {criteria_text}
        
        Genre: {context.genre}
        Previous passage: {context.recent_passage if context.recent_passage else "N/A"}
        Current outline point: {context.current_outline}
        
        Passage to evaluate:
        {passage.content}
        
        Return only a number between 0.0 and 1.0.
        <|im_end|>
        <|im_start|>assistant
        """
