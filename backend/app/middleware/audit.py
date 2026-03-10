"""Audit logging middleware — records all mutating API operations."""

from __future__ import annotations

import json
import logging
import time
from uuid import UUID

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.database import async_session_factory
from app.models.models import AuditLog

logger = logging.getLogger("wafx.audit")

_MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class AuditMiddleware(BaseHTTPMiddleware):
    """Log every mutating API request to the audit_logs table."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method not in _MUTATING_METHODS:
            return await call_next(request)

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        # Extract user ID from request state (set by auth dependency)
        user_id = getattr(request.state, "user_id", None)

        # Parse resource from path
        path_parts = request.url.path.strip("/").split("/")
        resource_type = path_parts[1] if len(path_parts) > 1 else "unknown"
        resource_id = path_parts[2] if len(path_parts) > 2 else None

        try:
            async with async_session_factory() as session:
                log_entry = AuditLog(
                    user_id=user_id,
                    action=f"{request.method} {request.url.path}",
                    resource_type=resource_type,
                    resource_id=resource_id,
                    details={
                        "status_code": response.status_code,
                        "duration_ms": round(duration_ms, 2),
                        "query_params": dict(request.query_params),
                    },
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent", "")[:512],
                )
                session.add(log_entry)
                await session.commit()
        except Exception:
            logger.exception("Failed to write audit log")

        return response
