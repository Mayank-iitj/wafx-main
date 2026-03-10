"""WAFx — FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.database import engine, Base
from app.core.redis import close_redis
from app.core.kafka import close_kafka_producer
from app.core.opensearch import close_opensearch
from app.middleware.audit import AuditMiddleware
from app.middleware.rate_limit import limiter

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("wafx")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("WAFx %s starting — env=%s", settings.APP_VERSION, settings.ENVIRONMENT)

    # Create tables if in development (in production use Alembic)
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created (dev mode)")

    yield

    # Shutdown
    await close_redis()
    await close_kafka_producer()
    await close_opensearch()
    await engine.dispose()
    logger.info("WAFx shutdown complete.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-Powered Security Operations & Threat Detection Platform",
        docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan,
    )

    # ── CORS ────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Audit Logging ───────────────────────────────────────────────────
    app.add_middleware(AuditMiddleware)

    # ── Rate Limiting ───────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── Prometheus ──────────────────────────────────────────────────────
    if settings.PROMETHEUS_ENABLED:
        Instrumentator(
            should_group_status_codes=True,
            excluded_handlers=["/health", "/metrics"],
        ).instrument(app).expose(app, endpoint="/metrics")

    # ── API Routers ─────────────────────────────────────────────────────
    from app.api.auth import router as auth_router
    from app.api.alerts import router as alerts_router
    from app.api.incidents import router as incidents_router
    from app.api.rules import router as rules_router
    from app.api.events import router as events_router
    from app.api.dashboard import router as dashboard_router
    from app.api.playbooks import router as playbooks_router
    from app.api.intelligence import router as intel_router
    from app.api.ai import router as ai_router
    from app.api.websocket import router as ws_router

    prefix = "/api/v1"
    app.include_router(auth_router, prefix=prefix)
    app.include_router(alerts_router, prefix=prefix)
    app.include_router(incidents_router, prefix=prefix)
    app.include_router(rules_router, prefix=prefix)
    app.include_router(events_router, prefix=prefix)
    app.include_router(dashboard_router, prefix=prefix)
    app.include_router(playbooks_router, prefix=prefix)
    app.include_router(intel_router, prefix=prefix)
    app.include_router(ai_router, prefix=prefix)
    app.include_router(ws_router, prefix=prefix)

    # ── Health Check ────────────────────────────────────────────────────
    @app.get("/health")
    async def health():
        return {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    # ── Global Exception Handler ────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return app


app = create_app()
