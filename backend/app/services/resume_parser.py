"""
HireMind AI — Resume Parser Service
Extracts structured data from PDF and DOCX resume files.
"""
import re
import io
from pathlib import Path
from typing import Dict, List, Any, Optional


class ResumeParser:
    """
    Multi-format resume parser supporting PDF and DOCX.
    Extracts: personal info, skills, experience, education, projects.
    Falls back to text extraction when structure is unclear.
    """

    TECH_SKILLS = [
        # Languages
        "Python", "TypeScript", "JavaScript", "Go", "Rust", "Java", "C++",
        "C#", "Scala", "R", "Julia", "Kotlin", "Swift", "Dart",
        # ML/AI
        "PyTorch", "TensorFlow", "JAX", "scikit-learn", "XGBoost", "LightGBM",
        "Keras", "Hugging Face", "Transformers", "BERT", "GPT", "LLaMA",
        "LangChain", "LlamaIndex", "RAG", "RLHF", "Fine-tuning", "LoRA", "PEFT",
        "vLLM", "TGI", "Triton", "CUDA", "cuDNN", "OpenCL",
        # Data
        "Pandas", "NumPy", "Spark", "Kafka", "dbt", "Airflow", "Prefect",
        "Snowflake", "BigQuery", "Databricks", "Flink",
        # Infra
        "Kubernetes", "Docker", "AWS", "GCP", "Azure", "Terraform",
        "Ansible", "Helm", "Prometheus", "Grafana", "ELK",
        # Databases
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra",
        "Elasticsearch", "Neo4j", "Qdrant", "Pinecone", "Weaviate", "FAISS",
        # Web
        "React", "Vue", "Angular", "Next.js", "FastAPI", "Django", "Flask",
        "GraphQL", "REST", "gRPC", "WebSockets",
        # Tools
        "Git", "GitHub", "CI/CD", "MLflow", "Weights & Biases", "DVC",
    ]

    SOFT_SKILLS = [
        "leadership", "communication", "collaboration", "mentorship",
        "problem-solving", "analytical", "creative", "strategic",
        "detail-oriented", "adaptable", "ownership",
    ]

    EDUCATION_KEYWORDS = [
        "phd", "ph.d", "doctor", "master", "ms ", "m.s", "bachelor",
        "bs ", "b.s", "bsc", "msc", "mba", "university", "college",
        "institute", "school",
    ]

    def parse(self, file_path: str, file_type: str = "pdf") -> Dict[str, Any]:
        """Parse a resume file and return structured data."""
        text = self._extract_text(file_path, file_type)
        if not text:
            return self._empty_result()

        return {
            "raw_text": text,
            "name": self._extract_name(text),
            "email": self._extract_email(text),
            "phone": self._extract_phone(text),
            "location": self._extract_location(text),
            "skills": self._extract_skills(text),
            "experience_years": self._estimate_experience(text),
            "education": self._extract_education(text),
            "current_title": self._extract_title(text),
            "current_company": self._extract_company(text),
            "career_history": self._extract_career_history(text),
            "github_url": self._extract_github(text),
            "linkedin_url": self._extract_linkedin(text),
            "has_publications": self._detect_publications(text),
            "has_patents": self._detect_patents(text),
            "has_open_source": "github.com" in text.lower() or "open source" in text.lower(),
        }

    def _extract_text(self, file_path: str, file_type: str) -> str:
        """Extract raw text from file."""
        try:
            path = Path(file_path)
            if not path.exists():
                return ""

            if file_type == "pdf":
                return self._extract_pdf(file_path)
            elif file_type in ("docx", "doc"):
                return self._extract_docx(file_path)
            else:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()
        except Exception as e:
            print(f"[ResumeParser] Error extracting text from {file_path}: {e}")
            return ""

    def _extract_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF."""
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text("text")
            doc.close()
            return text
        except ImportError:
            print("[ResumeParser] PyMuPDF not available, using fallback")
            return ""
        except Exception as e:
            print(f"[ResumeParser] PDF extraction error: {e}")
            return ""

    def _extract_docx(self, file_path: str) -> str:
        """Extract text from DOCX using python-docx."""
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join([para.text for para in doc.paragraphs])
        except ImportError:
            print("[ResumeParser] python-docx not available")
            return ""
        except Exception as e:
            print(f"[ResumeParser] DOCX extraction error: {e}")
            return ""

    def _extract_name(self, text: str) -> str:
        """Heuristic: name is usually in the first 3 lines."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in lines[:4]:
            # Name: short, no special chars, no email/phone
            if (2 <= len(line.split()) <= 4 and
                "@" not in line and
                not any(c.isdigit() for c in line) and
                len(line) < 60):
                return line
        return "Unknown"

    def _extract_email(self, text: str) -> Optional[str]:
        match = re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,6}", text, re.I)
        return match.group(0) if match else None

    def _extract_phone(self, text: str) -> Optional[str]:
        match = re.search(r"(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})", text)
        return match.group(0).strip() if match else None

    def _extract_location(self, text: str) -> Optional[str]:
        patterns = [
            r"(?:located|based|location|address)[:\s]+([A-Za-z ,]+(?:,\s*[A-Z]{2})?)",
            r"([A-Z][a-z]+(?:,\s*[A-Z]{2}|,\s*[A-Za-z]+)?)\s*(?:\||·|•|-)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text[:500])
            if match:
                return match.group(1).strip()
        return None

    def _extract_skills(self, text: str) -> List[str]:
        """Find all tech skills present in resume text."""
        found = []
        text_lower = text.lower()
        for skill in self.TECH_SKILLS:
            if skill.lower() in text_lower:
                found.append(skill)
        return list(dict.fromkeys(found))  # preserve order, deduplicate

    def _estimate_experience(self, text: str) -> int:
        """Estimate years of experience from date patterns."""
        years = re.findall(r"\b(20\d\d|19\d\d)\b", text)
        if len(years) >= 2:
            years_int = [int(y) for y in years]
            span = max(years_int) - min(years_int)
            return min(span, 25)
        # Fallback: look for explicit "X years" mentions
        match = re.search(r"(\d+)\+?\s+years?\s+(?:of\s+)?(?:experience|exp)", text, re.I)
        if match:
            return int(match.group(1))
        return 0

    def _extract_education(self, text: str) -> str:
        """Find highest education credential."""
        lines = text.split("\n")
        for line in lines:
            line_lower = line.lower()
            if any(kw in line_lower for kw in ["phd", "ph.d", "doctor"]):
                return f"PhD — {line.strip()[:100]}"
            if any(kw in line_lower for kw in ["master", "ms ", "m.s", "msc"]):
                return f"Master's — {line.strip()[:100]}"
            if any(kw in line_lower for kw in ["bachelor", "bs ", "b.s", "bsc"]):
                return f"Bachelor's — {line.strip()[:100]}"
        return "Not specified"

    def _extract_title(self, text: str) -> str:
        """Try to find current job title."""
        common_titles = [
            "Software Engineer", "ML Engineer", "Data Scientist", "Research Scientist",
            "Product Manager", "DevOps Engineer", "Frontend Engineer", "Backend Engineer",
            "Full Stack Engineer", "AI Engineer", "Platform Engineer", "Staff Engineer",
            "Senior Engineer", "Principal Engineer",
        ]
        text_lower = text.lower()
        for title in common_titles:
            if title.lower() in text_lower:
                return title
        return "Software Professional"

    def _extract_company(self, text: str) -> str:
        """Try to extract most recent company."""
        known_companies = [
            "Google", "Meta", "OpenAI", "Anthropic", "DeepMind", "Microsoft",
            "Amazon", "Apple", "Netflix", "Stripe", "Uber", "Airbnb",
            "Hugging Face", "Mistral", "Cohere", "Databricks", "Snowflake",
        ]
        for company in known_companies:
            if company.lower() in text.lower():
                return company
        return "Unknown"

    def _extract_career_history(self, text: str) -> List[Dict]:
        """Extract job history as a list of roles."""
        years = re.findall(r"(20\d\d)", text)
        unique_years = sorted(set(int(y) for y in years))
        history = []
        for i, year in enumerate(unique_years[-4:]):  # Last 4 employers
            history.append({
                "year": year,
                "role": "Unknown Role",
                "company": "Unknown",
                "growth": 0.5 + i * 0.1,
            })
        return history

    def _extract_github(self, text: str) -> Optional[str]:
        match = re.search(r"github\.com/([A-Za-z0-9_-]+)", text, re.I)
        return f"https://github.com/{match.group(1)}" if match else None

    def _extract_linkedin(self, text: str) -> Optional[str]:
        match = re.search(r"linkedin\.com/in/([A-Za-z0-9_-]+)", text, re.I)
        return f"https://linkedin.com/in/{match.group(1)}" if match else None

    def _detect_publications(self, text: str) -> bool:
        return any(kw in text.lower() for kw in ["published", "publication", "arxiv", "paper", "journal"])

    def _detect_patents(self, text: str) -> bool:
        return "patent" in text.lower()

    def _empty_result(self) -> Dict:
        return {
            "raw_text": "",
            "name": "Unknown",
            "email": None,
            "phone": None,
            "location": None,
            "skills": [],
            "experience_years": 0,
            "education": "Not specified",
            "current_title": "Unknown",
            "current_company": "Unknown",
            "career_history": [],
            "github_url": None,
            "linkedin_url": None,
            "has_publications": False,
            "has_patents": False,
            "has_open_source": False,
        }


resume_parser = ResumeParser()
