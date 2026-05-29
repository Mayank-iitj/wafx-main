from typing import Optional
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.data.mock_candidates import MOCK_CANDIDATES
from app.services.ranking_engine import ranking_engine

router = APIRouter()


@router.get("/{job_id}", summary="Get AI-ranked candidates for a job")
async def get_rankings(
    job_id: str,
    custom_technical: Optional[float] = None,
    custom_leadership: Optional[float] = None,
    custom_behavioral: Optional[float] = None,
    current_user: dict = Depends(get_current_user),
):
    candidates = list(MOCK_CANDIDATES.values())
    custom_weights = None
    if custom_technical or custom_leadership or custom_behavioral:
        custom_weights = {
            "technical_fit": custom_technical or 0.35,
            "domain_expertise": 0.20,
            "leadership": custom_leadership or 0.15,
            "learning_velocity": 0.10,
            "behavioral_signals": custom_behavioral or 0.10,
            "cultural_alignment": 0.10,
        }

    ranked = ranking_engine.rank_candidates(
        {"title": "Senior ML Engineer", "skills_required": ["Python", "PyTorch", "RAG"]},
        candidates,
        custom_weights,
    )

    return {
        "job_id": job_id,
        "total_candidates": len(ranked),
        "rankings": [
            {
                "rank": item["rank"],
                "candidate_id": item["candidate"]["id"],
                "candidate_name": item["candidate"]["name"],
                "overall_fit": item["candidate"]["scores"]["overall_fit"],
                "scores": item["candidate"]["scores"],
                "is_hidden_gem": item["candidate"]["is_hidden_gem"],
            }
            for item in ranked
        ],
    }


@router.get("/{job_id}/hidden-gems", summary="Get hidden gem candidates for a job")
async def get_hidden_gems(job_id: str, current_user: dict = Depends(get_current_user)):
    gems = [c for c in MOCK_CANDIDATES.values() if c.get("is_hidden_gem") or c["scores"]["hidden_gem_score"] > 0.7]
    return {
        "job_id": job_id,
        "gems_count": len(gems),
        "hidden_gems": [
            {
                "candidate_id": c["id"],
                "name": c["name"],
                "hidden_gem_score": c["scores"]["hidden_gem_score"],
                "future_potential": c["scores"]["future_potential"],
                "learning_velocity": c["scores"]["learning_velocity"],
                "ai_insight": c["ai_explanation"]["summary"],
            }
            for c in gems
        ],
    }
