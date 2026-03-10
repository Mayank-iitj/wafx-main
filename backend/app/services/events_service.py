"""Events Service — ingestion pipeline and OpenSearch-backed search."""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any

from app.core.config import get_settings
from app.core.kafka import get_kafka_producer
from app.core.opensearch import get_opensearch

logger = logging.getLogger("wafx.events")
settings = get_settings()


class EventsService:
    """Handle raw event ingestion and full-text search over OpenSearch."""

    def __init__(self) -> None:
        self._index = f"{settings.OPENSEARCH_INDEX_PREFIX}-events"

    # ── Ingestion ──────────────────────────────────────────────────────────

    async def ingest(self, events: list[dict[str, Any]], org_id: str) -> dict[str, Any]:
        """
        Normalize, deduplicate, and route events:
        1. Add metadata (org_id, received_at, event_id)
        2. Publish to Kafka topic for async detection engine processing
        3. Index into OpenSearch for search
        Returns ingestion summary.
        """
        if not events:
            return {"ingested": 0, "errors": []}

        producer = await get_kafka_producer()
        os_client = await get_opensearch()
        ingested = 0
        errors: list[str] = []

        for raw_event in events:
            try:
                event = self._normalize(raw_event, org_id)
                event_bytes = json.dumps(event, default=str).encode()

                # Publish to Kafka (fire and forget — detection engine consumes)
                if producer:
                    await producer.send_and_wait(settings.KAFKA_RAW_TOPIC, value=event_bytes)

                # Index into OpenSearch for immediate searchability
                if os_client:
                    await os_client.index(
                        index=self._index,
                        body=event,
                        id=event["event_id"],
                    )

                ingested += 1
            except Exception as exc:
                logger.warning("Event ingestion error: %s", exc)
                errors.append(str(exc))

        return {"ingested": ingested, "errors": errors}

    def _normalize(self, raw: dict[str, Any], org_id: str) -> dict[str, Any]:
        """Normalize a raw event into a canonical WAFx event schema."""
        now = datetime.now(timezone.utc).isoformat()

        # Stable deterministic ID based on content + timestamp
        content_hash = hashlib.sha256(
            json.dumps(raw, sort_keys=True, default=str).encode()
        ).hexdigest()[:16]

        event: dict[str, Any] = {
            "event_id": f"evt-{content_hash}",
            "org_id": org_id,
            "received_at": now,
            "timestamp": raw.get("timestamp", now),
            "source": raw.get("source", "unknown"),
            "source_type": raw.get("source_type", "generic"),
            "message": raw.get("message", ""),
            "severity": raw.get("severity", "info"),
            "host": raw.get("host", raw.get("hostname", "")),
            "src_ip": raw.get("src_ip", raw.get("source_ip", "")),
            "dst_ip": raw.get("dst_ip", raw.get("dest_ip", "")),
            "user": raw.get("user", raw.get("username", "")),
            "process": raw.get("process", raw.get("process_name", "")),
            "tags": raw.get("tags", []),
            "raw": raw,
        }
        return event

    # ── Search ─────────────────────────────────────────────────────────────

    async def search(
        self,
        org_id: str,
        query: str | None = None,
        filters: dict[str, Any] | None = None,
        time_from: str | None = None,
        time_to: str | None = None,
        page: int = 1,
        page_size: int = 100,
    ) -> dict[str, Any]:
        """
        Full-text + field search over OpenSearch.
        Falls back gracefully if OpenSearch is unavailable.
        """
        os_client = await get_opensearch()
        if not os_client:
            return {"hits": [], "total": 0, "page": page, "page_size": page_size}

        must: list[dict] = [{"term": {"org_id": org_id}}]

        if query:
            must.append({"multi_match": {"query": query, "fields": ["message", "host", "user", "src_ip", "dst_ip"]}})

        if time_from or time_to:
            range_filter: dict[str, Any] = {}
            if time_from:
                range_filter["gte"] = time_from
            if time_to:
                range_filter["lte"] = time_to
            must.append({"range": {"timestamp": range_filter}})

        if filters:
            for field, value in filters.items():
                if value:
                    must.append({"term": {field: value}})

        os_query = {
            "query": {"bool": {"must": must}},
            "sort": [{"timestamp": {"order": "desc"}}],
            "from": (page - 1) * page_size,
            "size": page_size,
        }

        try:
            resp = await os_client.search(index=self._index, body=os_query)
            hits_raw = resp.get("hits", {})
            total = hits_raw.get("total", {}).get("value", 0)
            hits = [h["_source"] for h in hits_raw.get("hits", [])]
            return {
                "hits": hits,
                "total": total,
                "page": page,
                "page_size": page_size,
            }
        except Exception as exc:
            logger.error("OpenSearch query error: %s", exc)
            return {"hits": [], "total": 0, "page": page, "page_size": page_size, "error": str(exc)}
