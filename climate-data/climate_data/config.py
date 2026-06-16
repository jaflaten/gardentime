"""Tiny stdlib-only .env loader + Frost API credential accessors."""

import os
from pathlib import Path

ENV_PATH = Path(__file__).parent.parent / ".env"


def load_env() -> None:
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def frost_credentials() -> tuple[str, str]:
    load_env()
    cid = os.environ.get("FROST_CLIENT_ID", "").strip()
    sec = os.environ.get("FROST_CLIENT_SECRET", "").strip()
    if not cid:
        raise RuntimeError(
            "FROST_CLIENT_ID is not set. Copy .env.example to .env and fill in "
            "credentials from https://frost.met.no/auth/requestCredentials.html"
        )
    return cid, sec
