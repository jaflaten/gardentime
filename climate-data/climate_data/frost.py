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
# Extended to 2024 (Tier-2, 2026-06-23) so recent temperature stations accumulate a usable
# record; keep in sync with stations.WINDOW_END. The 1991-2020 core still dominates the
# median for long-running stations, but young stations (e.g. Rv5 Kaupanger, temp from 2014)
# can now reach the >=10-year gate. Keep in sync with stations.py.
NORMAL_END = "2024-12-31"
FROST_THRESHOLD_C = 0.0
SPRING_LAST_DOY = 213          # July 31
AUTUMN_FIRST_DOY = 214         # August 1
MIN_DAYS_PER_YEAR = 300
# Lowered 15 -> 10 (Tier-2): admits recent, well-sited stations. Stations with fewer than
# LOW_CONFIDENCE_YEARS contributing years are flagged confidence="low" so the app can warn.
MIN_YEARS_WITH_FROST = 10
LOW_CONFIDENCE_YEARS = 15


class FrostNormal(TypedDict):
    key: str
    lastFrostDoy: int
    firstFrostDoy: int
    gdd5: int
    # Number of years (1991-2024, >=300 obs days, real growing season) the normal is derived
    # from, and a coarse confidence: "low" when years < LOW_CONFIDENCE_YEARS (short record →
    # noisier dates), else "high". The app surfaces "low" as a caution in the location trust line.
    years: int
    confidence: str
    # Cumulative growing-degree-day curves (median across the normal years): 13 month-boundary
    # checkpoints where index 0 = year start (always 0), index k = cumulative GDD through the end of
    # month k, index 12 = annual total. base 5 for cool crops, base 10 for warm crops. Drives the
    # location-aware harvest prediction in the app (Increment I, Layer 0). gddCurve5[12] == gdd5.
    gddCurve5: list[int]
    gddCurve10: list[int]
    # Cumulative count of *growing days* (days with Tmean above base), same 13 checkpoints as the
    # GDD curves. Lets the app lapse-correct the GDD heat budget for the user's elevation: a garden
    # below its station is ΔT warmer, worth ~ΔT extra GDD per growing day (Increment I, Layer 0 fix).
    growDays5: list[int]
    growDays10: list[int]


def _monthly_cumulative(days: dict[int, dict[str, float]], year: int, base: float) -> list[int]:
    """Cumulative GDD (base `base`) through the end of each month, as 13 checkpoints
    (index 0 = 0, index 12 = annual total). Same per-day clipping and present-days-only
    semantics as the `gdd5` sum, so gddCurve5[12] matches the gdd5 derivation."""
    monthly = [0.0] * 13  # indices 1..12 used
    jan1 = dt.date(year, 1, 1)
    for doy, v in days.items():
        if "tmean" not in v:
            continue
        g = v["tmean"] - base
        if g <= 0.0:
            continue
        month = (jan1 + dt.timedelta(days=doy - 1)).month
        monthly[month] += g
    cum = [0] * 13
    run = 0.0
    for m in range(1, 13):
        run += monthly[m]
        cum[m] = int(round(run))
    return cum


def _monthly_cumulative_growdays(days: dict[int, dict[str, float]], year: int, base: float) -> list[int]:
    """Cumulative count of growing days (Tmean above `base`) through the end of each month, as 13
    checkpoints. Mirrors `_monthly_cumulative` but counts qualifying days instead of summing GDD —
    so the app can credit ~ΔT extra GDD per growing day when lapse-correcting for elevation."""
    monthly = [0] * 13  # indices 1..12 used
    jan1 = dt.date(year, 1, 1)
    for doy, v in days.items():
        if "tmean" not in v:
            continue
        if v["tmean"] - base <= 0.0:
            continue
        month = (jan1 + dt.timedelta(days=doy - 1)).month
        monthly[month] += 1
    cum = [0] * 13
    run = 0
    for m in range(1, 13):
        run += monthly[m]
        cum[m] = run
    return cum


Yearly = dict[int, dict[int, dict[str, float]]]


def _fetch_daily(station_id: str) -> Yearly:
    """Daily min+mean air temp → {year: {doy: {tmin, tmean}}}. Empty on error / no data.
    Stations that report daily *mean* but not daily *min* yield buckets with tmean only —
    the caller detects the missing frost data and falls back to hourly."""
    try:
        data = frost_api.get(
            "/observations/v0.jsonld",
            {
                "sources": station_id,
                "elements": "min(air_temperature P1D),mean(air_temperature P1D)",
                "referencetime": f"{NORMAL_START}/{NORMAL_END}",
            },
            cache_key=f"obs_{station_id}_1991_2024",
        )
    except (HTTPError, Exception):
        return defaultdict(dict)

    yearly: Yearly = defaultdict(dict)
    for rec in data.get("data", []):
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
    return yearly


