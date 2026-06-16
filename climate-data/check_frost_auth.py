"""Verify Frost API credentials work. Run: python3 check_frost_auth.py"""

import base64
import json
import urllib.request

from climate_data.config import frost_credentials


def main() -> None:
    cid, _ = frost_credentials()
    auth = base64.b64encode(f"{cid}:".encode()).decode()
    req = urllib.request.Request(
        "https://frost.met.no/sources/v0.jsonld?country=NO&types=SensorSystem",
        headers={"Authorization": f"Basic {auth}"},
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read().decode())
    sources = data.get("data", [])
    print(f"OK — auth works. {len(sources)} Norwegian stations visible.")
    if sources:
        s = sources[0]
        print(f"Sample: {s.get('id')} {s.get('name')} ({s.get('masl')} moh)")


if __name__ == "__main__":
    main()
