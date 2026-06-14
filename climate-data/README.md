# climate-data

Builds the static climate JSON assets shipped with the MyGarden PWA.

Runs once per release when source data changes (e.g. new MET climate normals,
new Bring/Posten postnummer dataset, expansion to Sweden/Denmark).

**Not** a runtime service. **Not** part of CI. A manual `python build.py` that
emits committed JSON files.

## What it produces

Three files, written by default to `../mvp-mygarden/src/data/`:

- `postnummer.json` — `[{ postnummer, kommune, fylke, centroidLat, centroidLon, centroidElevationM, stationId }]`
- `stations.json` — `[{ id, name, lat, lon, elevationM }]`
- `frost-normals.json` — `[{ key, lastFrostDoy, firstFrostDoy, gdd5 }]`

`key` in `frost-normals.json` matches `stationId` from `postnummer.json` (or a
seNorge 1km grid cell ID, depending on the source choice — TBD).

## Setup

Requires Python 3.11+.

```sh
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Run

```sh
python build.py                          # writes to ../mvp-mygarden/src/data/
python build.py --out-dir ./data/out     # writes elsewhere
python build.py --source frost-api       # use Frost API per-station (alt)
python build.py --source senorge         # use seNorge 1km gridded (default once implemented)
```

Today the stubs emit hardcoded sample data for three postnumre (Oslo, Sogndal,
Tromsø) so the schema and orchestration can be verified end-to-end. Replace the
sample data with real implementations in `climate_data/{postnummer,stations,frost}.py`.

## Data sources

- **MET seNorge_2018** — 1 km gridded daily Tmin/Tmax/Tmean over Norway, 1957→present
  ([paper](https://essd.copernicus.org/articles/11/1531/2019/)).
- **MET Frost API** — per-station observations and climate normals
  ([docs](https://frost.met.no/)), CC BY 3.0 NO.
- **Bring/Posten** postnummer dataset (CSV).
- **Kartverket** elevation DEM (for postnummer centroid elevation).

## License

Output data must carry attribution: *"Klimadata fra Meteorologisk institutt,
CC BY 3.0 NO."* The MyGarden app surfaces this in About + the location settings
panel.
