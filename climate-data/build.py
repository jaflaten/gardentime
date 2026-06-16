"""Entry point — runs the three builders and writes JSON assets."""

import argparse
import json
from pathlib import Path

from climate_data import frost, postnummer, stations

DEFAULT_OUT = Path(__file__).parent.parent / "mvp-mygarden" / "src" / "data"


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT,
        help=f"Where to write JSON assets (default: {DEFAULT_OUT})",
    )
    p.add_argument(
        "--source",
        choices=["senorge", "frost-api"],
        default="frost-api",
        help="Climate source for frost-normals.json",
    )
    p.add_argument(
        "--with-elevation",
        action="store_true",
        help="Fetch per-postnummer elevation from open-meteo (slow, rate-limited)",
    )
    p.add_argument(
        "--max-stations",
        type=int,
        default=None,
        help="Limit the number of stations processed (useful for quick test runs)",
    )
    args = p.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)

    print("stations (candidates):")
    candidates = stations.build()
    print(f"  candidates: {len(candidates)}")

    print("frost normals:")
    fn_list = frost.build(candidates, source=args.source, max_stations=args.max_stations)
    print(f"  derived: {len(fn_list)} / {len(candidates) if args.max_stations is None else args.max_stations}")

    keep_ids = {n["key"] for n in fn_list}
    final_stations = [s for s in candidates if s["id"] in keep_ids]

    _write(args.out_dir / "stations.json", final_stations)
    _write(args.out_dir / "frost-normals.json", fn_list)

    print("postnummer:")
    pn_list = postnummer.build(final_stations, with_elevation=args.with_elevation)
    _write(args.out_dir / "postnummer.json", pn_list)

    print(f"Done — wrote 3 files to {args.out_dir}/")


def _write(path: Path, data: list[dict]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"  -> {path.name}: {len(data)} entries")


if __name__ == "__main__":
    main()
