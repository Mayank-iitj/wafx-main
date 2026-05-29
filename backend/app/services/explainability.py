"""
HireMind AI — Explainability Service
Generates human-readable AI explanations for every ranking decision.
"""
from typing import Dict, List, Any


class ExplainabilityService:
    """
    For every candidate ranking, generate:
    - Why ranked at this position
    - Key strengths detected
    - Gaps and weaknesses
    - Risk factors
    - Interview focus areas
    - Confidence reasoning
    """

    def generate_explanation(
        self,
        candidate: Dict,
        scores: Dict,
        job: Dict,
        rank: int,
    ) -> Dict[str, Any]:
        """Generate full explainability report for a candidate."""
        return {
            "summary": self._generate_summary(candidate, scores, job, rank),
            "why_ranked_here": self._explain_rank(scores, rank),
            "strengths": self._identify_strengths(candidate, scores),
            "weaknesses": self._identify_weaknesses(candidate, scores, job),
            "risk_factors": self._assess_risks(candidate, scores),
            "interview_focus": self._suggest_interview_focus(candidate, scores, job),
            "confidence_reasoning": self._explain_confidence(scores),
            "score_drivers": self._identify_score_drivers(scores),
        }

    def _generate_summary(self, candidate: Dict, scores: Dict, job: Dict, rank: int) -> str:
        overall = scores.get("overall_fit", 0)
        technical = scores.get("technical_fit", 0)
        gem = scores.get("hidden_gem_score", 0)

        prefix = "🌟 HIDDEN GEM: " if gem > 0.8 else ""
        quality = "exceptional" if overall > 0.85 else "strong" if overall > 0.70 else "moderate"

        summary = (
            f"{prefix}{candidate.get('name', 'Candidate')} shows {quality} alignment "
            f"with {overall * 100:.0f}% overall fit for the {job.get('title', 'role')}. "
        )
        if technical > 0.85:
            summary += "Technical depth is a key differentiator. "
        if gem > 0.8:
            summary += "Despite gaps in current skills, extraordinary learning velocity and future potential make this a high-value investment. "
        return summary.strip()

    def _explain_rank(self, scores: Dict, rank: int) -> str:
        overall = scores.get("overall_fit", 0)
        if rank == 1:
            return f"Ranked #1 with {overall * 100:.0f}% fit — highest composite score across all 9 dimensions."
        elif rank <= 3:
            return f"Top-3 candidate with strong performance across technical, behavioral, and cultural dimensions."
        elif rank <= 10:
            return f"Ranked #{rank} — solid fit with minor gaps that can be addressed through onboarding."
        else:
            return f"Ranked #{rank} — potential fit but significant skill gaps or low behavioral signals."

    def _identify_strengths(self, candidate: Dict, scores: Dict) -> List[str]:
        strengths = []
        if scores.get("technical_fit", 0) > 0.85:
            strengths.append(f"Exceptional technical depth — {scores['technical_fit'] * 100:.0f}% technical fit")
        if scores.get("leadership", 0) > 0.80:
            strengths.append("Strong leadership signal from career history")
        if scores.get("learning_velocity", 0) > 0.85:
            strengths.append("High learning velocity — rapid skill acquisition demonstrated")
        if scores.get("behavioral_signals", 0) > 0.80:
            strengths.append("Exceptional community engagement and open-source activity")
        if scores.get("stability", 0) > 0.85:
            strengths.append("Strong career stability — low job-hopping risk")
        if scores.get("cultural_alignment", 0) > 0.85:
            strengths.append("High cultural alignment with company values")
        if not strengths:
            strengths.append(f"Solid overall profile with {scores.get('overall_fit', 0) * 100:.0f}% fit score")
        return strengths[:5]

    def _identify_weaknesses(self, candidate: Dict, scores: Dict, job: Dict) -> List[str]:
        weaknesses = []
        if scores.get("technical_fit", 0) < 0.65:
            weaknesses.append("Technical skill gaps — missing critical required skills")
        if scores.get("leadership", 0) < 0.55:
            weaknesses.append("Limited leadership evidence from career history")
        if scores.get("stability", 0) < 0.60:
            weaknesses.append("Job-hopping pattern detected — retention risk")
        if scores.get("behavioral_signals", 0) < 0.50:
            weaknesses.append("Low community activity and engagement signals")
        if not weaknesses:
            weaknesses.append("No major weaknesses identified — minor gaps addressable through onboarding")
        return weaknesses[:3]

    def _assess_risks(self, candidate: Dict, scores: Dict) -> List[str]:
        risks = []
        if scores.get("stability", 0) < 0.6:
            risks.append("Retention risk — history of short tenures")
        if scores.get("overall_fit", 0) > 0.90:
            risks.append("May be overqualified — ensure role scope matches ambitions")
        if scores.get("learning_velocity", 0) > 0.95 and scores.get("technical_fit", 0) < 0.65:
            risks.append("Steep initial ramp-up — requires significant onboarding investment")
        return risks

    def _suggest_interview_focus(self, candidate: Dict, scores: Dict, job: Dict) -> List[str]:
        focus = []
        if scores.get("technical_fit", 0) < 0.75:
            focus.append("Technical depth — assess core skill competency with hands-on challenge")
        if scores.get("leadership", 0) < 0.65:
            focus.append("Leadership examples — behavioral STAR questions on team influence")
        if scores.get("cultural_alignment", 0) < 0.70:
            focus.append("Cultural fit — discuss work style, decision-making, and ambiguity tolerance")
        if scores.get("adaptability", 0) > 0.90:
            focus.append("Highlight growth mindset — candidate shows strong learning signals")
        focus.append("Motivations and career goals — ensure role alignment with aspirations")
        return focus[:4]

    def _explain_confidence(self, scores: Dict) -> str:
        conf = scores.get("confidence", 0.7)
        if conf > 0.90:
            return "High confidence — strong signals across all dimensions with consistent behavioral data."
        elif conf > 0.75:
            return "Good confidence — most dimensions scored well with minor data gaps."
        else:
            return "Moderate confidence — limited profile data; recommend interview to validate."

    def _identify_score_drivers(self, scores: Dict) -> List[Dict]:
        """Return top 3 score drivers (positive and negative)."""
        dimension_labels = {
            "technical_fit": "Technical Fit",
            "domain_expertise": "Domain Expertise",
            "leadership": "Leadership",
            "learning_velocity": "Learning Velocity",
            "behavioral_signals": "Behavioral Signals",
            "cultural_alignment": "Cultural Alignment",
        }
        drivers = [
            {"dimension": label, "score": scores.get(key, 0), "impact": "positive" if scores.get(key, 0) > 0.7 else "negative"}
            for key, label in dimension_labels.items()
        ]
        drivers.sort(key=lambda x: abs(x["score"] - 0.7), reverse=True)
        return drivers[:3]


explainability_service = ExplainabilityService()
