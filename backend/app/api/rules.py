"""Detection Rules API — CRUD, enable/disable."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AdminUser, AnalystUser, CurrentUser, DBSession
from app.models.models import DetectionRule, AlertSeverity
from app.schemas.schemas import RuleCreate, RuleOut, RuleUpdate, PaginatedResponse

router = APIRouter(prefix="/rules", tags=["Detection Rules"])


@router.post("/", response_model=RuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule(payload: RuleCreate, user: AnalystUser, db: DBSession):
    # Validate YAML content
    import yaml
    try:
        parsed = yaml.safe_load(payload.yaml_content)
        if not isinstance(parsed, dict):
            raise ValueError("YAML must be a mapping")
    except yaml.YAMLError as e:
        raise HTTPException(status_code=422, detail=f"Invalid YAML: {e}")

    rule = DetectionRule(
        rule_id=payload.rule_id,
        name=payload.name,
        description=payload.description,
        yaml_content=payload.yaml_content,
        mitre_tactic=payload.mitre_tactic,
        mitre_technique=payload.mitre_technique,
        severity=AlertSeverity(payload.severity),
        is_active=payload.is_active,
        author=user.full_name,
        tags=payload.tags,
        org_id=user.org_id,
    )
    db.add(rule)
    await db.flush()
    return rule


@router.get("/", response_model=PaginatedResponse)
async def list_rules(
    user: CurrentUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    active_only: bool = False,
):
    query = select(DetectionRule).where(
        (DetectionRule.org_id == user.org_id) | (DetectionRule.org_id.is_(None))
    )
    count_q = select(func.count(DetectionRule.id)).where(
        (DetectionRule.org_id == user.org_id) | (DetectionRule.org_id.is_(None))
    )
    if active_only:
        query = query.where(DetectionRule.is_active.is_(True))
        count_q = count_q.where(DetectionRule.is_active.is_(True))

    total = (await db.execute(count_q)).scalar() or 0
    from math import ceil
    result = await db.execute(
        query.order_by(DetectionRule.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rules = result.scalars().all()

    return PaginatedResponse(
        items=[RuleOut.model_validate(r) for r in rules],
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if page_size else 1,
    )


@router.get("/{rule_id}", response_model=RuleOut)
async def get_rule(rule_id: UUID, user: CurrentUser, db: DBSession):
    result = await db.execute(select(DetectionRule).where(DetectionRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.patch("/{rule_id}", response_model=RuleOut)
async def update_rule(rule_id: UUID, payload: RuleUpdate, user: AnalystUser, db: DBSession):
    result = await db.execute(select(DetectionRule).where(DetectionRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    data = payload.model_dump(exclude_unset=True)
    if "yaml_content" in data:
        import yaml
        try:
            yaml.safe_load(data["yaml_content"])
        except yaml.YAMLError as e:
            raise HTTPException(status_code=422, detail=f"Invalid YAML: {e}")
    if "severity" in data:
        data["severity"] = AlertSeverity(data["severity"])

    for k, v in data.items():
        setattr(rule, k, v)
    return rule


@router.post("/{rule_id}/toggle")
async def toggle_rule(rule_id: UUID, user: AdminUser, db: DBSession):
    result = await db.execute(select(DetectionRule).where(DetectionRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.is_active = not rule.is_active
    return {"rule_id": str(rule.id), "is_active": rule.is_active}
