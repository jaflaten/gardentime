"""HTTP client for MET Frost API with auth + on-disk response cache."""

import base64
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from climate_data.config import frost_credentials

BASE = "https://frost.met.no"
CACHE_DIR = Path(__file__).parent.parent / "data" / "raw" / "frost"
MIN_INTERVAL_S = 1.1

_last_call = 0.0


def get(path: str, params: dict[str, str], cache_key: str | None = None) -> dict[str, Any]:
    if cache_key:
        cache_file = CACHE_DIR / f"{cache_key}.json"
        if cache_file.exists():
            return json.loads(cache_file.read_text())

    global _last_call
    delta = time.time() - _last_call
    if delta < MIN_INTERVAL_S:
        time.sleep(MIN_INTERVAL_S - delta)

    cid, _ = frost_credentials()
    auth = base64.b64encode(f"{cid}:".encode()).decode()
    url = f"{BASE}{path}?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": f"Basic {auth}"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read().decode())
    finally:
        _last_call = time.time()

    if cache_key:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_file.write_text(json.dumps(data))
    return data
