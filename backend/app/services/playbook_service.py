"""Playbook Service — CRUD and execution history for SOAR playbooks."""

from __future__ import annotations

import uuid
from math import ceil
from typing import Any

import yaml
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Playbook, PlaybookExecution, PlaybookStatus
from app.schemas.schemas import (
    PaginatedResponse,
    PlaybookCreate,
    PlaybookExecutionOut,
    PlaybookOut,
    PlaybookUpdate,
)
from app.soar.engine import PlaybookEngine


class PlaybookService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_playbook(self, payload: PlaybookCreate, org_id: uuid.UUID) -> Playbook:
        try:
            yaml.safe_load(payload.yaml_content)
        except yaml.YAMLError as exc:
            raise ValueError(f"Invalid YAML in playbook: {exc}") from exc

        pb = Playbook(
            name=payload.name,
            description=payload.description,
            yaml_content=payload.yaml_content,
            trigger_conditions=payload.trigger_conditions or {},
            is_active=payload.is_active,
            org_id=org_id,
        )
        self.db.add(pb)
        await self.db.flush()
        await self.db.refresh(pb)
        return pb

    async def get_playbook(self, playbook_id: uuid.UUID, org_id: uuid.UUID) -> Playbook | None:
        stmt = select(Playbook).where(
            Playbook.id == playbook_id,
            or_(Playbook.org_id == org_id, Playbook.org_id.is_(None)),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_playbooks(
        self,
        org_id: uuid.UUID,
        page: int = 1,
        page_size: int = 50,
        is_active: bool | None = None,
    ) -> PaginatedResponse:
        base_filter = or_(Playbook.org_id == org_id, Playbook.org_id.is_(None))
        stmt = select(Playbook).where(base_filter)
        count_stmt = select(func.count(Playbook.id)).where(base_filter)

        if is_active is not None:
            stmt = stmt.where(Playbook.is_active == is_active)
            count_stmt = count_stmt.where(Playbook.is_active == is_active)

        total = (await self.db.execute(count_stmt)).scalar() or 0
        result = await self.db.execute(
            stmt.order_by(Playbook.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = result.scalars().all()
        return PaginatedResponse(
            items=[PlaybookOut.model_validate(pb) for pb in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=ceil(total / page_size) if page_size else 1,
        )

    async def update_playbook(
        self, playbook_id: uuid.UUID, org_id: uuid.UUID, payload: PlaybookUpdate
    ) -> Playbook | None:
        pb = await self.get_playbook(playbook_id, org_id)
        if not pb:
            return None

        data = payload.model_dump(exclude_unset=True)
        if "yaml_content" in data:
            try:
                yaml.safe_load(data["yaml_content"])
            except yaml.YAMLError as exc:
                raise ValueError(f"Invalid YAML: {exc}") from exc

        for key, value in data.items():
            setattr(pb, key, value)

        await self.db.flush()
        await self.db.refresh(pb)
        return pb

    async def toggle_playbook(
        self, playbook_id: uuid.UUID, org_id: uuid.UUID
    ) -> Playbook | None:
        pb = await self.get_playbook(playbook_id, org_id)
        if not pb:
            return None
        pb.is_active = not pb.is_active
        await self.db.flush()
        await self.db.refresh(pb)
        return pb

    async def execute(
        self,
        playbook_id: uuid.UUID,
        org_id: uuid.UUID,
        alert_context: dict[str, Any] | None = None,
        triggered_by: uuid.UUID | None = None,
    ) -> PlaybookExecution:
        pb = await self.get_playbook(playbook_id, org_id)
        if not pb:
            raise ValueError("Playbook not found")

        context: dict[str, Any] = {}
        if alert_context:
            context["alert"] = alert_context

        engine = PlaybookEngine()
        exec_result = await engine.execute(pb.yaml_content, context)

        status = (
            PlaybookStatus.COMPLETED
            if exec_result.get("status") == "completed"
            else PlaybookStatus.FAILED
        )

        execution = PlaybookExecution(
            playbook_id=pb.id,
            alert_id=alert_context.get("id") if alert_context else None,
            status=status,
            steps_completed=exec_result.get("steps_completed", []),
            result=exec_result,
            triggered_by=triggered_by,
        )
        self.db.add(execution)
        await self.db.flush()
        await self.db.refresh(execution)
        return execution

    async def list_executions(
        self,
        org_id: uuid.UUID,
        playbook_id: uuid.UUID | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> PaginatedResponse:
        """List execution history, optionally filtered by playbook."""
        # Join to Playbook to scope by org
        stmt = (
            select(PlaybookExecution)
            .join(Playbook, PlaybookExecution.playbook_id == Playbook.id)
            .where(or_(Playbook.org_id == org_id, Playbook.org_id.is_(None)))
        )
        count_stmt = (
            select(func.count(PlaybookExecution.id))
            .join(Playbook, PlaybookExecution.playbook_id == Playbook.id)
            .where(or_(Playbook.org_id == org_id, Playbook.org_id.is_(None)))
        )

        if playbook_id:
            stmt = stmt.where(PlaybookExecution.playbook_id == playbook_id)
            count_stmt = count_stmt.where(PlaybookExecution.playbook_id == playbook_id)

        total = (await self.db.execute(count_stmt)).scalar() or 0
        result = await self.db.execute(
            stmt.order_by(PlaybookExecution.started_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = result.scalars().all()
        return PaginatedResponse(
            items=[PlaybookExecutionOut.model_validate(e) for e in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=ceil(total / page_size) if page_size else 1,
        )
