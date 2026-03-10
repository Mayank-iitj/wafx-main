"""Incident service — lifecycle management, timeline, evidence, notes."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from math import ceil
from typing import Any
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Alert, Incident, IncidentNote, IncidentStatus, AlertSeverity
from app.schemas.schemas import (
    IncidentCreate,
    IncidentOut,
    IncidentUpdate,
    NoteCreate,
    NoteOut,
    PaginatedResponse,
)

logger = logging.getLogger("wafx.incidents")


class IncidentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_incident(self, payload: IncidentCreate, org_id: UUID, user_id: UUID) -> Incident:
        incident = Incident(
            title=payload.title,
            description=payload.description,
            severity=AlertSeverity(payload.severity),
            org_id=org_id,
            tags=payload.tags,
            timeline=[{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "incident_created",
                "user_id": str(user_id),
                "details": f"Incident created with {len(payload.alert_ids)} linked alerts",
            }],
        )
        self.db.add(incident)
        await self.db.flush()

        # Link alerts to incident
        if payload.alert_ids:
            await self.db.execute(
                update(Alert)
                .where(Alert.id.in_(payload.alert_ids), Alert.org_id == org_id)
                .values(incident_id=incident.id)
            )

        logger.info("Incident created: %s [%s]", incident.title, incident.id)
        return incident

    async def get_incident(self, incident_id: UUID, org_id: UUID) -> Incident | None:
        result = await self.db.execute(
            select(Incident).where(Incident.id == incident_id, Incident.org_id == org_id)
        )
        return result.scalar_one_or_none()

    async def list_incidents(
        self,
        org_id: UUID,
        page: int = 1,
        page_size: int = 50,
        status: str | None = None,
    ) -> PaginatedResponse:
        query = select(Incident).where(Incident.org_id == org_id)
        count_q = select(func.count(Incident.id)).where(Incident.org_id == org_id)

        if status:
            query = query.where(Incident.status == IncidentStatus(status))
            count_q = count_q.where(Incident.status == IncidentStatus(status))

        total = (await self.db.execute(count_q)).scalar() or 0
        query = query.order_by(Incident.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        items = result.scalars().all()

        return PaginatedResponse(
            items=[IncidentOut.model_validate(i) for i in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=ceil(total / page_size) if page_size else 1,
        )

    async def update_incident(
        self, incident_id: UUID, org_id: UUID, payload: IncidentUpdate, user_id: UUID
    ) -> Incident | None:
        incident = await self.get_incident(incident_id, org_id)
        if not incident:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        changes = []

        if "status" in update_data:
            old_status = incident.status.value
            update_data["status"] = IncidentStatus(update_data["status"])
            changes.append(f"Status: {old_status} → {update_data['status'].value}")
            if update_data["status"] in (IncidentStatus.REMEDIATED, IncidentStatus.CLOSED):
                update_data["resolved_at"] = datetime.now(timezone.utc)

        if "severity" in update_data:
            update_data["severity"] = AlertSeverity(update_data["severity"])
            changes.append(f"Severity: → {update_data['severity'].value}")

        if "assigned_to" in update_data:
            changes.append(f"Assigned to: {update_data['assigned_to']}")

        for k, v in update_data.items():
            setattr(incident, k, v)
        incident.updated_at = datetime.now(timezone.utc)

        # Append to timeline
        if changes:
            timeline = list(incident.timeline or [])
            timeline.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "incident_updated",
                "user_id": str(user_id),
                "details": "; ".join(changes),
            })
            incident.timeline = timeline

        return incident

    async def add_note(self, incident_id: UUID, org_id: UUID, user_id: UUID, payload: NoteCreate) -> IncidentNote:
        incident = await self.get_incident(incident_id, org_id)
        if not incident:
            raise ValueError("Incident not found")

        note = IncidentNote(
            incident_id=incident_id,
            author_id=user_id,
            content=payload.content,
        )
        self.db.add(note)
        await self.db.flush()

        # Append note to timeline
        timeline = list(incident.timeline or [])
        timeline.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": "note_added",
            "user_id": str(user_id),
            "details": payload.content[:200],
        })
        incident.timeline = timeline

        return note

    async def add_evidence(
        self, incident_id: UUID, org_id: UUID, user_id: UUID, evidence_type: str, url: str, description: str
    ) -> Incident | None:
        incident = await self.get_incident(incident_id, org_id)
        if not incident:
            return None

        evidence = list(incident.evidence or [])
        evidence.append({
            "type": evidence_type,
            "url": url,
            "description": description,
            "added_by": str(user_id),
            "added_at": datetime.now(timezone.utc).isoformat(),
        })
        incident.evidence = evidence

        timeline = list(incident.timeline or [])
        timeline.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": "evidence_added",
            "user_id": str(user_id),
            "details": f"Evidence: {evidence_type} — {description[:100]}",
        })
        incident.timeline = timeline
        return incident

    async def get_open_count(self, org_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(Incident.id)).where(
                Incident.org_id == org_id,
                Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING]),
            )
        )
        return result.scalar() or 0
