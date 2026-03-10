"""WAFx Core Configuration — loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="WAFX_",
        case_sensitive=False,
    )

    # ── App ──────────────────────────────────────────────────────────────
    APP_NAME: str = "WAFx"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # ── Security ─────────────────────────────────────────────────────────
    SECRET_KEY: SecretStr = SecretStr("CHANGE-ME-IN-PRODUCTION")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12

    # ── OAuth2 ───────────────────────────────────────────────────────────
    OAUTH2_GITHUB_CLIENT_ID: str = ""
    OAUTH2_GITHUB_CLIENT_SECRET: SecretStr = SecretStr("")
    OAUTH2_GOOGLE_CLIENT_ID: str = ""
    OAUTH2_GOOGLE_CLIENT_SECRET: SecretStr = SecretStr("")

    # ── PostgreSQL ───────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://wafx:wafx@localhost:5432/wafx"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30

    # ── Redis ────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_MAX_CONNECTIONS: int = 50

    # ── Kafka ────────────────────────────────────────────────────────────
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_CONSUMER_GROUP: str = "wafx-backend"
    KAFKA_RAW_TOPIC: str = "wafx.events.raw"
    KAFKA_NORMALIZED_TOPIC: str = "wafx.events.normalized"
    KAFKA_ALERT_TOPIC: str = "wafx.alerts"

    # ── OpenSearch ───────────────────────────────────────────────────────
    OPENSEARCH_HOSTS: str = "https://localhost:9200"
    OPENSEARCH_USER: str = "admin"
    OPENSEARCH_PASSWORD: SecretStr = SecretStr("admin")
    OPENSEARCH_INDEX_PREFIX: str = "wafx"
    OPENSEARCH_VERIFY_CERTS: bool = False

    # ── S3 / Object Storage ──────────────────────────────────────────────
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minio"
    S3_SECRET_KEY: SecretStr = SecretStr("minio123")
    S3_BUCKET_FORENSICS: str = "wafx-forensics"
    S3_REGION: str = "us-east-1"

    # ── Threat Intelligence ──────────────────────────────────────────────
    ABUSEIPDB_API_KEY: SecretStr = SecretStr("")
    OTX_API_KEY: SecretStr = SecretStr("")
    VIRUSTOTAL_API_KEY: SecretStr = SecretStr("")

    # ── AI / LLM ─────────────────────────────────────────────────────────
    LLM_PROVIDER: str = "openai"
    LLM_MODEL: str = "gpt-4o"
    LLM_API_KEY: SecretStr = SecretStr("")
    LLM_BASE_URL: str | None = None
    LLM_MAX_TOKENS: int = 4096

    # ── Rate Limiting ────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 120

    # ── SMTP (Notifications) ────────────────────────────────────────────
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: SecretStr = SecretStr("")
    SMTP_FROM: str = "noreply@wafx.io"

    # ── Slack (Notifications) ────────────────────────────────────────────
    SLACK_WEBHOOK_URL: str = ""

    # ── Observability ────────────────────────────────────────────────────
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
    PROMETHEUS_ENABLED: bool = True


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
