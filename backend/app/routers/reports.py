from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_user

router = APIRouter()


class ReportRequest(BaseModel):
    job_id: Optional[str] = None
    format: str = "pdf"
    include_explanations: bool = True
    include_charts: bool = True


@router.post("/export", summary="Generate and export a report")
async def export_report(request: ReportRequest, current_user: dict = Depends(get_current_user)):
    # In production: generate actual PDF/CSV using reportlab/pandas
    return {
        "status": "generated",
        "format": request.format,
        "job_id": request.job_id,
        "download_url": f"/reports/download/{request.job_id or 'all'}.{request.format}",
        "expires_at": "2026-06-01T00:00:00Z",
        "file_size_kb": 245,
    }


@router.get("/templates", summary="List available report templates")
async def list_templates(current_user: dict = Depends(get_current_user)):
    return {
        "templates": [
            {"id": "full-ranking", "name": "Full Ranking Report", "format": "pdf"},
            {"id": "rankings-csv", "name": "Rankings CSV Export", "format": "csv"},
            {"id": "bias-audit", "name": "Bias Audit Report", "format": "pdf"},
            {"id": "full-data", "name": "Full Data Export", "format": "json"},
        ]
    }
