"""Build postnummer.json from Bring/Posten source + Kartverket elevation."""

from typing import TypedDict


class PostnummerEntry(TypedDict):
    postnummer: str
    kommune: str
    fylke: str
    centroidLat: float
    centroidLon: float
    centroidElevationM: int
    stationId: str


_SAMPLE: list[PostnummerEntry] = [
    {
        "postnummer": "0150",
        "kommune": "Oslo",
        "fylke": "Oslo",
        "centroidLat": 59.9090,
        "centroidLon": 10.7460,
        "centroidElevationM": 10,
        "stationId": "SN18700",
    },
    {
        "postnummer": "6857",
        "kommune": "Sogndal",
        "fylke": "Vestland",
        "centroidLat": 61.2294,
        "centroidLon": 7.1018,
        "centroidElevationM": 5,
        "stationId": "SN55290",
    },
    {
        "postnummer": "9008",
        "kommune": "Tromsø",
        "fylke": "Troms",
        "centroidLat": 69.6492,
        "centroidLon": 18.9553,
        "centroidElevationM": 8,
        "stationId": "SN90450",
    },
]


def build() -> list[PostnummerEntry]:
    # TODO: parse Bring/Posten postnummer CSV
    # TODO: join with Kartverket DEM for centroidElevationM per centroid
    # TODO: find nearest station from stations.json for each centroid
    return _SAMPLE
