"""Derive frost-relevant climate normals (1991-2020) per station.

For each station we fetch 30 years of daily Tmin + daily Tmean from the Frost
API /observations endpoint, then derive three normals:
  - lastFrostDoy:  median across years of the last day-of-year (Jan-Jul) with Tmin <= 0°C
  - firstFrostDoy: median across years of the first day-of-year (Aug-Dec) with Tmin <= 0°C
  - gdd5:          median across years of annual sum of max(0, Tmean - 5)
"""

import datetime as dt
from collections import defaultdict
from statistics import median
from typing import Literal, TypedDict
from urllib.error import HTTPError

from climate_data import frost_api
from climate_data.stations import StationEntry

Source = Literal["senorge", "frost-api"]

NORMAL_START = "1991-01-01"
NORMAL_END = "2020-12-31"
FROST_THRESHOLD_C = 0.0
SPRING_LAST_DOY = 213          # July 31
AUTUMN_FIRST_DOY = 214         # August 1
MIN_DAYS_PER_YEAR = 300
MIN_YEARS_WITH_FROST = 15


class FrostNormal(TypedDict):
    key: str
    lastFrostDoy: int
    firstFrostDoy: int
    gdd5: int


def derive_from_observations(station_id: str) -> FrostNormal | None:
    try:
        data = frost_api.get(
            "/observations/v0.jsonld",
            {
                "sources": station_id,
                "elements": "min(air_temperature P1D),mean(air_temperature P1D)",
                "referencetime": f"{NORMAL_START}/{NORMAL_END}",
            },
            cache_key=f"obs_{station_id}_1991_2020",
        )
    except HTTPError:
        return None
    except Exception:
        return None

    records = data.get("data", [])
    if not records:
        return None

    yearly: dict[int, dict[int, dict[str, float]]] = defaultdict(dict)
    for rec in records:
        rt = rec.get("referenceTime", "")
        try:
            d = dt.date.fromisoformat(rt[:10])
        except ValueError:
            continue
        bucket = yearly[d.year].setdefault(d.timetuple().tm_yday, {})
        for obs in rec.get("observations", []):
            el = obs.get("elementId", "")
            val = obs.get("value")
            if val is None:
                continue
            if el.startswith("min(air_temperature"):
                bucket["tmin"] = float(val)
            elif el.startswith("mean(air_temperature"):
                bucket["tmean"] = float(val)

    last_frosts: list[int] = []
    first_frosts: list[int] = []
    gdds: list[float] = []
    for days in yearly.values():
        if len(days) < MIN_DAYS_PER_YEAR:
            continue
        last_spring = max(
            (d for d, v in days.items()
             if d <= SPRING_LAST_DOY and "tmin" in v and v["tmin"] <= FROST_THRESHOLD_C),
            default=None,
        )
        first_autumn = min(
            (d for d, v in days.items()
             if d >= AUTUMN_FIRST_DOY and "tmin" in v and v["tmin"] <= FROST_THRESHOLD_C),
            default=None,
        )
        gdd = sum(max(0.0, v["tmean"] - 5.0) for v in days.values() if "tmean" in v)
        if last_spring is not None:
            last_frosts.append(last_spring)
        if first_autumn is not None:
            first_frosts.append(first_autumn)
        if gdd > 0:
            gdds.append(gdd)

    if len(last_frosts) < MIN_YEARS_WITH_FROST or len(first_frosts) < MIN_YEARS_WITH_FROST:
        return None
    if not gdds:
        return None

    return {
        "key": station_id,
        "lastFrostDoy": int(round(median(last_frosts))),
        "firstFrostDoy": int(round(median(first_frosts))),
        "gdd5": int(round(median(gdds))),
    }


def build(stations: list[StationEntry], source: Source = "frost-api", max_stations: int | None = None) -> list[FrostNormal]:
    if source != "frost-api":
        raise NotImplementedError(f"source={source} not implemented yet")

    targets = stations[:max_stations] if max_stations else stations
    n = len(targets)
    out: list[FrostNormal] = []
    for i, s in enumerate(targets, 1):
        normal = derive_from_observations(s["id"])
        if normal is None:
            print(f"  [{i}/{n}] {s['id']} {s['name']}: skip (insufficient data)")
            continue
        out.append(normal)
        print(f"  [{i}/{n}] {s['id']} {s['name']}: "
              f"last={normal['lastFrostDoy']} first={normal['firstFrostDoy']} gdd5={normal['gdd5']}")
    return out
