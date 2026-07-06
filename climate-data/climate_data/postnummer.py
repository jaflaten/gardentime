"""Build postnummer.json from geonames + open-meteo elevation + nearest station.

Data sources:
  - geonames Norway postal codes (CC BY 4.0): postnr, place, fylke, kommune, lat, lon
  - open-meteo elevation API (free, no auth): elevation in metres from SRTM DEM
"""

import json
import math
import time
import urllib.request
import zipfile
from pathlib import Path
from typing import TypedDict

from climate_data.stations import StationEntry

GEONAMES_URL = "https://download.geonames.org/export/zip/NO.zip"
ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
ELEVATION_BATCH = 100
ELEVATION_SLEEP_S = 1.1
DEFAULT_ELEVATION_M = 150

CACHE_DIR = Path(__file__).parent.parent / "data" / "raw"


class PostnummerEntry(TypedDict):
    postnummer: str
    kommune: str
    fylke: str
    centroidLat: float
    centroidLon: float
    centroidElevationM: int
    stationId: str


def build(stations: list[StationEntry], with_elevation: bool = False) -> list[PostnummerEntry]:
    rows = _load_geonames()
    entries = _dedupe_by_postnummer(rows)
    print(f"  geonames: {len(entries)} unique postnumre")

    if with_elevation:
        try:
            elevations = _fetch_elevations([(e["centroidLat"], e["centroidLon"]) for e in entries])
            for e, elev in zip(entries, elevations):
                e["centroidElevationM"] = int(round(elev))
            print(f"  open-meteo: {len(elevations)} elevations resolved")
        except Exception as ex:
            print(f"  open-meteo failed ({ex}); falling back to elevation=0")
    else:
        for e in entries:
            e["centroidElevationM"] = DEFAULT_ELEVATION_M
        print(f"  centroidElevationM={DEFAULT_ELEVATION_M} (PLACEHOLDER — pass --with-elevation for real DEM)")
        # NOTE: the placeholder makes the app's lapse-rate correction (location.ts) anchor to a fake
        # baseline and over-warm high-elevation districts. Real per-postnummer elevation is fetched
        # above with --with-elevation (open-meteo SRTM DEM). The shipped postnummer.json was backfilled
        # in place by ../backfill_elevation.py (2026-07-06) without a full re-derive; a full build should
        # be run WITH --with-elevation. A future offline Kartverket DEM would remove the API dependency.

    for e in entries:
        e["stationId"] = _nearest_station(e["centroidLat"], e["centroidLon"], stations)["id"]

    return entries


def _load_geonames() -> list[dict]:
    cache = CACHE_DIR / "NO.zip"
    if not cache.exists():
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        print(f"  fetching {GEONAMES_URL}")
        urllib.request.urlretrieve(GEONAMES_URL, cache)

    with zipfile.ZipFile(cache) as z, z.open("NO.txt") as f:
        text = f.read().decode("utf-8")

    out = []
    for line in text.splitlines():
        cols = line.split("\t")
        if len(cols) < 11 or not cols[1] or not cols[9] or not cols[10]:
            continue
        out.append({
            "postnummer": cols[1].strip(),
            "fylke": cols[3].strip(),
            "kommune": cols[5].strip(),
            "centroidLat": float(cols[9]),
            "centroidLon": float(cols[10]),
        })
    return out


def _dedupe_by_postnummer(rows: list[dict]) -> list[PostnummerEntry]:
    seen: dict[str, PostnummerEntry] = {}
    for r in rows:
        pn = r["postnummer"]
        if pn not in seen:
            seen[pn] = {
                "postnummer": pn,
                "kommune": r["kommune"],
                "fylke": r["fylke"],
                "centroidLat": r["centroidLat"],
                "centroidLon": r["centroidLon"],
                "centroidElevationM": 0,
                "stationId": "",
            }
    return sorted(seen.values(), key=lambda e: e["postnummer"])


def _fetch_elevations(coords: list[tuple[float, float]]) -> list[float]:
    cache = CACHE_DIR / "elevations.json"
    if cache.exists():
        cached = json.loads(cache.read_text())
        if len(cached) == len(coords):
            print(f"    elevations: using cache ({cache.name})")
            return cached

    out: list[float] = []
    batches = (len(coords) + ELEVATION_BATCH - 1) // ELEVATION_BATCH
    for i in range(0, len(coords), ELEVATION_BATCH):
        if i > 0:
            time.sleep(ELEVATION_SLEEP_S)
        batch = coords[i:i + ELEVATION_BATCH]
        lats = ",".join(f"{lat:.4f}" for lat, _ in batch)
        lons = ",".join(f"{lon:.4f}" for _, lon in batch)
        url = f"{ELEVATION_URL}?latitude={lats}&longitude={lons}"
        with urllib.request.urlopen(url) as r:
            data = json.loads(r.read().decode())
        out.extend(float(e) for e in data["elevation"])
        print(f"    elevation batch {i // ELEVATION_BATCH + 1}/{batches}")

    cache.write_text(json.dumps(out))
    return out


def _nearest_station(lat: float, lon: float, stations: list[StationEntry]) -> StationEntry:
    return min(stations, key=lambda s: _haversine_km(lat, lon, s["lat"], s["lon"]))


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))
