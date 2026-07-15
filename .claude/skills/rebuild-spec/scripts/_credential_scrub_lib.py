"""Credential-scrub pass for service config files (Phase D, RT2-F12).

SEPARATE pass — NOT inherited from Phase B _sql_parse_lib. This pass covers a
NEW surface: application.yml / .properties / .env files containing broker URLs,
SASL jaas config, passwords, tokens.

Signal → action:
  broker URL with embedded creds (scheme://user:pass@host) → redact password
  sasl.jaas.config = ...                                    → redact entire value
  *.password = <value>                                      → redact value
  *.token = <value>                                         → redact value
  Authorization: Bearer <token>                             → redact token
  secret= / api_key= / apikey= <value>                      → redact value

Stdlib only.
"""
from __future__ import annotations

import os
import re
from pathlib import Path

# ---------------------------------------------------------------------------
# Scrub patterns (forbidden in digest output)
# ---------------------------------------------------------------------------

_SCRUB_PATTERNS: list[tuple[re.Pattern, str]] = [
    # broker URL with embedded creds: protocol://user:pass@host
    (re.compile(r'(//[^:/@\s]+):[^@/\s]+@'), r'\1:<redacted>@'),
    # sasl.jaas.config = org.apache.kafka...PlainLoginModule ... password=...
    (re.compile(r'(sasl\.jaas\.config\s*[=:]\s*).*', re.IGNORECASE), r'\1<redacted>'),
    # sasl.jaas (short form)
    (re.compile(r'(sasl\.jaas\s*[=:]\s*).*', re.IGNORECASE), r'\1<redacted>'),
    # *.password = secret  (any dotted key ending in .password or just password)
    (re.compile(r'((?:[\w.\-]+\.)?password\s*[=:]\s*)\S+', re.IGNORECASE), r'\1<redacted>'),
    # *.token = value
    (re.compile(r'((?:[\w.\-]+\.)?token\s*[=:]\s*)\S+', re.IGNORECASE), r'\1<redacted>'),
    # Authorization: Bearer <token>
    (re.compile(r'(Bearer\s+)\S+', re.IGNORECASE), r'\1<redacted>'),
    # secret= / api_key= / apikey=
    (re.compile(r'((?:secret|api[_-]?key|apikey)\s*[=:]\s*)\S+', re.IGNORECASE), r'\1<redacted>'),
    # SASL SCRAM/PLAIN principal (review H1): sasl.username= / *.user.name= / *.username=
    (re.compile(r'((?:[\w.\-]+\.)?user(?:name|\.name)?\s*[=:]\s*)\S+', re.IGNORECASE), r'\1<redacted>'),
]

_CONFIG_FILENAMES = frozenset({
    "application.yml", "application.yaml", "application.properties",
    ".env", ".env.local", ".env.production", ".env.staging",
})

_SKIP_DIRS = frozenset({".git", "node_modules", "vendor", "dist", "build", "target", "__pycache__"})


def scrub_line(line: str) -> str:
    """Apply all credential-scrub patterns to a single line; return scrubbed line."""
    for pattern, replacement in _SCRUB_PATTERNS:
        line = pattern.sub(replacement, line)
    return line


def is_config_file(filename: str) -> bool:
    """Return True if filename is a recognised service config file."""
    return filename in _CONFIG_FILENAMES or filename.startswith(".env")


def collect_scrubbed_config(component_root: str) -> str:
    """Read all config files under component_root, scrubbed line-by-line.

    Returns combined scrubbed text — an audit-only scrub walk over the service's config surface
    (NOT written to the digest, NOT hashed). The caller asserts on it / discards it; the digest's
    own `source_sha` is computed separately from the structural source tree.
    """
    parts: list[str] = []
    for dp, dirnames, filenames in os.walk(str(component_root), followlinks=False):
        dirnames[:] = [d for d in dirnames if d not in _SKIP_DIRS]
        for fn in filenames:
            if is_config_file(fn):
                fp = Path(dp) / fn
                try:
                    raw = fp.read_text(encoding="utf-8", errors="replace")
                    scrubbed = "\n".join(scrub_line(ln) for ln in raw.splitlines())
                    parts.append(scrubbed)
                except OSError:
                    pass
    return "\n".join(parts)


def assert_no_secrets(digest_json: str) -> list[str]:
    """Scan final digest JSON for credential patterns that should have been scrubbed.

    Returns a list of warning strings (should be empty after a correct scrub pass).
    """
    warnings: list[str] = []
    for pattern, _ in _SCRUB_PATTERNS:
        if pattern.search(digest_json):
            warnings.append(
                f"Possible credential leak detected in digest "
                f"(pattern: {pattern.pattern[:50]!r})"
            )
    return warnings
