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
    args = p.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)

    _write(args.out_dir / "stations.json", stations.build())
    _write(args.out_dir / "postnummer.json", postnummer.build())
    _write(args.out_dir / "frost-normals.json", frost.build(args.source))

    print(f"Wrote 3 files to {args.out_dir}/")


def _write(path: Path, data: list[dict]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"  {path.name}: {len(data)} entries")


if __name__ == "__main__":
    main()
