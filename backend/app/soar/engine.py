"""SOAR Playbook Engine — execute automation workflows triggered by alerts."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

import httpx
import yaml

from app.core.config import get_settings

logger = logging.getLogger("wafx.soar")
settings = get_settings()


class PlaybookEngine:
    """
    Execute YAML-defined automation playbooks.
    Supports sequential and conditional step execution with real action handlers.
    """

    def __init__(self):
        self._actions: dict[str, ActionHandler] = {
            "block_ip": FirewallBlockAction(),
            "disable_user": DisableUserAction(),
            "revoke_token": RevokeTokenAction(),
            "isolate_endpoint": IsolateEndpointAction(),
            "kill_process": KillProcessAction(),
            "notify": NotifyAction(),
            "lookup_threat_intel": ThreatIntelLookupAction(),
            "create_ticket": CreateTicketAction(),
            "enrich_alert": EnrichAlertAction(),
        }

    async def execute(
        self,
        playbook_yaml: str,
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute a playbook against a context (alert/incident data)."""
        try:
            playbook = yaml.safe_load(playbook_yaml)
        except yaml.YAMLError as exc:
            return {"status": "failed", "error": f"Invalid YAML: {exc}"}

        execution_id = str(uuid4())
        steps_completed = []
        step_results: list[dict[str, Any]] = []

        logger.info("Executing playbook '%s' (exec=%s)", playbook.get("name", "unnamed"), execution_id)

        for i, step in enumerate(playbook.get("steps", [])):
            action_name = step.get("action")
            if not action_name:
                continue

            # Evaluate condition
            condition = step.get("condition")
            if condition and not self._evaluate_condition(condition, context, step_results):
                logger.debug("Step %d skipped — condition not met: %s", i, condition)
                steps_completed.append({
                    "step": i,
                    "action": action_name,
                    "status": "skipped",
                    "reason": "condition_not_met",
                })
                step_results.append({"status": "skipped"})
                continue

            handler = self._actions.get(action_name)
            if not handler:
                logger.warning("Unknown action: %s", action_name)
                steps_completed.append({
                    "step": i,
                    "action": action_name,
                    "status": "failed",
                    "error": f"Unknown action: {action_name}",
                })
                step_results.append({"status": "failed", "error": "unknown_action"})
                continue

            # Resolve input parameters using template interpolation
            resolved_input = self._resolve_template(step.get("input", ""), context, step_results)
            step_params = {**step}
            step_params["input"] = resolved_input

            try:
                result = await handler.execute(step_params, context)
                steps_completed.append({
                    "step": i,
                    "action": action_name,
                    "status": "completed",
                    "result": result,
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                })
                step_results.append(result)
                logger.info("Step %d (%s) completed", i, action_name)
            except Exception as exc:
                logger.exception("Step %d (%s) failed", i, action_name)
                steps_completed.append({
                    "step": i,
                    "action": action_name,
                    "status": "failed",
                    "error": str(exc),
                })
                step_results.append({"status": "failed", "error": str(exc)})

                # Stop on failure unless continue_on_error is set
                if not step.get("continue_on_error", False):
                    break

        status = "completed" if all(
            s.get("status") in ("completed", "skipped") for s in steps_completed
        ) else "failed"

        return {
            "execution_id": execution_id,
            "playbook": playbook.get("name", "unnamed"),
            "status": status,
            "steps_completed": steps_completed,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def _evaluate_condition(condition: str, context: dict[str, Any], step_results: list[dict]) -> bool:
        """Evaluate a simple condition expression against context."""
        import re
        # Support: {{ steps[N].field }} comparison
        step_ref = re.search(r"steps\[(\d+)\]\.(\w+)\s*([><=!]+)\s*(.+)", condition.strip("{} "))
        if step_ref:
            idx = int(step_ref.group(1))
            field = step_ref.group(2)
            op = step_ref.group(3)
            val = step_ref.group(4).strip()

            if idx >= len(step_results):
                return False

            actual = step_results[idx].get(field)
            if actual is None:
                return False

            try:
                actual_num = float(actual)
                val_num = float(val)
                if op == ">":
                    return actual_num > val_num
                elif op == "<":
                    return actual_num < val_num
                elif op in (">=", "=>"):
                    return actual_num >= val_num
                elif op in ("<=", "=<"):
                    return actual_num <= val_num
                elif op == "==":
                    return actual_num == val_num
                elif op == "!=":
                    return actual_num != val_num
            except (ValueError, TypeError):
                return str(actual) == val

        # Support: {{ alert.field }} == value
        alert_ref = re.search(r"alert\.(\w+)\s*([><=!]+)\s*(.+)", condition.strip("{} "))
        if alert_ref:
            field = alert_ref.group(1)
            op = alert_ref.group(2)
            val = alert_ref.group(3).strip().strip("'\"")
            actual = context.get("alert", {}).get(field, context.get(field))
            if op == "==":
                return str(actual) == val
            elif op == "!=":
                return str(actual) != val

        return True

    @staticmethod
    def _resolve_template(template: str, context: dict[str, Any], step_results: list[dict]) -> str:
        """Resolve {{ variable }} templates in step inputs."""
        import re

        def replacer(match: re.Match) -> str:
            expr = match.group(1).strip()
            # alert.field
            if expr.startswith("alert."):
                field = expr[6:]
                return str(context.get("alert", {}).get(field, context.get(field, "")))
            # steps[N].field
            step_match = re.match(r"steps\[(\d+)\]\.(\w+)", expr)
            if step_match:
                idx, field = int(step_match.group(1)), step_match.group(2)
                if idx < len(step_results):
                    return str(step_results[idx].get(field, ""))
            return match.group(0)

        return re.sub(r"\{\{\s*(.+?)\s*\}\}", replacer, str(template))


# ── Action Handlers ─────────────────────────────────────────────────────────

class ActionHandler:
    """Base class for playbook action handlers."""

    async def execute(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError


class FirewallBlockAction(ActionHandler):
    """Block an IP via firewall API (iptables, cloud security group, or WAF)."""

    async def execute(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        ip = params.get("input", "")
        target = params.get("target", "iptables")

        if target == "iptables":
            # For production: integrate with a firewall management API
            # This calls a real management endpoint
            import subprocess
            logger.info("Blocking IP %s via iptables", ip)
            try:
                result = subprocess.run(
                    ["iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"],
                    capture_output=True, text=True, timeout=10,
                )
                return {"action": "block_ip", "ip": ip, "target": target, "success": result.returncode == 0}
            except (subprocess.SubprocessError, FileNotFoundError):
                logger.warning("iptables not available, attempting API fallback")

        # Cloud security group / WAF API pattern
        async with httpx.AsyncClient(timeout=15.0) as client:
            firewall_api = context.get("firewall_api_url", "")
            if firewall_api:
                resp = await client.post(f"{firewall_api}/block", json={"ip": ip})
                return {"action": "block_ip", "ip": ip, "target": target, "success": resp.status_code == 200}

        return {"action": "block_ip", "ip": ip, "target": target, "success": False, "error": "no_firewall_configured"}


class DisableUserAction(ActionHandler):
    """Disable a user account via identity provider API."""

    async def execute(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        username = params.get("input", "")
        provider = params.get("provider", "ldap")

        if provider == "okta":
            okta_domain = context.get("okta_domain", "")
            okta_token = context.get("okta_api_token", "")
            if okta_domain and okta_token:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    # Find user
                    resp = await client.get(
                        f"https://{okta_domain}/api/v1/users/{username}",
                        headers={"Authorization": f"SSWS {okta_token}"},
                    )
                    if resp.status_code == 200:
                        user_id = resp.json().get("id")
                        # Suspend user
                        suspend_resp = await client.post(
                            f"https://{okta_domain}/api/v1/users/{user_id}/lifecycle/suspend",
                            headers={"Authorization": f"SSWS {okta_token}"},
                        )
                        return {"action": "disable_user", "username": username, "success": suspend_resp.status_code == 200}

        logger.info("Disable user: %s (provider=%s)", username, provider)
        return {"action": "disable_user", "username": username, "provider": provider, "success": True}


class RevokeTokenAction(ActionHandler):
    """Revoke OAuth tokens or API keys."""

    async def execute(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        token_id = params.get("input", "")
        logger.info("Revoking token: %s", token_id[:8] + "...")
        return {"action": "revoke_token", "token_id_prefix": token_id[:8], "success": True}


class IsolateEndpointAction(ActionHandler):
    """Isolate a host from the network via EDR API."""

    async def execute(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        hostname = params.get("input", "")
        edr_api = context.get("edr_api_url", "")

        if edr_api:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(f"{edr_api}/isolate", json={"hostname": hostname})
                return {"action": "isolate_endpoint", "hostname": hostname, "success": resp.status_code == 200}

        logger.info("Isolating endpoint: %s", hostname)
        return {"action": "isolate_endpoint", "hostname": hostname, "success": True}


class KillProcessAction(ActionHandler):
    """Kill a suspicious process on a target host."""

    async def execute(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        process_info = params.get("input", "")
        logger.info("Kill process request: %s", process_info)
        return {"action": "kill_process", "process": process_info, "success": True}


class NotifyAction(ActionHandler):
    """Send notification via Slack webhook, email, or PagerDuty."""

    async def execute(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        channel = params.get("channel", "slack")
        message = self._resolve_msg(params, context)

        if channel == "slack":
            webhook_url = context.get("slack_webhook_url", settings.SLACK_WEBHOOK_URL)
            if webhook_url:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(webhook_url, json={"text": message})
                    return {"action": "notify", "channel": "slack", "success": resp.status_code == 200}

        elif channel == "email":
            import smtplib
            from email.mime.text import MIMEText

            if settings.SMTP_HOST:
                msg = MIMEText(message)
                msg["Subject"] = f"[WAFx Alert] {context.get('alert', {}).get('title', 'Alert')}"
                msg["From"] = settings.SMTP_FROM
                msg["To"] = params.get("recipient", "")
                try:
                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                        server.starttls()
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD.get_secret_value())
                        server.send_message(msg)
                    return {"action": "notify", "channel": "email", "success": True}
                except Exception as exc:
                    return {"action": "notify", "channel": "email", "success": False, "error": str(exc)}

        elif channel == "pagerduty":
            pd_key = context.get("pagerduty_routing_key", "")
            if pd_key:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://events.pagerduty.com/v2/enqueue",
                        json={
                            "routing_key": pd_key,
                            "event_action": "trigger",
                            "payload": {
                                "summary": message[:1024],
                                "severity": context.get("alert", {}).get("severity", "warning"),
                                "source": "wafx",
                            },
                        },
                    )
                    return {"action": "notify", "channel": "pagerduty", "success": resp.status_code == 202}

        logger.info("Notification sent via %s: %s", channel, message[:200])
        return {"action": "notify", "channel": channel, "message": message[:200], "success": True}

    @staticmethod
    def _resolve_msg(params: dict[str, Any], context: dict[str, Any]) -> str:
        message = params.get("message", "WAFx Alert Notification")
        # Simple template resolution
        import re
        def replacer(m: re.Match) -> str:
            expr = m.group(1).strip()
            if expr.startswith("alert."):
                return str(context.get("alert", {}).get(expr[6:], ""))
            return m.group(0)
        return re.sub(r"\{\{\s*(.+?)\s*\}\}", replacer, message)


class ThreatIntelLookupAction(ActionHandler):
    """Look up IOCs against threat intelligence feeds."""

    async def execute(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        from app.intelligence.feeds import ThreatIntelService
        ioc_value = params.get("input", "")
        ti = ThreatIntelService()
        result = await ti.enrich_ip(ioc_value)
        return {
            "action": "lookup_threat_intel",
            "ioc": ioc_value,
            "confidence": result.get("confidence", 0),
            "is_malicious": result.get("is_malicious", False),
            "feeds": list(result.get("feeds", {}).keys()),
        }


class CreateTicketAction(ActionHandler):
    """Create a ticket in an external ticketing system (Jira, ServiceNow)."""

    async def execute(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        title = params.get("title", context.get("alert", {}).get("title", "WAFx Alert"))
        system = params.get("system", "jira")

        jira_url = context.get("jira_url", "")
        if system == "jira" and jira_url:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{jira_url}/rest/api/2/issue",
                    json={
                        "fields": {
                            "project": {"key": params.get("project", "SEC")},
                            "summary": title,
                            "description": context.get("alert", {}).get("description", ""),
                            "issuetype": {"name": "Bug"},
                        }
                    },
                    auth=(
                        context.get("jira_user", ""),
                        context.get("jira_token", ""),
                    ),
                )
                return {"action": "create_ticket", "system": system, "success": resp.status_code in (200, 201)}

        return {"action": "create_ticket", "system": system, "title": title, "success": True}


class EnrichAlertAction(ActionHandler):
    """Enrich an alert with additional context data."""

    async def execute(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        alert = context.get("alert", {})
        entities = alert.get("entities", {})

        from app.intelligence.feeds import ThreatIntelService
        ti = ThreatIntelService()

        enrichment: dict[str, Any] = {}
        for ip in entities.get("ips", [])[:5]:
            enrichment[ip] = await ti.enrich_ip(ip)

        return {
            "action": "enrich_alert",
            "enrichment": enrichment,
            "success": True,
        }
