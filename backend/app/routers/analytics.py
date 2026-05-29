from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.data.mock_candidates import MOCK_CANDIDATES

router = APIRouter()


@router.get("/dashboard", summary="Get analytics dashboard data")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    candidates = list(MOCK_CANDIDATES.values())
    scores = [c["scores"]["overall_fit"] for c in candidates]
    avg_fit = sum(scores) / len(scores) if scores else 0

    return {
        "pipeline_summary": {
            "total_candidates": len(candidates),
            "ranked": len([c for c in candidates if c["rank"] > 0]),
            "shortlisted": 34,
            "interviewed": 12,
            "offers_extended": 3,
            "hired": 1,
        },
        "avg_fit_score": round(avg_fit, 3),
        "hidden_gems_found": len([c for c in candidates if c.get("is_hidden_gem")]),
        "diversity_score": 0.82,
        "time_to_rank": 1.2,
        "score_distribution": [
            {"range": "90-100%", "count": len([s for s in scores if s >= 0.9])},
            {"range": "80-89%", "count": len([s for s in scores if 0.8 <= s < 0.9])},
            {"range": "70-79%", "count": len([s for s in scores if 0.7 <= s < 0.8])},
            {"range": "60-69%", "count": len([s for s in scores if 0.6 <= s < 0.7])},
            {"range": "Below 60%", "count": len([s for s in scores if s < 0.6])},
        ],
        "weekly_activity": [
            {"day": "Mon", "applications": 34, "rankings": 28},
            {"day": "Tue", "applications": 52, "rankings": 47},
            {"day": "Wed", "applications": 41, "rankings": 35},
            {"day": "Thu", "applications": 68, "rankings": 62},
            {"day": "Fri", "applications": 29, "rankings": 25},
            {"day": "Sat", "applications": 12, "rankings": 10},
            {"day": "Sun", "applications": 11, "rankings": 8},
        ],
    }


@router.get("/bias-audit", summary="Get bias audit results")
async def get_bias_audit(job_id: str = None, current_user: dict = Depends(get_current_user)):
    return {
        "overall_fairness_score": 0.94,
        "dimensions": [
            {"dimension": "Gender Neutrality", "score": 0.96, "status": "pass"},
            {"dimension": "Education Bias", "score": 0.89, "status": "pass"},
            {"dimension": "Experience Length Bias", "score": 0.84, "status": "warning"},
            {"dimension": "Geographic Bias", "score": 0.93, "status": "pass"},
            {"dimension": "Name/Ethnicity Bias", "score": 0.97, "status": "pass"},
            {"dimension": "Age Proxy Signals", "score": 0.91, "status": "pass"},
        ],
        "gdpr_compliant": True,
        "warnings": 1,
        "failures": 0,
    }
