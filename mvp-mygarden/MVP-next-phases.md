# MyGarden — Next Phases Planned

> **Working rule:** This doc is the source of truth for what's planned and what's shipped. After completing any task in scope of these phases, update the relevant section *before* ending the session — move done items into **Shipped**, mark decisions as locked, record the actual numbers/paths that replaced any placeholders. Don't leave the doc lagging behind the code.

## Status

**Shipped:**
- MVP v1 — garden grid, box CRUD, plantings, history, mobile pinch-zoom
- MVP v2 (test-user readiness) — onboarding choice screen, reset garden, one-step layout undo, view-only share mode, "Sist lagret" badge, configurable grid size, import preview modal
- Phase A — plant `family` metadata + "Forrige sesong" hint on add-planting + family chip on planting rows
- Bullet 6 — `sunExposure` + `bedType` on `Box`, inline edit on BoxDetail
- Phase B — NYLIG BRUKT pinned in PlantPicker, long-press quick-add gesture, always-visible "+" badge on every tile, bottom-sheet QuickAdd
- Phase C — user-extensible plant DB (custom plants persisted in `gt_custom_plants`, merged into picker + lookup, Egne planter section in Settings, Export/Import round-trips them with `version: 2`)
- Cleanup — DinoGarden import surfaces removed (Settings + onboarding), legacy importer module deleted
- Phase D1 (data layer) — `climate-data/` Python pipeline (Frost API + geonames) → real 1991-2020 frost normals for 132 NO climate-reference stations + 5132 postnumre matched to nearest viable station. Shipped to `mvp-mygarden/src/data/{stations,frost-normals,postnummer}.json`. Frost threshold locked: **Tmin ≤ 0°C at 2 m, median over 1991-2020**.
- Phase D3 — variety tracking. `Planting.variety?: string` (`src/types/index.ts`), "Sort (valgfritt)" input in both QuickAddSheet and the BoxDetail add-planting form, surfaced as a "Sort: …" line on `PlantingRow` and inline " · variety" on `BoxTile` (with full-name tooltip). Optional field, no migration. Export/Import round-trips automatically — `isPlantingLike` validator does not gate optional fields.
- Phase D1 app-side (all 3 steps) — `📍 Hagens plassering` Settings section (postnummer + elevation + frost-justering inputs, kommune/fylke preview, "Bruk postnummer-default" shortcut, trust line, MET attribution), no-postnummer yellow banner on garden map, `useLocationStore` (`gt_location` localStorage), `src/lib/location.ts` resolver with **0.065 days/m lapse-rate correction** + frost-justering offset, `useResolvedLocation` React hook (`src/lib/useResolvedLocation.ts`), `PlantInfo` extended with `sowRules?`/`harvestRule?` (`src/types/index.ts`), `CustomPlantForm` collapsible "Avansert: så- og høstetider" group, **tagging on 31 of 32 bundled plants** (only generic "blomster" skipped) sourced from NLR + Hageselskapet + Felleskjøpet + Plantepleien via research agent. Sogndal 6857 @ 5 m verified end-to-end: resolves to Sogndal LH 497 m, last frost shifted to **15. apr** (−32 d), first frost to **5. nov** — matches D1 doc prediction.
- Phase D2 — *"Hva passer å så nå?"* card (`src/components/SowNowCard.tsx`) shown above the garden grid when location is set and any plant matches today's DOY window. Groups: **Så inne** (`indoor.weeksBeforeLastFrost`), **Så ute** (`outdoor.weeksAfterLastFrost`, with optional jord-temp note), **Plant ut** (`transplant.weeksAfterLastFrost`), **Høst snart** (active plantings whose `harvestRule` matches). Per-session dismiss via `sessionStorage`. Row "+ Legg til" opens a small `SowBoxPicker` modal listing all boxes → pick → `QuickAddSheet` opens with the plant pre-selected via new `initialPlantKey` prop. Verified end-to-end with simulated late-frost setting on Sogndal: 11 outdoor sows + 6 transplants surfaced from the tagged plant set; box-picker → QuickAddSheet → green-highlighted plant in picker confirmed.

**Guiding principles (still hold):**

1. **Show the data, not prescriptions.** Let the gardener decide. Suggestion engines come after metadata adoption.
2. **Tiny metadata additions unlock the most future features.** Prefer extending `PlantInfo` / `Box` over new surfaces.
3. **localStorage-first stays the default for free-tier users.** Sync is opt-in via account.
4. **Match scale to the user.** A free hobbyist's small bed shouldn't feel limited; paid power-users get more.

---

## Phase D — Location-aware calendar (Norway-first)

**Goal:** surface *"hva kan jeg så nå?"* with dates that actually match the user's location, so gardeners stop missing planting windows. Calendar intelligence is the product identity — not a paid feature.

**Market focus.** Build Norway-first; data model multi-region (NO/SE/DK) from day one. Intra-Norway variance (Stavanger ↔ Tromsø: ~3 months of growing-season difference, ~6 hardiness zones) is far larger than Norway-vs-Sweden variance in the populated zones. Solving Norway → SE/DK later is a data-tagging exercise, not a refactor.

**Why calendar is free, not paid.** It's the differentiator that makes the app worth installing. International tools (Gardenize, GrowVeg) can't match Norwegian frost-date accuracy; paywalling it leaves the free tier undifferentiated and starves the conversion funnel. Sync has visible per-user benefit *and* real per-user cost — that's the natural paywall. **Free = all intelligence. Paid = scale + sync.** This supersedes the placeholder split in Phase H below.

