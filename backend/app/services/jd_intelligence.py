"""
HireMind AI — JD Intelligence Engine
LLM-powered job description analysis and skill extraction.
"""
import re
from typing import Dict, List, Any
from app.core.config import settings


STARTUP_SIGNALS = [
    "startup", "fast-paced", "move fast", "ship weekly", "scrappy",
    "early stage", "seed", "series a", "series b", "small team",
]

LEADERSHIP_SIGNALS = [
    "lead", "manage", "mentor", "direct", "head", "principal", "staff",
    "architect", "senior", "director", "vp", "chief",
]

URGENCY_SIGNALS = [
    "immediately", "asap", "urgent", "immediate start", "critical hire",
]


class JDIntelligenceEngine:
    """
    Analyzes job descriptions to extract structured intelligence:
    - Required and preferred skills
    - Seniority level
    - Cultural signals
    - Leadership expectations
    - Hidden expectations
    - Ideal candidate profile
    """

    def analyze(self, jd_text: str, title: str = "") -> Dict[str, Any]:
        """Full JD analysis pipeline."""
        text_lower = jd_text.lower()

        return {
            "title": title,
            "domain": self._detect_domain(text_lower),
            "seniority": self._detect_seniority(text_lower, title),
            "skills_required": self._extract_skills(jd_text, required=True),
            "skills_preferred": self._extract_skills(jd_text, required=False),
            "soft_skills": self._extract_soft_skills(text_lower),
            "leadership_expected": self._detect_leadership(text_lower, title),
            "culture": self._detect_culture(text_lower),
            "urgency_level": self._detect_urgency(text_lower),
            "role_complexity": self._compute_complexity(jd_text),
            "inferred_signals": self._infer_signals(text_lower),
            "ideal_profile": self._generate_ideal_profile(jd_text, title),
            "skill_ontology": self._build_skill_ontology(jd_text),
            "hiring_signals": self._extract_hiring_signals(text_lower),
        }

    def _detect_domain(self, text: str) -> str:
        domains = {
            "Machine Learning / AI": ["machine learning", "ml engineer", "ai engineer", "llm", "deep learning", "nlp"],
            "Frontend Engineering": ["frontend", "react", "vue", "angular", "ui engineer"],
            "Backend Engineering": ["backend", "api", "microservices", "distributed systems"],
            "Data Science": ["data scientist", "analytics", "statistical", "forecasting"],
            "DevOps / Platform": ["devops", "kubernetes", "infrastructure", "sre", "platform"],
            "Product Management": ["product manager", "product owner", "roadmap"],
            "Design": ["ux", "ui design", "figma", "product design"],
        }
        for domain, keywords in domains.items():
            if any(k in text for k in keywords):
                return domain
        return "Software Engineering"

    def _detect_seniority(self, text: str, title: str) -> str:
        combined = (text + " " + title.lower())
        if any(w in combined for w in ["principal", "distinguished", "fellow"]):
            return "Principal"
        if "staff" in combined:
            return "Staff"
        if "senior" in combined or "sr." in combined:
            return "Senior"
        if "junior" in combined or "jr." in combined or "entry" in combined:
            return "Junior"
        if "lead" in combined:
            return "Lead"
        return "Mid-level"

    def _extract_skills(self, text: str, required: bool) -> List[str]:
        """Extract technical skills from JD."""
        tech_skills = [
            "Python", "TypeScript", "JavaScript", "Go", "Rust", "Java", "C++", "Scala",
            "React", "Vue", "Angular", "Next.js", "FastAPI", "Django", "Flask",
            "PyTorch", "TensorFlow", "JAX", "scikit-learn", "XGBoost", "LightGBM",
            "LangChain", "LlamaIndex", "RAG", "RLHF", "Fine-tuning", "LoRA",
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra", "Elasticsearch",
            "Kubernetes", "Docker", "AWS", "GCP", "Azure", "Terraform",
            "Kafka", "Spark", "dbt", "Airflow", "MLflow",
            "Vector DBs", "Qdrant", "Pinecone", "Weaviate", "FAISS",
            "vLLM", "TGI", "Triton", "CUDA", "HPC",
            "LLM", "Transformers", "BERT", "GPT", "Claude",
        ]
        found = []
        text_lower = text.lower()
        for skill in tech_skills:
            if skill.lower() in text_lower:
                found.append(skill)

        # Split into required vs preferred (simplified heuristic)
        half = len(found) // 2
        return found[:half + 3] if required else found[half + 3:]

    def _extract_soft_skills(self, text: str) -> List[str]:
        soft_map = {
            "communication": "Communication",
            "leadership": "Leadership",
            "collaboration": "Collaboration",
            "ownership": "Ownership",
            "adaptability": "Adaptability",
            "creativity": "Creativity",
            "problem.solving": "Problem Solving",
            "mentoring": "Mentorship",
            "empathy": "Empathy",
            "strategic": "Strategic Thinking",
        }
        return [v for k, v in soft_map.items() if re.search(k, text)]

    def _detect_leadership(self, text: str, title: str) -> bool:
        combined = text + " " + title.lower()
        return any(signal in combined for signal in LEADERSHIP_SIGNALS)

    def _detect_culture(self, text: str) -> str:
        startup_score = sum(1 for s in STARTUP_SIGNALS if s in text)
        if startup_score >= 2:
            return "Startup-oriented, fast-paced, high ownership"
        if any(w in text for w in ["enterprise", "fortune 500", "corporate", "large team"]):
            return "Enterprise, process-driven, collaborative"
        return "Growth-stage, balanced autonomy and structure"

    def _detect_urgency(self, text: str) -> str:
        if any(s in text for s in URGENCY_SIGNALS):
            return "High"
        if any(s in text for s in ["soon", "quickly", "near-term"]):
            return "Medium"
        return "Standard"

    def _compute_complexity(self, text: str) -> float:
        """Estimate role complexity (0-1) based on JD characteristics."""
        score = 0.4  # Base

        # Length proxy
        score += min(len(text) / 3000, 0.15)

        # Technical keywords depth
        advanced_terms = ["distributed", "latency", "throughput", "inference", "alignment",
                          "causal", "bayesian", "rlhf", "architecture", "system design"]
        matches = sum(1 for t in advanced_terms if t in text.lower())
        score += min(matches * 0.04, 0.25)

        # Multiple required skills
        skill_count = len(self._extract_skills(text, required=True))
        score += min(skill_count * 0.02, 0.2)

        return min(score, 1.0)

    def _infer_signals(self, text: str) -> List[str]:
        signals = []
        if any(s in text for s in STARTUP_SIGNALS):
            signals.extend([
                "Adaptability to ambiguity required",
                "Ownership mentality expected",
                "Fast execution over perfection",
            ])
        if self._detect_leadership(text, ""):
            signals.extend([
                "Cross-functional leadership expected",
                "Mentorship responsibilities likely",
            ])
        if "production" in text or "scale" in text:
            signals.append("Production system reliability mindset required")
        if "research" in text:
            signals.append("Research-to-production pipeline experience valued")
        return signals[:6]

    def _generate_ideal_profile(self, text: str, title: str) -> str:
        seniority = self._detect_seniority(text.lower(), title)
        domain = self._detect_domain(text.lower())
        culture = self._detect_culture(text.lower())
        return (
            f"{seniority} {domain} professional with strong technical foundation, "
            f"relevant domain expertise, and cultural fit for a {culture.lower()} environment. "
            f"Demonstrated ability to deliver impact and communicate effectively with cross-functional teams."
        )

    def _build_skill_ontology(self, text: str) -> Dict[str, List[str]]:
        skills = self._extract_skills(text, required=True) + self._extract_skills(text, required=False)
        half = len(skills) // 3
        return {
            "core": skills[:half + 2],
            "adjacent": skills[half + 2: half * 2 + 3],
            "transferable": ["Problem decomposition", "System thinking", "Data-driven decision making"],
        }

    def _extract_hiring_signals(self, text: str) -> List[str]:
        signals = []
        if "phd" in text or "doctoral" in text:
            signals.append("Research depth preferred")
        if "open source" in text:
            signals.append("OSS contribution valued")
        if "published" in text or "publication" in text:
            signals.append("Academic publications a plus")
        if "5+" in text or "7+" in text or "10+" in text:
            signals.append("Significant experience requirement")
        return signals


jd_engine = JDIntelligenceEngine()
