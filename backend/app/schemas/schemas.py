"""
HireMind AI — Pydantic Schemas
Request/response models for all API endpoints.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── Auth ──────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    company: str = ""
    role: str = "recruiter"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    company: str
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Jobs ──────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    description: str = Field(..., min_length=50)
    department: str = ""
    location: str = "Remote"
    type: str = "Full-time"
    seniority: str = "Senior"
    deadline: Optional[datetime] = None
    fit_threshold: float = Field(0.65, ge=0.0, le=1.0)


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    fit_threshold: Optional[float] = None


class JobOut(BaseModel):
    id: str
    title: str
    description: str
    department: str
    location: str
    type: str
    seniority: Optional[str]
    status: str
    urgency: str
    candidates_count: int
    ranked_count: int
    complexity_score: float
    fit_threshold: float
    skills_required: List[str]
    skills_preferred: List[str]
    ai_analysis: Dict[str, Any]
    created_at: datetime
    deadline: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Candidates ────────────────────────────────────────────

class CandidateScores(BaseModel):
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


class CandidateOut(BaseModel):
    id: str
    name: str
    title: Optional[str]
    email: Optional[str]
    location: Optional[str]
    years_exp: int
    education: Optional[str]
    current_company: Optional[str]
    skills: List[str]
    missing_skills: List[str]
    is_hidden_gem: bool
    bookmarked: bool
    status: str
    job_id: str
    rank: Optional[int] = None
    scores: Optional[Dict[str, float]] = None
    behavioral: Optional[Dict[str, Any]] = None
    career_trajectory: Optional[List[Dict]] = None
    ai_explanation: Optional[Dict[str, Any]] = None
    applied_at: datetime

    class Config:
        from_attributes = True


# ─── Rankings ──────────────────────────────────────────────

class RankingWeights(BaseModel):
    technical_fit: float = Field(0.35, ge=0.0, le=1.0)
    domain_expertise: float = Field(0.20, ge=0.0, le=1.0)
    leadership: float = Field(0.15, ge=0.0, le=1.0)
    learning_velocity: float = Field(0.10, ge=0.0, le=1.0)
    behavioral_signals: float = Field(0.10, ge=0.0, le=1.0)
    cultural_alignment: float = Field(0.10, ge=0.0, le=1.0)


class RankingOut(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    rank: int
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
    ai_explanation: Dict[str, Any]
    ranked_at: datetime

    class Config:
        from_attributes = True


# ─── Uploads ───────────────────────────────────────────────

class UploadOut(BaseModel):
    id: str
    filename: str
    file_size: int
    status: str
    job_id: Optional[str]
    candidate_id: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Copilot ───────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "ai"
    content: str
    timestamp: datetime


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: str = "default"
    job_id: Optional[str] = None
    stream: bool = True


class ChatResponse(BaseModel):
    message: str
    session_id: str
    model: str
    sources: List[str]


# ─── Analytics ─────────────────────────────────────────────

class PipelineSummary(BaseModel):
    total_candidates: int
    ranked: int
    shortlisted: int
    interviewed: int
    offers_extended: int
    hired: int


class AnalyticsDashboard(BaseModel):
    pipeline_summary: PipelineSummary
    avg_fit_score: float
    hidden_gems_found: int
    diversity_score: float
    time_to_rank: float
    score_distribution: List[Dict]
    weekly_activity: List[Dict]


# ─── Reports ───────────────────────────────────────────────

class ReportRequest(BaseModel):
    job_id: Optional[str] = None
    format: str = "pdf"
    include_explanations: bool = True
    include_charts: bool = True
    candidate_ids: Optional[List[str]] = None
