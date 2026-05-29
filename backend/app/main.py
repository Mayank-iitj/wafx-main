from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.routers import auth, jobs, candidates, rankings, upload, copilot, analytics, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("HireMind AI Backend starting...")
    print(f"   AI Provider: {settings.AI_PROVIDER}")
    print(f"   Database: {settings.DATABASE_URL[:30]}...")
    yield
    # Shutdown
    print("HireMind AI Backend shutting down...")


app = FastAPI(
    title="HireMind AI API",
    description="""
    ## Autonomous AI Candidate Intelligence & Ranking System
    
    Production-grade AI recruitment intelligence platform with:
    - Semantic job description understanding
    - Multi-dimensional candidate ranking
    - Hidden gem discovery
    - Explainable AI insights
    - Real-time behavioral signal analysis
    - Conversational recruiter copilot
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(candidates.router, prefix="/candidates", tags=["Candidates"])
app.include_router(rankings.router, prefix="/rankings", tags=["Rankings"])
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(copilot.router, prefix="/copilot", tags=["AI Copilot"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "HireMind AI",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "ai_provider": settings.AI_PROVIDER}
