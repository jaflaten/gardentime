"""Derive frost-normals.json from MET source data.

Two source options (chosen via CLI flag):
- "senorge": 1km gridded daily Tmin/Tmax over Norway → key = grid cell ID
- "frost-api": per-station daily Tmin from Frost API → key = stationId

Both must produce records with the same schema (lastFrostDoy, firstFrostDoy, gdd5)
so the consuming app does not care which source was used.
"""

from typing import Literal, TypedDict

Source = Literal["senorge", "frost-api"]


class FrostNormal(TypedDict):
    key: str
    lastFrostDoy: int
    firstFrostDoy: int
    gdd5: int


_SAMPLE: list[FrostNormal] = [
    {"key": "SN18700", "lastFrostDoy": 125, "firstFrostDoy": 283, "gdd5": 1450},
    {"key": "SN55290", "lastFrostDoy": 145, "firstFrostDoy": 270, "gdd5": 1100},
    {"key": "SN90450", "lastFrostDoy": 160, "firstFrostDoy": 255, "gdd5": 850},
]


def build(source: Source) -> list[FrostNormal]:
    # TODO source="senorge": open seNorge_2018 NetCDF, sample by station lat/lon,
    #   derive last-frost (last spring day Tmin<=0), first-frost (first autumn day Tmin<=0),
    #   GDD>5 sum, all averaged across the 1991-2020 normal period.
    # TODO source="frost-api": query frost.met.no daily Tmin per station, same derivation.
    # TODO lock the frost-threshold definition before this ships — Tmin<=0°C is the default,
    #   but NLR and Hageselskapet differ. The choice affects every date the app shows.
    return _SAMPLE
