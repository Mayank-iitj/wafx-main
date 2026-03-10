"""WAFx — initial database schema migration."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── organizations ──────────────────────────────────────────────────────
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('settings', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    # ── users ──────────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', sa.Enum('admin', 'analyst', 'viewer', name='userrole'), nullable=False, server_default='viewer'),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('mfa_secret', sa.String(255), nullable=True),
        sa.Column('mfa_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_org_role', 'users', ['org_id', 'role'])

    # ── detection_rules ────────────────────────────────────────────────────
    op.create_table(
        'detection_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rule_id', sa.String(64), nullable=False),
        sa.Column('name', sa.String(512), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('yaml_content', sa.Text(), nullable=False),
        sa.Column('mitre_tactic', sa.String(128), nullable=True),
        sa.Column('mitre_technique', sa.String(32), nullable=True),
        sa.Column('severity', sa.Enum('critical', 'high', 'medium', 'low', 'info', name='alertseverity'), nullable=False, server_default='medium'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('author', sa.String(255), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('rule_id'),
    )
    op.create_index('ix_rules_active', 'detection_rules', ['is_active'])
    op.create_index('ix_rules_mitre', 'detection_rules', ['mitre_tactic', 'mitre_technique'])

    # ── incidents ──────────────────────────────────────────────────────────
    op.create_table(
        'incidents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(1024), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.Enum('critical', 'high', 'medium', 'low', 'info', name='alertseverity'), nullable=False),
        sa.Column('status', sa.Enum('open', 'investigating', 'contained', 'remediated', 'closed', name='incidentstatus'), nullable=False, server_default='open'),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('timeline', postgresql.JSONB(), nullable=True),
        sa.Column('evidence', postgresql.JSONB(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_incidents_org_status', 'incidents', ['org_id', 'status'])

    # ── alerts ─────────────────────────────────────────────────────────────
    op.create_table(
        'alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(1024), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.Enum('critical', 'high', 'medium', 'low', 'info', name='alertseverity'), nullable=False),
        sa.Column('status', sa.Enum('new', 'in_progress', 'resolved', 'false_positive', 'closed', name='alertstatus'), nullable=False, server_default='new'),
        sa.Column('source', sa.String(255), nullable=True),
        sa.Column('rule_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('mitre_tactic', sa.String(128), nullable=True),
        sa.Column('mitre_technique', sa.String(32), nullable=True),
        sa.Column('source_event_ids', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('entities', postgresql.JSONB(), nullable=True),
        sa.Column('enrichment', postgresql.JSONB(), nullable=True),
        sa.Column('dedup_hash', sa.String(64), nullable=True),
        sa.Column('incident_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['incident_id'], ['incidents.id']),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['rule_id'], ['detection_rules.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_alerts_created', 'alerts', ['created_at'])
    op.create_index('ix_alerts_dedup', 'alerts', ['dedup_hash'])
    op.create_index('ix_alerts_org_status', 'alerts', ['org_id', 'status'])
    op.create_index('ix_alerts_severity_status', 'alerts', ['severity', 'status'])

    # ── incident_notes ─────────────────────────────────────────────────────
    op.create_table(
        'incident_notes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('incident_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('author_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        sa.ForeignKeyConstraint(['incident_id'], ['incidents.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── threat_intel ───────────────────────────────────────────────────────
    op.create_table(
        'threat_intel',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ioc_type', sa.Enum('ip', 'domain', 'url', 'md5', 'sha1', 'sha256', 'email', 'cve', name='ioctype'), nullable=False),
        sa.Column('ioc_value', sa.String(2048), nullable=False),
        sa.Column('source', sa.String(255), nullable=False),
        sa.Column('confidence', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('context', postgresql.JSONB(), nullable=True),
        sa.Column('first_seen', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('last_seen', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('expiry', sa.DateTime(timezone=True), nullable=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ioc_type', 'ioc_value', 'source', name='uq_ioc'),
    )
    op.create_index('ix_ti_type_value', 'threat_intel', ['ioc_type', 'ioc_value'])
    op.create_index('ix_ti_value', 'threat_intel', ['ioc_value'])

    # ── playbooks ──────────────────────────────────────────────────────────
    op.create_table(
        'playbooks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(512), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('yaml_content', sa.Text(), nullable=False),
        sa.Column('trigger_conditions', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── playbook_executions ────────────────────────────────────────────────
    op.create_table(
        'playbook_executions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('playbook_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('alert_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('incident_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.Enum('idle', 'running', 'completed', 'failed', name='playbookstatus'), nullable=False, server_default='idle'),
        sa.Column('steps_completed', postgresql.JSONB(), nullable=True),
        sa.Column('result', postgresql.JSONB(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('triggered_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['alert_id'], ['alerts.id']),
        sa.ForeignKeyConstraint(['incident_id'], ['incidents.id']),
        sa.ForeignKeyConstraint(['playbook_id'], ['playbooks.id']),
        sa.ForeignKeyConstraint(['triggered_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── event_sources ──────────────────────────────────────────────────────
    op.create_table(
        'event_sources',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('source_type', sa.String(64), nullable=False),
        sa.Column('config', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_event_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('event_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── audit_logs ─────────────────────────────────────────────────────────
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(128), nullable=False),
        sa.Column('resource_type', sa.String(64), nullable=False),
        sa.Column('resource_id', sa.String(128), nullable=True),
        sa.Column('details', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(512), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_resource', 'audit_logs', ['resource_type', 'resource_id'])
    op.create_index('ix_audit_user_time', 'audit_logs', ['user_id', 'timestamp'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('event_sources')
    op.drop_table('playbook_executions')
    op.drop_table('playbooks')
    op.drop_table('threat_intel')
    op.drop_table('incident_notes')
    op.drop_table('alerts')
    op.drop_table('incidents')
    op.drop_table('detection_rules')
    op.drop_table('users')
    op.drop_table('organizations')
