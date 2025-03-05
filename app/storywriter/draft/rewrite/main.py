from typing import List, Tuple, Dict
from enum import Enum
from functools import lru_cache
from app.storywriter.draft.schema import GeneratedPassage, PassageContext
from .evaluator import PassageEvaluator
from .improver import PassageImprover
import re
from collections import Counter
import numpy as np
import logging
import spacy
from sentence_transformers import SentenceTransformer
import logging

from pydoc import classname
from typing import List, Dict, Optional, Tuple, Union
# import tiktoken
from pymongo import UpdateOne
from datetime import datetime
import asyncio
import re
import spacy
from typing import Set
from functools import wraps


from ..schema import PassageContext, GeneratedPassage
from app.config.mongo import db




logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
nlp = spacy.load("en_core_web_lg")

class SimilarityMethod(Enum):
        COSINE = "cosine"
        EUCLIDEAN = "euclidean"
        DOT_PRODUCT = "dot_product"
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
    from functools import lru_cache


# Initialize tokenizer for token counting
# tokenizer = tiktoken.get_encoding("cl100k_base")

# Initialize passages collection
passage_collection = db.passages

class PassageRewriterS:
    # Pre-compile regex patterns for efficiency
    _FIRST_PERSON_PATTERN = re.compile(r'\b(I|me|my|mine|myself|we|us|our|ours|ourselves)\b', re.IGNORECASE)

    # Improved regex to ONLY remove proper quoted dialogues, not possessives
    _QUOTE_PATTERN = re.compile(r'(["\”\“])((?:\\.|(?!\1).)*?)\1', re.DOTALL)  # Matches proper quoted text

    def __init__(self):
        self.coherence_model = SentenceTransformer("sentence-transformers/paraphrase-mpnet-base-v2")
        try:
            self.nlp = spacy.load("en_core_web_lg")
        except:
            self.nlp = spacy.load("en_core_web_sm")
    """
    Computes coherence score using semantic similarity between consecutive passages first method
    Calculating similarity between two vectors using the specified method second methods.
    """
   
    
    def _calculate_similarity(self, vec1: np.ndarray, vec2: np.ndarray, method: SimilarityMethod) -> float:

        if method in [SimilarityMethod.COSINE, SimilarityMethod.DOT_PRODUCT]:
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
                
            vec1_normalized = vec1 / norm1
            vec2_normalized = vec2 / norm2
        
        if method == SimilarityMethod.COSINE:
            return np.dot(vec1_normalized, vec2_normalized)
        
        elif method == SimilarityMethod.EUCLIDEAN:
            distance = np.linalg.norm(vec1 - vec2)
            return float(1.0 / (1.0 + distance))  
        
        elif method == SimilarityMethod.DOT_PRODUCT:
            return np.dot(vec1_normalized, vec2_normalized)
        
        else:
            raise ValueError(f"Unknown similarity method: {method}")

    def calculate_semantic_coherence(
        self,
        text: Union[str, List[str]], 
        prev_text: Union[str, List[str], None] = None, 
        model = None,
        method: SimilarityMethod = SimilarityMethod.COSINE,
        cache_embeddings: bool = False,
        threshold: float = 0.0
    ) -> Union[float, List[float], Tuple[float, dict]]:
        if model is None:
            raise ValueError("Embedding model must be provided")
        
        if prev_text is None or (isinstance(prev_text, str) and not prev_text.strip()):
            if cache_embeddings and isinstance(text, str):
                try:
                    text_embedding = model.encode([text], convert_to_numpy=True)[0]
                    return 1.0, {"embedding": text_embedding}
                except Exception as e:
                    raise RuntimeError(f"Failed to generate embedding: {str(e)}")
            return 1.0
        
        is_batch = isinstance(text, list) and isinstance(prev_text, list)
        
        try:
            if not is_batch:
                embeddings = model.encode([prev_text, text], convert_to_numpy=True)
                prev_embedding, current_embedding = embeddings[0], embeddings[1]
                
                similarity = self._calculate_similarity(prev_embedding, current_embedding, method)
                
                if similarity < threshold:
                    similarity = 0.0
                    
                if cache_embeddings:
                    return similarity, {"embedding": current_embedding}
                return similarity
                
            else:
                if len(text) != len(prev_text):
                    raise ValueError("Batch sizes must match for text and prev_text")
                # prev_text = [prev_text] if isinstance(prev_text, str) else prev_text
                # text = [text] if isinstance(text, str) else text
                all_texts = prev_text + text

                all_embeddings = model.encode(all_texts, convert_to_numpy=True)
                
                prev_embeddings = all_embeddings[:len(prev_text)]
                current_embeddings = all_embeddings[len(prev_text):]
                
                similarities = [
                    self._calculate_similarity(prev_embeddings[i], current_embeddings[i], method)
                    for i in range(len(text))
                ]
                
                similarities = [0.0 if s < threshold else s for s in similarities]
                
                if cache_embeddings:
                    return similarities, {"embeddings": current_embeddings}
                return similarities
                
        except Exception as e:
            raise RuntimeError(f"Error calculating semantic coherence: {str(e)}")


    # def _calculate_relevance(self, passage: str, outline: str) -> float:
    #     """
    #     Measures semantic relevance of a passage to an outline using SBERT.
    #     """
    #     if not outline:
    #         return 0.0

    #     outline_embedding = self.coherence_model.encode(outline, convert_to_numpy=True)
    #     passage_embedding = self.coherence_model.encode(passage, convert_to_numpy=True)
        
    #     similarity = np.dot(outline_embedding, passage_embedding) / (
    #         np.linalg.norm(outline_embedding) * np.linalg.norm(passage_embedding)
    #     )

    #     return similarity  # Higher means better alignment with outline.
    
        def _calculate_entity_coverage(self, passage_entities: List[str], outline_entities: List[str], 
                                    special_weights: Optional[Dict[str, float]] = None) -> float:

            if not outline_entities:
                return 0.0

            # Default weight is 1.0, but special entities get custom weights
            special_weights = special_weights or {"protagonist": 2.0, "main character": 2.0}
            entity_weights = {ent: special_weights.get(ent, 1.0) for ent in outline_entities}

            matched_weight = sum(entity_weights.get(ent, 0) for ent in set(passage_entities) & set(outline_entities))
            total_weight = sum(entity_weights.values())

            return matched_weight / total_weight if total_weight > 0 else 0.0
            
    # def _extract_keywords(self, text: Union[str, Dict]) -> List[str]:
    #     """Extract important keywords from text using spaCy"""
    #     if isinstance(text, dict):
    #         text = " ".join(str(v) for v in text.values())

    #     # Process the text with spaCy
    #     doc = self.nlp(text)

    #     # Extract keywords: nouns and proper nouns
    #     keywords = [
    #         token.text.lower()
    #         for token in doc
    #         if token.pos_ in {"NOUN", "PROPN"} and not token.is_stop and len(token) > 3
    #     ]

    #     return list(set(keywords))  # Return unique keywords

    # def _calculate_readability(self, text: str) -> float:
    #     """
    #     Calculate a readability score using spaCy.
    #     Uses a simplified version of the Flesch Reading Ease score,
    #     normalized to a 0-1 scale where 1 is most readable.
    #     """
    #     try:
    #         doc = self.nlp(text)

    #         # Get sentences and words
    #         sentences = list(doc.sents)
    #         words = [
    #             token for token in doc if not token.is_punct and not token.is_space
    #         ]

    #         if not sentences or not words:
    #             return 0.0

    #         # Calculate metrics
    #         avg_sentence_length = len(words) / len(sentences)
    #         avg_word_length = sum(len(word.text) for word in words) / len(words)

    #         # Complex words are those with more than 2 syllables
    #         # Approximate syllables using character length and consonant clusters
    #         complex_words = sum(1 for word in words if len(word.text) > 6)
    #         complex_word_ratio = complex_words / len(words)

    #         # Calculate readability (simplified Flesch formula)
    #         # Higher score = more readable
    #         base_score = (
    #             206.835 - (1.015 * avg_sentence_length) - (84.6 * complex_word_ratio)
    #         )

    #         # Normalize to 0-1 range
    #         normalized_score = max(0.0, min(1.0, base_score / 100))

    #         return normalized_score

    #     except Exception as e:
    #         logger.error(f"Error calculating readability: {e}")
    #         return 0.0
    
    def _extract_keywords(self, text: Union[str, Dict]) -> List[str]:
        """Extract important keywords from text using spaCy noun chunks."""
        if isinstance(text, dict):
            text = " ".join(str(v) for v in text.values())

        doc = self.nlp(text)
        seen = set()
        keywords = []

        for chunk in doc.noun_chunks:
            # Skip chunks with stopword roots or short length
            if (
                chunk.root.is_stop
                or len(chunk.text) < 3
                or chunk.root.pos_ not in {"NOUN", "PROPN"}
            ):
                continue
            
            keyword = chunk.text.lower()
            # Optional: Use root lemma for normalization
            # keyword = chunk.root.lemma_.lower()  
            
            if keyword not in seen:
                seen.add(keyword)
                keywords.append(keyword)

        return keywords

    @lru_cache(maxsize=2048)
    def _count_syllables(word: str) -> int:
        """Approximate syllable count with caching for efficiency."""
        word = word.lower().strip('.,!?;:"()')
        if not word:
            return 0

        vowels = "aeiouy"
        count = 0
        prev_vowel = False

        # Count vowel groups
        for char in word:
            if char in vowels:
                if not prev_vowel:
                    count += 1
                prev_vowel = True
            else:
                prev_vowel = False

        # Adjust for silent e at word end
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

            # Calculate syllables and sentence metrics
            syllables = [self._count_syllables(word) for word in words]
            total_syllables = sum(syllables)

            avg_sentence_length = len(words) / len(sentences)
            avg_syllables_per_word = total_syllables / len(words)

            # Flesch Reading Ease formula
            flesch_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
            
            # Realistic normalization (typical range 0-100)
            clamped_score = max(0, min(100, flesch_score))
            return clamped_score / 100

        except Exception as e:
            logger.error(f"Error calculating readability: {e}", exc_info=True)
            return 0.0
  
    # def _detect_repetition(self, text: str, previous_text: str) -> float:
    #     """
    #     Detect repetition issues as mentioned in the instructions.
    #     Returns a score where 1.0 means no problematic repetition and 0.0 means severe repetition.
    #     """
    #     # Check for repeated phrases (4+ words)
    #     words = text.split()
    #     if len(words) < 8:
    #         return 1.0  # Too short to have meaningful repetition
            
    #     # Check for n-gram repetitions
    #     ngram_sizes = [4, 5, 6]  # Check for repetitions of 4, 5, and 6 word phrases
    #     repetition_penalties = []
        
    #     for n in ngram_sizes:
    #         if len(words) <= n:
    #             continue
                
    #         ngrams = [' '.join(words[i:i+n]) for i in range(len(words)-n+1)]
    #         ngram_counts = {}
            
    #         for ngram in ngrams:
    #             ngram_counts[ngram] = ngram_counts.get(ngram, 0) + 1
                
    #         # Calculate penalty for repetitions
    #         max_repetition = max(ngram_counts.values()) if ngram_counts else 1
    #         penalty = max(0, 1 - (max_repetition - 1) * 0.25)  # Each repetition beyond first reduces score by 0.25
    #         repetition_penalties.append(penalty)
            
    #     # Check for repetition with previous passage
    #     if previous_text:
    #         overlap_penalty = self._calculate_excessive_overlap(text, previous_text)
    #         repetition_penalties.append(overlap_penalty)
            
    #     return min(repetition_penalties) if repetition_penalties else 1.0
    
    # def _calculate_excessive_overlap(self, text: str, previous_text: str) -> float:
    #     """
    #     Calculate a penalty for excessive content overlap with previous passage.
    #     Returns 1.0 for acceptable overlap, lower for excessive overlap.
    #     """
    #     # Get n-grams from both texts
    #     text_words = text.split()
    #     prev_words = previous_text.split()
        
    #     # Create 4-grams
    #     text_4grams = [' '.join(text_words[i:i+4]) for i in range(len(text_words)-3)] if len(text_words) >= 4 else []
    #     prev_4grams = [' '.join(prev_words[i:i+4]) for i in range(len(prev_words)-3)] if len(prev_words) >= 4 else []
        
    #     # Calculate overlap
    #     overlap_count = sum(1 for gram in text_4grams if gram in prev_4grams)
        
    #     # More than 10% overlap is considered excessive
    #     overlap_ratio = overlap_count / len(text_4grams) if text_4grams else 0
        
    #     if overlap_ratio > 0.15:
    #         return max(0, 1 - (overlap_ratio - 0.15) * 5)  # Sharp penalty for excessive overlap
    #     return 1.0
    
    def _detect_repetition(self, text: str, previous_text: str) -> float:
        """
        Detect repetition issues, considering both internal n-gram repetitions and overlap with previous text.
        Returns a score between 0.0 (severe repetition) and 1.0 (no issues).
        """
        words = text.split()
        if len(words) < 8:
            return 1.0  # Insufficient length for meaningful analysis

        # Weights for n-gram sizes to prioritize longer repetitions
        ngram_config = {4: 1.0, 5: 1.2, 6: 1.5}
        penalties = []

        # Analyze n-gram repetitions using weighted penalties
        for n, weight in ngram_config.items():
            if len(words) <= n:
                continue
            
            ngrams = [' '.join(words[i:i+n]) for i in range(len(words)-n+1)]
            counter = {}
            for gram in ngrams:
                counter[gram] = counter.get(gram, 0) + 1
            
            if counter:
                max_repeats = max(counter.values())
                # Apply progressive penalty: 0.2 per repeat after first
                penalty = max(0.0, 1.0 - (max_repeats - 1) * 0.2)
                penalties.append((penalty, weight))

        # Calculate weighted average of n-gram penalties
        ngram_score = 1.0
        if penalties:
            total_weight = sum(w for p, w in penalties)
            weighted_sum = sum(p * w for p, w in penalties)
            ngram_score = weighted_sum / total_weight

        # Evaluate content overlap with previous text
        overlap_score = self._calculate_excessive_overlap(text, previous_text)

        # Final score is the stricter of the two metrics
        return min(ngram_score, overlap_score)

    def _calculate_excessive_overlap(self, text: str, previous_text: str) -> float:
        """
        Calculate overlap penalty using unique 4-grams with progressive scaling.
        Returns 1.0 for acceptable overlap, decreasing for excessive repetition.
        """
        if not previous_text:
            return 1.0

        current_words = text.split()
        prev_words = previous_text.split()

        # Generate unique 4-gram sets
        current_grams = set()
        if len(current_words) >= 4:
            current_grams = {' '.join(current_words[i:i+4]) for i in range(len(current_words)-3)}
        
        prev_grams = set()
        if len(prev_words) >= 4:
            prev_grams = {' '.join(prev_words[i:i+4]) for i in range(len(prev_words)-3)}

        if not current_grams:
            return 1.0

        # Calculate overlap metrics
        overlap = len(current_grams & prev_grams)
        overlap_ratio = overlap / len(current_grams)

        # Progressive penalty: full penalty at 30% overlap
        if overlap_ratio > 0.1:
            return max(0.0, 1.0 - (overlap_ratio - 0.1) * 5)
        return 1.0

    # def _check_narrative_perspective(self, text: str) -> float:
    #     """
    #     Check if the text uses consistent third-person perspective as mentioned in the instructions.
    #     Returns 1.0 for consistent third-person, 0.0 for first-person.
    #     """
    #     # Look for first-person pronouns
    #     first_person_pattern = r'\b(I|me|my|mine|myself|we|us|our|ours|ourselves)\b'
    #     matches = re.findall(first_person_pattern, text, re.IGNORECASE)
        
    #     # Count instances normalized by text length
    #     word_count = len(text.split())
    #     first_person_ratio = len(matches) / max(1, word_count / 100)  # Per 100 words
        
    #     # Score drops as first-person usage increases
    #     perspective_score = max(0, 1 - first_person_ratio)
        
    #     return perspective_score
    
    def check_narrative_perspective(self, text: str) -> dict:
        """
        Check if the text maintains consistent third-person perspective.
        """
        # Remove all properly quoted dialogues and thoughts (excluding possessives)
        cleaned_text = self._QUOTE_PATTERN.sub('', text)

        # Find first-person pronouns
        matches = list(self._FIRST_PERSON_PATTERN.finditer(cleaned_text))

        return 1.0 if not matches else 0.0
        
    # def _calculate_coherence_flow(self, text: str) -> float:
    #     """
    #     Calculate coherence based on sentence length variation.
    #     """
    #     sentences = [s.strip() for s in text.split(".") if s.strip()]
    #     if not sentences:
    #         return 0.0

    #     sentence_lengths = [len(s.split()) for s in sentences]
    #     if len(sentence_lengths) <= 1:
    #         return 1.0

    #     mean_length = sum(sentence_lengths) / len(sentence_lengths)
    #     if mean_length == 0:
    #         return 0.0
            
    #     variance = sum((l - mean_length) ** 2 for l in sentence_lengths) / (
    #         len(sentence_lengths) - 1
    #     )
    #     std_dev = variance**0.5

    #     coherence = max(0.0, 1.0 - (std_dev / mean_length))
    #     return coherence

    def calculate_coherence_flow(text: str) -> float:

        # Clean and normalize text
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Split into paragraphs
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
        if not paragraphs:
            return 0.0
        
        # Split into sentences using NLP
        doc = nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents]
        
        if not sentences:
            return 0.0
        if len(sentences) == 1:
            return 0.8  # Single sentence is coherent but not ideal
        
        # 1. Sentence Length Variation
        sentence_lengths = [len(s.split()) for s in sentences]
        mean_length = np.mean(sentence_lengths)
        std_dev = np.std(sentence_lengths)
        cv = std_dev / max(mean_length, 1)
        length_score = max(0, 1 - abs(cv - 0.5) * 1.2)

        # 2. Improved Transition Word Analysis (Now Checks Position)
        transition_categories = {
            "contrast": ["however", "nevertheless", "on the other hand", "in contrast"],
            "cause-effect": ["therefore", "thus", "as a result", "consequently"],
            "addition": ["furthermore", "moreover", "additionally"],
            "example": ["for example", "for instance"],
            "sequence": ["first", "second", "next", "then", "finally"]
        }
        
        transition_weight = {
            "contrast": 1.2,
            "cause-effect": 1.1,
            "addition": 1.0,
            "example": 1.0,
            "sequence": 0.9
        }
        
        transition_count = 0
        total_weight = 0
        
        for sent in sentences:
            words = sent.lower().split()
            first_word = words[0] if words else ""
            
            for category, phrases in transition_categories.items():
                for phrase in phrases:
                    if re.search(rf"\b{phrase}\b", sent, re.IGNORECASE):
                        weight = transition_weight[category]
                        if first_word in phrase.split():  # Transition word at start
                            weight *= 1.5  # Give higher weight
                        transition_count += 1
                        total_weight += weight

        transition_density = transition_count / len(sentences)
        transition_score = min(1.0, total_weight * 2 / len(sentences)) if transition_density <= 0.35 else max(0, 1.5 - transition_density)

        # 3. Topic Consistency via Semantic Similarity
        sentence_vectors = [nlp(sent).vector for sent in sentences if len(sent.split()) > 3]
        if len(sentence_vectors) > 1:
            avg_similarity = np.mean([
                np.dot(sentence_vectors[i], sentence_vectors[i + 1]) /
                (np.linalg.norm(sentence_vectors[i]) * np.linalg.norm(sentence_vectors[i + 1]) + 1e-5)
                for i in range(len(sentence_vectors) - 1)
            ])
            lexical_cohesion_score = max(0, min(1.0, avg_similarity))
        else:
            lexical_cohesion_score = 0.5  # Default score if only short sentences exist
        
        # 4. Adaptive Paragraph Structure Scoring
        para_lengths = [len(list(nlp(p).sents)) for p in paragraphs]  
        avg_sentences_per_para = np.mean(para_lengths)
        ideal_para_length = max(3, min(7, len(sentences) / max(len(paragraphs), 1)))
        paragraph_score = max(0, 1 - abs(avg_sentences_per_para - ideal_para_length) / ideal_para_length)

        # 5. Pronoun Reference Clarity with Error Handling
        try:
            unclear_references = sum(1 for cluster in doc._.coref_clusters if len(cluster) < 2)
            reference_clarity = max(0, 1 - (unclear_references / len(sentences)))
        except AttributeError:  # Coref resolution not available
            reference_clarity = 1.0  # Assume all references are clear

        # Dynamic Weighting System Based on Text Length
        text_length_factor = min(1.0, len(sentences) / 20)  

        weights = {
            "length": 0.2 * text_length_factor,
            "transition": 0.25 * text_length_factor,
            "cohesion": 0.3,
            "paragraph": 0.15 * text_length_factor,
            "reference": 0.1 * text_length_factor
        }

        # Compute Final Coherence Score
        coherence_score = (
            length_score * weights["length"] +
            transition_score * weights["transition"] +
            lexical_cohesion_score * weights["cohesion"] +
            paragraph_score * weights["paragraph"] +
            reference_clarity * weights["reference"]
        )

        return round(max(0.0, min(1.0, coherence_score)), 4)
        
    """Rewrite the passage to improve coherence by:

    Enhancing logical flow with well-placed transition words (especially at the beginning of sentences).
    Maintaining topic consistency by smoothly connecting ideas between sentences.
    Improving sentence variety while avoiding choppy or overly long sentences.
    Ensuring clear pronoun references and reducing ambiguity."""

    async def rewrite(self, 
                      passages: List[GeneratedPassage], 
                      context: PassageContext) -> GeneratedPassage:
        """
        Evaluates passages based on the criteria described in the Rewrite module 
        and returns the best one.
        """
        if not passages:
            raise ValueError("No passages provided for rewriting")
            
        logger.info(f"Rewriting {len(passages)} passages")
            
        async def score_passage(passage: GeneratedPassage) -> Tuple[GeneratedPassage, float]:
            text = passage.content
            outline_text = ""
            
            # Extract outline text from context
            if isinstance(context.current_outline, dict):
                outline_text = " ".join(str(v) for v in context.current_outline.values() if v)
            else:
                outline_text = str(context.current_outline)
                
            # Calculate scores based on the Coherence and Relevance Rerankers
            semantic_coherence = self._calculate_semantic_coherence(text, context.recent_passage)
            relevance_score = self._calculate_relevance(text, outline_text)
            
            # Apply heuristic filters as mentioned in the instructions
            repetition_score = self._detect_repetition(text, context.recent_passage)
            perspective_score = self._check_narrative_perspective(text)
            
            # Additional scores for enhanced evaluation
            coherence_flow = self._calculate_coherence_flow(text)
            readability_score = self._calculate_readability(text)
            
            # Entity coverage score
            outline_entities = []
            if isinstance(context.current_outline, dict) and "characters_involved" in context.current_outline:
                outline_entities = context.current_outline["characters_involved"]
                
            entity_coverage = self._calculate_entity_coverage(passage.mentioned_entities, outline_entities)
            
            # Keyword relevance score
            outline_keywords = set(self._extract_keywords(context.current_outline))
            passage_keywords = set(self._extract_keywords(text))
            keyword_relevance = len(outline_keywords & passage_keywords) / len(outline_keywords) if outline_keywords else 0.0
            
            # Length appropriateness
            word_count = len(text.split())
            length_score = max(0.0, 1.0 - abs(500 - word_count) / 500)
            
            # Weighting based on the described Rewrite module priorities
            total_score = (
                semantic_coherence * 0.25 +     # Coherence with previous passage (high priority)
                relevance_score * 0.25 +        # Relevance to outline (high priority)
                coherence_flow * 0.05 +         # Sentence flow coherence
                keyword_relevance * 0.1 +       # Keyword relevance
                entity_coverage * 0.1 +         # Entity coverage
                repetition_score * 0.1 +        # Repetition filter (critical)
                perspective_score * 0.05 +      # Narrative perspective consistency (critical)
                readability_score * 0.05 +      # Readability
                length_score * 0.05             # Appropriate length
            )
            
            # Apply critical filters - heavily penalize passages that fail them
            if repetition_score < 0.3 or perspective_score < 0.4:
                total_score *= 0.2  # 80% penalty for failing critical filters
                
            logger.debug(f"Passage score: {total_score:.4f} (C:{semantic_coherence:.2f} R:{relevance_score:.2f} Rep:{repetition_score:.2f} Persp:{perspective_score:.2f})")
                
            return passage, total_score
            
        scored_passages = await asyncio.gather(*(score_passage(p) for p in passages))
        best_passage, best_score = max(scored_passages, key=lambda x: x[1])
        
        logger.info(f"Selected best passage with score {best_score:.4f}")
        return best_passageclass PassageRewriter:
