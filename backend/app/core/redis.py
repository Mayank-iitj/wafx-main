"""Redis async connection pool."""

from __future__ import annotations

import redis.asyncio as aioredis

from app.core.config import get_settings

settings = get_settings()

redis_pool = aioredis.ConnectionPool.from_url(
    settings.REDIS_URL,
    max_connections=settings.REDIS_MAX_CONNECTIONS,
    decode_responses=True,
)

redis_client = aioredis.Redis(connection_pool=redis_pool)


async def get_redis() -> aioredis.Redis:
    """Return the shared async Redis client."""
    return redis_client


async def close_redis() -> None:
    await redis_client.aclose()
    await redis_pool.aclose()
