"""Fetch + filter MET Frost API station metadata for Norway.

We keep stations that:
  - have a known elevation (masl) and lat/lon
  - started before VALIDITY_START (long enough record for 1991-2020 normals)
  - are still operating, or closed after VALIDITY_END
"""

from typing import TypedDict

from climate_data import frost_api

VALIDITY_START = "1995-01-01"
VALIDITY_END = "2015-01-01"


class StationEntry(TypedDict):
    id: str
    name: str
    lat: float
    lon: float
    elevationM: int


def fetch_candidates() -> list[StationEntry]:
    data = frost_api.get(
        "/sources/v0.jsonld",
        {
            "country": "NO",
            "types": "SensorSystem",
            "validtime": "1991-01-01/2020-12-31",
        },
        cache_key="sources_no_1991_2020",
    )
    sources = data.get("data", [])
    out: list[StationEntry] = []
    for s in sources:
        if s.get("masl") is None:
            continue
        geom = s.get("geometry") or {}
        coords = geom.get("coordinates") or []
        if len(coords) != 2:
            continue
        valid_from = s.get("validFrom") or ""
        if valid_from[:10] > VALIDITY_START:
            continue
        valid_to = s.get("validTo") or ""
        if valid_to and valid_to[:10] < VALIDITY_END:
            continue
        out.append({
            "id": s["id"],
            "name": s.get("shortName") or s.get("name") or s["id"],
            "lon": float(coords[0]),
            "lat": float(coords[1]),
            "elevationM": int(s["masl"]),
        })
    return sorted(out, key=lambda s: s["id"])


def build() -> list[StationEntry]:
    return fetch_candidates()
