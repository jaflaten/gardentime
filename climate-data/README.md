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

## Credentials (Frost API)

Register a client at https://frost.met.no/auth/requestCredentials.html (free).

```sh
cp .env .env
# Edit .env and paste your FROST_CLIENT_ID + FROST_CLIENT_SECRET
python3 check_frost_auth.py   # smoke test — should print "OK — auth works."
```

`.env` is gitignored. Never commit real credentials.

## Run

```sh
python build.py                          # writes to ../mvp-mygarden/src/data/
python build.py --out-dir ./data/out     # writes elsewhere
python build.py --source frost-api       # use Frost API per-station (alt)
python build.py --source senorge         # use seNorge 1km gridded (default once implemented)
```

## What the pipeline does

1. **Stations** — fetches all Norwegian sensor systems from Frost API `/sources`,
   filters to those with elevation + a long enough record (active before 1995-01-01,
   and either still active or closed after 2015-01-01).
2. **Frost normals** — for each candidate, fetches 30 years (1991-2020) of daily
   `min(air_temperature P1D)` + `mean(air_temperature P1D)` via `/observations`,
   derives:
     - `lastFrostDoy` — median across years of last day-of-year (Jan-Jul) with Tmin ≤ 0°C
     - `firstFrostDoy` — median across years of first day-of-year (Aug-Dec) with Tmin ≤ 0°C
     - `gdd5` — median annual sum of `max(0, Tmean - 5)`
   Stations with insufficient data (no temperature, <15 valid years, etc.) are skipped.
3. **Postnummer** — parses Bring/Posten postal codes via geonames, defaults
   `centroidElevationM` to 150 (user overrides in app settings), assigns each
   postnummer to its nearest station from step 2 via haversine distance.

API responses are cached under `data/raw/frost/` so re-runs are near-instant after
the first full sync. Delete the cache to force a refresh.

## Frost threshold definition

We use **Tmin ≤ 0°C at 2 m air temperature** with the **median** across the 30-year
normal period. This is the standard NLR/Hageselskapet convention and the most
common gardener-relevant choice. If real users want a more conservative threshold
(e.g. 90th-percentile late date), it can be added as a separate field on each
frost normal record.

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