### D1 — Location + frost-relative data model (foundation)

**Status (as of 2026-06-16):** All D1 app-side work shipped same-day. Settings panel, no-postnummer banner, location store + resolver, `useResolvedLocation` hook, schema extension, `CustomPlantForm` advanced fields, and tagging on 31 of 32 plants. Generic "blomster" is the only untagged key — intentionally skipped because "Flowers" is too generic to pin sowing windows on. Cross-checking the tagged values against deeper NLR/Hageselskapet sources remains a quality-improvement TODO but doesn't block D2 (which is now also shipped).

**Data shipped with the app** (committed JSON, no runtime API calls):
- `postnummer.json` (5 132 entries) — `{ postnummer, kommune, fylke, centroidLat, centroidLon, centroidElevationM, stationId }`. Source: geonames Norway (CC BY 4.0). `centroidElevationM` defaults to **150 m** (user-overridable in app settings); per-postnummer elevation via Kartverket DEM is a future enhancement.
- `frost-normals.json` (132 entries) — `{ key, lastFrostDoy, firstFrostDoy, gdd5 }`. Derived from MET Frost API daily Tmin + Tmean over 1991-2020. **Threshold locked: Tmin ≤ 0°C at 2 m, median across 30 years.**
- `stations.json` (132 entries) — `{ id, name, lat, lon, elevationM }`. For the trust line in UI (*"vi bruker Sogndal LH, 497 moh"*).

Pipeline lives in `climate-data/` (Python 3.11+, stdlib only, MET credentials in `climate-data/.env`). Decision recorded: we use **Frost API per-station** rather than seNorge 1km gridded — simpler, no NetCDF dependency, accurate enough as long as the app applies lapse-rate correction (see Sogndal note below). seNorge remains the better long-term source if station coverage proves too sparse.

**Plant data model — frost-relative, not month-absolute:**
```ts
type SowRule =
  | { type: 'indoor', weeksBeforeLastFrost: [number, number] }
  | { type: 'outdoor', weeksAfterLastFrost: [number, number], minSoilTempC?: number }
  | { type: 'transplant', weeksAfterLastFrost: [number, number] }

type HarvestRule =
  | { weeksFromSowing: [number, number] }
  | { weeksBeforeFirstFrost: number }

type PlantInfo = {
  // ...existing fields
  sowRules?: SowRule[]
  harvestRule?: HarvestRule
}
```
Frost-relative rules are portable: the same `sowOutdoor: { weeksAfterLastFrost: [0, 2] }` for tomato works in Bergen, Oslo, and (later) Copenhagen. Only the per-location frost dates change. Tag the bundled 32 plants. `CustomPlantForm` gets the same optional fields.

**Settings UI (`📍 Hagens plassering`):**
- Postnummer (4 digits) — strongly nudged on first run, optional
- Høyde over havet (m) — auto-defaulted from postnummer centroid, editable
- Frost-justering (±dager) — optional local micro-adjustment for known frost pockets
- Trust line below: *"Vi bruker [stasjon], [N] moh. Anslått siste vårfrost: [dato]. Første høstfrost: [dato]."*

**UX states for missing/default data:**
- **No postnummer:** yellow banner top of garden map — *"Vi viser et grovt landsestimat. Legg inn postnummer for datoer som faktisk passer hagen din."* Fallback to national-median dates (≈ mid-May / mid-Sept).
- **Postnummer, default elevation:** green inline confirmation.
- **Postnummer + custom elevation:** green confirmation that names the elevation explicitly.

**Attribution:** *"Klimadata fra Meteorologisk institutt, lisensiert under CC BY 3.0 NO."* In About page **and** bottom of the location settings panel (visible where the data is used).

**Elevation gap — confirmed and addressed in the app layer.** Sogndal `6857` is the canonical case: postnummer centroid sits near the fjord, but the nearest station with 30 years of viable data is **Sogndal LH (the airport at 497 m)** — the lower-elevation Sogndal–Selsenghaugen station didn't pass the data-completeness threshold. Pipeline result for 6857: `stationId = SN55700`, station elevation 497 m, last frost ≈ 16 May, first frost ≈ 3 Oct. A real Sogndal-town user (~5 m) will see ~3-4 weeks earlier spring frost than that.

**The fix lives in the app code, not the data.** When the calendar computes user-facing frost dates, it must apply lapse-rate correction: `~0.65°C per 100 m elevation difference` × `~10 days per °C` between `station.elevationM` and `user.elevationM`. The pipeline already exposes both elevations; the calendar math does the shift. Users can further nudge with the `Frost-justering ±dager` field for known frost pockets.

Address-level lookup (yr.no-style locale name → lat/lon/elevation) and seNorge 1km re-sampling are future enhancements, not D1.

**Explicitly out of scope for D1:**
- Calendar UI ("Hva passer å så nå?" card) → D2
- Variety tracking → D3
- Day-length adjustment for high latitudes → deferred, revisit if Tromsø-area testers ask
- GPS auto-detect → deferred
- Address-level granularity (yr.no-style) → deferred
- Sweden/Denmark UI → deferred (data model already multi-region)

### D2 — "Hva passer å så nå?" card — ✅ SHIPPED 2026-06-16

**Status (as of 2026-06-16):** Shipped end-to-end. Card lives in `src/components/SowNowCard.tsx`, slotted in `src/pages/GardenMap.tsx` above the grid section, between the `NoLocationBanner` and the zoom controls. Hides automatically when (a) no postnummer set, (b) dismissed this session, or (c) zero plants match today's window. Per-session dismiss via `gt_sownow_dismissed_at` in `sessionStorage`. Row "+ Legg til" opens a compact `SowBoxPicker` modal that lists all boxes (2-col grid); picking a box opens `QuickAddSheet` with `initialPlantKey` pre-selected (highlighted in the picker).

