"""Threat Intelligence API — IOC management, enrichment."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.core.dependencies import AnalystUser, CurrentUser, DBSession
from app.intelligence.feeds import ThreatIntelService
from app.models.models import IOCType, ThreatIntel
from app.schemas.schemas import IOCCreate, IOCOut, PaginatedResponse

from math import ceil

router = APIRouter(prefix="/intelligence", tags=["Threat Intelligence"])


@router.post("/iocs", response_model=IOCOut, status_code=status.HTTP_201_CREATED)
async def create_ioc(payload: IOCCreate, user: AnalystUser, db: DBSession):
    ioc = ThreatIntel(
        ioc_type=IOCType(payload.ioc_type),
        ioc_value=payload.ioc_value,
        source=payload.source,
        confidence=payload.confidence,
        tags=payload.tags,
        context=payload.context,
        org_id=user.org_id,
    )
    db.add(ioc)
    await db.flush()
    return ioc


@router.get("/iocs", response_model=PaginatedResponse)
async def list_iocs(
    user: CurrentUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ioc_type: str | None = None,
):
    query = select(ThreatIntel).where(
        (ThreatIntel.org_id == user.org_id) | (ThreatIntel.org_id.is_(None))
    )
    count_q = select(func.count(ThreatIntel.id)).where(
        (ThreatIntel.org_id == user.org_id) | (ThreatIntel.org_id.is_(None))
    )

    if ioc_type:
        query = query.where(ThreatIntel.ioc_type == IOCType(ioc_type))
        count_q = count_q.where(ThreatIntel.ioc_type == IOCType(ioc_type))

    total = (await db.execute(count_q)).scalar() or 0
    result = await db.execute(
        query.order_by(ThreatIntel.last_seen.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    items = result.scalars().all()

    return PaginatedResponse(
        items=[IOCOut.model_validate(i) for i in items],
        total=total, page=page, page_size=page_size,
        pages=ceil(total / page_size) if page_size else 1,
    )


@router.post("/enrich/ip/{ip}")
async def enrich_ip(ip: str, user: AnalystUser):
    """Enrich an IP address against all configured TI feeds."""
    svc = ThreatIntelService()
    return await svc.enrich_ip(ip)


@router.post("/enrich/domain/{domain}")
async def enrich_domain(domain: str, user: AnalystUser):
    svc = ThreatIntelService()
    return await svc.enrich_domain(domain)


@router.post("/enrich/hash/{file_hash}")
async def enrich_hash(file_hash: str, user: AnalystUser):
    svc = ThreatIntelService()
    return await svc.enrich_hash(file_hash)
