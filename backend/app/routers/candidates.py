from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import get_current_user
from app.data.mock_candidates import MOCK_CANDIDATES

router = APIRouter()


class CandidateListItem(BaseModel):
    id: str
    name: str
    title: str
    current_company: str
    location: str
    years_exp: int
    education: str
    overall_fit: float
    rank: int
    is_hidden_gem: bool
    skills: List[str]
    job_id: str


@router.get("/", response_model=List[CandidateListItem], summary="List all candidates")
async def list_candidates(
    job_id: Optional[str] = None,
    sort_by: str = "fit",
    gems_only: bool = False,
    current_user: dict = Depends(get_current_user),
):
    candidates = list(MOCK_CANDIDATES.values())
    if job_id:
        candidates = [c for c in candidates if c.get("job_id") == job_id]
    if gems_only:
        candidates = [c for c in candidates if c.get("is_hidden_gem")]

    if sort_by == "fit":
        candidates.sort(key=lambda c: c["scores"]["overall_fit"], reverse=True)
    elif sort_by == "potential":
        candidates.sort(key=lambda c: c["scores"]["future_potential"], reverse=True)
    elif sort_by == "momentum":
        candidates.sort(key=lambda c: c["behavioral"]["momentum_score"], reverse=True)

    return [
        CandidateListItem(
            id=c["id"],
            name=c["name"],
            title=c["title"],
            current_company=c["current_company"],
            location=c["location"],
            years_exp=c["years_exp"],
            education=c["education"],
            overall_fit=c["scores"]["overall_fit"],
            rank=c["rank"],
            is_hidden_gem=c["is_hidden_gem"],
            skills=c["skills"],
            job_id=c["job_id"],
        )
        for c in candidates
    ]


@router.get("/{candidate_id}", summary="Get full candidate profile")
async def get_candidate(candidate_id: str, current_user: dict = Depends(get_current_user)):
    candidate = MOCK_CANDIDATES.get(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found")
    return candidate


@router.get("/{candidate_id}/profile", summary="Get full AI-enriched candidate profile")
async def get_candidate_profile(candidate_id: str, current_user: dict = Depends(get_current_user)):
    candidate = MOCK_CANDIDATES.get(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found")
    from app.services.explainability import explainability_service
    explanation = explainability_service.generate_explanation(
        candidate,
        candidate["scores"],
        {"title": "Senior ML Engineer"},
        candidate["rank"],
    )
    return {**candidate, "ai_explanation_detailed": explanation}


@router.get("/{candidate_id}/interview-kit", summary="Get AI-generated interview questions for candidate")
async def get_interview_kit(candidate_id: str, current_user: dict = Depends(get_current_user)):
    candidate = MOCK_CANDIDATES.get(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found")
    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate["name"],
        "technical": [
            {"question": "Design a RAG pipeline with sub-200ms query latency at 10M+ chunks.", "difficulty": "hard", "focus": "System Design"},
            {"question": "Explain DPO vs PPO vs RLHF tradeoffs for LLM alignment.", "difficulty": "hard", "focus": "LLM Fundamentals"},
            {"question": "How would you reduce hallucination rate from 8% to <2%?", "difficulty": "hard", "focus": "ML Debugging"},
        ],
        "behavioral": [
            {"question": "Tell me about a time you pushed back on a flawed product decision.", "difficulty": "medium", "focus": "Ownership"},
            {"question": "Describe handling a production ML incident with incorrect predictions.", "difficulty": "medium", "focus": "Crisis Management"},
        ],
        "weakness_probing": [
            {"question": f"Your background shows {candidate['title']}. How do you plan to adapt to our specific stack?", "difficulty": "medium", "focus": "Gap Assessment"},
        ],
    }