**Hard prerequisites (must land in this order before D2):**
1. **Location store** — `useUiStore` (or a new `useLocationStore`) holding `postnummer`, `elevationM`, `frostJustering` with `gt_location` localStorage key. Resolver: `postnummer → station → frost normals`, then apply lapse-rate correction (~0.65°C per 100 m × ~10 days per °C between `station.elevationM` and `user.elevationM`) + `frostJustering` offset. Returns `{ lastFrostDoy, firstFrostDoy, stationId, stationName }`.
2. **Settings panel** — `📍 Hagens plassering` in `src/pages/Settings.tsx` (new section above Backup). Writes the location store.
3. **`sowRules` / `harvestRule` on `PlantInfo`** — schema extension in `src/types/index.ts`, then tag the 32 bundled plants in `src/data/plants.json`. Same optional fields on `CustomPlantForm`. **This is the rate-limiter** — tagging needs cross-checked Norwegian sources (NLR, Hageselskapet) per plant.

Steps 1+2 are independent; step 3 (tagging) is parallel work. D2 is the consumer of all three.

**Card sketch (refined with code references):**
- Slot: `src/pages/GardenMap.tsx` between the sticky header (~line 301) and the grid container (~line 384). Above `LastSavedBadge` placement reads as a peer to the map; below it reads as a footer — go above.
- Source list: `useMergedPlantList()` (bundled + custom) filtered against today's DOY and the location store's frost dates.
- Grouping:
  - **Så inne** — `sowRules` includes `indoor` with `weeksBeforeLastFrost` window overlapping today (today is N weeks before `lastFrostDoy`)
  - **Så ute** — `sowRules` includes `outdoor` with `weeksAfterLastFrost` window overlapping today
  - **Plant ut** — `sowRules` includes `transplant` with `weeksAfterLastFrost` window overlapping today
  - **Høst snart** — for active plantings only: `harvestRule.weeksBeforeFirstFrost` within ~2 weeks, OR `harvestRule.weeksFromSowing` window reached since `plantedDate`
- Row click → opens `QuickAddSheet` with `plantKey` prefilled. Extend `QuickAddSheet` to accept an optional `initialPlantKey` prop (cleaner than URL params or store-state coupling).
- Dismiss: per-session, not permanent. Use `sessionStorage` so it returns next visit — users will want to see it again after planting one thing.

**Resolved decisions (previously "things that may shift"):**
- **No-postnummer users:** show a yellow banner ("Legg inn postnummer for å se hva som passer å så nå") in the same slot, **not** the card with national-fallback dates. National medians (mid-May / mid-Sept) are misleading enough that a misfit feels worse than no card.
- **Time-window aggressiveness:** start conservative (NLR-aligned). Widening windows after feedback is safer than narrowing them after a tester sowed too early.
- **Trust line:** don't repeat per card — the line in Settings is enough. Adding it to every card would clutter; users learn the source once.

**Out of scope for D2:**
- Edit-existing-planting flow (no edit surface exists today — `addPlanting` is the only mutation; if a user mis-sows from the card, they can mark `failed` and re-add)
- Per-plant detail page ("why is this in Så ute right now?") — defer until a tester asks
- Multi-year history influence ("you sowed tomato successfully on May 10 last year, suggest May 8") — needs Phase F harvest data + multiple seasons

### D3 — Variety tracking (independent) — ✅ SHIPPED 2026-06-16

**Concept:** *variety* is the cultivar of a picked plant (Sungold / Roma / Beefsteak for a tomato). Distinct from `customName` on `Planting`, which exists for free-text naming and stays untouched. A user picks "Cherrytomater" from the plant DB **and** notes the variety "Sungold" — two complementary fields.

**What landed:**
1. `src/types/index.ts` — `variety?: string` on `Planting` (between `customName` and `plantedDate`).
2. `src/components/QuickAddSheet.tsx` — "Sort (valgfritt)" text input above the date field, placeholder `f.eks. Sungold`. Persisted via `addPlanting`.
3. `src/pages/BoxDetail.tsx` — same "Sort (valgfritt)" input on the "Legg til plante" form. Mirrors QuickAdd so the "thorough" flow isn't missing the field.
4. `src/store/useGardenStore.ts` — no code change required. `addPlanting` already takes `Omit<Planting, "id" | "year">`, so the new optional field flows through automatically.
5. `src/components/PlantingRow.tsx` — "Sort: …" muted line under the plant name on both active and history rows (same component renders both sections).
6. `src/components/BoxTile.tsx` — inline " · variety" appended to the plant line, muted color, kept on the same row to preserve tile density. `truncate` handles overflow and `title` exposes the full string on hover.

**Storage:** no migration. Optional field; existing plantings stay valid. `isPlantingLike` in `src/pages/Settings.tsx` only validates required fields, so Export/Import round-trips variety untouched without bumping `version`.

**Out of scope for D3 v1 (defer until used):**
- Variety recall ("nylig brukt sort: Sungold" when picking tomato again) — high-leverage but adds the same NYLIG BRUKT plumbing as Phase B; ship the bare field first, see if it gets used.
- Variety on the "Forrige sesong" hint (Phase A) — would read "I fjor: Sungold-tomat". Small but worth holding until at least one season of variety data exists.
- Per-variety metadata (own row in plant DB with its own emoji / days-to-harvest) — overkill; the string is the MVP.
- Edit-existing-planting flow — captured as **D3.1** below; was originally deferred because no edit surface existed, but real use of D3 made it the obvious next step.

