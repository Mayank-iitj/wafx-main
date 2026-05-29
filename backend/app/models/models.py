"""
HireMind AI — SQLAlchemy Database Models
Full schema: Users, Jobs, Candidates, Rankings, Conversations
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text,
    ForeignKey, JSON, Enum as SAEnum
)
from sqlalchemy.orm import DeclarativeBase, relationship
import enum
import uuid


def new_uuid() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


# ─── Enums ─────────────────────────────────────────────────

class JobStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    closed = "closed"
    draft = "draft"


class UrgencyLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class CandidateStatus(str, enum.Enum):
    new = "new"
    screening = "screening"
    shortlisted = "shortlisted"
    interview = "interview"
    offer = "offer"
    hired = "hired"
    rejected = "rejected"


class UploadStatus(str, enum.Enum):
    queued = "queued"
    parsing = "parsing"
    embedding = "embedding"
    ranking = "ranking"
    done = "done"
    error = "error"


# ─── User ──────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=new_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # null for OAuth users
    company = Column(String(255), nullable=True)
    role = Column(String(50), default="recruiter")  # recruiter | admin | viewer
    avatar_url = Column(String(512), nullable=True)
    google_id = Column(String(255), nullable=True, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    jobs = relationship("Job", back_populates="owner")
    conversations = relationship("Conversation", back_populates="user")


# ─── Job ───────────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=new_uuid)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=False)
    department = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    type = Column(String(100), default="Full-time")
    seniority = Column(String(100), nullable=True)
    status = Column(SAEnum(JobStatus), default=JobStatus.active)
    urgency = Column(SAEnum(UrgencyLevel), default=UrgencyLevel.medium)

    # Counts
    candidates_count = Column(Integer, default=0)
    ranked_count = Column(Integer, default=0)

    # AI-computed fields
    complexity_score = Column(Float, default=0.5)
    fit_threshold = Column(Float, default=0.65)
    skills_required = Column(JSON, default=list)
    skills_preferred = Column(JSON, default=list)
    soft_skills = Column(JSON, default=list)
    ai_analysis = Column(JSON, default=dict)  # Full JD intelligence output

    # Ownership
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="jobs")
    candidates = relationship("Candidate", back_populates="job")
    rankings = relationship("Ranking", back_populates="job")


# ─── Candidate ─────────────────────────────────────────────

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=new_uuid)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)

    # Personal info
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)

    # Professional
    title = Column(String(255), nullable=True)
    current_company = Column(String(255), nullable=True)
    years_exp = Column(Integer, default=0)
    education = Column(String(512), nullable=True)

    # Resume
    resume_file_path = Column(String(512), nullable=True)
    resume_text = Column(Text, nullable=True)  # Parsed text
    resume_embedding = Column(JSON, nullable=True)  # Vector (stored as list)

    # Extracted data
    skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    career_history = Column(JSON, default=list)
    behavioral_data = Column(JSON, default=dict)

    # Flags
    is_hidden_gem = Column(Boolean, default=False)
    bookmarked = Column(Boolean, default=False)
    status = Column(SAEnum(CandidateStatus), default=CandidateStatus.new)

    # Timestamps
    applied_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="candidates")
    ranking = relationship("Ranking", back_populates="candidate", uselist=False)


# ─── Ranking ───────────────────────────────────────────────

class Ranking(Base):
    __tablename__ = "rankings"

    id = Column(String, primary_key=True, default=new_uuid)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False, unique=True)

    # Position
    rank = Column(Integer, nullable=False)

    # Core scores (0.0–1.0)
    overall_fit = Column(Float, default=0.0)
    technical_fit = Column(Float, default=0.0)
    domain_expertise = Column(Float, default=0.0)
    leadership = Column(Float, default=0.0)
    learning_velocity = Column(Float, default=0.0)
    behavioral_signals = Column(Float, default=0.0)
    cultural_alignment = Column(Float, default=0.0)
    communication = Column(Float, default=0.0)
    stability = Column(Float, default=0.0)
    adaptability = Column(Float, default=0.0)

    # Prediction scores
    confidence = Column(Float, default=0.0)
    interview_probability = Column(Float, default=0.0)
    success_prediction = Column(Float, default=0.0)
    hidden_gem_score = Column(Float, default=0.0)
    future_potential = Column(Float, default=0.0)

    # Full AI explanation (JSON)
    ai_explanation = Column(JSON, default=dict)

    # Weights used for this ranking
    weights_used = Column(JSON, default=dict)

    # Timestamps
    ranked_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="rankings")
    candidate = relationship("Candidate", back_populates="ranking")


# ─── Upload ────────────────────────────────────────────────

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(String, primary_key=True, default=new_uuid)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)
    filename = Column(String(512), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, default=0)
    status = Column(SAEnum(UploadStatus), default=UploadStatus.queued)
    error_message = Column(Text, nullable=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=True)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)


# ─── Conversation (AI Copilot) ──────────────────────────────

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=new_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    session_id = Column(String(255), nullable=False, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)
    messages = Column(JSON, default=list)  # [{role, content, timestamp}]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="conversations")