def _temp_years(station_id: str) -> tuple[int, int] | None:
    """Inclusive [firstYear, lastYear] (clamped to the window) the station has *any*
    air_temperature data, so the hourly fallback only fetches years that exist."""
    try:
        d = frost_api.get(
            "/observations/availableTimeSeries/v0.jsonld",
            {"sources": station_id, "elements": "air_temperature"},
            cache_key=f"ats_{station_id}",
        )
    except (HTTPError, Exception):
        return None
    lo, hi = 9999, 0
    win_lo, win_hi = int(NORMAL_START[:4]), int(NORMAL_END[:4])
    for r in d.get("data", []):
        vf = (r.get("validFrom") or "")[:4]
        vt = (r.get("validTo") or "")[:4]
        if vf.isdigit():
            lo = min(lo, int(vf))
        hi = max(hi, int(vt) if vt.isdigit() else win_hi)
    if hi == 0:
        return None
    return max(lo, win_lo), min(hi, win_hi)


def _fetch_hourly(station_id: str) -> Yearly:
    """Derive daily tmin/tmean from sub-hourly `air_temperature`, fetched year-by-year (a
    full-range request 403s — too large). For stations that lack a daily-min series."""
    span = _temp_years(station_id)
    if span is None:
        return defaultdict(dict)
    lo, hi = span
    # accumulate per-day readings, then reduce to min/mean
    raw: dict[int, dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))
    for year in range(lo, hi + 1):
        try:
            data = frost_api.get(
                "/observations/v0.jsonld",
                {
                    "sources": station_id,
                    "elements": "air_temperature",
                    "referencetime": f"{year}-01-01/{year}-12-31",
                },
                cache_key=f"obs_hourly_{station_id}_{year}",
            )
        except (HTTPError, Exception):
            continue
        for rec in data.get("data", []):
            rt = rec.get("referenceTime", "")
            try:
                d = dt.date.fromisoformat(rt[:10])
            except ValueError:
                continue
            for obs in rec.get("observations", []):
                if obs.get("elementId") == "air_temperature" and obs.get("value") is not None:
                    raw[d.year][d.timetuple().tm_yday].append(float(obs["value"]))
                    break
    yearly: Yearly = defaultdict(dict)
    for year, days in raw.items():
        for doy, temps in days.items():
            if temps:
                yearly[year][doy] = {"tmin": min(temps), "tmean": sum(temps) / len(temps)}
    return yearly


def derive_from_observations(station_id: str) -> FrostNormal | None:
    # Daily-min path (cheap, ~408 stations). Fall back to hourly aggregation for stations
    # that have daily mean / sub-hourly temp but no daily-min series (~188, incl. Kaupanger).
    normal = _compute_normal(station_id, _fetch_daily(station_id))
    if normal is not None:
        return normal
    return _compute_normal(station_id, _fetch_hourly(station_id))


def _compute_normal(station_id: str, yearly: Yearly) -> FrostNormal | None:
    if not yearly:
        return None

    last_frosts: list[int] = []
    first_frosts: list[int] = []
    gdds: list[float] = []
    curves5: list[list[int]] = []
    curves10: list[list[int]] = []
    growdays5: list[list[int]] = []
    growdays10: list[list[int]] = []
    for year, days in yearly.items():
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
            # Curves only from years with a real growing season, mirroring the gdd5 filter.
            curves5.append(_monthly_cumulative(days, year, 5.0))
            curves10.append(_monthly_cumulative(days, year, 10.0))
            growdays5.append(_monthly_cumulative_growdays(days, year, 5.0))
            growdays10.append(_monthly_cumulative_growdays(days, year, 10.0))

    if len(last_frosts) < MIN_YEARS_WITH_FROST or len(first_frosts) < MIN_YEARS_WITH_FROST:
        return None
    if not gdds:
        return None

    # Median per checkpoint across years (each curve is a 13-length cumulative array).
    gdd_curve5 = [int(round(median([c[k] for c in curves5]))) for k in range(13)]
    gdd_curve10 = [int(round(median([c[k] for c in curves10]))) for k in range(13)]
    grow_days5 = [int(round(median([c[k] for c in growdays5]))) for k in range(13)]
    grow_days10 = [int(round(median([c[k] for c in growdays10]))) for k in range(13)]

    years = len(gdds)
    return {
        "key": station_id,
        "lastFrostDoy": int(round(median(last_frosts))),
        "firstFrostDoy": int(round(median(first_frosts))),
        "gdd5": int(round(median(gdds))),
        "gddCurve5": gdd_curve5,
        "gddCurve10": gdd_curve10,
        "growDays5": grow_days5,
        "growDays10": grow_days10,
        "years": years,
        "confidence": "low" if years < LOW_CONFIDENCE_YEARS else "high",
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
