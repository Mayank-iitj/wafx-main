"""Event normalizer — maps raw events to Elastic Common Schema (ECS)."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

logger = logging.getLogger("wafx.ingestion.normalizer")


class EventNormalizer:
    """
    Normalize raw security events into ECS-compatible schema.
    Supports: syslog (RFC 5424), Windows Event Log, JSON, CEF, cloud audit logs.
    """

    def normalize(self, raw_envelope: dict[str, Any]) -> dict[str, Any]:
        source_type = raw_envelope.get("source_type", "json")
        raw = raw_envelope.get("raw", {})
        event_id = raw_envelope.get("event_id", str(uuid4()))

        normalizer = {
            "syslog": self._normalize_syslog,
            "windows_event": self._normalize_windows_event,
            "json": self._normalize_json,
            "cef": self._normalize_cef,
            "cloud_audit": self._normalize_cloud_audit,
            "container": self._normalize_container,
        }.get(source_type, self._normalize_json)

        try:
            normalized = normalizer(raw)
        except Exception:
            logger.exception("Normalization failed for event %s", event_id)
            normalized = self._fallback(raw)

        # Standard envelope fields
        normalized.update({
            "event_id": event_id,
            "source_type": source_type,
            "source_name": raw_envelope.get("source_name", "unknown"),
            "org_id": raw_envelope.get("org_id", ""),
            "ingested_at": raw_envelope.get("ingested_at", datetime.now(timezone.utc).isoformat()),
            "@timestamp": normalized.get("@timestamp", datetime.now(timezone.utc).isoformat()),
            "_raw": raw,
        })

        return normalized

    def _normalize_syslog(self, raw: Any) -> dict[str, Any]:
        """Parse RFC 5424 / RFC 3164 syslog messages."""
        if isinstance(raw, str):
            return self._parse_syslog_line(raw)
        if isinstance(raw, dict):
            msg = raw.get("message", "")
            result = self._parse_syslog_line(msg) if isinstance(msg, str) else {}
            result.update({
                "host.name": raw.get("hostname", raw.get("host", "")),
                "event.severity": raw.get("severity", raw.get("priority", "")),
                "process.name": raw.get("program", raw.get("app_name", "")),
                "@timestamp": raw.get("timestamp", datetime.now(timezone.utc).isoformat()),
            })
            return result
        return {}

    def _parse_syslog_line(self, line: str) -> dict[str, Any]:
        """Parse a raw syslog line."""
        # RFC 5424: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID MSG
        rfc5424 = re.match(
            r"<(\d+)>\d?\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)",
            line,
        )
        if rfc5424:
            pri, ts, host, app, pid, msgid, msg = rfc5424.groups()
            severity = int(pri) & 0x07
            facility = int(pri) >> 3
            return {
                "@timestamp": ts,
                "host.name": host,
                "process.name": app,
                "process.pid": pid,
                "event.severity": severity,
                "log.syslog.facility.code": facility,
                "message": msg,
            }

        # RFC 3164 fallback: <PRI>TIMESTAMP HOSTNAME MSG
        rfc3164 = re.match(r"<(\d+)>(\w{3}\s+\d+\s+[\d:]+)\s+(\S+)\s+(.*)", line)
        if rfc3164:
            pri, ts, host, msg = rfc3164.groups()
            return {
                "@timestamp": ts,
                "host.name": host,
                "event.severity": int(pri) & 0x07,
                "message": msg,
            }

        return {"message": line}

    def _normalize_windows_event(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Normalize Windows Event Log format."""
        return {
            "@timestamp": raw.get("TimeCreated", raw.get("timestamp", "")),
            "event.code": str(raw.get("EventID", raw.get("event_id", ""))),
            "event.provider": raw.get("ProviderName", raw.get("source", "")),
            "event.action": raw.get("TaskDisplayName", raw.get("task", "")),
            "event.category": raw.get("Channel", raw.get("log_name", "")),
            "event.severity": raw.get("Level", raw.get("level", "")),
            "host.name": raw.get("MachineName", raw.get("computer", "")),
            "user.name": raw.get("UserId", raw.get("user", "")),
            "process.pid": raw.get("ProcessId", raw.get("process_id", "")),
            "process.name": raw.get("ProcessName", ""),
            "message": raw.get("Message", raw.get("message", "")),
            "winlog.event_data": raw.get("EventData", {}),
        }

    def _normalize_json(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Pass-through with key field extraction for generic JSON."""
        result: dict[str, Any] = {}

        # Extract common ECS fields if present
        field_map = {
            "@timestamp": ["@timestamp", "timestamp", "time", "datetime", "created_at"],
            "host.name": ["host", "hostname", "host.name", "server"],
            "source.ip": ["source_ip", "src_ip", "client_ip", "remote_addr", "source.ip"],
            "destination.ip": ["dest_ip", "dst_ip", "destination.ip", "server_ip"],
            "user.name": ["user", "username", "user.name", "actor"],
            "event.action": ["action", "event_type", "event.action", "operation"],
            "event.category": ["category", "event.category", "log_type"],
            "event.severity": ["severity", "level", "priority"],
            "message": ["message", "msg", "description"],
            "process.name": ["process", "program", "application"],
        }

        for ecs_field, source_fields in field_map.items():
            for sf in source_fields:
                val = self._deep_get(raw, sf)
                if val is not None:
                    result[ecs_field] = val
                    break

        return result

    def _normalize_cef(self, raw: Any) -> dict[str, Any]:
        """Parse Common Event Format (CEF) messages."""
        if isinstance(raw, str):
            return self._parse_cef_string(raw)
        if isinstance(raw, dict):
            return {
                "@timestamp": raw.get("rt", raw.get("timestamp", "")),
                "event.action": raw.get("act", raw.get("name", "")),
                "event.severity": raw.get("severity", ""),
                "source.ip": raw.get("src", ""),
                "destination.ip": raw.get("dst", ""),
                "user.name": raw.get("suser", raw.get("duser", "")),
                "host.name": raw.get("shost", raw.get("dhost", "")),
                "message": raw.get("msg", raw.get("message", "")),
                "event.provider": raw.get("deviceVendor", ""),
                "event.code": raw.get("signatureId", ""),
            }
        return {}

    def _parse_cef_string(self, cef: str) -> dict[str, Any]:
        """Parse CEF: Version|Vendor|Product|Version|SignatureID|Name|Severity|Extensions"""
        parts = cef.split("|", 7)
        if len(parts) < 7:
            return {"message": cef}

        result = {
            "event.provider": f"{parts[1]} {parts[2]}",
            "event.code": parts[4],
            "event.action": parts[5],
            "event.severity": parts[6],
        }

        # Parse key=value extensions
        if len(parts) > 7:
            extensions = parts[7]
            for match in re.finditer(r"(\w+)=([^\s]+(?:\s+(?!\w+=))*)", extensions):
                key, val = match.group(1), match.group(2).strip()
                if key == "src":
                    result["source.ip"] = val
                elif key == "dst":
                    result["destination.ip"] = val
                elif key == "suser":
                    result["user.name"] = val
                elif key == "rt":
                    result["@timestamp"] = val
                elif key == "msg":
                    result["message"] = val

        return result

    def _normalize_cloud_audit(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Normalize cloud provider audit logs (AWS CloudTrail, GCP, Azure)."""
        # AWS CloudTrail format detection
        if "eventSource" in raw and "eventName" in raw:
            return {
                "@timestamp": raw.get("eventTime", ""),
                "cloud.provider": "aws",
                "cloud.region": raw.get("awsRegion", ""),
                "cloud.account.id": raw.get("recipientAccountId", ""),
                "event.action": raw.get("eventName", ""),
                "event.category": raw.get("eventSource", ""),
                "source.ip": raw.get("sourceIPAddress", ""),
                "user.name": raw.get("userIdentity", {}).get("userName", ""),
                "user.id": raw.get("userIdentity", {}).get("arn", ""),
                "event.outcome": "success" if not raw.get("errorCode") else "failure",
                "message": raw.get("errorMessage", raw.get("eventName", "")),
            }

        # Azure Activity Log
        if "operationName" in raw and "resourceId" in raw:
            return {
                "@timestamp": raw.get("time", raw.get("eventTimestamp", "")),
                "cloud.provider": "azure",
                "event.action": raw.get("operationName", ""),
                "event.category": raw.get("category", ""),
                "event.outcome": raw.get("resultType", ""),
                "user.name": raw.get("caller", ""),
                "cloud.resource.id": raw.get("resourceId", ""),
                "message": raw.get("description", raw.get("operationName", "")),
            }

        # GCP Audit Log
        if "protoPayload" in raw:
            proto = raw.get("protoPayload", {})
            return {
                "@timestamp": raw.get("timestamp", ""),
                "cloud.provider": "gcp",
                "event.action": proto.get("methodName", ""),
                "event.category": proto.get("serviceName", ""),
                "source.ip": proto.get("requestMetadata", {}).get("callerIp", ""),
                "user.name": proto.get("authenticationInfo", {}).get("principalEmail", ""),
                "message": proto.get("status", {}).get("message", ""),
            }

        return self._normalize_json(raw)

    def _normalize_container(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Normalize container / Kubernetes logs."""
        return {
            "@timestamp": raw.get("time", raw.get("timestamp", "")),
            "container.name": raw.get("container_name", raw.get("container", "")),
            "container.id": raw.get("container_id", ""),
            "container.image.name": raw.get("image", raw.get("container_image", "")),
            "host.name": raw.get("host", raw.get("node", "")),
            "kubernetes.namespace": raw.get("namespace", raw.get("kubernetes", {}).get("namespace", "")),
            "kubernetes.pod.name": raw.get("pod", raw.get("kubernetes", {}).get("pod", {}).get("name", "")),
            "event.action": raw.get("reason", raw.get("type", "")),
            "message": raw.get("log", raw.get("message", "")),
        }

    @staticmethod
    def _deep_get(d: dict[str, Any], key: str) -> Any:
        """Get a value from a nested dict using dot notation."""
        parts = key.split(".")
        current = d
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
            else:
                return None
        return current

    def _fallback(self, raw: Any) -> dict[str, Any]:
        """Fallback normalization for unparseable events."""
        return {
            "message": str(raw)[:4096],
            "@timestamp": datetime.now(timezone.utc).isoformat(),
        }
