"""Backfill real per-postnummer centroid elevation into the app's postnummer.json.

The main build.py fell through to the DEFAULT_ELEVATION_M=150 placeholder for every
postnummer (it was never run with --with-elevation), which made the app's lapse-rate
correction anchor to a fake baseline (location.ts) and over-warm high-elevation
districts. This is a surgical, data-only fix: it reads the *existing* shipped
postnummer.json (correct lat/lon/kommune/stationId already), fetches real elevation
per centroid from the open-meteo SRTM DEM API — the same source postnummer.py uses —
and writes centroidElevationM back in place. Frost normals and station assignment are
untouched (station matching is distance-based).

Run:  python3 backfill_elevation.py
Elevations cache to data/raw/elevations.json (keyed by the file's coordinate order),
so a re-run is instant and offline.
"""

import json
import time
import urllib.request
from pathlib import Path

APP_POSTNUMMER = Path(__file__).parent.parent / "Spirr" / "src" / "data" / "postnummer.json"
CACHE = Path(__file__).parent / "data" / "raw" / "elevations.json"
ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
BATCH = 100
SLEEP_S = 3.0
PARTIAL = Path(__file__).parent / "data" / "raw" / "elevations.partial.json"


def _fetch_batch(batch: list[tuple[float, float]]) -> list[float]:
    lats = ",".join(f"{lat:.4f}" for lat, _ in batch)
    lons = ",".join(f"{lon:.4f}" for _, lon in batch)
    url = f"{ELEVATION_URL}?latitude={lats}&longitude={lons}"
    req = urllib.request.Request(url, headers={"User-Agent": "spirr-climate-data/1.0"})
    attempts = 12
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(req) as r:
                return [float(e) for e in json.loads(r.read().decode())["elevation"]]
        except (urllib.error.HTTPError, urllib.error.URLError) as ex:
            code = getattr(ex, "code", None)
            transient = code in (429, 500, 502, 503, 504) or code is None  # None = URLError (network)
            if transient and attempt < attempts - 1:
                wait = min(60, 5 * (2 ** attempt))  # 5,10,20,40,60,60… capped
                print(f"      {code or 'net'} — backing off {wait}s (attempt {attempt + 1})")
                time.sleep(wait)
                continue
            raise
    raise RuntimeError("unreachable")


def fetch_elevations(coords: list[tuple[float, float]]) -> list[float]:
    if CACHE.exists():
        cached = json.loads(CACHE.read_text())
        if len(cached) == len(coords):
            print(f"  elevations: using cache ({CACHE.name}, {len(cached)} points)")
            return cached

    # Resume from a prior partial run (progressively cached) so a 429 mid-run isn't fatal.
    out: list[float] = json.loads(PARTIAL.read_text()) if PARTIAL.exists() else []
    if out:
        print(f"  resuming from partial ({len(out)} points already fetched)")
    PARTIAL.parent.mkdir(parents=True, exist_ok=True)

    batches = (len(coords) + BATCH - 1) // BATCH
    for i in range(len(out), len(coords), BATCH):
        if i > 0:
            time.sleep(SLEEP_S)
        out.extend(_fetch_batch(coords[i:i + BATCH]))
        PARTIAL.write_text(json.dumps(out))
        print(f"    batch {i // BATCH + 1}/{batches} ({len(out)}/{len(coords)})")

    CACHE.write_text(json.dumps(out))
    PARTIAL.unlink(missing_ok=True)
    return out


def main() -> None:
    entries = json.loads(APP_POSTNUMMER.read_text())
    print(f"  loaded {len(entries)} postnumre from {APP_POSTNUMMER.name}")

    coords = [(e["centroidLat"], e["centroidLon"]) for e in entries]
    elevations = fetch_elevations(coords)
    assert len(elevations) == len(entries), "elevation/entry count mismatch"

    changed = 0
    for e, elev in zip(entries, elevations):
        new = int(round(elev))
        # SRTM returns 0 over water / no-data; keep such a centroid at sea level (coastal is fine),
        # but never below 0.
        new = max(0, new)
        if e["centroidElevationM"] != new:
            changed += 1
        e["centroidElevationM"] = new

    APP_POSTNUMMER.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n")
    vals = [e["centroidElevationM"] for e in entries]
    print(f"  updated {changed}/{len(entries)} elevations")
    print(f"  range: {min(vals)}–{max(vals)} m, distinct values: {len(set(vals))}")
    print(f"  -> wrote {APP_POSTNUMMER}")


if __name__ == "__main__":
    main()