### D3.1 — Edit/extend existing planting from QuickAdd (follow-on, planned)

**Status (as of 2026-06-16):** Planned. Driven by user feedback after D3 shipped — opening QuickAdd on a box that already has a planting and entering a variety should *update* that planting, not create a duplicate dated today. Today's pre-fill (QuickAddSheet defaults the picker to the box's most recent active plant) is a stopgap that still creates a new row on save.

**Goal:** when QuickAdd opens on a box with an existing active planting, the default action is to edit/extend that planting (add/change `variety`, update `notes`, etc.) instead of inserting a new row. The original `plantedDate` is preserved — that's the whole reason for treating it as an edit.

**Cases to handle:**
- **0 active plantings** — current "add new" behavior, unchanged.
- **1 active planting** — QuickAdd opens in edit mode pre-filled with the existing planting. Lagre updates in place. A clearly-labeled secondary action (e.g. "Legg til en til") lets the user opt into creating a second planting alongside.
- **2+ active plantings** — force a choice: a short list of the box's active plantings at the top of the sheet (plant name + plantedDate + variety if any), user picks one to edit, or "Legg til ny planting" as last option. No default — ambiguity must be resolved explicitly.

**Code touches (anticipated, confirm against current state when starting):**
1. `src/store/useGardenStore.ts` — `updatePlanting()` already exists (~line 131) and handles partial patches; reuse it. No new store action needed.
2. `src/components/QuickAddSheet.tsx` — mode switch: `mode: "add" | "edit"`. In edit mode, render a "Rediger planting" header, pre-fill from the chosen planting (plantKey, customName, variety, notes, plantedDate), and call `updatePlanting(id, patch)` on submit instead of `addPlanting`. Add the disambiguation list when `activePlantings.length >= 2`.
3. `src/pages/BoxDetail.tsx` — keep its current "Legg til plante" form as pure add (the page already shows the full history; a separate explicit "Rediger" button per `PlantingRow` is the natural edit surface there — see "Related" below).
4. Tests of intent (informal): adding a variety on a 1-planting box keeps the same `id` and `plantedDate`; on a 2-planting box, Lagre is disabled until a planting is picked.

**Resolved decisions:**
- **Preserve `plantedDate`** — the whole reason the user flagged this. Updating it would make "Plantet: 12. mai" silently jump to today, which is exactly the harvest-tracking footgun we don't want.
- **`status` stays untouched** — don't auto-revive a `harvested`/`failed` planting just because the user opens QuickAdd. Edit mode targets `status === "active"` only; harvested rows need a different surface (probably the per-row edit button below).
- **Disambiguation list, not a dropdown** — a box can only realistically have 2-4 active plantings at once; a vertical pickable list is faster on mobile than a `<select>`.

**Out of scope for D3.1 (defer until used):**
- Editing harvested/removed plantings — needs a separate edit surface, probably on `PlantingRow`. Not blocking the QuickAdd flow.
- Bulk edit (apply the same variety to multiple plantings at once) — not a real user need until we see it.
- Undo on edit — `Planting` mutations are already non-destructive enough (every edit is one optimistic write), and there's no undo on `addPlanting` either; consistency over local cleverness.

