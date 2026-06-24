"""Fetch + filter MET Frost API station metadata for Norway.

Tier-2 (2026-06-23): temperature-first discovery. We no longer gate on a rigid
1991-2020 operating window (which dropped ~1500 well-sited stations and admitted
precipitation-only stations that have no temperature at all). Instead we:

  1. enumerate every NO station that actually reports *daily mean air temperature*
     (`availableTimeSeries`), with its temp-data date span, and
  2. keep those that also have an elevation + coordinates and at least
     MIN_TEMP_SPAN_YEARS of temperature data inside the derivation window.

The real per-year completeness gate (>=300 days, >=MIN_YEARS_WITH_FROST years with
frost) still lives in `frost.py`; this is just the cheap pre-filter so we don't
fetch observations for stations that obviously can't yield a normal.
"""

import datetime as dt
from typing import TypedDict

from climate_data import frost_api

# Derivation window — extended to 2024 so recent stations (e.g. Rv5 Kaupanger,
# temp from 2014) accumulate a usable record. Keep in sync with frost.py.
WINDOW_START = dt.date(1991, 1, 1)
WINDOW_END = dt.date(2024, 12, 31)
# Pre-filter: a station must have at least this many years of temp data inside the
# window to be worth fetching. The hard >=10 valid-years gate is re-checked in frost.py.
MIN_TEMP_SPAN_YEARS = 10.0


class StationEntry(TypedDict):
    id: str
    name: str
    lat: float
    lon: float
    elevationM: int


def _fetch_sources() -> dict[str, dict]:
    """All NO SensorSystem sources valid in the window, keyed by id, with elevation + coords."""
    data = frost_api.get(
        "/sources/v0.jsonld",
        {
            "country": "NO",
            "types": "SensorSystem",
            "validtime": "1991-01-01/2024-12-31",
        },
        cache_key="sources_no_1991_2024",
    )
    out: dict[str, dict] = {}
    for s in data.get("data", []):
        if s.get("masl") is None:
            continue
        geom = s.get("geometry") or {}
        coords = geom.get("coordinates") or []
        if len(coords) != 2:
            continue
        out[s["id"]] = {
            "name": s.get("shortName") or s.get("name") or s["id"],
            "lon": float(coords[0]),
            "lat": float(coords[1]),
            "elevationM": int(s["masl"]),
        }
    return out


def _temp_span_years() -> dict[str, float]:
    """Per source id, the longest span (years, clamped to the window) of daily mean air
    temperature data. Stations absent here have no daily-mean-temp series at all."""
    data = frost_api.get(
        "/observations/availableTimeSeries/v0.jsonld",
        {"elements": "mean(air_temperature P1D)"},
        cache_key="ats_meandaily",
    )

    def span_years(valid_from: str, valid_to: str) -> float:
        try:
            a = max(dt.date.fromisoformat(valid_from[:10]), WINDOW_START)
        except ValueError:
            a = WINDOW_START
        b = WINDOW_END
        if valid_to:
            try:
                b = min(dt.date.fromisoformat(valid_to[:10]), WINDOW_END)
            except ValueError:
                pass
        return max(0.0, (b - a).days / 365.25)

    spans: dict[str, float] = {}
    for r in data.get("data", []):
        sid = (r.get("sourceId") or "").split(":")[0]
        if not sid:
            continue
        y = span_years(r.get("validFrom") or "", r.get("validTo") or "")
        if y > spans.get(sid, 0.0):
            spans[sid] = y
    return spans


def fetch_candidates() -> list[StationEntry]:
    sources = _fetch_sources()
    spans = _temp_span_years()
    out: list[StationEntry] = []
    for sid, span in spans.items():
        if span < MIN_TEMP_SPAN_YEARS:
            continue
        meta = sources.get(sid)
        if meta is None:  # has temp data but no elevation/coords — skip (can't lapse-correct)
            continue
        out.append({
            "id": sid,
            "name": meta["name"],
            "lon": meta["lon"],
            "lat": meta["lat"],
            "elevationM": meta["elevationM"],
        })
    return sorted(out, key=lambda s: s["id"])


def build() -> list[StationEntry]:
    return fetch_candidates()
