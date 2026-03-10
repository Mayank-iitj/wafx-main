"""AI API — query the security assistant."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.ai.assistant import AIAssistant
from app.core.dependencies import AnalystUser, DBSession
from app.models.models import Alert, Incident
from app.schemas.schemas import AIQueryRequest, AIQueryResponse

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/query", response_model=AIQueryResponse)
async def ai_query(payload: AIQueryRequest, user: AnalystUser, db: DBSession):
    """Ask the AI assistant a security question, optionally with alert/incident context."""
    assistant = AIAssistant()
    context: dict = {}

    if payload.context_alert_id:
        result = await db.execute(
            select(Alert).where(Alert.id == payload.context_alert_id, Alert.org_id == user.org_id)
        )
        alert = result.scalar_one_or_none()
        if alert:
            from app.schemas.schemas import AlertOut
            context["alert"] = AlertOut.model_validate(alert).model_dump()

    if payload.context_incident_id:
        result = await db.execute(
            select(Incident).where(Incident.id == payload.context_incident_id, Incident.org_id == user.org_id)
        )
        incident = result.scalar_one_or_none()
        if incident:
            from app.schemas.schemas import IncidentOut
            context["incident"] = IncidentOut.model_validate(incident).model_dump()

    try:
        response = await assistant.investigate(payload.query, context)
        return AIQueryResponse(
            response=response["response"],
            sources=response.get("sources", []),
            suggested_actions=response.get("suggested_actions", []),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(exc)}")


@router.post("/analyze-alert/{alert_id}", response_model=AIQueryResponse)
async def analyze_alert(alert_id: str, user: AnalystUser, db: DBSession):
    from uuid import UUID
    result = await db.execute(
        select(Alert).where(Alert.id == UUID(alert_id), Alert.org_id == user.org_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    from app.schemas.schemas import AlertOut
    alert_data = AlertOut.model_validate(alert).model_dump()

    assistant = AIAssistant()
    try:
        response = await assistant.analyze_alert(alert_data)
        return AIQueryResponse(
            response=response["response"],
            sources=response.get("sources", []),
            suggested_actions=response.get("suggested_actions", []),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(exc)}")
