from typing import Dict, List
from app.storywriter.draft.schema import GeneratedPassage, PassageContext
from app.storywriter.llm import model
import logging
from app.utils.text_validation import get_logit_bias

logger = logging.getLogger(__name__)


class PassageImprover:
    async def generate_improvements(
        self,
        passage: GeneratedPassage,
        context: PassageContext,
        scores: Dict[str, float],
    ) -> Dict[str, List[str]]:
        """Generate specific improvements based on evaluation scores"""
        improvements: Dict[str, List[str]] = {}

        if scores["coherence"] < 0.7:
            improvements["coherence"] = await self._get_coherence_improvements(
                passage, context
            )

        if scores["relevance"] < 0.7:
            improvements["relevance"] = await self._get_relevance_improvements(
                passage, context
            )

        if scores["style"] < 0.7:
            improvements["style"] = await self._get_style_improvements(passage, context)

        return improvements

    async def apply_improvements(
        self,
        passage: GeneratedPassage,
        context: PassageContext,
        improvements: Dict[str, List[str]],
    ) -> str:
        """Apply suggested improvements to generate a new version"""
        improvement_text = "\n".join(
            [item for sublist in improvements.values() for item in sublist]
        )

        prompt = f"""
        <|im_start|>system
        Rewrite the following passage incorporating these improvements.
        Do not include any labels or numbering.
        
        Improvements to incorporate:
        {improvement_text}
        
        Original passage:
        {passage.content}
        
        Genre: {context.genre}
        Tone: {context.tone}
        
        Generate an improved version that maintains the core story elements while
        addressing the suggested improvements.
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            # Get logit bias
            logit_bias = get_logit_bias()

            response = model(
                prompt, max_tokens=1024, logit_bias=logit_bias, temperature=0.7
            )
            return response["choices"][0]["text"].strip()  # type: ignore
        except Exception as e:
            logger.error(f"Error applying improvements: {e}")
            return passage.content

    async def _get_coherence_improvements(
        self, passage: GeneratedPassage, context: PassageContext
    ) -> List[str]:
        """Generate coherence improvement suggestions"""
        prompt = f"""
        <|im_start|>system
        Analyze the coherence issues in this passage and provide specific suggestions for improvement.
        Consider:
        1. Continuity with previous events
        2. Character consistency
        3. Logical flow
        4. Tone consistency
        
        Previous passage: {context.recent_passage if context.recent_passage else "This is the first passage."}
        Current passage: {passage.content}
        
        List 3 specific suggestions for improving coherence.
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            response = model(prompt, max_tokens=256)
            suggestions = response["choices"][0]["text"].strip().split("\n")  # type: ignore
            return [s.strip() for s in suggestions if s.strip()]
        except Exception as e:
            logger.error(f"Error getting coherence suggestions: {e}")
            return ["Unable to generate coherence suggestions"]

    async def _get_relevance_improvements(
        self, passage: GeneratedPassage, context: PassageContext
    ) -> List[str]:
        """Generate relevance improvement suggestions"""
        prompt = f"""
        <|im_start|>system
        Analyze how well this passage addresses the outline point and provide specific suggestions for improvement.
        Consider:
        1. Adherence to outline point
        2. Character usage
        3. Setting accuracy
        4. Theme consistency
        
        Outline point: {context.current_outline}
        Passage: {passage.content}
        
        List 3 specific suggestions for improving relevance to the outline.
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            response = model(prompt, max_tokens=256)
            suggestions = response["choices"][0]["text"].strip().split("\n")  # type: ignore
            return [s.strip() for s in suggestions if s.strip()]
        except Exception as e:
            logger.error(f"Error getting relevance suggestions: {e}")
            return ["Unable to generate relevance suggestions"]

    async def _get_style_improvements(
        self, passage: GeneratedPassage, context: PassageContext
    ) -> List[str]:
        """Generate style improvement suggestions"""
        prompt = f"""
        <|im_start|>system
        Analyze the writing style issues in this passage and provide specific suggestions for improvement.
        Consider:
        1. Repetition
        2. Perspective consistency
        3. Dialogue balance
        4. Pacing
        5. Genre-appropriate tone
        
        Genre: {context.genre}
        Tone: {context.tone}
        Passage: {passage.content}
        
        List 3 specific suggestions for improving writing style.
        <|im_end|>
        <|im_start|>assistant
        """

        try:
            response = model(prompt, max_tokens=256)
            suggestions = response["choices"][0]["text"].strip().split("\n")  # type: ignore
            return [s.strip() for s in suggestions if s.strip()]
        except Exception as e:
            logger.error(f"Error getting style suggestions: {e}")
            return ["Unable to generate style suggestions"]
