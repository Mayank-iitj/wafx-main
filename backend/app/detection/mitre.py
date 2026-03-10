"""MITRE ATT&CK technique registry and lookup."""

from __future__ import annotations

from dataclasses import dataclass

# Production-grade MITRE ATT&CK Enterprise mapping (v15 — key techniques)
# Full matrix: https://attack.mitre.org/matrices/enterprise/

@dataclass(frozen=True)
class MitreTechnique:
    technique_id: str
    name: str
    tactic: str
    description: str

MITRE_TECHNIQUES: dict[str, MitreTechnique] = {
    # Reconnaissance
    "T1595": MitreTechnique("T1595", "Active Scanning", "reconnaissance", "Adversary scans victim IP blocks"),
    "T1592": MitreTechnique("T1592", "Gather Victim Host Information", "reconnaissance", "Adversary gathers host details"),
    # Resource Development
    "T1583": MitreTechnique("T1583", "Acquire Infrastructure", "resource-development", "Adversary acquires infrastructure"),
    # Initial Access
    "T1190": MitreTechnique("T1190", "Exploit Public-Facing Application", "initial-access", "Exploitation of web apps, services"),
    "T1566": MitreTechnique("T1566", "Phishing", "initial-access", "Phishing with attachment or link"),
    "T1566.001": MitreTechnique("T1566.001", "Spearphishing Attachment", "initial-access", "Targeted phishing with malicious attachment"),
    "T1566.002": MitreTechnique("T1566.002", "Spearphishing Link", "initial-access", "Targeted phishing with malicious link"),
    "T1078": MitreTechnique("T1078", "Valid Accounts", "initial-access", "Use of legitimate credentials"),
    "T1199": MitreTechnique("T1199", "Trusted Relationship", "initial-access", "Abuse trusted third-party relationship"),
    "T1133": MitreTechnique("T1133", "External Remote Services", "initial-access", "Use of VPN, RDP, etc."),
    # Execution
    "T1059": MitreTechnique("T1059", "Command and Scripting Interpreter", "execution", "Use of cmd, PowerShell, bash, etc."),
    "T1059.001": MitreTechnique("T1059.001", "PowerShell", "execution", "PowerShell command execution"),
    "T1059.003": MitreTechnique("T1059.003", "Windows Command Shell", "execution", "cmd.exe usage"),
    "T1059.004": MitreTechnique("T1059.004", "Unix Shell", "execution", "Bash/sh command execution"),
    "T1203": MitreTechnique("T1203", "Exploitation for Client Execution", "execution", "Exploit client app vulnerability"),
    "T1204": MitreTechnique("T1204", "User Execution", "execution", "Reliance on user to execute"),
    # Persistence
    "T1053": MitreTechnique("T1053", "Scheduled Task/Job", "persistence", "Persistence via scheduled tasks"),
    "T1136": MitreTechnique("T1136", "Create Account", "persistence", "Create new account for persistence"),
    "T1543": MitreTechnique("T1543", "Create or Modify System Process", "persistence", "System service modification"),
    "T1547": MitreTechnique("T1547", "Boot or Logon Autostart Execution", "persistence", "Autostart persistence"),
    # Privilege Escalation
    "T1068": MitreTechnique("T1068", "Exploitation for Privilege Escalation", "privilege-escalation", "Exploit vulnerability for privesc"),
    "T1548": MitreTechnique("T1548", "Abuse Elevation Control Mechanism", "privilege-escalation", "Bypass UAC, sudo, etc."),
    # Defense Evasion
    "T1070": MitreTechnique("T1070", "Indicator Removal", "defense-evasion", "Delete logs, timestamps, artifacts"),
    "T1070.001": MitreTechnique("T1070.001", "Clear Windows Event Logs", "defense-evasion", "Clear Windows event logs"),
    "T1027": MitreTechnique("T1027", "Obfuscated Files or Information", "defense-evasion", "Obfuscate code/data"),
    "T1562": MitreTechnique("T1562", "Impair Defenses", "defense-evasion", "Disable security tools"),
    # Credential Access
    "T1110": MitreTechnique("T1110", "Brute Force", "credential-access", "Brute force password attempts"),
    "T1110.001": MitreTechnique("T1110.001", "Password Guessing", "credential-access", "Online password guessing"),
    "T1110.003": MitreTechnique("T1110.003", "Password Spraying", "credential-access", "Try common passwords across accounts"),
    "T1003": MitreTechnique("T1003", "OS Credential Dumping", "credential-access", "Dump credentials from OS"),
    "T1555": MitreTechnique("T1555", "Credentials from Password Stores", "credential-access", "Extract stored credentials"),
    "T1557": MitreTechnique("T1557", "Adversary-in-the-Middle", "credential-access", "MITM attacks for credential capture"),
    # Discovery
    "T1046": MitreTechnique("T1046", "Network Service Discovery", "discovery", "Scan for network services"),
    "T1087": MitreTechnique("T1087", "Account Discovery", "discovery", "Enumerate user accounts"),
    "T1018": MitreTechnique("T1018", "Remote System Discovery", "discovery", "Discover remote systems on network"),
    # Lateral Movement
    "T1021": MitreTechnique("T1021", "Remote Services", "lateral-movement", "Use remote services (RDP, SSH, SMB)"),
    "T1021.001": MitreTechnique("T1021.001", "Remote Desktop Protocol", "lateral-movement", "RDP lateral movement"),
    "T1021.004": MitreTechnique("T1021.004", "SSH", "lateral-movement", "SSH lateral movement"),
    "T1570": MitreTechnique("T1570", "Lateral Tool Transfer", "lateral-movement", "Transfer tools between systems"),
    # Collection
    "T1005": MitreTechnique("T1005", "Data from Local System", "collection", "Collect local data"),
    "T1114": MitreTechnique("T1114", "Email Collection", "collection", "Collect email data"),
    # Command and Control
    "T1071": MitreTechnique("T1071", "Application Layer Protocol", "command-and-control", "C2 via HTTP, DNS, etc."),
    "T1105": MitreTechnique("T1105", "Ingress Tool Transfer", "command-and-control", "Transfer tools to victim"),
    "T1572": MitreTechnique("T1572", "Protocol Tunneling", "command-and-control", "Tunnel C2 through legit protocol"),
    # Exfiltration
    "T1041": MitreTechnique("T1041", "Exfiltration Over C2 Channel", "exfiltration", "Steal data over C2"),
    "T1048": MitreTechnique("T1048", "Exfiltration Over Alternative Protocol", "exfiltration", "Exfil via non-C2 protocol"),
    "T1567": MitreTechnique("T1567", "Exfiltration Over Web Service", "exfiltration", "Exfil to cloud storage"),
    # Impact
    "T1486": MitreTechnique("T1486", "Data Encrypted for Impact", "impact", "Ransomware encryption"),
    "T1489": MitreTechnique("T1489", "Service Stop", "impact", "Stop critical services"),
    "T1490": MitreTechnique("T1490", "Inhibit System Recovery", "impact", "Delete backups, shadow copies"),
    "T1499": MitreTechnique("T1499", "Endpoint Denial of Service", "impact", "DoS against endpoints"),
}


MITRE_TACTICS = [
    "reconnaissance", "resource-development", "initial-access", "execution",
    "persistence", "privilege-escalation", "defense-evasion", "credential-access",
    "discovery", "lateral-movement", "collection", "command-and-control",
    "exfiltration", "impact",
]


def get_technique(technique_id: str) -> MitreTechnique | None:
    return MITRE_TECHNIQUES.get(technique_id)


def get_techniques_by_tactic(tactic: str) -> list[MitreTechnique]:
    return [t for t in MITRE_TECHNIQUES.values() if t.tactic == tactic]


def get_tactic_heatmap() -> dict[str, int]:
    """Count techniques per tactic for heatmap visualization."""
    heatmap: dict[str, int] = {t: 0 for t in MITRE_TACTICS}
    for tech in MITRE_TECHNIQUES.values():
        heatmap[tech.tactic] = heatmap.get(tech.tactic, 0) + 1
    return heatmap
