"""Dashboard API — aggregated stats and real-time metrics."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.dependencies import CurrentUser, DBSession
from app.services.alert_service import AlertService
from app.services.incident_service import IncidentService
from app.schemas.schemas import AlertOut, DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def dashboard_stats(user: CurrentUser, db: DBSession):
    alert_svc = AlertService(db)
    incident_svc = IncidentService(db)

    stats = await alert_svc.get_stats(user.org_id)
    open_incidents = await incident_svc.get_open_count(user.org_id)

    # Get recent alerts
    recent = await alert_svc.list_alerts(user.org_id, page=1, page_size=10)

    return DashboardStats(
        total_alerts=stats["total_alerts"],
        critical_alerts=stats["critical_alerts"],
        open_incidents=open_incidents,
        events_24h=0,  # Populated from OpenSearch in production
        alerts_by_severity=stats["alerts_by_severity"],
        alerts_by_status=stats["alerts_by_status"],
        top_mitre_techniques=stats["top_mitre_techniques"],
        recent_alerts=recent.items,
    )
