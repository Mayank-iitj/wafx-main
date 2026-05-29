import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import get_current_user
from app.services.jd_intelligence import jd_engine

router = APIRouter()

# In-memory job store
jobs_db: dict = {}


class CreateJobRequest(BaseModel):
    title: str
    description: str
    department: str = ""
    location: str = "Remote"
    type: str = "Full-time"
    seniority: str = "Senior"
    deadline: Optional[str] = None
    fit_threshold: float = 0.65


class JobResponse(BaseModel):
    id: str
    title: str
    description: str
    department: str
    location: str
    type: str
    seniority: str
    status: str
    urgency: str
    candidates_count: int
    ranked_count: int
    created_at: str
    deadline: Optional[str]
    complexity_score: float
    fit_threshold: float
    skills_required: List[str]
    skills_preferred: List[str]
    ai_analysis: dict


@router.post("/", response_model=JobResponse, summary="Create a new job with AI analysis")
async def create_job(request: CreateJobRequest, current_user: dict = Depends(get_current_user)):
    job_id = f"job-{uuid.uuid4().hex[:8]}"

    # Run JD intelligence analysis
    analysis = jd_engine.analyze(request.description, request.title)

    job = {
        "id": job_id,
        "title": request.title,
        "description": request.description,
        "department": request.department,
        "location": request.location,
        "type": request.type,
        "seniority": request.seniority or analysis["seniority"],
        "status": "active",
        "urgency": analysis["urgency_level"].lower(),
        "candidates_count": 0,
        "ranked_count": 0,
        "created_at": datetime.utcnow().isoformat(),
        "deadline": request.deadline,
        "complexity_score": analysis["role_complexity"],
        "fit_threshold": request.fit_threshold,
        "skills_required": analysis["skills_required"],
        "skills_preferred": analysis["skills_preferred"],
        "ai_analysis": analysis,
        "owner_id": current_user.get("sub", "demo-user"),
    }
    jobs_db[job_id] = job
    return JobResponse(**{k: job[k] for k in JobResponse.__fields__})


@router.get("/", response_model=List[JobResponse], summary="List all jobs")
async def list_jobs(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    # Return mock jobs + any created ones
    from app.data.mock_jobs import MOCK_JOBS
    all_jobs = list(MOCK_JOBS.values()) + list(jobs_db.values())
    if status:
        all_jobs = [j for j in all_jobs if j["status"] == status]
    return [JobResponse(**{k: j[k] for k in JobResponse.__fields__}) for j in all_jobs]


@router.get("/{job_id}", response_model=JobResponse, summary="Get job by ID")
async def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    from app.data.mock_jobs import MOCK_JOBS
    job = jobs_db.get(job_id) or MOCK_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return JobResponse(**{k: job[k] for k in JobResponse.__fields__})


@router.get("/{job_id}/intelligence", summary="Get AI intelligence analysis for a job")
async def get_job_intelligence(job_id: str, current_user: dict = Depends(get_current_user)):
    from app.data.mock_jobs import MOCK_JOBS
    job = jobs_db.get(job_id) or MOCK_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return {"job_id": job_id, "intelligence": job.get("ai_analysis", {})}


@router.delete("/{job_id}", summary="Delete a job")
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    if job_id in jobs_db:
        del jobs_db[job_id]
    return {"message": "Job deleted successfully"}
