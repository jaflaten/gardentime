"""One-off: augment the shipped frost-normals.json with growing-day curves.

Reads the existing frost-normals.json, recomputes each station from the cached
1991-2020 daily observations (offline — no network), and attaches the new
`growDays5` / `growDays10` fields without disturbing the existing curves/normals.
These let the app lapse-correct the GDD heat budget for the user's elevation
(Increment I, Layer 0 fix). Idempotent. Run: `python add_grow_days.py`.
"""

import json
from pathlib import Path

from climate_data import frost

DATA = Path(__file__).parent.parent / "mvp-mygarden" / "src" / "data" / "frost-normals.json"


def main() -> None:
    entries = json.loads(DATA.read_text())
    out: list[dict] = []
    missing: list[str] = []
    for i, e in enumerate(entries, 1):
        key = e["key"]
        rec = frost.derive_from_observations(key)
        if rec is None:
            missing.append(key)
            out.append(e)
            print(f"[{i}/{len(entries)}] {key}: SKIP (no cache / insufficient) — left without growDays")
            continue
        merged = dict(e)
        merged["growDays5"] = rec["growDays5"]
        merged["growDays10"] = rec["growDays10"]
        out.append(merged)
        print(f"[{i}/{len(entries)}] {key}: growDays5[12]={rec['growDays5'][12]} "
              f"growDays10[12]={rec['growDays10'][12]}")

    DATA.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(f"\nWrote {len(out)} entries to {DATA}")
    print(f"missing growDays: {len(missing)} {missing}")


if __name__ == "__main__":
    main()
