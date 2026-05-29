import asyncio
from typing import AsyncGenerator
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.security import get_current_user

router = APIRouter()

COPILOT_RESPONSES = {
    "rank": "Based on the current rankings for **Senior ML Engineer**, Aria Chen leads with a **94% fit score** primarily due to her direct RLHF experience at OpenAI and exceptional behavioral signals — 145 commits/month and 23 OSS contributions. Marcus Rivera follows at 89% with Kaggle Grandmaster status and deep research background.",
    "gem": "I found **8 hidden gems** in this candidate pool. The most promising is **Priya Nair**, a Physics PhD with a 99% learning velocity score. Her GitHub activity (210 commits/month) is the highest in the pool. While she lacks LangChain/RAG experience, our models predict she'll close these gaps within 6-8 weeks given her demonstrated autodidact ability.",
    "startup": "For startup-minded engineers, I recommend filtering by: **Adaptability Score > 0.85**, Behavioral Momentum > 0.80, and tenure pattern showing comfort with ambiguity. This surfaces 12 candidates who thrive in fast-moving environments. Sofia Martinez and Priya Nair score highest on this composite profile.",
    "genai": "Candidates who can transition into GenAI: Look for strong mathematical foundations + high curiosity scores. **Marcus Rivera** (Kaggle Grandmaster, JAX expertise) and **Priya Nair** (Physics PhD, HPC background) are top transition candidates. Their computational thinking directly maps to LLM architecture understanding.",
    "default": "I've analyzed your query against the full candidate database. Based on the semantic match across 9 scoring dimensions, here are my findings: The top candidates show strong alignment with your requirements. Would you like me to deep-dive into any specific candidate or refine the search criteria?",
}


def get_response_for_query(query: str) -> str:
    q_lower = query.lower()
    if any(w in q_lower for w in ["rank", "above", "why", "#1", "top"]):
        return COPILOT_RESPONSES["rank"]
    if any(w in q_lower for w in ["gem", "hidden", "underrated", "potential"]):
        return COPILOT_RESPONSES["gem"]
    if any(w in q_lower for w in ["startup", "fast", "adaptable", "autonomous"]):
        return COPILOT_RESPONSES["startup"]
    if any(w in q_lower for w in ["genai", "llm", "transition", "pivot", "ai"]):
        return COPILOT_RESPONSES["genai"]
    return COPILOT_RESPONSES["default"]


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    job_id: str = None
    stream: bool = True


async def stream_response(text: str) -> AsyncGenerator[str, None]:
    """Stream response character by character with SSE format."""
    for char in text:
        yield f"data: {char}\n\n"
        await asyncio.sleep(0.015)
    yield "data: [DONE]\n\n"


@router.post("/chat", summary="Send message to AI Recruiter Copilot")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    response = get_response_for_query(request.message)

    if request.stream:
        return StreamingResponse(
            stream_response(response),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    return {
        "message": response,
        "session_id": request.session_id,
        "model": "hiremind-rag-v2",
        "sources": ["candidate_profiles", "job_intelligence", "behavioral_signals"],
    }


@router.get("/suggestions", summary="Get suggested queries for the copilot")
async def get_suggestions(current_user: dict = Depends(get_current_user)):
    return {
        "suggestions": [
            "Why is Aria Chen ranked #1?",
            "Find startup-minded engineers",
            "Show hidden gem candidates",
            "Who can transition into GenAI?",
            "Which candidates have RLHF experience?",
            "Compare top 3 candidates by leadership",
        ]
    }
