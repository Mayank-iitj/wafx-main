"""OpenSearch async client."""

from __future__ import annotations

import logging
from typing import Any

from opensearchpy import AsyncOpenSearch

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client: AsyncOpenSearch | None = None


def get_opensearch_client() -> AsyncOpenSearch:
    """Return the shared async OpenSearch client."""
    global _client
    if _client is None:
        hosts = [h.strip() for h in settings.OPENSEARCH_HOSTS.split(",")]
        _client = AsyncOpenSearch(
            hosts=hosts,
            http_auth=(
                settings.OPENSEARCH_USER,
                settings.OPENSEARCH_PASSWORD.get_secret_value(),
            ),
            use_ssl=any(h.startswith("https") for h in hosts),
            verify_certs=settings.OPENSEARCH_VERIFY_CERTS,
            ssl_show_warn=False,
            timeout=30,
            max_retries=3,
            retry_on_timeout=True,
        )
    return _client


async def close_opensearch() -> None:
    global _client
    if _client:
        await _client.close()
        _client = None
        logger.info("OpenSearch client closed.")


# ── Index Management ────────────────────────────────────────────────────────
async def ensure_index(index_name: str, mappings: dict[str, Any]) -> None:
    """Create an index if it does not exist."""
    client = get_opensearch_client()
    exists = await client.indices.exists(index=index_name)
    if not exists:
        await client.indices.create(index=index_name, body=mappings)
        logger.info("Created OpenSearch index: %s", index_name)


async def index_document(
    index: str, doc_id: str, body: dict[str, Any], pipeline: str | None = None
) -> None:
    """Index a single document."""
    client = get_opensearch_client()
    await client.index(index=index, id=doc_id, body=body, pipeline=pipeline)


async def search_documents(index: str, query: dict[str, Any], size: int = 50) -> dict[str, Any]:
    """Execute a search query against an index."""
    client = get_opensearch_client()
    return await client.search(index=index, body=query, size=size)


async def bulk_index(index: str, documents: list[dict[str, Any]]) -> dict[str, Any]:
    """Bulk-index documents."""
    client = get_opensearch_client()
    actions = []
    for doc in documents:
        doc_id = doc.get("id", doc.get("event_id"))
        actions.append({"index": {"_index": index, "_id": doc_id}})
        actions.append(doc)
    return await client.bulk(body=actions)
