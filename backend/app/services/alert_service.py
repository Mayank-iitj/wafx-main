"""Alert service — create, deduplicate, enrich, update, bulk actions."""

from __future__ import annotations

import asyncio
import hashlib
import logging
from datetime import datetime, timezone
from math import ceil
from typing import Any
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Alert, AlertSeverity, AlertStatus
from app.schemas.schemas import AlertCreate, AlertOut, AlertUpdate, PaginatedResponse

logger = logging.getLogger("wafx.alerts")


def _push_alert(org_id: str, alert_data: dict) -> None:
    """Fire-and-forget WebSocket broadcast — never raises."""
    try:
        from app.api.websocket import push_alert_to_org  # local import to avoid circular
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(push_alert_to_org(org_id, alert_data))
    except Exception as exc:
        logger.debug("WS push skipped: %s", exc)


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_alert(self, payload: AlertCreate, org_id: UUID) -> Alert:
        """Create a new alert with deduplication."""
        dedup_hash = self._compute_dedup_hash(payload)

        # Check for existing alert with same hash in last 24h
        existing = await self.db.execute(
            select(Alert).where(
                Alert.dedup_hash == dedup_hash,
                Alert.org_id == org_id,
                Alert.status.in_([AlertStatus.NEW, AlertStatus.IN_PROGRESS]),
            )
        )
        if dup := existing.scalar_one_or_none():
            # Merge source_event_ids into existing alert
            merged_ids = list(set(dup.source_event_ids + payload.source_event_ids))
            dup.source_event_ids = merged_ids
            dup.updated_at = datetime.now(timezone.utc)
            logger.debug("Deduplicated alert %s into %s", payload.title, dup.id)
            return dup

        alert = Alert(
            title=payload.title,
            description=payload.description,
            severity=AlertSeverity(payload.severity),
            source=payload.source,
            rule_id=payload.rule_id,
            mitre_tactic=payload.mitre_tactic,
            mitre_technique=payload.mitre_technique,
            source_event_ids=payload.source_event_ids,
            entities=payload.entities,
            dedup_hash=dedup_hash,
            org_id=org_id,
        )
        self.db.add(alert)
        await self.db.flush()
        await self.db.refresh(alert)
        logger.info("Alert created: %s [%s]", alert.title, alert.severity.value)
        # Broadcast real-time to all org WebSocket subscribers
        _push_alert(str(org_id), AlertOut.model_validate(alert).model_dump(mode="json"))
        return alert

    async def get_alert(self, alert_id: UUID, org_id: UUID) -> Alert | None:
        result = await self.db.execute(
            select(Alert).where(Alert.id == alert_id, Alert.org_id == org_id)
        )
        return result.scalar_one_or_none()

    async def list_alerts(
        self,
        org_id: UUID,
        page: int = 1,
        page_size: int = 50,
        severity: str | None = None,
        status: str | None = None,
        mitre_technique: str | None = None,
    ) -> PaginatedResponse:
        query = select(Alert).where(Alert.org_id == org_id)
        count_query = select(func.count(Alert.id)).where(Alert.org_id == org_id)

        if severity:
            query = query.where(Alert.severity == AlertSeverity(severity))
            count_query = count_query.where(Alert.severity == AlertSeverity(severity))
        if status:
            query = query.where(Alert.status == AlertStatus(status))
            count_query = count_query.where(Alert.status == AlertStatus(status))
        if mitre_technique:
            query = query.where(Alert.mitre_technique == mitre_technique)
            count_query = count_query.where(Alert.mitre_technique == mitre_technique)

        total = (await self.db.execute(count_query)).scalar() or 0
        query = query.order_by(Alert.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        alerts = result.scalars().all()

        return PaginatedResponse(
            items=[AlertOut.model_validate(a) for a in alerts],
            total=total,
            page=page,
            page_size=page_size,
            pages=ceil(total / page_size) if page_size else 1,
        )

    async def update_alert(self, alert_id: UUID, org_id: UUID, payload: AlertUpdate) -> Alert | None:
        alert = await self.get_alert(alert_id, org_id)
        if not alert:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        if "status" in update_data:
            update_data["status"] = AlertStatus(update_data["status"])
        if "severity" in update_data:
            update_data["severity"] = AlertSeverity(update_data["severity"])

        for k, v in update_data.items():
            setattr(alert, k, v)
        alert.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(alert)
        # Broadcast the update in real-time
        _push_alert(str(org_id), AlertOut.model_validate(alert).model_dump(mode="json"))
        return alert

    async def bulk_action(self, alert_ids: list[UUID], action: str, org_id: UUID, params: dict[str, Any] = {}) -> int:
        """Perform bulk status change on alerts."""
        status_map = {
            "close": AlertStatus.CLOSED,
            "resolve": AlertStatus.RESOLVED,
            "false_positive": AlertStatus.FALSE_POSITIVE,
            "in_progress": AlertStatus.IN_PROGRESS,
        }
        if action not in status_map and action != "assign":
            raise ValueError(f"Unknown bulk action: {action}")

        if action == "assign":
            assignee = params.get("assigned_to")
            stmt = (
                update(Alert)
                .where(Alert.id.in_(alert_ids), Alert.org_id == org_id)
                .values(assigned_to=assignee, updated_at=datetime.now(timezone.utc))
            )
        else:
            stmt = (
                update(Alert)
                .where(Alert.id.in_(alert_ids), Alert.org_id == org_id)
                .values(status=status_map[action], updated_at=datetime.now(timezone.utc))
            )

        result = await self.db.execute(stmt)
        return result.rowcount

    async def get_stats(self, org_id: UUID) -> dict[str, Any]:
        """Return alert statistics for the dashboard."""
        base = select(func.count(Alert.id)).where(Alert.org_id == org_id)

        total = (await self.db.execute(base)).scalar() or 0
        critical = (await self.db.execute(
            base.where(Alert.severity == AlertSeverity.CRITICAL)
        )).scalar() or 0

        # By severity
        sev_query = (
            select(Alert.severity, func.count(Alert.id))
            .where(Alert.org_id == org_id)
            .group_by(Alert.severity)
        )
        sev_result = await self.db.execute(sev_query)
        by_severity = {r[0].value: r[1] for r in sev_result.all()}

        # By status
        st_query = (
            select(Alert.status, func.count(Alert.id))
            .where(Alert.org_id == org_id)
            .group_by(Alert.status)
        )
        st_result = await self.db.execute(st_query)
        by_status = {r[0].value: r[1] for r in st_result.all()}

        # Top MITRE techniques
        mitre_query = (
            select(Alert.mitre_technique, func.count(Alert.id).label("cnt"))
            .where(Alert.org_id == org_id, Alert.mitre_technique.isnot(None))
            .group_by(Alert.mitre_technique)
            .order_by(func.count(Alert.id).desc())
            .limit(10)
        )
        mitre_result = await self.db.execute(mitre_query)
        top_mitre = [{"technique": r[0], "count": r[1]} for r in mitre_result.all()]

        return {
            "total_alerts": total,
            "critical_alerts": critical,
            "alerts_by_severity": by_severity,
            "alerts_by_status": by_status,
            "top_mitre_techniques": top_mitre,
        }

    @staticmethod
    def _compute_dedup_hash(payload: AlertCreate) -> str:
        """Hash key fields to detect duplicate alerts."""
        raw = f"{payload.title}|{payload.severity}|{payload.mitre_technique}|{payload.source}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]
