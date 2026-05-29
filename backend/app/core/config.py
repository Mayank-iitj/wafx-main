from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "HireMind AI"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "hiremind-super-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://hiremind.ai",
    ]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./hiremind.db"
    # For production: "postgresql+asyncpg://user:pass@localhost/hiremind"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Vector DB (Qdrant)
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "candidate_embeddings"

    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "hiremind123"

    # AI Providers (optional — system uses mock if not set)
    AI_PROVIDER: str = "groq"  # "groq" | "openai" | "gemini" | "claude" | "mock"
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # File upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"  # or "text-embedding-3-large"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
