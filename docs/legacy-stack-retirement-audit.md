# Legacy stack retirement — feature gap audit

**Date:** 2026-06-20
**Question:** Before deleting `client-next/` (Next.js web client) and the root Kotlin/Spring backend (`src/`), does either contain any feature or domain knowledge that the active app (`mvp-mygarden/`) does not already cover? (`plant-data-aggregator/` is being kept.)

---

## Verdict

**Deletion is safe.** The MVP already covers — and in its core areas *exceeds* — the old stack. The only genuinely irreplaceable content is a body of **horticultural rotation constants** hardcoded in the Kotlin source (`RotationRules.kt`). Capture those as backlog notes before deleting the source; everything else is either already in the MVP, already on the roadmap (Phase E / H), or intentionally dropped.

User framing (2026-06-20): *"We will have an account system with login later, but none of that is needed as far as I see. Current works better than the old one did."* This audit therefore treats architecture (auth, multi-tenant, cloud, multi-garden, visual canvas) as deliberately not carried forward, and focuses on portable domain logic/data that is costly to reconstruct.

---

## Where the MVP already *beats* the old stack

| Area | MVP (`mvp-mygarden`) | Old stack | Winner |
|---|---|---|---|
| Climate / harvest model | Real GDD model: 132 stations, base-5/base-10 curves, elevation lapse correction, greenhouse cover factor, won't-ripen detection, 5,132 postnumre mapped | `PlantingDateCalculatorService` was a TODO placeholder; only manual frost dates + hardiness zone stored | **MVP** |
| Sow-window guidance | `SowNowCard` + frost-relative sow rules per plant | Stub calendar events | **MVP** |
| Insights | "Hagen i tall": composition donut, season-status bar, per-year bars, harvest calendar, rotation heatmap, activity heatmap | Dashboard widgets (capacity %, recent harvests, upcoming tasks) | **MVP** (richer/analytical) |
| Onboarding / UX | localStorage-first, no login, Testhage demo, mobile gestures, view-only share, Norwegian-native | Required register → login → JWT before first use | **MVP** |

---

## Genuinely missing — preserve these before deleting

All from the Kotlin rotation engine. MVP rotation (`mvp-mygarden/src/lib/rotation.ts`, `boxRanking.ts`) is family-based with a **flat 2-year lookback for every family**, woven into warnings + box ranking + heatmap. The backend encoded more nuance — these are real agronomy that's hard to recall, so the constants are inlined here:

### 1. Family-specific rotation intervals
MVP uses one `ROTATION_LOOKBACK_YEARS = 2` for all families. Backend (`RotationRules.familyIntervals`) varied by disease pressure:

```
Solanaceae    4   (tomato, pepper, eggplant — blight, verticillium)
Brassicaceae  4   (cabbage, broccoli, kale — clubroot)
Cucurbitaceae 3   (squash, cucumber, melon — wilt)
Fabaceae      3   (beans, peas — root rots)
Apiaceae      3   (carrot, celery, parsnip — root diseases)
Alliaceae     3   (onion, garlic, leek — white rot)
Asteraceae    2   (lettuce, sunflower — downy mildew)
Chenopodiaceae 2  (beet, chard, spinach)
Amaranthaceae 2
Poaceae       2   (corn, grains)
Lamiaceae     2   (basil, mint, oregano)
default       3
critical floor 1
```
→ Cheap, high-value upgrade to MVP's existing rotation primitive (swap the flat constant for a per-family lookup).

### 2. Disease-persistence-aware rotation
MVP models no disease persistence. Backend (`RotationRules.defaultDiseasePersistence`, years in soil):

```
Clubroot          20
White Rot         15
Verticillium Wilt 10
Fusarium Wilt      7
Blight             3
Root Rot           3
Bacterial Wilt     3
Downy Mildew       1
Powdery Mildew     1
```

