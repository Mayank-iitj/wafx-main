"""Pydantic request/response schemas for the WAFx API."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ── Base ────────────────────────────────────────────────────────────────────

class WAFxBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    mfa_code: str | None = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    org_name: str = Field(..., min_length=1, max_length=255)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain an uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain a lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain a digit")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Users ───────────────────────────────────────────────────────────────────

class UserOut(WAFxBase):
    id: UUID
    email: str
    full_name: str
    role: str
    org_id: UUID
    mfa_enabled: bool
    is_active: bool
    last_login: datetime | None
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None


# ── Alerts ──────────────────────────────────────────────────────────────────

class AlertCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=1024)
    description: str | None = None
    severity: str
    source: str | None = None
    rule_id: UUID | None = None
    mitre_tactic: str | None = None
    mitre_technique: str | None = None
    source_event_ids: list[str] = []
    entities: dict[str, Any] = {}


class AlertOut(WAFxBase):
    id: UUID
    title: str
    description: str | None
    severity: str
    status: str
    source: str | None
    rule_id: UUID | None
    mitre_tactic: str | None
    mitre_technique: str | None
    source_event_ids: list[str]
    entities: dict[str, Any]
    enrichment: dict[str, Any]
    dedup_hash: str | None
    incident_id: UUID | None
    org_id: UUID
    assigned_to: UUID | None
    created_at: datetime
    updated_at: datetime


class AlertUpdate(BaseModel):
    status: str | None = None
    severity: str | None = None
    assigned_to: UUID | None = None
    incident_id: UUID | None = None


class AlertBulkAction(BaseModel):
    alert_ids: list[UUID]
    action: str  # close, resolve, assign, escalate
    params: dict[str, Any] = {}


# ── Incidents ───────────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=1024)
    description: str | None = None
    severity: str
    alert_ids: list[UUID] = []
    tags: list[str] = []


class IncidentOut(WAFxBase):
    id: UUID
    title: str
    description: str | None
    severity: str
    status: str
    assigned_to: UUID | None
    org_id: UUID
    timeline: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    tags: list[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None


class IncidentUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    severity: str | None = None
    assigned_to: UUID | None = None
    tags: list[str] | None = None


class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1)


class NoteOut(WAFxBase):
    id: UUID
    incident_id: UUID
    author_id: UUID
    content: str
    created_at: datetime


# ── Detection Rules ────────────────────────────────────────────────────────

class RuleCreate(BaseModel):
    rule_id: str = Field(..., pattern=r"^WAFX-RULE-\d{3,6}$")
    name: str = Field(..., min_length=1, max_length=512)
    description: str | None = None
    yaml_content: str
    mitre_tactic: str | None = None
    mitre_technique: str | None = None
    severity: str = "medium"
    tags: list[str] = []
    is_active: bool = True


class RuleOut(WAFxBase):
    id: UUID
    rule_id: str
    name: str
    description: str | None
    yaml_content: str
    mitre_tactic: str | None
    mitre_technique: str | None
    severity: str
    is_active: bool
    author: str | None
    tags: list[str]
    created_at: datetime
    updated_at: datetime


class RuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    yaml_content: str | None = None
    severity: str | None = None
    is_active: bool | None = None
    tags: list[str] | None = None


# ── Threat Intelligence ─────────────────────────────────────────────────────

class IOCCreate(BaseModel):
    ioc_type: str
    ioc_value: str = Field(..., min_length=1, max_length=2048)
    source: str
    confidence: int = Field(50, ge=0, le=100)
    tags: list[str] = []
    context: dict[str, Any] = {}


class IOCOut(WAFxBase):
    id: UUID
    ioc_type: str
    ioc_value: str
    source: str
    confidence: int
    tags: list[str]
    context: dict[str, Any]
    first_seen: datetime
    last_seen: datetime
    expiry: datetime | None


# ── Playbooks ───────────────────────────────────────────────────────────────

class PlaybookCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=512)
    description: str | None = None
    yaml_content: str
    trigger_conditions: dict[str, Any] = {}
    is_active: bool = True


class PlaybookOut(WAFxBase):
    id: UUID
    name: str
    description: str | None
    yaml_content: str
    trigger_conditions: dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PlaybookUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    yaml_content: str | None = None
    trigger_conditions: dict[str, Any] | None = None
    is_active: bool | None = None


class PlaybookExecutionOut(WAFxBase):
    id: UUID
    playbook_id: UUID
    alert_id: UUID | None
    incident_id: UUID | None
    status: str
    steps_completed: list[dict[str, Any]]
    result: dict[str, Any]
    started_at: datetime
    completed_at: datetime | None


# ── Events ──────────────────────────────────────────────────────────────────

class EventIngest(BaseModel):
    """Unified event ingest payload."""
    source_type: str  # syslog, json, cef, api
    source_name: str
    events: list[dict[str, Any]] = Field(..., min_length=1, max_length=1000)


class EventSearchRequest(BaseModel):
    query: str = "*"
    time_from: datetime | None = None
    time_to: datetime | None = None
    source: str | None = None
    severity: str | None = None
    size: int = Field(50, ge=1, le=10000)
    sort_field: str = "@timestamp"
    sort_order: str = "desc"


# ── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_alerts: int
    critical_alerts: int
    open_incidents: int
    events_24h: int
    alerts_by_severity: dict[str, int]
    alerts_by_status: dict[str, int]
    top_mitre_techniques: list[dict[str, Any]]
    recent_alerts: list[AlertOut]


# ── AI Assistant ────────────────────────────────────────────────────────────

class AIQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    context_alert_id: UUID | None = None
    context_incident_id: UUID | None = None


class AIQueryResponse(BaseModel):
    response: str
    sources: list[dict[str, Any]] = []
    suggested_actions: list[str] = []


# ── Pagination ──────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
    pages: int
