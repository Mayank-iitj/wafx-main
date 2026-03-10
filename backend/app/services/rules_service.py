"""Rules Service — CRUD and management of detection rules."""

from __future__ import annotations

import uuid
from math import ceil
from typing import Any

import yaml
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import AlertSeverity, DetectionRule
from app.schemas.schemas import PaginatedResponse, RuleCreate, RuleOut, RuleUpdate


class RulesService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_rule(self, payload: RuleCreate, org_id: uuid.UUID) -> DetectionRule:
        # Validate YAML before persisting
        try:
            yaml.safe_load(payload.yaml_content)
        except yaml.YAMLError as exc:
            raise ValueError(f"Invalid YAML content: {exc}") from exc

        rule = DetectionRule(
            rule_id=payload.rule_id or f"WAFX-{uuid.uuid4().hex[:8].upper()}",
            name=payload.name,
            description=payload.description,
            yaml_content=payload.yaml_content,
            mitre_tactic=payload.mitre_tactic,
            mitre_technique=payload.mitre_technique,
            severity=AlertSeverity(payload.severity),
            is_active=payload.is_active,
            author=payload.author,
            tags=payload.tags or [],
            org_id=org_id,
        )
        self.db.add(rule)
        await self.db.flush()
        await self.db.refresh(rule)
        return rule

    async def get_rule(self, rule_id: uuid.UUID, org_id: uuid.UUID) -> DetectionRule | None:
        stmt = select(DetectionRule).where(
            DetectionRule.id == rule_id,
            or_(DetectionRule.org_id == org_id, DetectionRule.org_id.is_(None)),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_rules(
        self,
        org_id: uuid.UUID,
        page: int = 1,
        page_size: int = 50,
        severity: str | None = None,
        is_active: bool | None = None,
        mitre_technique: str | None = None,
        search: str | None = None,
    ) -> PaginatedResponse:
        base_filter = or_(DetectionRule.org_id == org_id, DetectionRule.org_id.is_(None))
        stmt = select(DetectionRule).where(base_filter)
        count_stmt = select(func.count(DetectionRule.id)).where(base_filter)

        if severity:
            stmt = stmt.where(DetectionRule.severity == AlertSeverity(severity))
            count_stmt = count_stmt.where(DetectionRule.severity == AlertSeverity(severity))
        if is_active is not None:
            stmt = stmt.where(DetectionRule.is_active == is_active)
            count_stmt = count_stmt.where(DetectionRule.is_active == is_active)
        if mitre_technique:
            stmt = stmt.where(DetectionRule.mitre_technique == mitre_technique)
            count_stmt = count_stmt.where(DetectionRule.mitre_technique == mitre_technique)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(
                DetectionRule.name.ilike(like) | DetectionRule.rule_id.ilike(like)
            )
            count_stmt = count_stmt.where(
                DetectionRule.name.ilike(like) | DetectionRule.rule_id.ilike(like)
            )

        total = (await self.db.execute(count_stmt)).scalar() or 0
        result = await self.db.execute(
            stmt.order_by(DetectionRule.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = result.scalars().all()
        return PaginatedResponse(
            items=[RuleOut.model_validate(r) for r in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=ceil(total / page_size) if page_size else 1,
        )

    async def update_rule(
        self, rule_id: uuid.UUID, org_id: uuid.UUID, payload: RuleUpdate
    ) -> DetectionRule | None:
        rule = await self.get_rule(rule_id, org_id)
        if not rule:
            return None

        data = payload.model_dump(exclude_unset=True)
        if "yaml_content" in data:
            try:
                yaml.safe_load(data["yaml_content"])
            except yaml.YAMLError as exc:
                raise ValueError(f"Invalid YAML: {exc}") from exc

        for key, value in data.items():
            if key == "severity" and value:
                value = AlertSeverity(value)
            setattr(rule, key, value)

        await self.db.flush()
        await self.db.refresh(rule)
        return rule

    async def toggle_rule(self, rule_id: uuid.UUID, org_id: uuid.UUID) -> DetectionRule | None:
        rule = await self.get_rule(rule_id, org_id)
        if not rule:
            return None
        rule.is_active = not rule.is_active
        await self.db.flush()
        await self.db.refresh(rule)
        return rule

    async def delete_rule(self, rule_id: uuid.UUID, org_id: uuid.UUID) -> bool:
        rule = await self.get_rule(rule_id, org_id)
        if not rule:
            return False
        await self.db.delete(rule)
        return True

    async def get_stats(self, org_id: uuid.UUID) -> dict[str, Any]:
        base = or_(DetectionRule.org_id == org_id, DetectionRule.org_id.is_(None))
        total = (await self.db.execute(select(func.count(DetectionRule.id)).where(base))).scalar() or 0
        active = (
            await self.db.execute(
                select(func.count(DetectionRule.id)).where(base, DetectionRule.is_active.is_(True))
            )
        ).scalar() or 0

        # Count by severity
        by_severity: dict[str, int] = {}
        for sev in AlertSeverity:
            cnt = (
                await self.db.execute(
                    select(func.count(DetectionRule.id)).where(
                        base, DetectionRule.severity == sev
                    )
                )
            ).scalar() or 0
            by_severity[sev.value] = cnt

        return {
            "total": total,
            "active": active,
            "inactive": total - active,
            "by_severity": by_severity,
        }
