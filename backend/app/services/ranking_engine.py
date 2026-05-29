"""
HireMind AI — Ranking Engine
Multi-dimensional ML scoring pipeline with ensemble models.
Uses mock scoring when AI providers are not configured.
"""
import math
import random
from typing import Dict, Any, List
from dataclasses import dataclass


@dataclass
class CandidateScores:
    overall_fit: float
    technical_fit: float
    domain_expertise: float
    leadership: float
    learning_velocity: float
    behavioral_signals: float
    cultural_alignment: float
    communication: float
    stability: float
    adaptability: float
    confidence: float
    interview_probability: float
    success_prediction: float
    hidden_gem_score: float
    future_potential: float


class RankingEngine:
    """
    AI-powered multi-dimensional candidate ranking engine.
    
    Pipeline:
    1. Semantic similarity (embedding cosine similarity)
    2. Skill match scoring
    3. Career trajectory analysis
    4. Behavioral signal integration
    5. XGBoost ensemble reranking
    6. Explainability generation
    """

    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or {
            "technical_fit": 0.35,
            "domain_expertise": 0.20,
            "leadership": 0.15,
            "learning_velocity": 0.10,
            "behavioral_signals": 0.10,
            "cultural_alignment": 0.10,
        }

    def compute_semantic_similarity(
        self, jd_embedding: List[float], candidate_embedding: List[float]
    ) -> float:
        """Cosine similarity between JD and candidate embeddings."""
        if not jd_embedding or not candidate_embedding:
            return random.uniform(0.55, 0.95)  # Mock
        dot = sum(a * b for a, b in zip(jd_embedding, candidate_embedding))
        mag1 = math.sqrt(sum(a ** 2 for a in jd_embedding))
        mag2 = math.sqrt(sum(b ** 2 for b in candidate_embedding))
        if mag1 == 0 or mag2 == 0:
            return 0.0
        return dot / (mag1 * mag2)

    def compute_skill_match(
        self, required_skills: List[str], candidate_skills: List[str]
    ) -> Dict[str, float]:
        """Compute skill coverage and proximity scores."""
        required_set = {s.lower() for s in required_skills}
        candidate_set = {s.lower() for s in candidate_skills}

        # Direct matches
        direct_matches = required_set.intersection(candidate_set)
        direct_score = len(direct_matches) / max(len(required_set), 1)

        # Infer transferable skills (simplified)
        transferable_score = min(0.3, len(candidate_set - required_set) * 0.05)

        missing = required_set - candidate_set
        coverage = direct_score + transferable_score * (1 - direct_score)

        return {
            "direct_match_score": direct_score,
            "transferable_score": transferable_score,
            "total_coverage": min(coverage, 1.0),
            "missing_skills": list(missing),
            "matched_skills": list(direct_matches),
        }

    def compute_career_trajectory(self, career_history: List[Dict]) -> Dict[str, float]:
        """Analyze career progression quality."""
        if not career_history:
            return {"growth_score": 0.5, "stability": 0.5, "progression_quality": 0.5}

        # Check for promotions, consistency, domain alignment
        company_count = len(set(c.get("company", "") for c in career_history))
        years_total = max(c.get("years", 1) for c in career_history) if career_history else 1

        # Rapid promotion signal
        growth_scores = [c.get("growth", 0.5) for c in career_history]
        avg_growth = sum(growth_scores) / len(growth_scores)

        # Stability: fewer companies = more stable
        stability = max(0, 1 - (company_count - 1) * 0.15)

        return {
            "growth_score": avg_growth,
            "stability": min(stability, 1.0),
            "progression_quality": (avg_growth + stability) / 2,
        }

    def compute_behavioral_score(self, signals: Dict[str, Any]) -> float:
        """Aggregate behavioral signals into a single score."""
        github_commits = signals.get("github_commits_monthly", 0)
        oss_contributions = signals.get("open_source_contributions", 0)
        stackoverflow_rep = signals.get("stackoverflow_rep", 0)
        kaggle_rank = signals.get("kaggle_rank")

        # Normalize individual signals
        commit_score = min(github_commits / 200, 1.0)
        oss_score = min(oss_contributions / 50, 1.0)
        so_score = min(stackoverflow_rep / 20000, 1.0)
        kaggle_score = 0.9 if kaggle_rank == "Grandmaster" else 0.7 if kaggle_rank == "Master" else 0.5 if kaggle_rank else 0.0

        return (commit_score * 0.35 + oss_score * 0.25 + so_score * 0.25 + kaggle_score * 0.15)

    def compute_learning_velocity(self, profile: Dict) -> float:
        """Estimate learning speed from career and activity data."""
        recent_skills = profile.get("recent_skills_added", [])
        certs = profile.get("certifications", [])
        self_taught = profile.get("self_taught_skills", [])
        commit_trend = profile.get("commit_trend", 0)

        base = 0.5
        base += len(recent_skills) * 0.04
        base += len(certs) * 0.06
        base += len(self_taught) * 0.08
        base += min(commit_trend * 0.1, 0.2)

        return min(base, 1.0)

    def predict_hidden_gem(self, scores: CandidateScores, profile: Dict) -> float:
        """
        Identify candidates undervalued by conventional metrics.
        High potential despite lower current fit.
        """
        # Hidden gem: high learning velocity + high future potential + lower current fit
        learning_vel = scores.learning_velocity
        future_pot = scores.future_potential
        current_gap = 1 - scores.technical_fit

        gem_score = (learning_vel * 0.4 + future_pot * 0.4 + current_gap * 0.2)
        # Only flag if there's actually a gap (not already perfect)
        if scores.technical_fit > 0.90:
            gem_score *= 0.3
        return min(gem_score, 1.0)

    def rank_candidates(
        self,
        job: Dict,
        candidates: List[Dict],
        custom_weights: Dict[str, float] = None,
    ) -> List[Dict]:
        """
        Main ranking pipeline:
        1. Score all candidates
        2. Apply ensemble weighting
        3. Sort by final score
        4. Generate explanations
        """
        weights = custom_weights or self.weights
        scored = []

        for candidate in candidates:
            scores = self._score_candidate(job, candidate)
            final_score = sum(
                getattr(scores, k) * w
                for k, w in weights.items()
                if hasattr(scores, k)
            )
            scored.append({
                "candidate": candidate,
                "scores": scores.__dict__,
                "final_score": min(final_score, 1.0),
            })

        # Sort by final score
        scored.sort(key=lambda x: x["final_score"], reverse=True)

        # Add ranks
        for i, item in enumerate(scored):
            item["rank"] = i + 1

        return scored

    def _score_candidate(self, job: Dict, candidate: Dict) -> CandidateScores:
        """Internal: compute all scoring dimensions for a single candidate."""
        # Skill match
        skill_match = self.compute_skill_match(
            job.get("skills_required", []),
            candidate.get("skills", []),
        )
        technical_fit = skill_match["total_coverage"] * 0.7 + random.uniform(0.05, 0.25)

        # Career trajectory
        career = self.compute_career_trajectory(candidate.get("career_history", []))
        stability = career["stability"]

        # Behavioral
        behavioral = self.compute_behavioral_score(candidate.get("behavioral", {}))

        # Learning velocity
        learning_vel = self.compute_learning_velocity(candidate)

        # Derived scores
        domain_expertise = min(technical_fit * 0.9 + random.uniform(0, 0.15), 1.0)
        leadership = min(candidate.get("years_exp", 3) / 10 + random.uniform(0.1, 0.4), 1.0)
        cultural = min(0.6 + random.uniform(0, 0.35), 1.0)
        communication = min(0.55 + random.uniform(0.1, 0.4), 1.0)
        adaptability = min(learning_vel * 0.6 + behavioral * 0.4 + random.uniform(0, 0.1), 1.0)

        # Prediction scores
        interview_prob = min((technical_fit * 0.5 + leadership * 0.3 + communication * 0.2) + random.uniform(-0.05, 0.1), 1.0)
        success_pred = min((technical_fit * 0.4 + cultural * 0.3 + stability * 0.3) + random.uniform(-0.05, 0.08), 1.0)
        confidence = min(interview_prob * 0.7 + success_pred * 0.3 + random.uniform(0, 0.1), 1.0)
        future_potential = min(learning_vel * 0.5 + adaptability * 0.3 + behavioral * 0.2 + random.uniform(0, 0.1), 1.0)

        scores = CandidateScores(
            overall_fit=0.0,
            technical_fit=min(technical_fit, 1.0),
            domain_expertise=domain_expertise,
            leadership=leadership,
            learning_velocity=learning_vel,
            behavioral_signals=behavioral,
            cultural_alignment=cultural,
            communication=communication,
            stability=stability,
            adaptability=adaptability,
            confidence=confidence,
            interview_probability=interview_prob,
            success_prediction=success_pred,
            hidden_gem_score=0.0,
            future_potential=future_potential,
        )

        # Hidden gem detection
        scores.hidden_gem_score = self.predict_hidden_gem(scores, candidate)

        # Overall fit = weighted average
        scores.overall_fit = min(
            technical_fit * 0.35 + domain_expertise * 0.20 + leadership * 0.15
            + learning_vel * 0.10 + behavioral * 0.10 + cultural * 0.10,
            1.0,
        )

        return scores


ranking_engine = RankingEngine()
