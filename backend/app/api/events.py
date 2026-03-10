"""Event ingestion & search API — accept logs, proxy search to OpenSearch."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, status

from app.core.dependencies import AnalystUser, CurrentUser, DBSession
from app.core.kafka import publish_event
from app.core.opensearch import search_documents
from app.core.config import get_settings
from app.schemas.schemas import EventIngest, EventSearchRequest

logger = logging.getLogger("wafx.events")
settings = get_settings()

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_events(payload: EventIngest, user: AnalystUser):
    """Accept a batch of events and publish to Kafka for processing."""
    accepted = 0
    for event in payload.events:
        event_envelope = {
            "event_id": str(uuid.uuid4()),
            "source_type": payload.source_type,
            "source_name": payload.source_name,
            "org_id": str(user.org_id),
            "ingested_at": datetime.now(timezone.utc).isoformat(),
            "raw": event,
        }
        await publish_event(
            topic=settings.KAFKA_RAW_TOPIC,
            value=event_envelope,
            key=f"{user.org_id}:{payload.source_name}",
        )
        accepted += 1

    logger.info(
        "Ingested %d events from %s/%s (org=%s)",
        accepted, payload.source_type, payload.source_name, user.org_id,
    )
    return {"accepted": accepted}


@router.post("/search")
async def search_events(payload: EventSearchRequest, user: CurrentUser):
    """Search logs in OpenSearch."""
    index = f"{settings.OPENSEARCH_INDEX_PREFIX}-events-*"

    must_clauses = []

    # Full-text query
    if payload.query and payload.query != "*":
        must_clauses.append({"query_string": {"query": payload.query}})

    # Time range
    range_filter: dict = {}
    if payload.time_from:
        range_filter["gte"] = payload.time_from.isoformat()
    if payload.time_to:
        range_filter["lte"] = payload.time_to.isoformat()
    if range_filter:
        must_clauses.append({"range": {"@timestamp": range_filter}})

    # Source filter
    if payload.source:
        must_clauses.append({"term": {"source_name.keyword": payload.source}})

    # Org filter (always)
    must_clauses.append({"term": {"org_id.keyword": str(user.org_id)}})

    query = {
        "query": {"bool": {"must": must_clauses}} if must_clauses else {"match_all": {}},
        "sort": [{payload.sort_field: {"order": payload.sort_order}}],
    }

    result = await search_documents(index, query, size=payload.size)
    hits = result.get("hits", {})

    return {
        "total": hits.get("total", {}).get("value", 0),
        "events": [h["_source"] for h in hits.get("hits", [])],
    }
