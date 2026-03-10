"""YAML detection rule parser — loads and validates rule definitions."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

import yaml

logger = logging.getLogger("wafx.detection.parser")

RULE_TYPES = {"threshold", "correlation", "ioc_match", "anomaly", "simple"}


@dataclass
class ParsedRule:
    id: str
    name: str
    rule_type: str
    data_source: str
    conditions: dict[str, Any]
    severity: str
    mitre_tactic: str | None = None
    mitre_technique: str | None = None
    response_actions: list[str] = field(default_factory=list)
    group_by: list[str] = field(default_factory=list)
    window_seconds: int = 300
    threshold: int = 1
    description: str = ""
    tags: list[str] = field(default_factory=list)
    enabled: bool = True


def parse_rule(yaml_content: str) -> ParsedRule:
    """Parse a YAML rule definition into a structured ParsedRule object."""
    try:
        raw = yaml.safe_load(yaml_content)
    except yaml.YAMLError as exc:
        raise ValueError(f"Invalid YAML: {exc}") from exc

    if not isinstance(raw, dict):
        raise ValueError("Rule YAML must be a mapping")

    required_fields = ["id", "name", "type", "data_source", "conditions", "severity"]
    for f in required_fields:
        if f not in raw:
            raise ValueError(f"Missing required field: {f}")

    if raw["type"] not in RULE_TYPES:
        raise ValueError(f"Unknown rule type: {raw['type']}. Must be one of {RULE_TYPES}")

    conditions = raw["conditions"]
    mitre = raw.get("mitre", {})

    # Extract threshold and window from conditions for threshold-type rules
    threshold = 1
    window_seconds = 300
    group_by = []

    if raw["type"] == "threshold":
        threshold = conditions.get("threshold", 1)
        window_raw = conditions.get("window", "300s")
        window_seconds = _parse_duration(window_raw)
        group_by_raw = conditions.get("group_by")
        if isinstance(group_by_raw, str):
            group_by = [group_by_raw]
        elif isinstance(group_by_raw, list):
            group_by = group_by_raw

    elif raw["type"] == "correlation":
        window_raw = conditions.get("window", "600s")
        window_seconds = _parse_duration(window_raw)
        group_by = conditions.get("group_by", [])
        if isinstance(group_by, str):
            group_by = [group_by]

    return ParsedRule(
        id=raw["id"],
        name=raw["name"],
        rule_type=raw["type"],
        data_source=raw["data_source"],
        conditions=conditions,
        severity=raw["severity"],
        mitre_tactic=mitre.get("tactic"),
        mitre_technique=mitre.get("technique"),
        response_actions=raw.get("response", []),
        group_by=group_by,
        window_seconds=window_seconds,
        threshold=threshold,
        description=raw.get("description", ""),
        tags=raw.get("tags", []),
        enabled=raw.get("enabled", True),
    )


def parse_rules_file(yaml_content: str) -> list[ParsedRule]:
    """Parse a multi-document YAML file containing multiple rules."""
    rules = []
    for doc in yaml.safe_load_all(yaml_content):
        if doc:
            rules.append(parse_rule(yaml.dump(doc)))
    return rules


def _parse_duration(value: str) -> int:
    """Parse duration string like '300s', '5m', '1h' into seconds."""
    value = value.strip().lower()
    if value.endswith("s"):
        return int(value[:-1])
    elif value.endswith("m"):
        return int(value[:-1]) * 60
    elif value.endswith("h"):
        return int(value[:-1]) * 3600
    elif value.endswith("d"):
        return int(value[:-1]) * 86400
    else:
        return int(value)
