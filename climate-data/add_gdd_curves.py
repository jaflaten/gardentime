"""One-off: augment the already-shipped frost-normals.json with GDD curves.

Reads the existing frost-normals.json, recomputes each station from the cached
1991-2020 daily observations (offline — no network), and attaches the new
`gddCurve5` / `gddCurve10` fields without disturbing the existing scalar
normals. Idempotent: re-running just rewrites the same curves.

A full `python build.py` would also produce these (frost.py now emits them),
but that re-fetches /sources + rebuilds postnummer; this patches in place from
the cache. Run: `python add_gdd_curves.py`.
"""

import json
from pathlib import Path

from climate_data import frost

DATA = Path(__file__).parent.parent / "mvp-mygarden" / "src" / "data" / "frost-normals.json"


def main() -> None:
    entries = json.loads(DATA.read_text())
    out: list[dict] = []
    missing: list[str] = []
    drift: list[str] = []
    for i, e in enumerate(entries, 1):
        key = e["key"]
        rec = frost.derive_from_observations(key)
        if rec is None:
            missing.append(key)
            out.append(e)
            print(f"[{i}/{len(entries)}] {key}: SKIP (no cache / insufficient) — left without curves")
            continue
        merged = dict(e)
        merged["gddCurve5"] = rec["gddCurve5"]
        merged["gddCurve10"] = rec["gddCurve10"]
        out.append(merged)
        # Sanity: curve tail must equal the annual gdd5; flag any drift from the shipped value.
        if rec["gddCurve5"][12] != rec["gdd5"]:
            drift.append(f"{key}: curve5[12]={rec['gddCurve5'][12]} != gdd5={rec['gdd5']}")
        if "gdd5" in e and abs(rec["gdd5"] - e["gdd5"]) > 1:
            drift.append(f"{key}: recomputed gdd5={rec['gdd5']} != shipped {e['gdd5']}")
        print(f"[{i}/{len(entries)}] {key}: curve5[12]={rec['gddCurve5'][12]} "
              f"curve10[12]={rec['gddCurve10'][12]}")

    DATA.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(f"\nWrote {len(out)} entries to {DATA}")
    print(f"missing curves: {len(missing)} {missing}")
    print(f"drift warnings: {len(drift)}")
    for d in drift:
        print(f"  ! {d}")


if __name__ == "__main__":
    main()
