from typing import List, Tuple, Dict, Optional, Union
from enum import Enum
from functools import lru_cache
import re
import logging
import asyncio
import numpy as np
import spacy
from sentence_transformers import SentenceTransformer
from pymongo import UpdateOne
from app.storywriter.draft.schema import GeneratedPassage, PassageContext
from app.storywriter.draft.rewrite.evaluator import PassageEvaluator
from app.storywriter.draft.rewrite.improver import PassageImprover
from app.config.mongo import db

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
nlp = spacy.load("en_core_web_lg")

class SimilarityMethod(Enum):
    COSINE = "cosine"
    EUCLIDEAN = "euclidean"
    DOT_PRODUCT = "dot_product"

class PassageRewriter:
    _FIRST_PERSON_PATTERN = re.compile(r'\b(I|me|my|mine|myself|we|us|our|ours|ourselves)\b', re.IGNORECASE)
    _QUOTE_PATTERN = re.compile(r'(["\”\“])((?:\\.|(?!\1).)*?)\1', re.DOTALL)

    def __init__(self, story_id: str):
        self.story_id = story_id
        self.evaluator = PassageEvaluator()
        self.improver = PassageImprover()
        self.coherence_model = SentenceTransformer("sentence-transformers/paraphrase-mpnet-base-v2")
        try:
            self.nlp = spacy.load("en_core_web_lg")
        except:
            self.nlp = spacy.load("en_core_web_sm")
            
    async def process_passages(
        self,
        passages: List[GeneratedPassage],
        context: PassageContext,
        improvement_threshold: float = 0.7,
    ) -> Tuple[GeneratedPassage, Dict[str, float]]:
        passage_scores = []
        for passage in passages:
            scores = await self.evaluator.evaluate_passage(passage, context)
            passage_scores.append((passage, scores))

        passage_scores.sort(key=lambda x: x[1]["total"], reverse=True)
        best_passage, best_scores = passage_scores[0]

        if best_scores["total"] < improvement_threshold:
            improvements = await self.improver.generate_improvements(
                best_passage, context, best_scores
            )
            improved_content = await self.improver.apply_improvements(
                best_passage, context, improvements
            )
            best_passage.content = improved_content
            best_scores = await self.evaluator.evaluate_passage(best_passage, context)

        return best_passage, best_scores

    def _normalize_vectors(self, vec1: np.ndarray, vec2: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return vec1, vec2
        return vec1 / (norm1 + 1e-10), vec2 / (norm2 + 1e-10) 

    def _calculate_similarity(self, vec1: np.ndarray, vec2: np.ndarray, method: SimilarityMethod) -> float:
        if method == SimilarityMethod.COSINE:
            vec1_norm, vec2_norm = self._normalize_vectors(vec1, vec2)
            return float(np.dot(vec1_norm, vec2_norm))
        elif method == SimilarityMethod.EUCLIDEAN:
            distance = np.linalg.norm(vec1 - vec2)
            return float(1.0 / (1.0 + distance))
        elif method == SimilarityMethod.DOT_PRODUCT:
            vec1_norm, vec2_norm = self._normalize_vectors(vec1, vec2)
            return float(np.dot(vec1_norm, vec2_norm))
        else:
            raise ValueError(f"Unknown similarity method: {method}")

    # def calculate_semantic_coherence(
    #     self,
    #     text: Union[str, List[str]],
    #     prev_text: Union[str, List[str], None] = None,
    #     method: SimilarityMethod = SimilarityMethod.COSINE,
    #     threshold: float = 0.0
    # ) -> Union[float, List[float]]:
    #     if prev_text is None or (isinstance(prev_text, str) and not prev_text.strip()):
    #         return 1.0

    #     is_batch = isinstance(text, list) and isinstance(prev_text, list)
        
    #     try:
    #         if not is_batch:
    #             embeddings = self.coherence_model.encode([prev_text, text], convert_to_numpy=True)
    #             similarity = self._calculate_similarity(embeddings[0], embeddings[1], method)
    #             return max(similarity, threshold)
    #         else:
    #             if len(text) != len(prev_text):
    #                 raise ValueError("Batch sizes must match for text and prev_text")
                
    #             if isinstance(prev_text, str):
    #                 prev_text = [prev_text] * len(text)
    #             all_embeddings = self.coherence_model.encode(prev_text + text, convert_to_numpy=True)
    #             similarities = [
    #                 self._calculate_similarity(all_embeddings[i], all_embeddings[len(prev_text)+i], method)
    #                 for i in range(len(text))
    #             ]
    #             return [max(s, threshold) for s in similarities]
                
    #     except Exception as e:
    #         logger.error(f"Error calculating semantic coherence: {str(e)}")
    #         return 0.0 if not is_batch else [0.0]*len(text)
    def calculate_semantic_coherence(
        self,
        text: Union[str, List[str]],
        prev_text: Union[str, List[str], None] = None,
        method: SimilarityMethod = SimilarityMethod.COSINE,
        threshold: float = 0.0,
        force_scalar: bool = False
    ) -> Union[float, List[float]]:
        # Return default value for empty previous text
        if prev_text is None or (isinstance(prev_text, str) and not prev_text.strip()):
            return 1.0 if not isinstance(text, list) or force_scalar else [1.0] * len(text)
        
        # Standardize input formats
        is_input_batch = isinstance(text, list)
        text_list = text if is_input_batch else [text]
        
        # Handle different prev_text formats
        if isinstance(prev_text, list):
            if len(prev_text) != len(text_list):
                raise ValueError("Batch sizes must match for text and prev_text")
            prev_text_list = prev_text
        else:
            # If prev_text is a string, replicate it for each text item
            prev_text_list = [prev_text] * len(text_list)
        
        try:
            # Encode all texts at once for efficiency
            all_texts = prev_text_list + text_list
            all_embeddings = self.coherence_model.encode(all_texts, convert_to_numpy=True)
            
            # Calculate similarities
            similarities = [
                self._calculate_similarity(
                    all_embeddings[i], 
                    all_embeddings[i + len(prev_text_list)],
                    method
                )
                for i in range(len(text_list))
            ]
            
            # Apply threshold
            similarities = [max(s, threshold) for s in similarities]
            
            # Return appropriate format based on input and force_scalar flag
            if not is_input_batch or force_scalar:
                return similarities[0] if similarities else 0.0
            return similarities
                
        except Exception as e:
            logger.error(f"Error calculating semantic coherence: {str(e)}")
            if not is_input_batch or force_scalar:
                return 0.0
            return [0.0] * len(text_list)

    def _calculate_relevance(self, passage: str, outline: str) -> float:
        if not outline:
            return 0.0

        passage_embed = self.coherence_model.encode(passage)
        outline_embed = self.coherence_model.encode(outline)
        return np.dot(passage_embed, outline_embed) / (np.linalg.norm(passage_embed) * np.linalg.norm(outline_embed))

    def _calculate_entity_coverage(
        self,
        passage_entities: List[str],
        outline_entities: List[str],
        special_weights: Optional[Dict[str, float]] = None
    ) -> float:
        if not outline_entities:
            return 0.0

        weights = special_weights or {"protagonist": 2.0, "main character": 2.0}
        entity_weights = {ent: weights.get(ent, 1.0) for ent in outline_entities}
        matched = sum(entity_weights.get(ent, 0) for ent in set(passage_entities) & set(outline_entities))
        total = sum(entity_weights.values())
        return matched / total if total > 0 else 0.0

    def _extract_keywords(self, text: Union[str, Dict]) -> List[str]:
        content = " ".join(text.values()) if isinstance(text, dict) else text
        doc = self.nlp(content)
        return list({
            chunk.text.lower()
            for chunk in doc.noun_chunks
            if chunk.root.pos_ in {"NOUN", "PROPN"} and not chunk.root.is_stop and len(chunk.text) > 2
        })

    @staticmethod
    @lru_cache(maxsize=2048)
    def _count_syllables(word: str) -> int:
        word = word.lower().strip('.,!?;:"()')
        vowels = "aeiouy"
        count = 0
        prev_vowel = False

        for char in word:
            if char in vowels:
                if not prev_vowel:
                    count += 1
                prev_vowel = True
            else:
                prev_vowel = False

        if word.endswith(('e', 'es', 'ed')) and count > 1:
            count -= 1

        return max(1, count)

    def _calculate_readability(self, text: str) -> float:
        try:
            doc = self.nlp(text)
            sentences = list(doc.sents)
            words = [token.text for token in doc if not token.is_punct and not token.is_space]

            if not sentences or not words:
                return 0.0

            syllables = [self._count_syllables(word) for word in words]
            avg_sentence_len = len(words) / len(sentences)
            avg_syllables = sum(syllables) / len(words)

            flesch = 206.835 - (1.015 * avg_sentence_len) - (84.6 * avg_syllables)
            return max(0, min(100, flesch)) / 100
        except Exception as e:
            logger.error(f"Readability error: {e}")
            return 0.0

    def _detect_repetition(self, text: str, previous_text: str) -> float:
        words = text.split()
        if len(words) < 8:
            return 1.0

        current_grams = {' '.join(words[i:i+4]) for i in range(len(words)-3)} if len(words) >=4 else set()
        prev_grams = {' '.join(previous_text.split()[i:i+4]) for i in range(len(previous_text.split())-3)} if previous_text else set()
        
        overlap = len(current_grams & prev_grams) / len(current_grams) if current_grams else 0
        return 1.0 - min(overlap / 0.15, 1.0) if overlap > 0.1 else 1.0

    def _check_narrative_perspective(self, text: str) -> float:
        cleaned = self._QUOTE_PATTERN.sub('', text)
        return 1.0 if not self._FIRST_PERSON_PATTERN.search(cleaned) else 0.0

    def calculate_coherence_flow(self, text: str) -> float:
        doc = self.nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 10]

        if len(sentences) < 2:
            return 0.8 if sentences else 0.0

        # Sentence variation analysis
        lengths = [len(sent.split()) for sent in sentences]
        cv = np.std(lengths) / np.mean(lengths)
        length_score = max(0, 1 - abs(cv - 0.5))

        # Semantic cohesion
        vectors = [sent.vector for sent in doc.sents if len(sent.text.split()) > 3]
        if len(vectors) > 1:
            similarities = [
                np.dot(vectors[i], vectors[i+1]) / (np.linalg.norm(vectors[i]) * np.linalg.norm(vectors[i+1]))
                for i in range(len(vectors)-1)
            ]
            cohesion_score = np.mean(similarities).clip(0, 1)
        else:
            cohesion_score = 0.5

        return round((length_score * 0.4 + cohesion_score * 0.6), 4)

    async def rewrite(self, passages: List[GeneratedPassage], context: PassageContext) -> GeneratedPassage:
        if not passages:
            raise ValueError("No passages provided for rewriting")

        async def score_passage(passage: GeneratedPassage) -> Tuple[GeneratedPassage, float]:
            text = passage.content
            outline = " ".join(str(v) for v in context.current_outline.values()) if isinstance(context.current_outline, dict) else str(context.current_outline)

            # Get coherence score and ensure it's a scalar
            coherence = self.calculate_semantic_coherence(text, context.recent_passage, force_scalar=True),
            # coherence = self.calculate_semantic_coherence(text, context.recent_passage)
            if isinstance(coherence, list):
                coherence = coherence[0] if coherence else 0.0

            scores = {
                'coherence': coherence,  # Now guaranteed to be a scalar
                'relevance': self._calculate_relevance(text, outline),
                'repetition': self._detect_repetition(text, context.recent_passage or ""),
                'perspective': self._check_narrative_perspective(text),
                'flow': self.calculate_coherence_flow(text),
                'readability': self._calculate_readability(text)
            }

            # Now all scores should be scalar values and can be safely compared with floats
            total = (
                scores['coherence'] * 0.25 +
                scores['relevance'] * 0.25 +
                scores['repetition'] * 0.2 +
                scores['perspective'] * 0.1 +
                scores['flow'] * 0.1 +
                scores['readability'] * 0.1
            )

            if scores['repetition'] < 0.3 or scores['perspective'] < 0.4:
                total *= 0.2

            return passage, total

        scored = await asyncio.gather(*(score_passage(p) for p in passages))
        return max(scored, key=lambda x: x[1])[0]

# MongoDB collection instance
passage_collection = db.passages