**Related:**
- The "edit existing planting" button on `PlantingRow` (referenced under D3.1 step 3 and the D2 section's "Edit-existing-planting flow" out-of-scope note) is a separate but adjacent surface — both share `updatePlanting`. Ship D3.1 first; the PlantingRow edit button is a natural follow-on once the mode-switch pattern exists.

### Sources

- [Frost API (frost.met.no)](https://frost.met.no/) — REST API for per-station MET data, free with client credentials, returns `"license": "CC BY 3.0 NO"` directly in every response
- [seNorge_2018 gridded datasets (Lussana et al., 2019)](https://essd.copernicus.org/articles/11/1531/2019/) — 1 km gridded daily Tmin/Tmax/Tmean over Norway, 1957→present; the right source for elevation-aware frost-date derivation
- [MET report 05/2021 — Free Norwegian standard climate normals 1991–2020](https://www.met.no/kss/_/attachment/download/5a8e178e-48b0-4b5a-8410-8628804299f8:3ac4fec6cf3fb7919aefe42db2b63ad8e8b9e6a6/METreport%2005_2021_New_Norwegian_standard_climate_normals_1991_2020-signert.pdf) — what MET publishes as normals
- [MET report 9/2025 — Frost i vekstsesongen](https://www.met.no/publikasjoner/met-report/_/attachment/inline/6a85d48d-c7d0-4014-9c17-64842d1392df:692b728eab7afabde90b851ecff442cd2879bc05/MET%20rapport%209_2025%20-%20Frost%20i%20vekstsesong,%20KiN%20bakgrunnsrapport.pdf) — MET's 2025 analysis of growing-season frost, useful for definitions
- [frostr R package](https://cran.r-project.org/web/packages/frostr/frostr.pdf) — third-party client showing Frost API element model in practice
- [Norsk Klimaservicesenter (seklima)](https://seklima.met.no/) — interactive frontend over the same data, useful for cross-checks
- Bring/Posten open postnummer dataset — source for `postnummer.json`

---

## Hagekalender — full feature roadmap (post-D2 expansion)

> Planning-only doc. None of this is implemented yet — D2's "Hva passer å så nå?" card is the entry point; this section sketches the destination and the small shippable steps between here and there. Each increment is independently testable so we don't build a complex beast in one shot.

### Vision

D2's today-card answers **one** question: *what can I sow right now?* The full calendar should answer **four**, across the season:

1. **What** can I sow / plant out / harvest right now? — *D2 (shipped)*
2. **Where** in my garden does it go? — *Increments B + C*
3. **When** else this season — and what's next? — *Increments D + E*
4. **What did I learn from last year?** — *Increment I, depends on Phase F*

The user phrased a similar intuition: "help suggest where to plant it, based on history of the boxes and plant families". This roadmap is that, broken into landable pieces.

### Why this fits MyGarden — and what it's not

Competitive landscape (knowledge as of training; verify before locking decisions):

- **Gardenize** (Norwegian-built, broad) — strong plant journal + photo log + reminders, weaker on station-accurate frost timing. Wins on logging, not on calendar accuracy.
- **GrowVeg / Almanac.com Garden Planner** — strong drag-drop layout designer + companion + crop rotation. Generic frost-zone calendars (US/UK-leaning), paywalled.
- **Hjemmehagen.no** — Norwegian digital allotment planner with plot layout focus; not a calendar-first tool.
- **Plantasjen / Hageselskapet content** — calendars exist as articles + month-by-month guides, not in-app contextual to the user's specific garden.

**Our wedge — what nobody else combines:** Norwegian station-accurate frost dates × frost-relative plant rules × per-box family history × the user's actual layout. We already have all four primitives. The roadmap is connecting them into intelligence the user can act on.

Strategically NOT building (other apps do these well or they conflict with our positioning):

- Drag-drop graph-paper garden designer → GrowVeg's territory; we're calendar-first, not layout-first.
- AI plant identification → different product surface; defer.
- Heavy social / community / sharing → not our identity (already in "NOT planned").
- Subscription paywall on calendar → per existing principle, *calendar is the free differentiator*.

### Philosophy (anchored in the existing principles)

- **Show the data, never enforce.** Soft hints over hard rules. The user always overrides without friction. Every recommendation surfaces its *why* in one line.
- **Show negative space too.** When a plant is *missing* from a recommendation list, surface *why* — not just hide it. "Du kan ikke plante Solanaceae i drivhus 2 i år fordi du hadde tomater og potet her i 2024 og 2025" is often more directly actionable than the positive "you can plant X" list, because it prevents a mistake the user might make on their own. Negative recommendations also teach the rotation/sun/bed principles passively, without a tutorial.
- **Tiny metadata adds unlock big features.** Each increment introduces at most one new optional field on `PlantInfo` or `Box`. No schema sprawl.
- **Reuse the existing primitives.** Family, sunExposure, bedType, planting history, frost normals, harvest rules. Add only when an increment genuinely pays for it.
- **Calendar stays free** (per Phase D's positioning). Sync + scale go in Phase H; the intelligence does not.

### Increments — each independently shippable

Each increment lists: **Goal** · **New metadata** · **UI surface** · **Depends on** · **Effort**.

#### A. ✅ "Hva passer å så nå?" card (= D2 — shipped)

Today-card with grouped recommendations. See the D2 section above.

#### B. Smart SowBoxPicker — box-ranked recommendations

- **Goal:** When the user clicks "+ Legg til" in the D2 card, the picker doesn't list all 50 boxes equally — it ranks them by fit for the chosen plant.
- **Ranking inputs (orthogonal — all must pass):**
  - Family rotation: penalize same-family in last 1–2 years.
  - Sun match: plant's `sunNeed` vs box's `sunExposure`.
  - Bed type match: plant's `prefersBedType` vs box's `bedType`.
  - **Soil depth match: plant's `minDepthCm` vs box's `depthCm`.** Hard-ish constraint for root vegetables (potet, gulrot, rødbeter, persillerot, kålrot need 25–30 cm; shallow planters at 20 cm rule them out). Missing `depthCm` on a box is treated as "unknown — no constraint" (same as in-ground beds, which are effectively unlimited).
  - Empty preferred: boxes with no active plantings rank higher.
  - Plant size vs box size: don't waste a big bed on lettuce.
- **New metadata:**
  - `sunNeed?: 'full' | 'partial' | 'shade'` on `PlantInfo`.
  - `prefersBedType?: BedType[]` on `PlantInfo`.
  - `minDepthCm?: number` on `PlantInfo` (only set on plants that genuinely care — root veg + tomato in container; most leaves and herbs don't need it).
  - `depthCm?: number` on `Box`. New `BoxMetaFields` input with helper text *"Anslag i cm. En pallekarm er typisk ~20 cm — to i stabel ≈ 40 cm. La stå tom for plantet i bakken."*
  - All optional; missing = no penalty / no constraint.
- **UI:** Three groups in the picker — **Anbefalt** / **OK** / **Frarådes**. Each box card carries a muted one-line *why* (*"Sør-vendt, opphøyd, 40 cm dyp"* / *"Solanaceae her i fjor"* / *"Kun 20 cm dyp — for grunt for gulrot"*).
- **Depends on:** D2 (shipped). Otherwise independent.
- **Effort:** ~1 day for ranking + UI + new fields; +½ day for the `BoxMetaFields` extension and bulk-tagging `minDepthCm` on root-veg plants.

#### C. "Hva passer i denne kassen?" — reverse lookup from BoxDetail

- **Goal:** From a single box's page, ask the inverse question — not what to sow globally, but what fits **here** today. Equally important: surface what *doesn't* fit, and why, since the absence of an option is information.
- **Two surfaces, both on `BoxDetail`:**
  - **Passive context banner** (always visible when any constraint is informative): one or two short sentences summarising what *not* to plant here and why. Examples:
    - *"Du hadde Solanaceae her i 2024 og 2025 — vurder en annen familie i år."* (rotation)
    - *"Denne kassen er 20 cm dyp — for grunt for poteter, gulrot, rødbeter og andre rotgrønnsaker."* (depth)
    - *"Kassen er skygget — løvgrønnsaker passer, ikke tomat eller paprika."* (sun)
    - Multiple constraints concatenate into a single 1–2 sentence block, never a wall of text.
    - No interaction needed; it's there when you open the box. Pure data → derived sentence. Hides when no constraint is meaningful (e.g. an in-ground bed with no recent family conflict).
  - **Active "Hva passer her nå?" panel** (button-triggered): three groups in the same B/SowBoxPicker style — **Anbefalt** / **OK** / **Frarådes** — filtered by today's frost-window match + this box's sun/bed/family/**depth** fit. Each row carries a one-line *why*, both for the recommended plants ("ny familie i denne kassen, sør-vendt, 40 cm dyp") and the discouraged ones ("Solanaceae 2 år på rad", "trenger 30 cm, kun 20 cm her"). Click an Anbefalt row → `QuickAddSheet` pre-filled for THIS box (reusing the `initialPlantKey` prop D2 added).
- **New metadata:** none — reuses B's sun/bed metadata + existing family/history.
- **Depends on:** B (the sun/bed metadata). The passive banner depends on nothing new and could ship even before B if helpful for testing.
- **Effort:** ~½ day for the banner, ~½ day for the panel — can be split.

#### D. Sesongoversikt — horizontal timeline view

- **Goal:** Show the season ahead at a glance. When should each task happen? When are things due?
- **Derives from:** frost dates + active plantings + plant rules. No new metadata.
- **UI:** New view (or expandable section in `GardenMap`). Horizontal timeline today → first frost, with markers per task (sow / plant out / harvest). Optional per-box swim-lanes. Tap a marker → details.
- **Depends on:** D2 (frost dates + rules already in place).
- **Effort:** 2–3 days. Biggest UI lift in this roadmap.

#### E. Successional sowing reminders

- **Goal:** Salat, reddik, spinat reward sowing every 2–3 weeks. Surface that as the previous batch matures.
- **New metadata:** `successionWeeks?: number` on `PlantInfo` (e.g. salat: 3, reddik: 2).
- **UI:** D2 card gains a **Successjon** group: *"Sådd salat for 3 uker siden i box 30 — så ny portion nå"*.
- **Depends on:** D2 (shipped).
- **Effort:** ~½ day (mostly tagging).

#### F. Companion hints — *(absorbs Phase E's companion scope)*

- **Goal:** Surface good/bad plant pairings when adding a plant near existing active ones.
- **New metadata:** `companionsGood?: PlantKey[]`, `companionsBad?: PlantKey[]` on `PlantInfo`. Source: `plant-data-aggregator/plant-data-aggregator/docs/companionship/companionship.json` (already scraped and sitting in the repo).
- **UI:** B's box picker shows a green hint on boxes with compatible companions ("🌿 Trives med basilikum i nabokasse"); QuickAdd shows pairing hints when the target box has other active plantings.
- **Depends on:** none (orthogonal to other increments).
- **Effort:** 1–2 days (mostly tagging + cross-referencing).

#### G. Rotation warnings (per-action chips) — *(absorbs Phase E's rotation scope)*

- **Goal:** Soft warning *at the moment of decision* when the user is about to repeat a family in the same box. 4-year cycle is the gardening ideal; warn at 2 years.
- **New metadata:** none — derives from existing `family` + planting history.
- **UI:** Inline warning chip in `QuickAdd` ("⚠ Solanaceae her i 2024 og 2025"); same chip on rows in B's box picker. Dismissable, never blocking.
- **Pairs with Increment C's passive context banner** — G fires *as you act* (you've picked a plant; we warn before you confirm), C surfaces *when you arrive* (you opened a box; here's its rotation/depth/sun context in one or two sentences). Both shipping is the point — the chip catches the action, the banner sets context.
- **Depends on:** none.
- **Effort:** ~½ day.

#### H. Reminders / notifications (opt-in)

- **Goal:** Proactive nudges instead of "open app, check card". E.g. *"Tomatene dine bør plantes ut nå"*, *"Frost om 2 dager — dekk til ømtålige planter"*.
- **New infra:** `gt_reminders` localStorage with last-shown timestamps to dedupe. Web push opt-in via service worker — or, simpler v1, a session-only banner ("Du har 3 oppgaver i dag").
- **UI:** Bell icon or session banner at top of garden map. Settings toggle to enable browser push.
- **Depends on:** Service worker setup (new infra, not currently in the app).
- **Effort:** 2–3 days for web push; ½ day for session banner only.

#### I. Multi-year intelligence — *(depends on Phase F)*

- **Goal:** Use 2+ years of history to refine recommendations beyond defaults. Examples: *"Du sådde tomat 10. mai i 2024 og 2025 — vurder 3. mai i år for tidligere høst"*, *"Bønner i box 4 ga god avling i fjor — fortsett der?"*
- **New metadata:** uses Phase F's `harvestYield`.
- **UI:** Refines existing card hints + adds *"I fjor: …"* reasoning lines.
- **Depends on:** **Phase F** (harvest tracking) + at least one full season of personal data.
- **Effort:** Open-ended. Start with rule-of-thumb (mean-of-prior-years), evolve.

#### J. Visualisering / dashboards — *(addresses the user note in Phase H)*

- **Goal:** Capture the user's stated interest in graphs and visuals.
- **Candidate charts:** family-composition pie (which families dominate this year?), yield-over-time bars, box-productivity ranking, calendar-density heatmap. Sesongoversikt (D) is already one form of visualization.
- **New metadata:** none beyond what other increments add.
- **Depends on:** Phase F for yield-based charts; D ships one form already.
- **Effort:** ~½ day per chart. Pick high-value ones; don't ship a dashboard for the sake of having one.

### Suggested sequencing — cohorts, not a long single sprint

**Cohort 1 — quick wins on existing data (1–2 weeks total):**

- **G** (rotation warnings) — half day, uses what we already have.
- **B** (smart box picker) — biggest user value from existing data; one new pair of metadata fields.
- **C** (reverse lookup) — builds on B's metadata.

**Cohort 2 — small schema extensions, get real-user feedback (2–3 weeks):**

- **F** (companions) — tagging-heavy but data source already in repo.
- **E** (succession) — tiny metadata add.
- **D** (sesongoversikt) — biggest UI lift, no new metadata; do this once Cohort 1 has settled in.

**Cohort 3 — needs Phase F first:**

- **Phase F** (harvest tracking).
- **I** (multi-year intelligence).
- Yield-based parts of **J** (dashboards).

**Cohort 4 — opt-in, infra-heavy:**

- **H** (notifications) — only after we've got real-user signal that the card alone isn't enough.

### Relationship to other phases (housekeeping)

- **Phase E** (active rotation + companion suggestions) — its scope is absorbed into this roadmap as increments **F + G**. The Phase E section below still applies; treat it as the detail page for F + G. When we ship F + G, fold Phase E's section into the shipped log.
- **Phase F** (harvest tracking) — hard prerequisite for Increment **I** and yield-based parts of **J**. Ship F before Cohort 3.
- **Phase G** (photos) — independent. Could feed into J as a visual diary tab eventually, but doesn't gate anything in this roadmap.
- **Phase H** (accounts, sync, tiers) — all calendar increments stay free per the existing positioning. None of these gate behind paywall.

### Anti-patterns to avoid

- **Hidden ranking.** Every recommendation must expose its *why* in one line. If the user can't tell why a box was demoted, the feature is opaque magic.
- **Schema sprawl.** Resist adding a new `PlantInfo` field for every nice-to-have. If a feature can be derived from existing data + a single new flag, that's the limit.
- **Hard validation.** No increment in this roadmap should ever block a user action. Warn, surface, suggest — never refuse.
- **Big-bang releases.** Each increment lands and gets used before the next starts. Cohort 1 should be in real hands for at least a couple of weeks before Cohort 2 begins.
- **Subscription paywall on the calendar.** Free = all intelligence. Per the existing principle, this is the wedge.

---

## Phase E — Active rotation + companion suggestions

**Goal:** turn the family data + calendar data into actionable guidance.

**Scope:**
- Soft rotation warning in the add-planting form: *"⚠ Du hadde Solanaceae her i 2024 og 2025. Vurder en annen familie."* Non-blocking, dismissable.
- Companion data on `PlantInfo`: `companionsGood?: PlantKey[]` and `companionsBad?: PlantKey[]`. Tag bundled plants from the existing `plant-data-aggregator/plant-data-aggregator/docs/companionship/companionship.json` (already scraped, sitting in repo).
- When picking a plant for a box with active plantings, surface inline pairs: *"🌿 Trives med basilikum"* or *"⚠ Dårlig kombinasjon med dill"*.
- Stretch: nutrient-flow hints (heavy feeder → light feeder → nitrogen fixer rotation).

**Caveat.** Every gardener has slightly different rotation rules. Design these as soft *information*, never blocking validation. Always allow the user to override. **Don't ship E until A's family chip has been in real-world use for a season** — we want to see how the gardener actually uses the data before automating recommendations.

---

## Phase F — Harvest tracking

**Goal:** close the loop on which plantings actually paid off — input for next year's planning.

**Scope:**
- Optional `harvestYield?: string` on `Planting` (free text: "5 kg", "3 bøtter", "1 sekk").
- On the Høst action, optionally prompt for yield.
- History view (already grouped by year) could later show "best performers" per box.

**Why now:** cheap addition, aligns with regenerative philosophy — track what works, drop what doesn't.

---

## Phase G — Photos

**Goal:** visual diary per planting and per box.

**Scope:**
- `Planting.photo?: string` (compressed JPEG, target ~200 KB).
- `Box.coverPhoto?: string`.
- Camera API on mobile, file picker on desktop.
- Client-side image compression before storage.

**Storage caveat.** localStorage caps at ~5 MB total per origin. Photos blow that budget fast (~25 photos at 200 KB and you're done). This phase likely needs IndexedDB *or* a backend — natural pairing with Phase H sync.

---

## Phase H — Accounts, sync, and tiers

**Goal:** garden follows the gardener across devices. Spouse can co-edit. Paid tier unlocks power-user shapes.

### Architecture

- Supabase backend with magic-link auth.
- Replace `src/lib/storage.ts` with `src/lib/supabase.ts`. Same store actions, just a different persistence layer. **The store API (`useGardenStore` / `useCustomPlantsStore` / `useUiStore`) stays unchanged** — that's the seam.
- Garden ownership model: each user owns N gardens; each garden has 0+ collaborators.
- Migration: on first login with existing localStorage data, prompt *"Vil du knytte hagen din til en konto?"* and bulk-upload to backend.

### Free vs paid tier *(placeholder — confirm against user feedback)*

**Free (default, generous):**
- 1 garden, single-device.
- Sensible cap on box count / grid size that comfortably covers a typical home garden.
- Read-only share links (`?view=1`) already work.
- All Phase A–F features (family hints, custom plants, calendar, harvest tracking).
- Local Export/Import is the manual sync path.

**Paid (working name: "Hagentøy Pro" — placeholder):**
- Multiple gardens (allotment + home + community plot).
- Larger grid + higher box cap.
- Cross-device sync via account.
- Co-edit with spouse / family.
- (Maybe) photo storage backed by backend.
- (Maybe) calendar reminders by email.

### Principles for the paid line

1. Free should never feel **crippled** — limits target power-user shapes, not basic shapes.
2. Paid features unlock **more**, never **required**. Avoid antipatterns like *"you can't reset until you upgrade"*.
3. The boundary should be a meaningful jump in value, not artificial friction.
4. Sync is the headline upgrade. Everything else is a bundle around it.

### Open questions for monetization

- What's a "typical" home garden in terms of box count / grid size? **Need real user data before setting the free-tier cap.** Watch what testers actually build.
- Photo storage costs scale per user. Must be priced into the paid tier, OR use heavily compressed thumbnails only.
- Co-editing requires conflict resolution (CRDT or last-write-wins). Out of scope until paid demand is real.
- Pricing model: monthly, annual, or one-time? Norwegian market expectations differ.

Note from user: I had an idea that could perhaps add some interesting graphs and visuals at some points to see how the garden is doing, what we have planted, status of boxes etc. Perhaps we could make some interesting visuals, even the calendar features might have interesting data that we could visualize. We need to discuss and plan this further. **(Planned as Increment J in the Hagekalender roadmap above.)** 
---

## Phases NOT planned (yet)

Explicitly deferred:

- **Multi-language UI beyond plant names.** App chrome stays Norwegian-only by design. Polish toggle only swaps plant labels.
- **ML-driven yield prediction.** Too brittle without years of personal data.
- **Social features.** Sharing gardens publicly, plant trading, community feeds — not part of the gardening-tool identity.
- **Native mobile app.** PWA is enough. If iOS/Android wraps become valuable, Capacitor over the existing web app — not a rewrite.

---

## What to ship next (recommendation)

**Phase D1 + D2 + D3 are shipped 2026-06-16.** Full Norway-first calendar foundation is live: postnummer-driven frost dates with lapse-rate correction, `useResolvedLocation` hook, 31-of-32 plants tagged from NLR/Hageselskapet/Felleskjøpet/Plantepleien, *"Hva passer å så nå?"* card with click-to-prefill, and variety tracking on plantings.

**Order of operations from here:**

1. **D3.1 — edit/extend existing planting from QuickAdd.** Same-day user feedback flagged the "add duplicate vs. edit existing" choice as the obvious next polish. Small, well-scoped; see the D3.1 section.
2. **Hagekalender Cohort 1** (smart box picker + reverse lookup + rotation warnings). See the Hagekalender roadmap section. ~1–2 weeks. Each lands independently; ship them one at a time and look for friction before moving on.
3. **Real-user feedback loop on D2** — get the card in a real Norwegian gardener's hand across a couple of weeks before locking sowRule values. Pair with a targeted NLR/Hageselskapet cross-check on the plants the user actually grows.
4. **Phase F (harvest tracking)** — unlocks Cohort 3 of the roadmap (multi-year intelligence). ~1 day to ship.

**Big bets — hold for signal before starting:**

- **Phase H** (accounts/sync/tiers) — wait for at least one tester to explicitly ask for cross-device or shared editing.
- **Phase G** (photos) — wait until users ask, and pair with H since localStorage can't hold many images.

After D1+D2 ship and get real use, **Phase F (harvest tracking)** is a cheap follow-on (~1 day) that closes the loop.

**Phase E and Phase H are the big bets** — they shape the product story (E) and the business story (H). Hold both until user feedback gives concrete demand signals:

- **Hold E** until the family chip has been in the user's hand for a growing season. Watch which "which family was here last year?" decisions get repeated — those are the candidates for soft warnings.
- **Hold H** until at least one tester explicitly asks for cross-device or shared editing. Build the paid tier around demonstrated demand, not assumed demand.

---

## Architecture note for future H

The data layer is already shaped for sync. Three localStorage namespaces map cleanly to three Supabase tables:

| Local key | Maps to | Notes |
|---|---|---|
| `gt_boxes` | `boxes` (FK to garden) | Layout `{x,y,w,h}` + optional `sunExposure` + `bedType` |
| `gt_plantings` | `plantings` (FK to box) | Existing structure already includes `year`, `status` |
| `gt_custom_plants` | `custom_plants` (FK to user, NOT garden) | Vocabulary follows the gardener, not the garden |
| `gt_grid_size`, `gt_language`, `gt_lastSavedAt` | per-user preferences | Move to a `user_preferences` table |

`useGardenStore` and `useCustomPlantsStore` are the seams. Swap `src/lib/storage.ts` for `src/lib/supabase.ts` and the rest of the app doesn't notice.

**Don't break this seam.** If a future phase couples the store directly to localStorage outside `storage.ts`, it makes H harder. Keep persistence centralized.
