"""Incidents API — lifecycle, notes, evidence."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import AnalystUser, CurrentUser, DBSession
from app.schemas.schemas import (
    IncidentCreate,
    IncidentOut,
    IncidentUpdate,
    NoteCreate,
    NoteOut,
    PaginatedResponse,
)
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.post("/", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
async def create_incident(payload: IncidentCreate, user: AnalystUser, db: DBSession):
    svc = IncidentService(db)
    incident = await svc.create_incident(payload, org_id=user.org_id, user_id=user.id)
    return incident


@router.get("/", response_model=PaginatedResponse)
async def list_incidents(
    user: CurrentUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    status_filter: str | None = Query(None, alias="status"),
):
    svc = IncidentService(db)
    return await svc.list_incidents(user.org_id, page, page_size, status_filter)


@router.get("/{incident_id}", response_model=IncidentOut)
async def get_incident(incident_id: UUID, user: CurrentUser, db: DBSession):
    svc = IncidentService(db)
    incident = await svc.get_incident(incident_id, user.org_id)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentOut)
async def update_incident(incident_id: UUID, payload: IncidentUpdate, user: AnalystUser, db: DBSession):
    svc = IncidentService(db)
    incident = await svc.update_incident(incident_id, user.org_id, payload, user.id)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return incident


@router.post("/{incident_id}/notes", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
async def add_note(incident_id: UUID, payload: NoteCreate, user: AnalystUser, db: DBSession):
    svc = IncidentService(db)
    try:
        note = await svc.add_note(incident_id, user.org_id, user.id, payload)
        return note
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{incident_id}/evidence")
async def add_evidence(
    incident_id: UUID,
    evidence_type: str,
    url: str,
    description: str,
    user: AnalystUser,
    db: DBSession,
):
    svc = IncidentService(db)
    incident = await svc.add_evidence(incident_id, user.org_id, user.id, evidence_type, url, description)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return {"status": "evidence_added"}