### 3. Nutrient / feeder-type sequencing
`FeederType` = HEAVY / MODERATE / LIGHT / NITROGEN_FIXER. Scoring (`RotationRules.NutrientBalance`):
- **Ideal:** heavy→nitrogen-fixer, nitrogen-fixer→heavy, heavy→light
- **Poor:** heavy→heavy (depletes soil fast)
- Already named as a **Phase E stretch** ("nutrient-flow hints"); the concrete rules lived only in Kotlin.

### 4. Root-depth diversity
`RotationRules.RootDepth`: reward shallow/medium/deep variation over the last 3 crops (avoid compaction). 3 distinct depths = best, repeating one depth = compaction risk. Not in MVP.

### 5. Structured harvest outcome → feeds rotation
Kotlin `CropRecord` had `yieldRating`, `soilQualityAfter`, and **per-crop disease logging** (`hadDiseases`, `diseaseNames`, `diseaseNotes`). MVP harvest is free-text `harvestYield` only. Per-crop disease logging is the missing input that would make #2 actionable from real data rather than literature defaults.

### 6. Educational rotation messaging
`RotationMessageService` produced "learn more" copy with scientific basis per rule. Nice-to-have; the *content* is worth keeping even if delivery differs.

> These map onto the existing **Phase E** ("Active rotation + companion suggestions") in `MVP-next-phases.md`, whose stretch already names nutrient-flow. This audit just makes the buried constants explicit so they survive deletion.

### Scoring weights (for reference, if a richer engine is ever rebuilt)
`RotationScoringService` blended these to a 0–100 score → grade EXCELLENT(85+)/GOOD(70+)/FAIR(60+)/POOR(40+)/AVOID(<40):
Family rotation 35 · Nutrient balance 25 · Disease risk 20 · Root-depth diversity 10 · Companion compatibility 10.

---

## Intentionally NOT porting (dropped by design)

- **Auth / JWT / multi-tenant / password reset** — Phase H ("later, not needed now"). MVP is account-free by design.
- **Multiple gardens per user** — MVP is deliberately single-garden.
- **Visual drawing canvas** (Konva: 8 tools, freehand, shapes, copy/paste, bulk-select, snap-grid, undo/redo) — MVP's grid + minimap + single-step undo is the chosen simpler model.
- **Dashboard task widgets** (capacity %, upcoming-tasks to-do, recent-harvests) — MVP analytics + SowNowCard's "Høst snart" cover the intent; a dedicated to-do list is a possible future nicety, not a loss.
- **Formal SeasonPlan / PlannedCrop entities + rotation auto-placement planner** — MVP plans implicitly via plantings + SowNowCard + box ranking. Auto-placement is heavier than the MVP's philosophy wants now.
- **Plant Data Aggregator deep fields** (soil temp/pH, spacing, staking, pruning…) — that service is **kept**; nothing lost.

---

## Safe-to-delete checklist

1. **Capture knowledge:** fold the "Genuinely missing" section (esp. constants #1–#3) into `mvp-mygarden/MVP-next-phases.md` under Phase E / a new audit note, so it outlives the Kotlin source.
2. **Confirm no runtime coupling:** `grep -rl "localhost:8081\|plant-data-aggregator\|sogn.gardentime" mvp-mygarden/` should return nothing — proving the MVP has no dependency on the backend.
3. **Then delete:** `client-next/`, `src/`, and the root Kotlin build files (`build.gradle.kts`, `settings.gradle.kts`, `gradlew*`, `gradle/`, `.kotlin/`, `build/`). Keep `plant-data-aggregator/`.

---

## Source references (knowledge being preserved, then deletable)

- `src/main/kotlin/no/sogn/gardentime/rotation/RotationRules.kt` — all constants above.
- `src/main/kotlin/no/sogn/gardentime/rotation/RotationScoringService.kt` — scoring weights + grades.
- `src/main/kotlin/no/sogn/gardentime/rotation/RotationMessageService.kt` — educational copy.
- `src/main/kotlin/no/sogn/gardentime/model/CropRecord.kt` — structured outcome fields.
- MVP equivalents that already cover the rest: `mvp-mygarden/src/lib/{rotation,boxRanking,gdd,seasonTimeline,sowWindow,gardenStats}.ts`.
