"""SQLAlchemy ORM models — WAFx domain entities."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


# ── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"


class AlertSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AlertStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"
    CLOSED = "closed"


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    REMEDIATED = "remediated"
    CLOSED = "closed"


class IOCType(str, enum.Enum):
    IP = "ip"
    DOMAIN = "domain"
    URL = "url"
    FILE_HASH_MD5 = "md5"
    FILE_HASH_SHA1 = "sha1"
    FILE_HASH_SHA256 = "sha256"
    EMAIL = "email"
    CVE = "cve"


class PlaybookStatus(str, enum.Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


# ── Organizations ───────────────────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False, unique=True)
    settings = Column(JSONB, default=dict)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    users = relationship("User", back_populates="organization", lazy="selectin")


# ── Users ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    mfa_secret = Column(String(255), nullable=True)
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    organization = relationship("Organization", back_populates="users")

    __table_args__ = (
        Index("ix_users_org_role", "org_id", "role"),
    )


# ── Detection Rules ────────────────────────────────────────────────────────

class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    rule_id = Column(String(64), nullable=False, unique=True)  # e.g. WAFX-RULE-001
    name = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    yaml_content = Column(Text, nullable=False)
    mitre_tactic = Column(String(128), nullable=True)
    mitre_technique = Column(String(32), nullable=True)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.MEDIUM, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    author = Column(String(255), nullable=True)
    tags = Column(ARRAY(String), default=list)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    __table_args__ = (
        Index("ix_rules_mitre", "mitre_tactic", "mitre_technique"),
        Index("ix_rules_active", "is_active"),
    )


# ── Alerts ──────────────────────────────────────────────────────────────────

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    title = Column(String(1024), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(Enum(AlertSeverity), nullable=False, index=True)
    status = Column(Enum(AlertStatus), default=AlertStatus.NEW, nullable=False, index=True)
    source = Column(String(255), nullable=True)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("detection_rules.id"), nullable=True)
    mitre_tactic = Column(String(128), nullable=True)
    mitre_technique = Column(String(32), nullable=True)
    source_event_ids = Column(ARRAY(String), default=list)
    entities = Column(JSONB, default=dict)        # IPs, users, hosts involved
    enrichment = Column(JSONB, default=dict)       # TI enrichment data
    dedup_hash = Column(String(64), nullable=True, index=True)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    incident = relationship("Incident", back_populates="alerts")
    rule = relationship("DetectionRule")

    __table_args__ = (
        Index("ix_alerts_created", "created_at"),
        Index("ix_alerts_org_status", "org_id", "status"),
        Index("ix_alerts_severity_status", "severity", "status"),
    )


# ── Incidents ───────────────────────────────────────────────────────────────

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    title = Column(String(1024), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(Enum(AlertSeverity), nullable=False, index=True)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.OPEN, nullable=False, index=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    timeline = Column(JSONB, default=list)        # [{timestamp, action, user, details}]
    evidence = Column(JSONB, default=list)        # [{type, url, description}]
    tags = Column(ARRAY(String), default=list)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    alerts = relationship("Alert", back_populates="incident", lazy="selectin")
    notes = relationship("IncidentNote", back_populates="incident", lazy="selectin")

    __table_args__ = (
        Index("ix_incidents_org_status", "org_id", "status"),
    )


class IncidentNote(Base):
    __tablename__ = "incident_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    incident = relationship("Incident", back_populates="notes")
    author = relationship("User")


# ── Threat Intelligence ─────────────────────────────────────────────────────

class ThreatIntel(Base):
    __tablename__ = "threat_intel"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    ioc_type = Column(Enum(IOCType), nullable=False, index=True)
    ioc_value = Column(String(2048), nullable=False)
    source = Column(String(255), nullable=False)
    confidence = Column(Integer, default=50, nullable=False)  # 0-100
    tags = Column(ARRAY(String), default=list)
    context = Column(JSONB, default=dict)
    first_seen = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    last_seen = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    expiry = Column(DateTime(timezone=True), nullable=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)

    __table_args__ = (
        UniqueConstraint("ioc_type", "ioc_value", "source", name="uq_ioc"),
        Index("ix_ti_value", "ioc_value"),
        Index("ix_ti_type_value", "ioc_type", "ioc_value"),
    )


# ── Playbooks & Executions ──────────────────────────────────────────────────

class Playbook(Base):
    __tablename__ = "playbooks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    name = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    yaml_content = Column(Text, nullable=False)
    trigger_conditions = Column(JSONB, default=dict)
    is_active = Column(Boolean, default=True, nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)


class PlaybookExecution(Base):
    __tablename__ = "playbook_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    playbook_id = Column(UUID(as_uuid=True), ForeignKey("playbooks.id"), nullable=False)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("alerts.id"), nullable=True)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=True)
    status = Column(Enum(PlaybookStatus), default=PlaybookStatus.IDLE, nullable=False)
    steps_completed = Column(JSONB, default=list)
    result = Column(JSONB, default=dict)
    started_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    playbook = relationship("Playbook")


# ── Event Sources ───────────────────────────────────────────────────────────

class EventSource(Base):
    __tablename__ = "event_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    source_type = Column(String(64), nullable=False)  # syslog, api, agent, cloud
    config = Column(JSONB, default=dict)
    is_active = Column(Boolean, default=True, nullable=False)
    last_event_at = Column(DateTime(timezone=True), nullable=True)
    event_count = Column(Integer, default=0)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)


# ── Audit Logs ──────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(128), nullable=False)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(128), nullable=True)
    details = Column(JSONB, default=dict)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=_utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_audit_user_time", "user_id", "timestamp"),
        Index("ix_audit_resource", "resource_type", "resource_id"),
    )
