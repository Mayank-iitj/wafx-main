"""Playbooks API — manage and trigger SOAR playbooks."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.core.dependencies import AdminUser, AnalystUser, CurrentUser, DBSession
from app.models.models import Alert, Playbook, PlaybookExecution, PlaybookStatus
from app.schemas.schemas import PlaybookCreate, PlaybookOut, PlaybookExecutionOut, PaginatedResponse
from app.soar.engine import PlaybookEngine

router = APIRouter(prefix="/playbooks", tags=["Playbooks"])

from math import ceil


@router.post("/", response_model=PlaybookOut, status_code=status.HTTP_201_CREATED)
async def create_playbook(payload: PlaybookCreate, user: AdminUser, db: DBSession):
    import yaml
    try:
        yaml.safe_load(payload.yaml_content)
    except yaml.YAMLError as e:
        raise HTTPException(status_code=422, detail=f"Invalid YAML: {e}")

    pb = Playbook(
        name=payload.name,
        description=payload.description,
        yaml_content=payload.yaml_content,
        trigger_conditions=payload.trigger_conditions,
        is_active=payload.is_active,
        org_id=user.org_id,
    )
    db.add(pb)
    await db.flush()
    return pb


@router.get("/", response_model=PaginatedResponse)
async def list_playbooks(
    user: CurrentUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    query = select(Playbook).where(
        (Playbook.org_id == user.org_id) | (Playbook.org_id.is_(None))
    )
    count_q = select(func.count(Playbook.id)).where(
        (Playbook.org_id == user.org_id) | (Playbook.org_id.is_(None))
    )
    total = (await db.execute(count_q)).scalar() or 0
    result = await db.execute(
        query.order_by(Playbook.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    items = result.scalars().all()
    return PaginatedResponse(
        items=[PlaybookOut.model_validate(p) for p in items],
        total=total, page=page, page_size=page_size,
        pages=ceil(total / page_size) if page_size else 1,
    )


@router.post("/{playbook_id}/execute", response_model=PlaybookExecutionOut)
async def execute_playbook(
    playbook_id: UUID,
    alert_id: UUID | None = None,
    user: AnalystUser = None,
    db: DBSession = None,
):
    result = await db.execute(select(Playbook).where(Playbook.id == playbook_id))
    pb = result.scalar_one_or_none()
    if not pb:
        raise HTTPException(status_code=404, detail="Playbook not found")

    # Build execution context from alert
    context: dict = {}
    if alert_id:
        alert_result = await db.execute(
            select(Alert).where(Alert.id == alert_id, Alert.org_id == user.org_id)
        )
        alert = alert_result.scalar_one_or_none()
        if alert:
            from app.schemas.schemas import AlertOut
            context["alert"] = AlertOut.model_validate(alert).model_dump()

    engine = PlaybookEngine()
    exec_result = await engine.execute(pb.yaml_content, context)

    # Record execution
    execution = PlaybookExecution(
        playbook_id=pb.id,
        alert_id=alert_id,
        status=PlaybookStatus.COMPLETED if exec_result["status"] == "completed" else PlaybookStatus.FAILED,
        steps_completed=exec_result["steps_completed"],
        result=exec_result,
        triggered_by=user.id,
    )
    db.add(execution)
    await db.flush()
    return execution
