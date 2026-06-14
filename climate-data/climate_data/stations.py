"""Build stations.json from MET Frost API station metadata."""

from typing import TypedDict


class StationEntry(TypedDict):
    id: str
    name: str
    lat: float
    lon: float
    elevationM: int


_SAMPLE: list[StationEntry] = [
    {
        "id": "SN18700",
        "name": "Oslo – Blindern",
        "lat": 59.9423,
        "lon": 10.7200,
        "elevationM": 94,
    },
    {
        "id": "SN55290",
        "name": "Sogndal – Selsenghaugen",
        "lat": 61.2289,
        "lon": 7.1020,
        "elevationM": 287,
    },
    {
        "id": "SN90450",
        "name": "Tromsø",
        "lat": 69.6537,
        "lon": 18.9368,
        "elevationM": 100,
    },
]


def build() -> list[StationEntry]:
    # TODO: GET frost.met.no/sources/v0.jsonld?country=NO&types=SensorSystem
    # TODO: filter to stations with active temperature observations
    # TODO: keep id, name, lat, lon, elevation
    return _SAMPLE
