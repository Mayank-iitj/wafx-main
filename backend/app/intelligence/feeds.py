"""Threat Intelligence feed manager and integrations."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger("wafx.intelligence")
settings = get_settings()


class ThreatFeed(ABC):
    """Base class for threat intelligence feed integrations."""

    @abstractmethod
    async def check_ip(self, ip: str) -> dict[str, Any] | None:
        """Check an IP address against this feed."""
        ...

    @abstractmethod
    async def check_domain(self, domain: str) -> dict[str, Any] | None:
        """Check a domain against this feed."""
        ...

    @abstractmethod
    async def check_hash(self, file_hash: str) -> dict[str, Any] | None:
        """Check a file hash against this feed."""
        ...


class AbuseIPDBFeed(ThreatFeed):
    """AbuseIPDB API v2 integration — IP reputation lookup."""

    BASE_URL = "https://api.abuseipdb.com/api/v2"

    def __init__(self):
        self.api_key = settings.ABUSEIPDB_API_KEY.get_secret_value()
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={
                "Key": self.api_key,
                "Accept": "application/json",
            },
            timeout=15.0,
        )

    async def check_ip(self, ip: str) -> dict[str, Any] | None:
        if not self.api_key:
            return None
        try:
            resp = await self.client.get("/check", params={
                "ipAddress": ip,
                "maxAgeInDays": 90,
                "verbose": "",
            })
            resp.raise_for_status()
            data = resp.json().get("data", {})
            return {
                "source": "abuseipdb",
                "ip": ip,
                "abuse_confidence_score": data.get("abuseConfidenceScore", 0),
                "total_reports": data.get("totalReports", 0),
                "country_code": data.get("countryCode", ""),
                "isp": data.get("isp", ""),
                "domain": data.get("domain", ""),
                "is_tor": data.get("isTor", False),
                "last_reported_at": data.get("lastReportedAt"),
                "categories": data.get("reports", [])[:5],
            }
        except Exception:
            logger.exception("AbuseIPDB lookup failed for %s", ip)
            return None

    async def check_domain(self, domain: str) -> dict[str, Any] | None:
        return None  # AbuseIPDB is IP-only

    async def check_hash(self, file_hash: str) -> dict[str, Any] | None:
        return None  # AbuseIPDB is IP-only


class OTXFeed(ThreatFeed):
    """AlienVault OTX DirectConnect API — multi-IOC reputation."""

    BASE_URL = "https://otx.alienvault.com/api/v1"

    def __init__(self):
        self.api_key = settings.OTX_API_KEY.get_secret_value()
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={"X-OTX-API-KEY": self.api_key} if self.api_key else {},
            timeout=15.0,
        )

    async def check_ip(self, ip: str) -> dict[str, Any] | None:
        try:
            resp = await self.client.get(f"/indicators/IPv4/{ip}/reputation")
            resp.raise_for_status()
            data = resp.json()
            reputation = data.get("reputation", {})
            return {
                "source": "otx",
                "ip": ip,
                "reputation": reputation.get("threat_score", 0),
                "activities": [
                    {"name": a.get("name", ""), "description": a.get("description", "")}
                    for a in reputation.get("activities", [])[:5]
                ],
                "pulses": data.get("pulse_info", {}).get("count", 0),
            }
        except Exception:
            logger.exception("OTX IP lookup failed for %s", ip)
            return None

    async def check_domain(self, domain: str) -> dict[str, Any] | None:
        try:
            resp = await self.client.get(f"/indicators/domain/{domain}/general")
            resp.raise_for_status()
            data = resp.json()
            return {
                "source": "otx",
                "domain": domain,
                "pulses": data.get("pulse_info", {}).get("count", 0),
                "alexa": data.get("alexa", ""),
                "whois": data.get("whois", "")[:500],
            }
        except Exception:
            logger.exception("OTX domain lookup failed for %s", domain)
            return None

    async def check_hash(self, file_hash: str) -> dict[str, Any] | None:
        hash_type = "SHA256" if len(file_hash) == 64 else "SHA1" if len(file_hash) == 40 else "MD5"
        try:
            resp = await self.client.get(f"/indicators/file/{file_hash}/general")
            resp.raise_for_status()
            data = resp.json()
            return {
                "source": "otx",
                "hash": file_hash,
                "hash_type": hash_type,
                "pulses": data.get("pulse_info", {}).get("count", 0),
                "file_type": data.get("type", ""),
                "size": data.get("size", 0),
            }
        except Exception:
            logger.exception("OTX hash lookup failed for %s", file_hash)
            return None


class VirusTotalFeed(ThreatFeed):
    """VirusTotal API v3 — file, URL, IP, domain analysis."""

    BASE_URL = "https://www.virustotal.com/api/v3"

    def __init__(self):
        self.api_key = settings.VIRUSTOTAL_API_KEY.get_secret_value()
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={"x-apikey": self.api_key} if self.api_key else {},
            timeout=30.0,
        )

    async def check_ip(self, ip: str) -> dict[str, Any] | None:
        if not self.api_key:
            return None
        try:
            resp = await self.client.get(f"/ip_addresses/{ip}")
            resp.raise_for_status()
            attrs = resp.json().get("data", {}).get("attributes", {})
            stats = attrs.get("last_analysis_stats", {})
            return {
                "source": "virustotal",
                "ip": ip,
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "harmless": stats.get("harmless", 0),
                "undetected": stats.get("undetected", 0),
                "as_owner": attrs.get("as_owner", ""),
                "country": attrs.get("country", ""),
                "reputation": attrs.get("reputation", 0),
            }
        except Exception:
            logger.exception("VirusTotal IP lookup failed for %s", ip)
            return None

    async def check_domain(self, domain: str) -> dict[str, Any] | None:
        if not self.api_key:
            return None
        try:
            resp = await self.client.get(f"/domains/{domain}")
            resp.raise_for_status()
            attrs = resp.json().get("data", {}).get("attributes", {})
            stats = attrs.get("last_analysis_stats", {})
            return {
                "source": "virustotal",
                "domain": domain,
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "harmless": stats.get("harmless", 0),
                "registrar": attrs.get("registrar", ""),
                "creation_date": attrs.get("creation_date", 0),
                "reputation": attrs.get("reputation", 0),
            }
        except Exception:
            logger.exception("VirusTotal domain lookup failed for %s", domain)
            return None

    async def check_hash(self, file_hash: str) -> dict[str, Any] | None:
        if not self.api_key:
            return None
        try:
            resp = await self.client.get(f"/files/{file_hash}")
            resp.raise_for_status()
            attrs = resp.json().get("data", {}).get("attributes", {})
            stats = attrs.get("last_analysis_stats", {})
            return {
                "source": "virustotal",
                "hash": file_hash,
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "harmless": stats.get("harmless", 0),
                "undetected": stats.get("undetected", 0),
                "file_type": attrs.get("type_description", ""),
                "file_name": attrs.get("meaningful_name", ""),
                "size": attrs.get("size", 0),
                "reputation": attrs.get("reputation", 0),
            }
        except Exception:
            logger.exception("VirusTotal hash lookup failed for %s", file_hash)
            return None


class ThreatIntelService:
    """Aggregate threat intelligence from multiple feeds."""

    def __init__(self):
        self.feeds: list[ThreatFeed] = [
            AbuseIPDBFeed(),
            OTXFeed(),
            VirusTotalFeed(),
        ]

    async def enrich_ip(self, ip: str) -> dict[str, Any]:
        results: dict[str, Any] = {"ip": ip, "feeds": {}}
        max_score = 0
        for feed in self.feeds:
            data = await feed.check_ip(ip)
            if data:
                results["feeds"][data["source"]] = data
                # Normalize confidence score
                if "abuse_confidence_score" in data:
                    max_score = max(max_score, data["abuse_confidence_score"])
                elif "malicious" in data:
                    total = sum(data.get(k, 0) for k in ["malicious", "suspicious", "harmless", "undetected"])
                    if total > 0:
                        score = int((data["malicious"] / total) * 100)
                        max_score = max(max_score, score)
        results["confidence"] = max_score
        results["is_malicious"] = max_score > 50
        return results

    async def enrich_domain(self, domain: str) -> dict[str, Any]:
        results: dict[str, Any] = {"domain": domain, "feeds": {}}
        for feed in self.feeds:
            data = await feed.check_domain(domain)
            if data:
                results["feeds"][data["source"]] = data
        return results

    async def enrich_hash(self, file_hash: str) -> dict[str, Any]:
        results: dict[str, Any] = {"hash": file_hash, "feeds": {}}
        for feed in self.feeds:
            data = await feed.check_hash(file_hash)
            if data:
                results["feeds"][data["source"]] = data
        is_malicious = any(
            d.get("malicious", 0) > 3
            for d in results["feeds"].values()
        )
        results["is_malicious"] = is_malicious
        return results
