"""Alerts API — CRUD, bulk ops, stats."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import AnalystUser, CurrentUser, DBSession
from app.schemas.schemas import AlertBulkAction, AlertCreate, AlertOut, AlertUpdate, PaginatedResponse
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.post("/", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
async def create_alert(payload: AlertCreate, user: AnalystUser, db: DBSession):
    svc = AlertService(db)
    alert = await svc.create_alert(payload, org_id=user.org_id)
    return alert


@router.get("/", response_model=PaginatedResponse)
async def list_alerts(
    user: CurrentUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    severity: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    mitre_technique: str | None = None,
):
    svc = AlertService(db)
    return await svc.list_alerts(
        org_id=user.org_id,
        page=page,
        page_size=page_size,
        severity=severity,
        status=status_filter,
        mitre_technique=mitre_technique,
    )


@router.get("/stats")
async def alert_stats(user: CurrentUser, db: DBSession):
    svc = AlertService(db)
    return await svc.get_stats(user.org_id)


@router.get("/{alert_id}", response_model=AlertOut)
async def get_alert(alert_id: UUID, user: CurrentUser, db: DBSession):
    svc = AlertService(db)
    alert = await svc.get_alert(alert_id, user.org_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.patch("/{alert_id}", response_model=AlertOut)
async def update_alert(alert_id: UUID, payload: AlertUpdate, user: AnalystUser, db: DBSession):
    svc = AlertService(db)
    alert = await svc.update_alert(alert_id, user.org_id, payload)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.post("/bulk", status_code=status.HTTP_200_OK)
async def bulk_action(payload: AlertBulkAction, user: AnalystUser, db: DBSession):
    svc = AlertService(db)
    count = await svc.bulk_action(payload.alert_ids, payload.action, user.org_id, payload.params)
    return {"updated": count}
