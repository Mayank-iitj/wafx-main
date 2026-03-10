"""AI Security Assistant — LLM-powered alert analysis & investigation helper."""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from litellm import acompletion

from app.core.config import get_settings

logger = logging.getLogger("wafx.ai")
settings = get_settings()


SYSTEM_PROMPT = """You are WAFx AI Security Assistant — a senior SOC analyst AI embedded in the WAFx Security Operations Platform.

Your role:
1. Explain security alerts in clear, actionable language
2. Summarize incidents and their potential impact
3. Suggest investigation steps and mitigation strategies
4. Help analysts understand attack techniques (MITRE ATT&CK)
5. Correlate related events and identify attack patterns

Rules:
- Always ground your analysis in the provided event data — never fabricate IOCs or events
- Reference MITRE ATT&CK techniques by ID when relevant
- Provide severity assessments based on real risk
- Suggest concrete, prioritized response actions
- Flag if data is insufficient for confident analysis
"""


class AIAssistant:
    """LLM-backed security assistant using real alert/event data."""

    def __init__(self):
        self.model = settings.LLM_MODEL
        self.api_key = settings.LLM_API_KEY.get_secret_value()
        self.base_url = settings.LLM_BASE_URL
        self.max_tokens = settings.LLM_MAX_TOKENS

    async def analyze_alert(self, alert_data: dict[str, Any]) -> dict[str, Any]:
        """Explain an alert and suggest response actions."""
        user_prompt = self._build_alert_prompt(alert_data)
        response = await self._query(user_prompt)
        return {
            "response": response,
            "type": "alert_analysis",
            "sources": [{"alert_id": alert_data.get("id", "")}],
            "suggested_actions": self._extract_actions(response),
        }

    async def summarize_incident(self, incident_data: dict[str, Any], alerts: list[dict[str, Any]]) -> dict[str, Any]:
        """Generate an executive summary of an incident."""
        user_prompt = self._build_incident_prompt(incident_data, alerts)
        response = await self._query(user_prompt)
        return {
            "response": response,
            "type": "incident_summary",
            "sources": [
                {"incident_id": incident_data.get("id", "")},
                *[{"alert_id": a.get("id", "")} for a in alerts[:10]],
            ],
            "suggested_actions": self._extract_actions(response),
        }

    async def investigate(self, query: str, context: dict[str, Any]) -> dict[str, Any]:
        """Answer a free-form investigation query with context."""
        context_str = self._format_context(context)
        user_prompt = f"""Investigation Query: {query}

Available Context:
{context_str}

Provide a thorough analysis with:
1. Direct answer to the question
2. Relevant MITRE ATT&CK techniques if applicable
3. Recommended investigation steps
4. Potential false positive indicators
5. Suggested containment actions if threat is confirmed"""

        response = await self._query(user_prompt)
        return {
            "response": response,
            "type": "investigation",
            "sources": [],
            "suggested_actions": self._extract_actions(response),
        }

    async def suggest_mitigation(self, technique_id: str, alert_data: dict[str, Any]) -> dict[str, Any]:
        """Suggest specific mitigations for a MITRE ATT&CK technique."""
        user_prompt = f"""Provide specific mitigation recommendations for MITRE ATT&CK technique {technique_id}.

Alert Context:
- Title: {alert_data.get('title', 'N/A')}
- Severity: {alert_data.get('severity', 'N/A')}
- Entities: {alert_data.get('entities', {})}
- Enrichment: {alert_data.get('enrichment', {})}

Provide:
1. Immediate containment actions
2. Short-term remediation steps
3. Long-term prevention measures
4. Detection improvements to catch similar attacks
5. Specific WAFx playbook actions that could automate the response"""

        response = await self._query(user_prompt)
        return {
            "response": response,
            "type": "mitigation",
            "technique_id": technique_id,
            "suggested_actions": self._extract_actions(response),
        }

    async def _query(self, user_prompt: str) -> str:
        """Send a query to the LLM via LiteLLM."""
        try:
            response = await acompletion(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=self.max_tokens,
                temperature=0.3,
                api_key=self.api_key,
                api_base=self.base_url,
            )
            return response.choices[0].message.content or ""
        except Exception:
            logger.exception("LLM query failed")
            raise

    @staticmethod
    def _build_alert_prompt(alert: dict[str, Any]) -> str:
        enrichment = alert.get("enrichment", {})
        return f"""Analyze this security alert:

Title: {alert.get('title', 'N/A')}
Severity: {alert.get('severity', 'N/A')}
Status: {alert.get('status', 'N/A')}
Source: {alert.get('source', 'N/A')}
MITRE Tactic: {alert.get('mitre_tactic', 'N/A')}
MITRE Technique: {alert.get('mitre_technique', 'N/A')}
Description: {alert.get('description', 'N/A')}

Entities Involved:
- IPs: {alert.get('entities', {}).get('ips', [])}
- Users: {alert.get('entities', {}).get('users', [])}
- Hosts: {alert.get('entities', {}).get('hosts', [])}

Threat Intelligence Enrichment:
{enrichment}

Provide:
1. Plain-language explanation of what happened
2. Risk assessment (what could go wrong if ignored)
3. Attack chain analysis (what stage of attack this represents)
4. Recommended immediate actions (prioritized)
5. Related MITRE ATT&CK techniques to investigate"""

    @staticmethod
    def _build_incident_prompt(incident: dict[str, Any], alerts: list[dict[str, Any]]) -> str:
        alert_summaries = "\n".join(
            f"  - [{a.get('severity', '?')}] {a.get('title', '?')} (MITRE: {a.get('mitre_technique', 'N/A')})"
            for a in alerts[:20]
        )
        return f"""Summarize this security incident:

Incident: {incident.get('title', 'N/A')}
Severity: {incident.get('severity', 'N/A')}
Status: {incident.get('status', 'N/A')}
Tags: {incident.get('tags', [])}

Associated Alerts ({len(alerts)} total):
{alert_summaries}

Timeline:
{incident.get('timeline', [])}

Provide:
1. Executive summary (2-3 sentences)
2. Attack narrative (what happened chronologically)
3. Impact assessment
4. Current containment status
5. Recommended next steps"""

    @staticmethod
    def _format_context(context: dict[str, Any]) -> str:
        parts = []
        if "alert" in context:
            a = context["alert"]
            parts.append(f"Alert: {a.get('title', 'N/A')} [{a.get('severity', '?')}]")
        if "events" in context:
            parts.append(f"Related Events: {len(context['events'])} events")
            for e in context["events"][:5]:
                parts.append(f"  - {e.get('message', str(e)[:200])}")
        if "enrichment" in context:
            parts.append(f"TI Enrichment: {context['enrichment']}")
        return "\n".join(parts) if parts else "No additional context available."

    @staticmethod
    def _extract_actions(response: str) -> list[str]:
        """Extract suggested actions from LLM response."""
        actions = []
        for line in response.split("\n"):
            line = line.strip()
            if any(kw in line.lower() for kw in ["block", "disable", "isolate", "revoke", "notify", "investigate", "scan"]):
                clean = line.lstrip("0123456789.-) •*")
                if clean and len(clean) > 10:
                    actions.append(clean.strip())
        return actions[:10]
