"""Core detection engine — evaluates rules against normalized events in real-time."""

from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.core.config import get_settings
from app.core.kafka import create_kafka_consumer, publish_event
from app.detection.rule_parser import ParsedRule, parse_rule
from app.detection.mitre import get_technique

logger = logging.getLogger("wafx.detection.engine")
settings = get_settings()


class DetectionEngine:
    """
    Real-time detection engine consuming normalized events from Kafka,
    evaluating detection rules, and publishing alerts.

    Supports:
    - Threshold detection (count within time window per group)
    - Simple field matching
    - IOC matching (delegated to IOC matcher service)
    - Multi-event correlation with sliding windows
    """

    def __init__(self):
        self._rules: list[ParsedRule] = []
        self._running = False
        # Sliding window state: rule_id -> group_key -> list of timestamps
        self._threshold_windows: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
        # Correlation state: rule_id -> group_key -> {sub_event_type: [timestamps]}
        self._correlation_windows: dict[str, dict[str, dict[str, list[float]]]] = defaultdict(
            lambda: defaultdict(lambda: defaultdict(list))
        )

    def load_rules(self, rules: list[ParsedRule]) -> None:
        """Load detection rules into the engine."""
        self._rules = [r for r in rules if r.enabled]
        logger.info("Loaded %d active detection rules", len(self._rules))

    async def start(self) -> None:
        """Start consuming normalized events and evaluating rules."""
        self._running = True
        consumer = create_kafka_consumer(
            settings.KAFKA_NORMALIZED_TOPIC,
            group_id="wafx-detection-engine",
        )
        await consumer.start()
        logger.info("Detection engine started — consuming from %s", settings.KAFKA_NORMALIZED_TOPIC)

        try:
            async for msg in consumer:
                if not self._running:
                    break
                try:
                    event = msg.value
                    alerts = await self.evaluate(event)
                    for alert in alerts:
                        await publish_event(settings.KAFKA_ALERT_TOPIC, alert)
                except Exception:
                    logger.exception("Error evaluating event")
        finally:
            await consumer.stop()
            logger.info("Detection engine stopped.")

    async def stop(self) -> None:
        self._running = False

    async def evaluate(self, event: dict[str, Any]) -> list[dict[str, Any]]:
        """Evaluate all loaded rules against a single normalized event."""
        alerts = []
        now = time.time()

        for rule in self._rules:
            # Check if event matches the rule's data source
            event_source = event.get("source_type", "")
            if rule.data_source != "*" and rule.data_source != event_source:
                continue

            try:
                if rule.rule_type == "simple":
                    if self._evaluate_simple(rule, event):
                        alerts.append(self._build_alert(rule, event, [event]))

                elif rule.rule_type == "threshold":
                    if self._evaluate_threshold(rule, event, now):
                        matched_events = self._get_window_events(rule, event)
                        alerts.append(self._build_alert(rule, event, matched_events))

                elif rule.rule_type == "correlation":
                    if self._evaluate_correlation(rule, event, now):
                        alerts.append(self._build_alert(rule, event, [event]))

                elif rule.rule_type == "ioc_match":
                    if self._evaluate_ioc_match(rule, event):
                        alerts.append(self._build_alert(rule, event, [event]))

            except Exception:
                logger.exception("Rule %s failed on event", rule.id)

        return alerts

    def _evaluate_simple(self, rule: ParsedRule, event: dict[str, Any]) -> bool:
        """Simple field-value match."""
        conditions = rule.conditions
        field_path = conditions.get("field", "")
        expected_value = conditions.get("value")
        operator = conditions.get("operator", "eq")

        actual_value = self._resolve_field(event, field_path)
        if actual_value is None:
            return False

        if operator == "eq":
            return str(actual_value) == str(expected_value)
        elif operator == "contains":
            return str(expected_value) in str(actual_value)
        elif operator == "regex":
            import re
            return bool(re.search(str(expected_value), str(actual_value)))
        elif operator == "gt":
            return float(actual_value) > float(expected_value)
        elif operator == "lt":
            return float(actual_value) < float(expected_value)
        return False

    def _evaluate_threshold(self, rule: ParsedRule, event: dict[str, Any], now: float) -> bool:
        """Threshold detection — count events within sliding window per group."""
        conditions = rule.conditions
        field_path = conditions.get("field", "")
        expected_value = conditions.get("value")

        actual_value = self._resolve_field(event, field_path)
        if actual_value is None or str(actual_value) != str(expected_value):
            return False

        # Build group key from group_by fields
        group_key = self._build_group_key(rule, event)

        # Add timestamp to window
        window = self._threshold_windows[rule.id][group_key]
        window.append(now)

        # Prune expired timestamps
        cutoff = now - rule.window_seconds
        self._threshold_windows[rule.id][group_key] = [t for t in window if t > cutoff]

        # Check threshold
        count = len(self._threshold_windows[rule.id][group_key])
        if count >= rule.threshold:
            # Reset window after alert to prevent continuous firing
            self._threshold_windows[rule.id][group_key] = []
            logger.info(
                "Threshold rule %s fired: %d events in %ds for group %s",
                rule.id, count, rule.window_seconds, group_key,
            )
            return True
        return False

    def _evaluate_correlation(self, rule: ParsedRule, event: dict[str, Any], now: float) -> bool:
        """Multi-event correlation — require N different event types within window."""
        conditions = rule.conditions
        required_events = conditions.get("events", [])
        if not required_events:
            return False

        group_key = self._build_group_key(rule, event)
        corr_state = self._correlation_windows[rule.id][group_key]

        # Check if this event matches any required sub-event
        for req in required_events:
            field_path = req.get("field", "")
            expected = req.get("value")
            event_type = req.get("type", field_path)
            actual = self._resolve_field(event, field_path)
            if actual is not None and str(actual) == str(expected):
                corr_state[event_type].append(now)

        # Prune expired
        cutoff = now - rule.window_seconds
        for et in list(corr_state.keys()):
            corr_state[et] = [t for t in corr_state[et] if t > cutoff]

        # Check if all required event types are present
        required_types = {req.get("type", req.get("field", "")) for req in required_events}
        matched = {et for et, ts in corr_state.items() if len(ts) > 0}

        if required_types <= matched:
            # Reset state after alert
            self._correlation_windows[rule.id][group_key] = defaultdict(list)
            logger.info("Correlation rule %s fired for group %s", rule.id, group_key)
            return True
        return False

    def _evaluate_ioc_match(self, rule: ParsedRule, event: dict[str, Any]) -> bool:
        """IOC matching — check event fields against known IOCs (via conditions list)."""
        conditions = rule.conditions
        ioc_fields = conditions.get("fields", [])
        ioc_list = conditions.get("ioc_values", set())

        for field_path in ioc_fields:
            value = self._resolve_field(event, field_path)
            if value and str(value) in ioc_list:
                return True
        return False

    def _build_group_key(self, rule: ParsedRule, event: dict[str, Any]) -> str:
        """Build a grouping key from group_by fields."""
        if not rule.group_by:
            return "__global__"
        parts = []
        for field_path in rule.group_by:
            val = self._resolve_field(event, field_path)
            parts.append(str(val) if val else "_")
        return "|".join(parts)

    @staticmethod
    def _resolve_field(event: dict[str, Any], field_path: str) -> Any:
        """Resolve a dot-notation field path in a nested dict."""
        parts = field_path.split(".")
        current = event
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
            else:
                return None
        return current

    def _get_window_events(self, rule: ParsedRule, event: dict[str, Any]) -> list[dict[str, Any]]:
        """Return the group-key context for an alert (stub — full impl stores events)."""
        return [event]

    @staticmethod
    def _build_alert(rule: ParsedRule, trigger_event: dict[str, Any], matched_events: list[dict[str, Any]]) -> dict[str, Any]:
        """Construct an alert payload from a fired rule."""
        mitre_info = get_technique(rule.mitre_technique) if rule.mitre_technique else None
        return {
            "alert_id": str(uuid4()),
            "rule_id": rule.id,
            "rule_name": rule.name,
            "title": f"[{rule.severity.upper()}] {rule.name}",
            "description": rule.description,
            "severity": rule.severity,
            "mitre_tactic": rule.mitre_tactic or (mitre_info.tactic if mitre_info else None),
            "mitre_technique": rule.mitre_technique,
            "source_event_ids": [e.get("event_id", "") for e in matched_events],
            "entities": _extract_entities(trigger_event),
            "response_actions": rule.response_actions,
            "org_id": trigger_event.get("org_id"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }


def _extract_entities(event: dict[str, Any]) -> dict[str, Any]:
    """Extract key entities (IPs, users, hosts) from normalized event."""
    entities: dict[str, Any] = {}
    raw = event.get("raw", event)

    for ip_field in ("source.ip", "destination.ip", "client.ip", "server.ip"):
        val = DetectionEngine._resolve_field(raw, ip_field)
        if val:
            entities.setdefault("ips", []).append(val)

    for user_field in ("user.name", "user.id", "source.user.name"):
        val = DetectionEngine._resolve_field(raw, user_field)
        if val:
            entities.setdefault("users", []).append(val)

    for host_field in ("host.name", "host.hostname", "agent.hostname"):
        val = DetectionEngine._resolve_field(raw, host_field)
        if val:
            entities.setdefault("hosts", []).append(val)

    return entities
