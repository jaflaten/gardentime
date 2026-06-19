# MyGarden — Next Phases Planned

> **Working rule:** This doc is the source of truth for what's planned and what's shipped. After completing any task in scope of these phases, update the relevant section *before* ending the session — move done items into **Shipped**, mark decisions as locked, record the actual numbers/paths that replaced any placeholders. Don't leave the doc lagging behind the code.

## Status

**Shipped:**
- **Increment K — Forkultivering (indoor seedling tracking) (2026-06-19).** Closed the last documented pure-new-surface increment (K). In Norway you pre-cultivate heat-lovers indoors weeks before last frost, then plant out — but the app could only model *plantings in a box*, so there was nowhere to record "startet 6 tomater inne". The *timing* half already existed (SowNowCard's "Så inne" / "Plant ut" groups); this adds the **tracking** — the entity + the two verbs. **Reasoned from first principles:** the fundamental entity is *a planting that exists before it has a box*, and the key requirement is **identity continuity through "Plant ut"** (tomato `weeksFromSowing` counts from the *indoor* sow, not plant-out). So the seam is **reuse `Planting` with `boxId?` optional** (not a separate `Seedling` entity that would sever the link) — "Plant ut" just fills in `boxId` + `transplantedDate`, preserving the original `plantedDate`. **Refined the original K plan by *dropping* the proposed `stage` field** — an indoor seedling is derivable as "no `boxId`" (`isIndoorSeedling()` in `src/lib/planting.ts`), one fewer field for the same behavior. **Zero store changes** (like D3.1 — `addPlanting`/`updatePlanting` already take the shapes needed). New schema: `boxId?: string` + `transplantedDate?: string` (`src/types/index.ts`, no migration — existing rows keep their boxId). **Surface = a dedicated `/seedlings` route** (`src/pages/Seedlings.tsx`, `App.tsx`), reached via a **🌱 Forkultivering** header link on `GardenMap` with a live count badge — chosen over a map section because a windowsill tray has no spatial home and is a seasonal (Feb–May) concern that shouldn't clutter the grid year-round. The tray lists active indoor seedlings (emoji · sort · antall · "Sådd inne {date} · {age}"), a **per-seedling readiness hint** ("Plant ut om ~N uker" / "Klar til utplanting nå" / "Bør plantes ut snart") derived purely from the plant's existing `transplant` sowRule vs the resolved frost date (new `transplantReadiness()` in `sowWindow.ts` — no new metadata), a **"Plant ut"** button → the **extracted, now-shared `SowBoxPicker`** (`src/components/SowBoxPicker.tsx`, pulled out of `GardenMap` and given a `verb` prop so it reads "Hvor vil du *plante ut* X?") which ranks boxes for the seedling's plant via Increment B, a **delete** action, a **"+ Start frø inne"** form (reuses `PlantPicker` + sort/antall/dato, saves with no `boxId`), and an **empty state** that explains forkultivering + lists plants whose indoor-sow window is open now. The SowNowCard **"Så inne"** group's button now reads **"+ Start inne"** and routes to `/seedlings?start=<key>` (new `onStartIndoor` prop) instead of the box picker. **Correctness work — the real subtlety:** making `boxId` optional means *global* active-planting scans must exclude windowsill sprouts. Audited & guarded the exact set: `seasonTimeline.ts` (no swim-lane for seedlings), `SowNowCard` succession + "Høst snart" (a 2-inch seedling must not show "harvest soon"), `GardenGrid` occupied-set, `boxAdjacency`, and the `isPlantingLike` import validator (`boxId` now optional so seedlings round-trip Export/Import). Every *per-box* filter (`boxId === box.id`) already auto-excludes seedlings, so box totals / rotation / BoxTile / deleteBox were safe untouched. **Verified end-to-end in browser** (Standardoppsett @ 5252, today 19 Jun): started 🍅 Cherrytomater 'Sungold' ×6 inne → row shows "Sådd inne 19. juni · i dag" + "Bør plantes ut snart" (correct — June is past the April transplant window); header badge showed ①; "Plant ut" → ranked picker ("Hvor vil du plante ut Cherrytomater?", drivhus/empty = Anbefalt, occupied = OK, jordbær/potet beds = Frarådes companion cautions) → picked drivhus 1 → seedling left the tray, badge cleared, and drivhus 1 now carries Cherrytomater · Søtvierfamilien · Sort Sungold · Antall 6 · **Plantet 19.6.2026** (indoor sow date preserved). `tsc -b` + `eslint` + `vite build` clean. **Testhage fixture seeded (same day):** added two boxId-less indoor seedlings to `demo-garden.json` — `tomat_cherry` 'Sungold' ×6 (sown inne 20 May) + `paprika` ×4 (sown inne 10 May) — to exercise the **prior-state load path** (a seedling read in via import/deserialization, not created live). **Re-verified on a fresh Testhage load:** the header badge reads **2** on load, both render in the tray with age + "Bør plantes ut snart", and crucially **neither leaks into garden views** — no box shows them, and Sesongoversikt draws lanes for exactly the 7 *box* plantings (no seedling lanes). **Deferred:** a "Plantet ut"-history view on the tray (transplanted seedlings live in their boxes now — keep the tray to active indoor ones); a hardening-off reminder. See the Increment K section.
- **Sesongoversikt grouped view for many plantings (2026-06-19).** Tester (me) noticed that opening **Standardoppsett** (55 boxes, **46 active plantings**) makes the per-planting Sesongoversikt list ~46 rows / ~1800px of scroll — the at-a-glance "when is stuff happening" read drowns in row count. Reasoned from first principles: the fix isn't "shorter scroll" but "see the season's *shape*, then drill into the loved detail on demand." Chose **group-by-plant** (over a kommende-høst filter or a compact-density toggle) because it both cuts row count *and* keeps the existing per-planting view as the drill-down. New pure `groupTimelineItems()` in `seasonTimeline.ts` (one `TimelineGroup` per `plantKey` / `custom:<name>`, union harvest band, all sow dots, distinct box list — insertion order preserved so groups read chronologically). `SeasonTimeline.tsx` refactored: extracted a shared `TimelineBar` (now takes `plantedDoys: number[]` so it draws one *or many* dots) + `DetailRow` (the byte-identical loved row, reused in detailed mode, in count-1 groups, and inside expanded groups) + `GroupRow` (▸/▾ chevron, "🍅 Tomat ×N · flerårig · Kasse A, B", click to expand into the `DetailRow`s). A **"Detaljert / Gruppert"** segmented toggle appears **only above `GROUP_THRESHOLD = 12` rows** *and* when grouping actually collapses something, and defaults to Gruppert; below the threshold there's no toggle and the view is unchanged. No new metadata — pure derivation from existing plantings. **Verified in browser** (Standardoppsett @ postnr 5252): 46 rows → **19 grouped rows**, toggle defaults to Gruppert, Gulrot ×5 expands to its 5 indented box rows then collapses, Detaljert restores all 46; a 7-planting garden shows **no toggle / 7 plain rows / no chevrons** (loved view untouched). `tsc` + `eslint` clean. **Follow-up — zebra lanes (same day, 2 rounds):** tester asked for alternating lane colours to track rows at a glance. *Round 1* tried a two-tone inversion (warm row ↔ white bar track) using existing `--bg`/`--surface`; tester found `#f7f5f0`-vs-white too subtle and wanted clearer borders on the white lanes. *Round 2 (shipped):* every top-level lane is now `border`ed (incl. white ones) and the stripe is a deliberately warmer parchment — two new tokens in `index.css` (final after a colour tweak: `--lane-stripe: #f1ddd0` warm terracotta/red-tinted + `--lane-border: #ddc4b2`). Dropped the track inversion: the bar track is a **constant** `var(--bg)` on every row, so the green harvest band reads identically everywhere (the inversion had it sitting on white vs warm per-row). Lanes alternate `--surface` (white) ↔ `--lane-stripe`; parity by top-level index, applied in **both** Detaljert and Gruppert; an expanded group's nested rows are border/bg-less (`paintRow={false}`) so the whole plant reads as one bordered lane. Verified in browser (Standardoppsett): rows alternate `rgb(255,255,255)` ↔ `rgb(236,227,208)`, every lane carries the `rgb(214,204,184)` border. `tsc` + `eslint` clean.
- **Perennial seasonal-window location fix (2026-06-19).** Closed Increment D limitation 4: perennial `seasonal` harvest windows (e.g. `jordbær` 06-15→07-31) were hardcoded absolute dates that ignored location, so cold gardens saw "harvest now" weeks too early. Now bundled `seasonal` windows shift by `clamp(lastFrostDoy − 110, −30, +75)` days — `110` = the warm-lowland baseline (Oslo/Stavanger/Bergen, where mid-June strawberries are realistic), chosen over the all-station median (128) so cooler gardens shift the band *later* (the honest direction; GDD5 corroborates). Custom plants don't shift (user already entered local dates — `isBundledPlantKey` gates it). Applied in both `seasonTimeline.harvestWindow` and `SowNowCard`'s "Høst snart". **Verified in browser** (Testhage, 19 Jun): a Sogndal garden (+14) drops jordbær from "Høst snart"; a colder origin (+49) moves the timeline band to Aug→Sep. Still a frost *proxy* (not true phenology) — Phase F calibration + the custom window / `frostJustering` remain the escape hatches. See Increment D limitation 4 (now fixed).
- **CustomPlantForm advanced fields (2026-06-19).** Closed the long-standing "custom plants are second-class" deferral (noted across Increments B/F/D). Decision was reasoned from first principles — the custom form is an *escape hatch*, not a clone of `PlantInfo`: add a field only if its **absence is visibly wrong** *and* the **gardener plausibly knows it** (missing fields always fall back to "no constraint — safe"). Scope chosen = **"Knowable basics"**: `perennial` (checkbox) + a new `seasonal` harvest option (month/day **Fra→Til**, "samme datoer hvert år") + `sunNeed` (select) + `minDepthCm` (number), in a new **Voksekrav (valgfritt)** group + a 4th radio in the harvest editor. **Deliberately excluded:** `companionsGood/Bad` (user least-likely-to-know, needs an N-way plant-key multiselect, absence is invisible), `prefersBedType`, `successionWeeks`, `rainSensitive` (all niche / invisible-when-absent). **Zero downstream work** — all four fields were already *read* by `rotation.ts`/`boxRanking.ts`/`seasonTimeline.ts`/`SowNowCard.tsx`, and `usePlantLookup`/`useMergedPlantList` already merge customs, so the form was the only missing *writer* (purely additive). **Bonus:** a user-entered `seasonal` window self-calibrates to their microclimate, sidestepping Increment D limitation 4 (bundled seasonal windows ignore location) for custom plants. **Verified in browser** (Settings → Egne planter): created "Rabarbra" perennial, seasonal juni 15→juli 31, Delvis sol, 30 cm; round-trips on re-open (advanced auto-expands, every value repopulated). See the Increment B/F/D deferral notes (now resolved).
- **Planting age "N dager siden" + grow duration (2026-06-19).** Tester request: when opening a box, see how long each plant has been in the ground. Derived from the existing `plantedDate` — no new data. New `daysSince` + `plantedAgeLabel` in `src/lib/planting.ts` (both ends normalized to local midnight so DST doesn't drift the count); `PlantingRow` appends *"· N dager siden"* (with "i dag" / "1 dag" singular handling) after the Plantet date on **active rows**. For **harvested rows** it instead shows *"· N dager i vekst"* after the Høstet date (planting→harvest span) — a small bonus that feeds the harvest-learning loop. **Verified in browser** (Testhage, today 2026-06-19): Persille planted 12.5 → "38 dager siden", Basilikum 10.5 → "40 dager siden", harvested 2025 Salat 25.4→20.6 → "56 dager i vekst".
- **PlantingRow edit + plant count (2026-06-19).** Two quality-polish items in one pass. (1) **Per-row "Rediger" button** on `PlantingRow` (the natural D3.1 follow-on) — opens an inline edit form reusing `updatePlanting`, editing Sort/Antall/Plantet dato/Notater, plus **Avling** on harvested rows only. Wired on both the active and Historikk lists in `BoxDetail` (gated out in view-mode via the `onUpdate` prop, mirroring `onHarvest`/`onDelete`). So harvested/historical rows are now editable — previously there was no edit surface for them. (2) **`Planting.quantity?`** (antall planter) — optional count in QuickAddSheet + BoxDetail add-forms + the new edit form (shared `parseQuantity` in `src/lib/planting.ts`); shown as an *"Antall: N planter"* line on the row and summed into a **🌱 N planter totalt** chip in `BoxDetail`'s "Nå" header (a planting with no quantity counts as 1). No migration, round-trips Export/Import. **Verified in browser** (Testhage, Grunt krukke): set Persille = 6 → row shows "Antall: 6 planter", header total 2 → 7; harvested-row edit exposes the Avling field, active-row edit hides it. See the D3.1 + variety-recall notes.
- **Timeline picking-duration (2026-06-19).** Quality-polish item: `harvestDurationWeeks?` on `PlantInfo` so continuous croppers (beans/tomatoes/courgette/salat) draw a longer Sesongoversikt harvest bar than one-shot roots, instead of the old uniform 2-week uncertainty band. `seasonTimeline.ts` extends the `weeksFromSowing` band end by the duration; 13 plants tagged; `CustomPlantForm` exposes the field. Verified in browser. Closes limitation 1 of Increment D's harvest-window accuracy notes (limitation 2 — real per-garden calibration — still waits on a logged Phase F season). See the Increment D limitations section.
- **Three cheap follow-ups (2026-06-18).** (1) **Box footprint** — optional `widthCm`/`lengthCm` on `Box`, Bredde/Lengde inputs in `BoxMetaFields`, a **📐 w × l cm** chip on `BoxDetail`. (2) **Rain-sensitive** — `rainSensitive?` on `PlantInfo` (tomat_cherry/tomat_stor/paprika); a ☔ "sett under tak" note in the D2 card's *Plant ut* group + a "Liker ikke regn" caution in box ranking for uncovered beds (greenhouse/tunnel exempt). (3) **Proximity companions** — `src/lib/boxAdjacency.ts` (grid-gap adjacency, `NEIGHBOUR_GAP_UNITS = 2`); `CompanionHints` now also surfaces neighbour-box pairings as muted *"…i nabokassen"* hints (de-duped vs same-box), wired into QuickAdd + BoxDetail. All optional, no migration, round-trip Export/Import. Each verified end-to-end in browser. See the Increment B + F TODO sections.
- **Phase F — harvest tracking.** `Planting.harvestYield?: string` (free text), an inline *"Avling (valgfritt)"* prompt revealed by the **Høst** button in `PlantingRow` (Bekreft/Avbryt; blank = nothing stored), `markHarvested(id, { harvestYield, date })`, and an *"Avling: …"* line on harvested rows. Round-trips Export/Import with no `version` bump; Testhage's harvested gulrot carries `"3 kg"`. Verified end-to-end in browser. **Unlocks Cohort 3** (multi-year intelligence I + yield dashboards J) — which now wait on a logged season, not on code. See the Phase F section.
- Hagekalender **Cohort 2 (F + E + D)** — companion hints, succession nudges, and the season timeline. **F:** `companionsGood`/`companionsBad` on 27/32 plants (derived from in-repo companionship data), `src/lib/companions.ts` + `CompanionHints.tsx` below the picker in QuickAdd + BoxDetail, and companion signals folded into B's box ranking. **E:** `successionWeeks` on 5 crops + a **Suksesjon** group in `SowNowCard` (nudges a re-sow once the latest in-season batch is `successionWeeks` old). **D:** **📅 Sesongoversikt** — a collapsible per-active-planting timeline (`SeasonTimeline.tsx` + pure `src/lib/seasonTimeline.ts`) showing planted dot + harvest window + today line across a month axis anchored to frost dates; caught & fixed a spring-DST off-by-one in the day-of-year math. All three verified end-to-end in the browser against the Testhage. See the Hagekalender increment sections for full breakdowns + deferrals.
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
- Phase D3.1 — edit/extend existing planting from QuickAdd (`src/components/QuickAddSheet.tsx`). Opening QuickAdd on a box with an active planting now **edits in place** (reuses `updatePlanting`) instead of inserting a duplicate dated today. Three cases: **0 active** → add new (unchanged); **1 active** → opens in edit mode pre-filled (header "Rediger planting i …"), with a "Legg til en til" toggle to opt into a second planting (and "‹ Rediger eksisterende i stedet" to switch back); **2+ active** → a selection list at the top of the sheet (plant name + variety + Plantet date), no default, form hidden until the user picks one or "+ Legg til ny planting". `initialPlantKey` (D2 card) always forces add-new — explicit plant choice means a new sowing. `plantedDate` is pre-filled with the existing date (not today) so harvest tracking isn't silently reset; `status` stays `active`-only (no auto-revive of harvested/failed). Refactored the sheet into `QuickAddForm` (selection/mode state) + a keyed `PlantingEditor` (form fields reset on target switch via `key`, no `useEffect`). No store change — `updatePlanting`/`addPlanting` already existed.
- Hagekalender Increment C (reverse lookup) — `BoxDetail` gained (1) a passive 💡 context banner ("what not to plant here & why" — rotation families, depth-too-shallow root veg by name, shaded box) from `boxContextNotes()`, and (2) a button-triggered **"Hva passer her nå?"** panel that ranks plants *sowable today* for THIS box (Anbefalt/OK/Frarådes via `rankPlantsForBox`, the inverse of B), with row-click → pre-filled add form. Extracted `src/lib/sowWindow.ts` (shared with `SowNowCard`, duplication removed). No new metadata. **Cohort 1 (G + B + C) complete.** Verified end-to-end in browser.
- Hagekalender Increment B (smart box picker) — the D2 "+ Legg til" picker now ranks boxes into **Anbefalt / OK / Frarådes** with per-box why-lines (`src/lib/boxRanking.ts` + grouped `SowBoxPicker` in `GardenMap.tsx`). New optional metadata: `depthCm` on `Box`; `sunNeed`/`prefersBedType`/`minDepthCm` on `PlantInfo`. Box depth editable in `BoxMetaFields` (create + `BoxDetail` edit). 31/32 bundled plants tagged. Criteria (rotation/sun/depth/bed/occupancy) each block→Frarådes, caution→OK, or positive→Anbefalt; reuses `boxRotationHistory`. Every box stays clickable → `QuickAddSheet` with the plant pre-selected. Verified end-to-end in browser against the Testhage. See the Increment B section for the full breakdown + what was deferred (plant-size ranking, custom-plant B-fields).
- UX — **box/tile sizing overhaul** (professional grid). Root cause: `addBox` defaulted new boxes to **2×2** (smaller than anything in the bundled garden) and the grid row was only **32 px** tall, so a box of height 2 couldn't fit its name + 2 plant rows — text spilled past the border. Fixes: grid row height **32→40 px** + col width **44→48 px** (`MAP_BASE_ROW_HEIGHT`/`MAP_BASE_COL_WIDTH` in `GardenGrid.tsx`) so a 2-tall box now holds name + 2 plants; default new box **2×2→4×3** (`NEW_BOX_W`/`NEW_BOX_H` in `useGardenStore.ts`); resize floor `minW/minH = 2` (`MIN_BOX_UNITS`); `.tile` got `overflow: hidden` so content can never spill past the rounded border; box name now `truncate`s (with `min-w-0 flex-1` + hover `title`) instead of wrapping and shoving plant rows down; `BoxTile` shows `h>=3 ? 3 : 2` plant rows before "+N til" so short boxes stay clean. Demo fixture re-laid-out to uniform readable 4-wide boxes. **Verified in browser**: a 4×2 container shows two plants (Basilikum + Persille) with no overflow; all box names read fully. Note: grid *dimensions* (51×26 units) were left as-is — the overflow was cell *pixel* size, not unit count.
- Dev tooling — **Testhage** (seed fixture). `src/resources/demo-garden.json` (11 boxes, 22 plantings, 1 custom plant `custom_demo01` Jordskokk, seeded location **6857 @ 300 m**; includes an active prior-year perennial `jordbær` in *Åpen seng B* to exercise the seasonal harvest path) loaded by a new dashed-amber **"🧪 Testhage"** button on the onboarding landing page, beside "Standardoppsett". Reuses the existing `setPendingImport → ConfirmModal → confirmImport` import seam — no new store action; `PendingImport`/`BackupPayload` extended with an optional `location` applied via `useLocationStore` after the garden write (real backups leave it undefined). Dev-only `warnUnknownDemoPlantKeys()` console-warns any fixture `plantKey` missing from `plants.json`/customPlants. Each box is engineered to exercise a feature (Solanaceae 2024+2025+2026-failed → red multi-year rotation warning; harvested gulrot → amber same-season; **Pallekarm Sør carries a 2023 Solanaceae → adding tomato today gives NO warning, verifying the 2-year lookback boundary**; shallow container; shaded bed; clean baseline; active+variety; two plants in one container; free-text planting; custom-plant pick). Boxes are 4-wide and positioned near the top of the canvas. Boxes already carry `depthCm` (forward-seed for Increment B). **Verified end-to-end in browser** (Chrome DevTools MCP): import count, location applied (banner gone), custom plant + variety render, both rotation severities + dismiss fire on the engineered boxes. Visible/un-gated per user request (test phase); flipping it behind `import.meta.env.DEV || ?demo=1` later is one line.
- Hagekalender Increment G (rotation warnings) — soft, non-blocking amber chip at the moment of decision when the picked plant's family was grown in the same box within the last **2 years** (`ROTATION_LOOKBACK_YEARS`). New shared primitive `src/lib/rotation.ts` (`boxRotationHistory` → `Map<family, years[]>`, `familyConflictYears`, `formatYearList`) — the rotation derivation B's smart box picker will reuse, so the "same family N years running" rule lives in one place. New `src/components/RotationWarning.tsx` (returns null when no conflict). Wired into both add-surfaces: `QuickAddSheet` (`PlantingEditor`) and `BoxDetail`'s "Legg til plante" form, rendered below the picker, above the neutral Phase A "Forrige sesong" chips (which stay — context vs. warning are complementary). **Same-season repeat covered:** a current-year planting counts once it's been *cleared* (harvested/removed/failed), so carrot → Høst → replant carrot warns; a *still-active* current-year planting is skipped (companion/duplicate, not rotation — also stops an edited planting warning against itself). **Two severities:** same-season repeat = gentle amber nudge; prior-year conflict = stronger red "Vekstskifte anbefales" treatment. Both **dismissible** via ✕ (soft info, never blocks); dismiss resets when the picked plant changes. Skips `other` family (too generic). No schema change; derives from existing `family` + planting history.
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

### D3.1 — Edit/extend existing planting from QuickAdd — ✅ SHIPPED 2026-06-17

**Status (as of 2026-06-17):** Shipped. All three cases (0 / 1 / 2+ active plantings) handled in `src/components/QuickAddSheet.tsx`. The sheet now edits in place via `updatePlanting` instead of always inserting a new row. `plantedDate` preserved, `status` left untouched, `initialPlantKey` forces add-new. See the Shipped log entry for the full behavior breakdown. The implementation matched the plan below; the only structural deviation was splitting the form into `QuickAddForm` (selection + mode) and a keyed `PlantingEditor` so field state resets without a `useEffect`. `notes` was *not* added to the form — QuickAdd has never had a notes input, so edit mode covers plantKey/customName/variety/plantedDate only.

**Original plan (driven by user feedback after D3 shipped):** opening QuickAdd on a box that already has a planting and entering a variety should *update* that planting, not create a duplicate dated today. The old pre-fill (QuickAddSheet defaulted the picker to the box's most recent active plant) was a stopgap that still created a new row on save.

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
- The "edit existing planting" button on `PlantingRow` (referenced under D3.1 step 3 and the D2 section's "Edit-existing-planting flow" out-of-scope note) is a separate but adjacent surface — both share `updatePlanting`. ✅ **SHIPPED 2026-06-19** — inline "Rediger" form on every `PlantingRow` (active + harvested/historical), editing Sort/Antall/Plantet dato/Notater + Avling-on-harvested. See the Shipped log entry. This closes the editing gap for harvested/historical rows that D3.1's QuickAdd flow (active-only) left open.

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

#### B. Smart SowBoxPicker — box-ranked recommendations — ✅ SHIPPED 2026-06-17

**What landed.** The D2 card's "+ Legg til" picker now ranks boxes into **Anbefalt / OK / Frarådes** with a per-box why-line, instead of a flat list.
- **Schema** (`src/types/index.ts`): `depthCm?` on `Box`; `sunNeed?` (`full`/`partial`/`shade`, in `boxMeta.ts`), `prefersBedType?: BedType[]`, `minDepthCm?` on `PlantInfo`. All optional → missing = no constraint.
- **Box depth UI**: `BoxMetaFields` gained a "Dybde (cm)" input (helper text: pallekarm ~20 cm, stabel ≈40 cm, blank for in-ground), threaded through the create-box form (`addBox` options) and `BoxDetail` edit (`updateBox`), and shown as a 📏 chip on `BoxDetail`.
- **Tagging**: 31 of 32 bundled plants in `plants.json` (generic "blomster" skipped) — `sunNeed` on 31, `prefersBedType` on the 5 heat-lovers (tomato/paprika/agurk → greenhouse/tunnel/raised; basilikum → greenhouse/container/raised), `minDepthCm` on 15 root/large crops.
- **Ranking engine** (`src/lib/boxRanking.ts`): `rankBoxesForPlant(...) → BoxFit[]` with tier + Norwegian reasons. Orthogonal criteria — rotation (reuses `boxRotationHistory`), sun, depth, bed-type, occupancy — each a **blocker** (→ Frarådes), **caution** (→ OK), or **positive** (→ Anbefalt context).
- **UI**: `SowBoxPicker` in `GardenMap.tsx` renders the three tinted groups; every box stays clickable (soft, never blocks) and routes to `QuickAddSheet` with the plant pre-selected.
- **Verified in browser** against the Testhage (frost-justering bumped to surface the card): for Gulrot — Anbefalt = Drivhus 1 ("Full sol · Dyp nok (30 cm) · Ledig"), Eksperiment, Åpen seng A; OK = Pallekarm Nord ("Litt lite sol"), + occupied boxes; Frarådes = Bøtte krydder/Grunt krukke ("Trenger 30 cm — kun 25/20 cm her"), Pallekarm Sør ("Skjermplantefamilien her i 2026"), Skyggebed ("Trenger sol — kassen er skygget"). Pick → QuickAdd flow intact.
- **Deferred from the original plan**: plant-size-vs-box-size ranking (needs a plant-size field; the other 5 criteria carry the feature) and the B-fields on `CustomPlantForm` (custom plants rank as no-constraint for now — safe). Box `depthCm` was forward-seeded into the Testhage fixture earlier, so the depth scenarios were live immediately. **Update 2026-06-19:** the ranking B-fields `sunNeed` + `minDepthCm` are now exposed on `CustomPlantForm` (so custom plants rank on sun/depth too); `prefersBedType` was deliberately left out as niche. See the 2026-06-19 Shipped entry.

**TODO (user, 2026-06-17) — optional box footprint (length × width). ✅ SHIPPED 2026-06-18.** `widthCm?` + `lengthCm?` on `Box` (`src/types/index.ts`), a **Bredde/Lengde** input pair in `BoxMetaFields` below Dybde (shared `clampCm` helper, 0–2000 cm), threaded through the create-box form (`addBox` options, `GardenMap.tsx`) and `BoxDetail` edit (`updateBox`), and a **📐 {w} × {l} cm** chip on `BoxDetail` beside the 📏 depth chip (renders if either dimension is set, `?` for the missing one). All optional, no migration, round-trips Export/Import (only `isBoxLike`-required fields are gated). Chip kept on `BoxDetail` only (mirrors depth — tiles stay dense). **Verified in browser** (Testhage, Åpen seng B): saved 80 × 120 → chip shows *"📐 80 × 120 cm"*. **Still the missing input for Increment B's deferred "plant size vs box size" ranking** — footprint now exists, so that criterion (don't waste a big bed on lettuce / warn a sprawling squash into a tiny box) is implementable from real area whenever we add a plant-size field. Independent of the grid `layout` w/h (abstract units, not cm).

**Future idea (user, 2026-06-17) — rain-sensitive plants → "bør stå under tak". ✅ SHIPPED 2026-06-18.** `rainSensitive?: boolean` on `PlantInfo` (`src/types/index.ts`), tagged on **3 plants** (`tomat_cherry`, `tomat_stor`, `paprika`). Two surfaces: (a) the D2 card's **Plant ut** group shows an amber **"☔ Liker ikke regn — sett under tak (drivhus/tunnel)"** note (new optional `GroupedRow.note` in `SowNowCard.tsx`); (b) box ranking (`evaluateFit` in `boxRanking.ts`) adds a **"Liker ikke regn — sett under tak"** caution for a rain-sensitive plant in any uncovered bed — `COVERED_BEDS = {greenhouse, tunnel}` are exempt. Orthogonal to `prefersBedType`, so a pallekarm (a *preferred* bed) still gets the rain caution because it's roofless — which is exactly the signal the user wanted. **Verified in browser** (Testhage, frost-justering +35 to bring tomatoes into window): both tomatoes show the ☔ note in "Plant ut" while basilikum/agurk don't; the SowBoxPicker for Cherrytomater cautions every open/raised/container box and correctly omits Tunnel 1 + Drivhus 1.

**Original plan:**

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

#### C. "Hva passer i denne kassen?" — reverse lookup from BoxDetail — ✅ SHIPPED 2026-06-17

**What landed.** Both surfaces on `BoxDetail`, no new metadata (reuses B's).
- **Passive context banner** — amber 💡 box below the header, auto-derived from `boxContextNotes()` (`src/lib/boxRanking.ts`): rotation families grown here in the lookback ("Du hadde Kurvblomstfamilien her i 2025 — vurder en annen familie i år."), depth-too-shallow root veg by name ("Denne kassen er 20 cm dyp — for grunt for cherrytomater, stortomat, gulrot og agurk m.fl."), and a shaded-box note. Hides entirely when nothing is worth flagging.
- **Active "Hva passer her nå?" panel** — button-triggered, shows `rankPlantsForBox()` (the inverse of B's `rankBoxesForPlant`, sharing the same `evaluateFit` core) over the plants **sowable today** (via new `src/lib/sowWindow.ts`, also now used by `SowNowCard` — duplication removed). Same Anbefalt/OK/Frarådes tiers + why-lines; row click pre-fills `BoxDetail`'s own add-plant form (`openAddFormWith`). Without a location it falls back to all plants ranked, with a note.
- **Verified in browser** against the Testhage: Grunt krukke (20 cm, occupied) → depth + rotation banner, panel shows shallow crops as OK (occupied) and deep crops / asteraceae as Frarådes; Åpen seng A (empty, sun) → no banner, panel Anbefalt for most + heat-lovers demoted to OK ("Foretrekker Drivhus/Tunnel/Pallekarm"). Row click → add form pre-filled.
- **Deferred**: the panel opens `BoxDetail`'s existing add form rather than `QuickAddSheet` (the plan named the latter, but the page's own form is the natural surface and already carries the rotation chip).

**Original plan:**

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

#### D. Sesongoversikt — horizontal timeline view — ✅ SHIPPED 2026-06-17

**What landed.** A collapsible **📅 Sesongoversikt** section on `GardenMap` (below the SowNowCard, hidden in view-mode), off by default. One swim-lane per **active planting** across a month axis: a **planted** dot at the sow date and a lighter **forventet høst** segment computed from the plant's `harvestRule` (`weeksFromSowing` off the sow date, `weeksBeforeFirstFrost` off the autumn frost, or — added 2026-06-18 — a `seasonal` absolute calendar window for perennials; see limitation 3 below). A green **"i dag"** line + label and month gridlines anchor the axis; a one-line caption names the frost dates; a legend explains the marks.
- **No new metadata** — derives entirely from plantings + plant rules + the resolved frost dates.
- **Pure math in `src/lib/seasonTimeline.ts`** (`buildSeasonTimeline`, `dateToDoy`/`doyToDate`, `monthTicks`, `doyToPercent`) so the windowing is testable without React. Component in `src/components/SeasonTimeline.tsx`. Axis spans ~8 weeks before last frost → first frost, expanded to include any planting/harvest that falls outside, snapped to whole months.
- **DST bug caught in browser verification & fixed:** `dateToDoy` originally `floor`ed a millisecond diff that crosses Norway's spring DST transition, under-counting by a day after late March and producing a duplicate month tick. Now normalizes both endpoints to local midnight and rounds.
- **Verified in browser** against the Testhage (Sogndal 6857): six active plantings render with correct planted dots, harvest windows, today line, and `mar…okt` axis.
- **Deferred** (noted, not built): catalog-driven *planning* timeline ("when should I sow tomatoes?" for plants not yet in the garden), per-box swim-lanes, and tap-a-marker detail popovers. The personal-garden timeline is bounded by garden size and answers "what's next" without overwhelming; the catalog planner is the natural follow-on if a tester asks.

**Harvest-window accuracy — known limitations (user-raised 2026-06-18). Three real gaps to address, not bugs in the timeline itself but in the underlying `harvestRule` model:**
1. **The bar is an *uncertainty band*, not the picking season.** ✅ **FIXED 2026-06-19.** Was: the bar length was just the `[min,max]` span of "weeks from sowing to *first* harvest" (2 weeks for most plants), so continuous croppers looked identical to one-shot roots. **What landed:** new optional `harvestDurationWeeks?: number` on `PlantInfo` (`src/types/index.ts`) — how many weeks the crop is *picked over* once it starts. `src/lib/seasonTimeline.ts` `harvestWindow` extends the `weeksFromSowing` band's end by `harvestDurationWeeks` (`[planted + min·7, planted + (max + duration)·7]`); only applies to `weeksFromSowing` rules (perennials' `seasonal` windows already encode the picking season; `weeksBeforeFirstFrost` left as-is). Missing = no extension (one-shot pick, unchanged). **Tagged 13 continuous croppers** in `plants.json`: tomat_cherry/tomat_stor/basilikum 8, agurk 8, persille/gressløk 10, squash 10, paprika/bønner 6, brokkoli 4, erter 3, salat 3, spinat 2. `CustomPlantForm` gained a "Høsteperiode (uker, valgfritt)" input under the from-sowing harvest option (persists + round-trips). **Verified in browser** (Testhage, Sogndal 6857): Persille (10) draws the longest bar (jul→okt), Basilikum (8) shorter, Erter (3) shorter still, while Timian + the custom Jordskokk (untagged) stay short single-pick bars and Jordbær's seasonal band is unchanged. The numbers are still literature estimates — limitation 2 (real calibration via Phase F) stands.
2. **The numbers are literature estimates, not measured.** All `sowRules`/`harvestRule` values came from a research-agent pass over NLR/Hageselskapet/Felleskjøpet/Plantepleien — conservative rules-of-thumb, never validated against this garden's microclimate or the actual varieties grown. Treat the bars as *indicative*. The real fix is **Phase F (harvest tracking)** feeding **Increment I (multi-year)**: once we log actual harvest dates, calibrate per-plant (and eventually per-variety/per-box) instead of trusting defaults. A targeted NLR/Hageselskapet cross-check on the plants the user actually grows is the cheap interim step.
3. **Perennials are mis-modelled — they show no recurring window (and `jordbær` shows none at all).** ✅ **FIXED 2026-06-18.** The model *was* sow-relative only (`weeksFromSowing` off `plantedDate`), which works for annuals but meant a strawberry planted June 2025 drew nothing on the 2026 axis: `jordbær` had no `harvestRule` at all, and even with one the window computed off the 2025 sow date and fell outside the year. **What landed:**
   - New `HarvestRule` variant `{ seasonal: ["MM-DD", "MM-DD"] }` (`src/types/index.ts`) — an **absolute calendar window that repeats every year**, independent of sow date. Plus a `perennial?: boolean` flag on `PlantInfo`.
   - `jordbær` tagged `perennial: true` + `harvestRule: { seasonal: ["06-15", "07-31"] }` (mid-Jun→Jul) in `plants.json`.
   - `src/lib/seasonTimeline.ts`: `harvestWindow` handles the `seasonal` rule (new exported `mmddToDoy(mmdd, year)` helper); `buildSeasonTimeline` now treats a planting sown in a **prior season** as having no on-axis sow date (`plantedDoy: number | null`) so an established perennial draws its recurring harvest band **without** a misplaced "Plantet" dot. (Bonus: stale prior-year annuals no longer render garbage windows either.)
   - `SeasonTimeline.tsx`: planted dot omitted when `plantedDoy === null`; a muted **"· flerårig"** tag on perennial rows.
   - `SowNowCard.tsx` "Høst snart": `seasonal` rule matches whenever today falls inside the calendar window (helper *"Høstesesong nå"*). **Follow-up 2026-06-18:** the group now **collapses to one row per plant with a `×N` count** (`GroupedRow.count`) — the standardoppsett has 9 jordbær beds, which previously rendered 9 identical "Høst snart" lines; now it's a single *"🍓 Jordbær ×9"*. Other groups already key off unique plants, so only "Høst snart" (per-planting) needed deduping. Verified in browser against the standardoppsett.
   - **Testhage fixture:** added an active `jordbær` (Korona) planted **2025**-06-01 in *Åpen seng B* to exercise the prior-year-perennial path.
   - **Verified in browser** (Testhage, Sogndal 6857, today 2026-06-18): "Høst snart" surfaces 🍓 Jordbær *"Høstesesong nå"*; Sesongoversikt shows the jordbær harvest band (mid-Jun→end-Jul) with the "flerårig" tag and **no** planted dot, while annual *Erter* still shows both dot + band.
   - **Rotation-awareness for perennials — ✅ FIXED 2026-06-18 (follow-up).** A perennial sits in its bed across seasons, so it isn't a rotated crop and must not generate phantom "you grew this family here in 2024/2025" pressure against other plants. New shared `plantingFamilyResolver(findPlant)` in `src/lib/rotation.ts` resolves a planting's family **but returns undefined for perennials** (and for free-text/unknown plants), which `boxRotationHistory` then skips. All three call sites — `QuickAddSheet` + `BoxDetail` (the `RotationWarning` chip) and `boxRanking.ts` (`evaluateFit` ranking **and** `boxContextNotes` banner) — now route through it, so the perennial rule lives in one place. **Verified in browser:** *Åpen seng B* (active 2025 perennial jordbær = rosaceae) shows rotation notes only for Grasfamilien 2024 (mais) + Gresskarfamilien 2025 (squash) — the Rosefamilien note that the strawberry previously produced is gone.
   - **~~Still deferred:~~ ✅ RESOLVED 2026-06-19:** `CustomPlantForm` now exposes the `seasonal`/`perennial` fields (Voksekrav group + "Fast høstesesong" harvest option) — custom perennials can be tagged and draw their recurring harvest band. (The bundled perennial herbs timian/rosmarin/gressløk are still left untagged on purpose — they harvest continuously, not in a discrete window, and herbs aren't a rotation concern.) Per-plant calibration of the window still wants Phase F. See the 2026-06-19 Shipped entry.
4. **`seasonal` (perennial) harvest windows are NOT location/frost-aware — they're absolute calendar dates.** ✅ **FIXED 2026-06-19.** *(user-raised 2026-06-19.)* Was: the `seasonal: ["MM-DD","MM-DD"]` rule (`jordbær` = `06-15`→`07-31`) was a hardcoded absolute window ignoring location, so cold/high-latitude gardens showed "harvest now" weeks before the berries actually ripen — exactly what the user saw in their own beds. **What landed** (`src/lib/seasonTimeline.ts`):
   - `SEASONAL_REFERENCE_LAST_FROST_DOY = 110` — the warm-lowland baseline the bundled windows were authored for (Oslo/Stavanger/Bergen friland sit at last frost ≈ DOY 110 / ~20 Apr, where mid-June strawberries are realistic). **Chosen deliberately over the all-station median (DOY 128):** the median would under-shift; anchoring to the warm lowland means *most* of Norway is cooler → shifts the band **later**, which is the honest direction (the bundled `06-15` is southern-optimistic). GDD5 corroborates the direction — Sogndal (946) / Tromsø (740) are far cooler than Oslo (1608) and get the bigger later-shift.
   - `seasonalShiftDays(lastFrostDoy)` = `clamp(lastFrostDoy − 110, −30, +75)`; `seasonalShiftForPlant(key, lastFrostDoy)` returns that for **bundled** plants and **0 for custom** plants (whose windows the user already entered for their own garden — `isBundledPlantKey` in `src/lib/plants.ts` makes the distinction). Both `harvestWindow` (timeline) and `harvestSoonForPlanting` (`SowNowCard` "Høst snart") add the shift to the `seasonal` branch.
   - **Verified in browser** (Testhage): on **today 19 Jun**, a Sogndal garden (last frost 4 May → shift +14) drops jordbær from "Høst snart" (window now starts ~29 Jun) — the premature "Høstesesong nå" is gone; and on a colder origin (last frost 8 Jun → shift +49) the Sesongoversikt jordbær band moves all the way to **early Aug → mid-Sep**, well past the "i dag" line. Custom perennials are unaffected (shift 0).
   - **Still a frost *proxy* for ripening, not true phenology** (a maritime fjord can have a mild last frost yet cool summers): the magnitude won't be perfect, but it's directionally right for the dominant elevation+latitude gradient and stops the premature signal. Per-garden calibration still wants **Phase F**; users can also override via the custom seasonal window or `frostJustering`.

**Original plan:**

- **Goal:** Show the season ahead at a glance. When should each task happen? When are things due?
- **Derives from:** frost dates + active plantings + plant rules. No new metadata.
- **UI:** New view (or expandable section in `GardenMap`). Horizontal timeline today → first frost, with markers per task (sow / plant out / harvest). Optional per-box swim-lanes. Tap a marker → details.
- **Depends on:** D2 (frost dates + rules already in place).
- **Effort:** 2–3 days. Biggest UI lift in this roadmap.

#### E. Successional sowing reminders — ✅ SHIPPED 2026-06-17

**What landed.** `SowNowCard` gained a **Suksesjon** group. New `successionWeeks?: number` on `PlantInfo`, tagged on **5 crops** (salat 3, spinat 3, pak_choi 3, reddik 2, gulrot 4). For each succession-tagged crop with an active planting, once the **most recent** active batch is at least `successionWeeks` old *and* the crop is still sowable today (reuses `isSowableNow`), the card nudges *"Sist sådd for N uker siden — så en ny pott for jevn høst"*. Keying on the latest batch means sowing a fresh portion clears the nudge for another interval; the season gate avoids out-of-season suggestions. Row "+ Legg til" routes through the same box-picker as the other groups. **Verified in browser** (Testhage, frost-justering bumped to put salat in-window): a 5-week-old active salat surfaces in Suksesjon.
- Module-level `weeksSinceSowing` helper keeps the `useMemo` body pure (the `react-hooks/purity` rule rejects `Date.now()`/`new Date()` inside hooks).

**Original plan:**

- **Goal:** Salat, reddik, spinat reward sowing every 2–3 weeks. Surface that as the previous batch matures.
- **New metadata:** `successionWeeks?: number` on `PlantInfo` (e.g. salat: 3, reddik: 2).
- **UI:** D2 card gains a **Successjon** group: *"Sådd salat for 3 uker siden i box 30 — så ny portion nå"*.
- **Depends on:** D2 (shipped).
- **Effort:** ~½ day (mostly tagging).

#### F. Companion hints — ✅ SHIPPED 2026-06-17 — *(absorbs Phase E's companion scope)*

**What landed.** Soft green/amber companion hints below the plant picker, plus companion-awareness in B's box ranking.
- **Schema** (`src/types/index.ts`): `companionsGood?: string[]` + `companionsBad?: string[]` on `PlantInfo` (hold other plant keys). All optional.
- **Data:** derived from the in-repo `plant-data-aggregator/.../companionship-extended2.json` (broadest coverage — includes squash/pumpkin/kale). A one-off script symmetrized the English-named relationships, dropped `neutral`, and mapped them onto our 32 keys → **27/32 tagged** (only timian/rosmarin/gressløk/solsikke/blomster lack source data; herbs aren't in the dataset). Brassica approximations: pak_choi/knutekål ← Cabbage/Kohlrabi/Kale, kålrot ← Turnip. No conflicts after symmetrizing.
- **Logic** (`src/lib/companions.ts`): `companionHints(plant, neighbourKeys, findPlant)` — one hint per distinct neighbour, bad wins over good, checks both directions (robust to one-sided custom-plant tags), skips same-plant neighbours.
- **Component** (`src/components/CompanionHints.tsx`): green *"Trives med X og Y i denne kassen."* / amber *"Dårlig naboskap med Z — de trives bedre hver for seg."* Returns null when no pairing. Wired below `RotationWarning` in **both** `QuickAddSheet` (`PlantingEditor`) and `BoxDetail`'s add-form, fed the box's other active plantings.
- **B integration:** `evaluateFit` (`src/lib/boxRanking.ts`) now reads `companionHints` against each box's active plantings — a good companion is a **positive** ("🌿 Trives med …"), a bad one a **caution** — so the SowBoxPicker/"Hva passer her nå?" why-lines reflect companionship too.
- **Verified in browser** (Testhage): adding cherrytomat to a box with basilikum+persille → green "Trives med Basilikum og Persille"; adding løk beside erter → amber "Dårlig naboskap med Erter".
- **Deferred:** companion fields on `CustomPlantForm` — custom plants rank as no-companion. **Decision 2026-06-19: keep this deferred deliberately** (not just "for now"). Companionship is the data a user is *least* likely to know, it needs an N-way plant-key multiselect (heavy UI), and its absence is invisible (the hint simply doesn't show). When `CustomPlantForm` got its advanced fields (sun/depth/perennial/seasonal), companions were the one B/F field explicitly excluded by the escape-hatch test. The "good companion in a *neighbouring box*" cross-box hint shipped 2026-06-18 (see the proximity note below).

**TODO (user, 2026-06-18) — proximity-aware companionship across nearby boxes. ✅ SHIPPED 2026-06-18.** Companion hints now also fire for plants in **neighbouring** boxes, not just the same box. New `src/lib/boxAdjacency.ts`: `neighbouringBoxes(box, boxes, gap)` (rectangle-gap test over `layout.{x,y,w,h}`, gap measured in grid units on both axes) + `nearbyActivePlantKeys(...)` which collects neighbours' active plant keys **de-duped against the same-box keys** (same-box is the stronger, separately-rendered signal). `NEIGHBOUR_GAP_UNITS = 2` — captures both side-by-side (the demo spaces columns 1 unit apart) and stacked (rows 2 units apart) neighbours; tunable, and a future cm-footprint threshold (now that B's `widthCm`/`lengthCm` exist) could refine "near" into real distance. `CompanionHints` gained an optional `nearbyKeys` prop and renders the neighbour pairings in muted styling with distinct wording — **"Trives med X i nabokassen"** / **"Mindre heldig naboskap med Y i nabokassen"** — below the bold same-box hints. Wired into both add-surfaces (`QuickAddSheet` `PlantingEditor` + `BoxDetail`). **Box ranking left same-box only** (extending `evaluateFit` why-lines to neighbours would add noise; the hint surface is where proximity belongs). **Verified in browser** (Testhage): adding Cherrytomater to *Åpen seng B* (active erter + jordbær) shows same-box *"Dårlig naboskap med Jordbær"* **and** neighbour *"Trives med Basilikum og Persille i nabokassen"* (from the adjacent Grunt krukke), with no double-counting. **Still deferred:** weighting same-box stronger than neighbour in *ranking* (n/a — ranking stays same-box); **companion** fields on `CustomPlantForm` (deliberately — see Increment F's deferral note; sun/depth/perennial/seasonal *did* land 2026-06-19).

**Original plan:**

- **Goal:** Surface good/bad plant pairings when adding a plant near existing active ones.
- **New metadata:** `companionsGood?: PlantKey[]`, `companionsBad?: PlantKey[]` on `PlantInfo`. Source: `plant-data-aggregator/plant-data-aggregator/docs/companionship/companionship.json` (already scraped and sitting in the repo).
- **UI:** B's box picker shows a green hint on boxes with compatible companions ("🌿 Trives med basilikum i nabokasse"); QuickAdd shows pairing hints when the target box has other active plantings.
- **Depends on:** none (orthogonal to other increments).
- **Effort:** 1–2 days (mostly tagging + cross-referencing).

#### G. Rotation warnings (per-action chips) — ✅ SHIPPED 2026-06-17 — *(absorbs Phase E's rotation scope)*

- **Goal:** Soft warning *at the moment of decision* when the user is about to repeat a family in the same box. 4-year cycle is the gardening ideal; warn at 2 years.
- **New metadata:** none — derives from existing `family` + planting history.
- **What landed:** `src/lib/rotation.ts` (shared rotation primitive — `boxRotationHistory`, `familyConflictYears`, `formatYearList`, `ROTATION_LOOKBACK_YEARS = 2`); `src/components/RotationWarning.tsx` (null-when-no-conflict amber chip); wired into `QuickAddSheet` (`PlantingEditor`) **and** `BoxDetail`'s add-plant form, below the picker. Fires only on the *selected* plant's family; skips `other`. The neutral Phase A "Forrige sesong" chip panel stays alongside it (context vs. warning).
- **Current-season rule (refined after testing):** a current-year planting counts toward rotation once **cleared** (harvested/removed/failed) — so harvest a carrot then replant carrot in the same bed → warning. A *still-active* current-year planting is skipped: it's a companion/duplicate, not a rotation conflict, and skipping it also prevents an edited planting from warning against itself.
- **Two severities + dismiss (`RotationWarning` derives severity from the conflict years):**
  - **Same-season only** (conflict is just this year, e.g. harvested→replant): gentle **amber** nudge — *"Du dyrket allerede [familie] her tidligere i år…"*.
  - **Prior-year** (family grew here in a previous season): stronger **red** treatment with a bold lead — *"**Vekstskifte anbefales.** Du hadde [familie] her i 2024 og 2025 — plant en annen familie i år…"*. This is the real cross-year rotation case, so it reads as more important.
  - Both are **dismissible** via an ✕ (we never block — soft info per the philosophy). Dismiss state lives in the add-form and resets when the picked plant changes, so switching plants re-evaluates.
- **Reuse seam for B:** the box-ranking picker should read `boxRotationHistory(...)` for its family-rotation input rather than re-deriving — that's why the primitive lives in its own lib.
- **Pairs with Increment C's passive context banner** — G fires *as you act* (you've picked a plant; we warn before you confirm), C surfaces *when you arrive* (you opened a box; here's its rotation/depth/sun context in one or two sentences). Both shipping is the point — the chip catches the action, the banner sets context.
- **Depends on:** none.
- **Effort:** ~½ day. (Actual: built shared primitive + component + both surfaces in one pass.)

#### H. Reminders / notifications (opt-in)

- **Goal:** Proactive nudges instead of "open app, check card". E.g. *"Tomatene dine bør plantes ut nå"*, *"Frost om 2 dager — dekk til ømtålige planter"*.
- **New infra:** `gt_reminders` localStorage with last-shown timestamps to dedupe. Web push opt-in via service worker — or, simpler v1, a session-only banner ("Du har 3 oppgaver i dag").
- **UI:** Bell icon or session banner at top of garden map. Settings toggle to enable browser push.
- **Depends on:** Service worker setup (new infra, not currently in the app).
- **Effort:** 2–3 days for web push; ½ day for session banner only.

#### I. Multi-year intelligence — *(re-scoped into layers 2026-06-19)*

**The original framing** (below) treated this as one feature gated on Phase F *plus a full logged season* of the user's own harvests. That's true **only for the narrowest version** — "calibrate YOUR sow date against YOUR past outcomes." Reasoned from first principles (2026-06-19): *"multi-year intelligence" is not one thing gated on one season* — it's "recommendations smarter than static literature defaults," and that has **four independent data sources**, only one of which needs us to wait. So we split I into layers and **build the no-wait layers now.**

**Why the narrow version genuinely waits:** to say *"you sowed tomato 10 May and got a good yield — try 8 May"* you need a recorded sow date **and** a recorded outcome **and** ideally 2+ points for a trend. One harvest cycle = one season per crop, minimum; you cannot manufacture the user's own microclimate × variety × practice ground truth faster than the plant grows. A single season is also statistically weak (one warm year tells you little). That constraint is real — but it only blocks Layer 2, not the feature.

**The layers (build top-down, value front-loaded):**

- **Layer 0 — GDD-based calibration (now, no season wait, no user data).** We already ship `gdd5` (1991–2020 growing-degree-day normal, base 5°C) per station in `frost-normals.json` — and it is currently **read by nothing** (only typed in `location.ts`). That's 30 years of climate history sitting unused. Tag crops with **GDD-to-maturity** (literature: ag-extension / NLR / seed "days to maturity" converted) and predict harvest readiness from accumulated GDD instead of the cruder `weeksFromSowing` proxy. **Data gap to close:** we have only the *season-total* GDD per station, not a cumulative GDD-by-day-of-year curve — so this needs a `climate-data/` pipeline pass to derive cumulative-GDD-by-DOY per station (the Frost API daily Tmean is already in use, so it's bounded pipeline work, **not** a wait). Improves harvest/sow accuracy for **every user on day one**.
- **Layer 1 — retrospective backfill (now, no season wait).** Let users enter **last year's** (and earlier) crops per box at onboarding or anytime. The multi-year *engine already exists* — rotation warnings (`rotation.ts`) already read `year` across seasons, and the Testhage fixture already carries 2023/24/25 plantings. The only thing missing is users *having* multi-year data; backfill is the shortcut. The moment a user fills in one past season, rotation history + *"I fjor: …"* hints light up — no waiting for 2027. **Doubles as the data flywheel:** a backfilled sow/harvest date is exactly the ground truth Layer 2 would otherwise wait a season to collect (see `USER-TESTING-PLAN.md`). Cheapest, highest-leverage, reuses existing schema (`Planting.year/plantedDate/harvestYield/status`).
- **Layer 2 — self-calibration from logged harvests (one season later).** The originally-scoped version: mean-of-prior-years sow-date nudges, per-box yield memory. Now it's the **capstone on an already-smart system**, not the gate on all progress. Still wants ≥1 logged season (real constraint above); backfill (Layer 1) can partially pre-seed it.
- **Layer 3 — cross-user regional aggregate (needs Phase H).** *"Gardeners near you sowed tomato ≈ 12 May; the early-May sowers reported better yields."* This is multi-year-quality intelligence from **one** season across **many** users — gated on accounts/sync (infra), not on time. The long-term north star; the data moat competitors can't copy.

**Build order:** Layer 1 first (cheapest, unblocks multi-year this week, feeds the flywheel) → Layer 0 (best accuracy lift, needs the GDD pipeline pass + literature tagging) → Layer 2 (after a season) → Layer 3 (with Phase H).

**Original framing (kept for the record):**
- **Goal:** Use 2+ years of history to refine recommendations beyond defaults. Examples: *"Du sådde tomat 10. mai i 2024 og 2025 — vurder 3. mai i år for tidligere høst"*, *"Bønner i box 4 ga god avling i fjor — fortsett der?"*
- **New metadata:** uses Phase F's `harvestYield` (Layer 2); GDD-to-maturity on `PlantInfo` (Layer 0).
- **UI:** Refines existing card hints + adds *"I fjor: …"* reasoning lines.
- **Depends on:** **Phase F** (harvest tracking) + at least one full season of personal data **— for Layer 2 only.** Layers 0 and 1 depend on neither.
- **Effort:** Layer 1 ~1 day (UI over existing schema). Layer 0 ~2–3 days (pipeline GDD-by-DOY pass + crop tagging + compute). Layer 2 open-ended. Layer 3 = Phase H.

#### J. Visualisering / dashboards — *(addresses the user note in Phase H)*

- **Goal:** Capture the user's stated interest in graphs and visuals.
- **Candidate charts:** family-composition pie (which families dominate this year?), yield-over-time bars, box-productivity ranking, calendar-density heatmap. Sesongoversikt (D) is already one form of visualization.
- **New metadata:** none beyond what other increments add.
- **Depends on:** Phase F for yield-based charts; D ships one form already.
- **Effort:** ~½ day per chart. Pick high-value ones; don't ship a dashboard for the sake of having one.

#### K. Forkultivering — indoor seedling tracking — ✅ SHIPPED 2026-06-19 — *(new; user-raised 2026-06-17)*

**What landed.** A dedicated **`/seedlings`** route (the "Forkultivering" tray) for plantings that exist *before* they have a box. Reused `Planting` with **`boxId?` made optional** (+ `transplantedDate?`) rather than a separate entity — so "Plant ut" preserves the indoor sow date and the row becomes an ordinary box planting. **Dropped the planned `stage` field** (derived via `isIndoorSeedling()` = no `boxId`). Zero store changes. Tray = list of active indoor seedlings with a readiness hint (`transplantReadiness()`, reuses the `transplant` sowRule — no new metadata), "Plant ut" → the now-shared `SowBoxPicker` (extracted from `GardenMap`, `verb` prop), a "+ Start frø inne" form, and an empty state. Entry via a **🌱 Forkultivering** header badge (live count) on `GardenMap`; the "Så inne" card button now routes here. Audited every *global* active-planting scan (timeline, succession, "Høst snart", grid occupancy, adjacency, import validator) to exclude seedlings. Verified end-to-end in browser. See the 2026-06-19 Shipped entry for the full breakdown.

**Original plan:**

- **Goal:** In Norway you rarely direct-sow the heat-lovers — you **pre-cultivate indoors** (forkultivering) weeks before last frost, then plant out. Today the app only models *plantings in a box*; an indoor seed tray isn't a box, so there's nowhere to record "startet 6 tomater inne 1. mars" before they go out.
- **What already exists (the timing half — shipped):** D2's SowNowCard **"Så inne"** group already tells you *when* to start each plant indoors (`sowRules` `indoor.weeksBeforeLastFrost`), and **"Plant ut"** tells you when to transplant. So the *calendar hints* are there. **This increment adds the *tracking*** — the missing entity + the two actions around it.
- **Data model (the careful part):** let a `Planting` exist **without a box** while it's indoors. Cleanest seam: make `boxId` nullable + add `stage?: 'indoors' | 'planted'` (default `'planted'`, so existing data is unchanged), plus a `transplantedDate?`. A **"Plant ut"** action assigns the seedling to a box (set `boxId`, record `transplantedDate`, keep the original indoor sow date for days-to-harvest). This is the **first feature that makes `boxId` optional** — do it deliberately so the Phase H sync mapping (plantings FK to box) tolerates null/indoor rows.
- **UI surfaces:**
  - A small **"Forkultivering / Inne"** area (a virtual tray, *not* on the garden grid) listing indoor seedlings with sow date + a **"Plant ut"** button.
  - The SowNowCard **"Så inne"** row "+ Legg til" creates an *indoor* seedling (no box prompt) rather than routing through the box picker.
  - **"Plant ut" reuses Increment B's ranked SowBoxPicker** to choose the best box — nice synergy (the seedling already knows its plant, so the picker ranks boxes for it).
- **Depends on:** B (box picker for the plant-out step). Orthogonal to C/D.
- **Effort:** ~1–1.5 days (the nullable-`boxId` migration + "Plant ut" verb are the work; UI is small).

### Suggested sequencing — cohorts, not a long single sprint

**Cohort 1 — quick wins on existing data (1–2 weeks total):**

- ~~**G** (rotation warnings)~~ ✅ Shipped 2026-06-17. Built the shared `src/lib/rotation.ts` primitive B reuses.
- ~~**B** (smart box picker)~~ ✅ Shipped 2026-06-17. `src/lib/boxRanking.ts` + grouped `SowBoxPicker`; added the sun/bed/depth metadata + box `depthCm` UI. Reuses `boxRotationHistory`.
- ~~**C** (reverse lookup)~~ ✅ Shipped 2026-06-17. Passive context banner + "Hva passer her nå?" panel on `BoxDetail` (`boxContextNotes` + `rankPlantsForBox`); extracted `src/lib/sowWindow.ts`. **Cohort 1 complete.**

**Cohort 2 — small schema extensions, get real-user feedback (2–3 weeks):**

- ~~**F** (companions)~~ ✅ Shipped 2026-06-17. `companionsGood`/`companionsBad` on 27/32 plants (derived from the in-repo `companionship-extended2.json`), `src/lib/companions.ts` + `CompanionHints.tsx`, wired into QuickAdd + BoxDetail add-forms and folded into B's box ranking.
- ~~**E** (succession)~~ ✅ Shipped 2026-06-17. `successionWeeks` on 5 crops; new **Suksesjon** group in `SowNowCard`.
- ~~**D** (sesongoversikt)~~ ✅ Shipped 2026-06-17. `SeasonTimeline.tsx` + `src/lib/seasonTimeline.ts`, collapsible section on `GardenMap`. **Cohort 2 complete.**

**Cohort 3 — needs Phase F first:**

- ~~**Phase F** (harvest tracking).~~ ✅ Shipped 2026-06-18. `harvestYield` on `Planting` + yield prompt on the Høst action. See the Phase F section.
- **I** (multi-year intelligence) — **re-scoped into layers 2026-06-19 so it no longer blocks on a season.** Layer 1 (retrospective backfill) + Layer 0 (GDD-based calibration using the already-shipped-but-unused `gdd5`) are buildable **now**; only Layer 2 (self-calibration from the user's own logged harvests) needs ≥1 full season, and Layer 3 needs Phase H. See the reworked Increment I section. **This is the recommended next code work** — Layer 1 first.
- Yield-based parts of **J** (dashboards) — partly unblocked: data-independent charts (family-composition pie, calendar-density heatmap) need no harvest data; yield-over-time / box-productivity charts still want real logged harvests.

**Cohort 4 — opt-in, infra-heavy:**

- **H** (notifications) — only after we've got real-user signal that the card alone isn't enough.

### Relationship to other phases (housekeeping)

- **Phase E** (active rotation + companion suggestions) — ✅ **fully absorbed and shipped** as increments **G** (rotation warnings, 2026-06-17) + **F** (companions, 2026-06-17). The Phase E section below is now historical — its rotation-warning and companion-pairing scope both landed; nutrient-flow hints (the "stretch" bullet) were not built and aren't currently planned.
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

## Grid / map navigation & overview UX — *(planning; user-raised 2026-06-18)*

> Status: **All four items + foundation + zoom-to-cursor SHIPPED 2026-06-18.** Four issues the user hit while using the garden map on a Mac, plus a foundation change they all share and a few adjacent improvements. Remaining work is optional polish (persist view, touch-pinch focal, smarter fit).
>
> **✅ Item 2 — minimap with live frame (shipped 2026-06-18).** New `src/components/GridMinimap.tsx`, rendered by `GardenGrid` inside a `relative` wrapper, pinned `absolute top-2 right-2` over the viewport. Draws every box scaled down (green = has an active planting, light = empty) plus a translucent green **frame rectangle** for the visible region. It reads the viewport's live metrics (a rAF-throttled `scroll` listener + a `ResizeObserver` on both the viewport and its content child, so the frame stays correct across pan, zoom, and window resize) and **auto-hides when the grid already fits** (no scroll overflow). **Click or drag** the minimap to pan — `panTo` maps the pointer fraction to `viewport.scrollTo({left/top})`, centered on the cursor, with `setPointerCapture` so a drag keeps panning outside the minimap. Coordinates: boxes use grid-unit × cell-stride (`colWidth+margin`) and the frame uses pixel ratios, both divided by the live `scrollWidth/Height`, so they share one basis and stay aligned at any zoom; the minimap box is sized to the content aspect within a 180×120 cap. Verified in browser against the 55-box standardoppsett: 55 box rects + frame render, click-to-pan jumped the viewport to the clamped corner and the frame tracked it, no console errors.
>
> **✅ Shipped this pass (verified in browser against the Testhage):**
> - **Foundation — bounded 2-D scroll viewport.** `GardenGrid`'s old `w-full overflow-x-auto` wrapper is now a single `overflow-auto overscroll-contain` viewport with `ref={viewportRef}` and a responsive height `min(70vh, ${gridSize.rows*(rowHeight+margin)}px)` (caps at content height so small gardens don't get dead space). Both scroll axes now live on one element. Verified: `overflow:auto`, `overscroll-behavior:contain`, scrollable in X and Y.
> - **Item 3 — back-swipe fix.** `overscroll-behavior: contain` on that viewport (both axes) stops the Mac trackpad two-finger horizontal swipe from triggering browser back/forward while panning. Scoped to the viewport (no global rule that would kill swipe-back on other pages). *Caveat: confirm on a real trackpad; the property is the documented fix and is applied, but the back-nav gesture itself can't be dispatched synthetically.*
> - **Item 4 — "+ Ny kasse" moved above the grid** in edit mode (`GardenMap.tsx`, the `editMode && !viewMode` create-box `<section>` now renders right after `SeasonTimeline`, before the grid `<section>`). Verified: button top (433px) is above grid top (603px).
> - **Zoom-to-cursor (bonus, user-requested).** Ctrl/⌘ + wheel (= Mac trackpad pinch) now zooms anchored to the pointer instead of the top-left. `GardenGrid` binds a non-passive `wheel` listener on the viewport; it captures the focal point as a fraction of the scroll extent, calls `onZoomChange` (new prop → `GardenMap`'s `setZoom`), and a `useLayoutEffect` restores `scrollLeft/scrollTop` against the new extent after the re-layout. Plain wheel still scrolls; zoom clamps to `MIN/MAX_MAP_ZOOM`. Verified: horizontal drift ~0, vertical drift ~5px per aggressive step (negligible); zoom clamps at 120%.
> - **Item 1 — wider grid on large screens.** Page container raised responsively: `<main>` `max-w-6xl xl:max-w-[1400px] 2xl:max-w-[1800px]` (`GardenMap.tsx`). The grid `<section>` is `w-full`, so it immediately uses the extra room (verified: at a 1920px window the main is 1800px and the grid viewport ~1742px — up from ~1094px). The create-box **form** inputs are capped at `max-w-xl` so they don't stretch absurdly in the wider card. **"Tilpass" rewired** to fit *all columns into the real viewport width* (it bumps a `fitNonce` → `GardenGrid` computes the fit from `viewport.clientWidth`, margin-aware via the new `MAP_BASE_MARGIN` constant, and resets scroll to the origin through the focal mechanism) — fixing the old `window.innerWidth` math that would over-zoom now that the container is capped. Verified: Tilpass → all 51 cols fit (no horizontal scroll), vertical scrolls, no page overflow. *Note:* fit targets the whole grid **canvas** width (51 cols), same as before — boxes clustered in the left of a large canvas still look small after fit; a "fit to the box bounding-box" smarter-fit is a possible follow-up.
>
> **Deferred from this pass:** mobile pinch (touch) is *not* yet cursor/midpoint-anchored — only Ctrl/⌘+wheel is (the user is on a Mac trackpad). The zoom *buttons* still anchor at the viewport's current top-left rather than centering — fine, left as-is. `touch-action: pan-x pan-y` on tiles in non-edit mode (so a one-finger pan that starts on a tile scrolls) was skipped to avoid mobile-gesture regressions; revisit if a tester reports it.

### The map today (so the plan is grounded in what exists)

- **Page shell:** `GardenMap` renders everything inside one centred `<main className="mx-auto … max-w-6xl">` (`src/pages/GardenMap.tsx:371`). Header, `SowNowCard`, `SeasonTimeline`, the grid `<section>`, and the edit/create-box `<section>` all stack vertically inside that 1152 px column.
- **Scrolling is split across two axes:** `GardenGrid` wraps the grid in `<div className="w-full overflow-x-auto pb-2">` (`src/components/GardenGrid.tsx:76`) — so **horizontal** panning is that div's native scroll, while **vertical** panning is the *whole page* scrolling. The inner content div has an explicit `width: gridWidth` (`gridSize.cols * colWidth`) but **no explicit height** — height comes implicitly from the row content + a `__bottom_spacer__` item (`GardenGrid.tsx:44-56`).
- **Zoom** is a `0.2–1.2` number (`MIN_MAP_ZOOM`/`MAX_MAP_ZOOM`, `GardenGrid.tsx:15-16`) held in `GardenMap` state, default `0.9`. It re-lays-out by scaling `colWidth`/`rowHeight`/`margin` (not a CSS transform), so zoom anchors at the top-left and the view drifts. Not persisted. Pinch-zoom is wired via `onTouch*` handlers on the wrapper around `GardenGrid` (`GardenMap.tsx:468-480`).
- **Grid units & padding:** `EXTRA_LEFT_COLS = 4`, `EXTRA_TOP_ROWS = 14` pad the usable area; `gridSize` defaults to `51 × 26` and is user-configurable/persisted (`useUiStore`). Box positions are stored in abstract grid units (`box.layout.{x,y,w,h}`), independent of zoom.

### Foundation (do first): one bounded 2-D scroll viewport

**Why.** Items 1, 2, and 3 all want the same thing: a single element that owns *both* scroll axes, with a known `scrollLeft/scrollTop/clientWidth/clientHeight/scrollWidth/scrollHeight`. The split "horizontal-div + page-vertical" model makes the minimap frame (item 2) ill-defined and makes the back-nav fix (item 3) only half-work. Converting the grid into one bounded, internally-scrolling box is the backbone.

**What changes.**
- In `GardenGrid`, replace the `w-full overflow-x-auto` wrapper with a bounded viewport: `overflow-auto overscroll-contain` + a responsive height (e.g. `h-[55vh] lg:h-[65vh] 2xl:h-[72vh]`, with a sensible `min-h`). Give the inner content div an **explicit height** (`gridSize.rows * rowHeight`) so `scrollHeight` is exact (and we can drop or keep the bottom-spacer hack — explicit height makes it redundant).
- Expose the viewport element to the parent via a `ref` (forwardRef or a callback ref) so the minimap and any "center on box" logic can read scroll metrics and call `scrollTo`.
- Keep `ReactGridLayout` and `useContainerWidth` inside unchanged; `width={Math.max(width, gridWidth)}` still resolves correctly (viewport `clientWidth` vs `gridWidth`).
- **Touch:** keep pinch on the viewport; ensure one-finger/2-finger *pan* uses native scroll. Note the pre-existing `.react-grid-item { touch-action: none }` (`src/index.css:71`) — in non-edit mode (drag disabled) consider `touch-action: pan-x pan-y` on tiles so a swipe that starts on a tile still pans.

**Trade-off / the one real decision.** A fixed-height inner scroll region is great for an overview + minimap but some people dislike "a scroll inside a scroll" on desktop. Recommended anyway because the user explicitly asked for both a *wider overview* and a *minimap with a moving frame*, and a minimap frame only has meaning relative to a defined viewport. Alternative if disliked: keep page-flow and make the minimap frame track the window viewport instead — messier, and item 3 then needs a global `overscroll-behavior-x` instead of one scoped element.

### 1. Wider grid on large screens — ✅ SHIPPED 2026-06-18

- **Goal:** more of the garden visible at once on a desktop/large window; less scrolling to get the overview.
- **Approach:** let the **map area use more horizontal room** than the reading content. Recommended: raise the page container responsively (`max-w-6xl xl:max-w-[1400px] 2xl:max-w-[1760px]` on the `<main>` at `GardenMap.tsx:371`) and wrap the genuinely text-heavy blocks (header, `SowNowCard`, `SeasonTimeline`, create-box form) in an inner `mx-auto w-full max-w-5xl` so prose stays readable while the grid `<section>` spans the full width. (Alternative: keep `max-w-6xl` and full-bleed only the grid section via `relative left-1/2 -translate-x-1/2 w-screen` — avoided as the default because full-bleed risks a horizontal-scrollbar/overflow fight.)
- Pair with the foundation's responsive **viewport height** so the bigger area is both wider and taller.
- **Optional:** auto-fit zoom to the viewport (both axes) on first mount / on viewport resize *until the user manually zooms*, so a large window starts showing the whole garden. Today's `zoomFit` (`GardenMap.tsx:159`) only fits width to `window.innerWidth`; with a bounded viewport it should fit to the viewport's client box on both axes.
- **Files:** `GardenMap.tsx` (container classes, `zoomFit`), `GardenGrid.tsx` (viewport height). **Effort:** ~½ day (mostly the foundation; this rides on it).

### 2. Minimap with a live viewport frame (top-right) — ✅ SHIPPED 2026-06-18

- **Goal:** a small overview in the top-right corner showing the whole garden, with a frame rectangle that moves as you pan, so you always know *where* in the grid you're looking — and can click/drag the frame to jump.
- **Approach:** new `GridMinimap` component, absolutely positioned over the viewport (`absolute top-2 right-2`, pinned to the *viewport*, not scrolling with content; small, e.g. `w-44 h-28`, semi-transparent surface, rounded border, soft shadow).
  - **Coordinate basis:** work in grid units (cols/rows incl. the `EXTRA_*` offsets) so it's zoom-independent. `scaleX = minimapW / gridSize.cols`, `scaleY = minimapH / gridSize.rows`. Draw each box as a tiny rect at `(x*scaleX, y*scaleY, w*scaleX, h*scaleY)`, tinted active (green) vs empty (gray) — reuse the tile palette.
  - **Frame rect:** derive from live scroll metrics — `left% = scrollLeft/scrollWidth`, `width% = clientWidth/scrollWidth` (and the y analogues) — applied to the minimap box. This stays correct across zoom because it's ratios of the *pixel* scroll box. (Boxes in grid-units + frame in scroll-ratios both map to the same normalized 0–1 space, so they line up.)
  - **Live updates:** a rAF-throttled `scroll` listener on the viewport writes `{scrollLeft, scrollTop, clientW, clientH, scrollW, scrollH}` into state; also recompute on resize and zoom change. Box count is tiny (≤ dozens) so re-render cost is negligible.
  - **Interaction:** click → center the viewport on that point (`viewport.scrollTo({left: pxX - clientW/2, top: pxY - clientH/2})`); drag the frame → pan continuously (`behavior:'auto'`). Respect `prefers-reduced-motion` for any smooth scroll.
  - **Visibility:** show only when content overflows the viewport (`scrollW>clientW || scrollH>clientH`); otherwise the whole garden is already visible and the minimap is noise. v1: no manual toggle; auto show/hide. Keep it visible in view-mode too (navigation aid). Don't render it over the create-box form.
- **Depends on:** the foundation (needs the viewport ref + explicit content size). **Files:** new `src/components/GridMinimap.tsx`; small wiring in `GardenMap.tsx`/`GardenGrid.tsx` to share the viewport ref + metrics. **Effort:** ~1 day.

### 3. Stop the browser back/forward swipe while panning the grid — ✅ SHIPPED 2026-06-18

- **Goal:** on a Mac trackpad, a two-finger horizontal swipe to pan must not trigger browser **back/forward** when the grid hits its scroll edge.
- **Root cause:** horizontal overscroll on the scroll container chains to the browser's history-navigation gesture.
- **Fix:** `overscroll-behavior: contain` (Tailwind `overscroll-contain`) on the bounded viewport (folded into the foundation). This disables scroll-chaining *and* the swipe-nav gesture for that element on both axes, while keeping normal scrolling. 
- **Edge case:** `overscroll-behavior` only suppresses nav when the element is actually scrollable in that axis. If the garden fits horizontally (no overflow), a horizontal swipe over it falls through to the page → nav. If that proves annoying, add `overscroll-behavior-x: contain` to `html, body` in `src/index.css` as a belt-and-suspenders (scoped consideration: it changes overscroll globally, but the app has no intentional horizontal-overscroll-nav anywhere, so it's safe). Start with the scoped viewport rule; add the global only if the user still hits it.
- **Files:** `GardenGrid.tsx` (class on the viewport), optionally `src/index.css`. **Effort:** trivial (~1 line) once the viewport exists.

### 4. Move the "+ Ny kasse" button to the top of the grid (edit mode) — ✅ SHIPPED 2026-06-18

- **Goal:** in edit mode, the add-box control sits **above** the grid instead of below it, so it's reachable without scrolling past the whole garden. (User said "add planter button" — in the code this is the **"+ Ny kasse"** / create-box section, `GardenMap.tsx:509-570`.)
- **Approach:** relocate that `editMode && !viewMode` `<section>` to render **immediately above** the grid `<section>` (e.g. right after `SeasonTimeline`, `GardenMap.tsx:422`). Keep the collapsible button→form behavior as-is. When the form is open it pushes the grid down — acceptable; if that feels heavy later, open the form in a modal/sheet instead of inline.
- **Files:** `GardenMap.tsx` (JSX reorder only). **Effort:** trivial.

### Also came to mind (document now, build only if wanted)

- **Zoom-to-cursor / zoom-to-center.** ✅ **Ctrl/⌘+wheel shipped 2026-06-18** (see the status block at the top of this section). Still open: anchor the *touch pinch* (around the pinch midpoint) and the *zoom buttons* (around the viewport center) the same way.
- **Persist zoom + scroll position** (`gt_map_view` in localStorage) so returning users land where they left off. Cheap.
- **Desktop drag-to-pan.** Grab-cursor + space-or-middle-mouse drag to pan in non-edit mode, for mouse users without a trackpad. Native scroll already covers trackpad/wheel.
- **Keyboard nav + a11y.** Arrow keys to pan, `+`/`-` to zoom, a focus ring on the viewport; minimap as a labelled region. Important if the map is to be operable without a mouse.
- **"Center on box" / return highlight.** When returning from `BoxDetail`, scroll the source box into view and briefly pulse it (we already pass `search` through navigation, so the box id is available).
- **Move the zoom toolbar into the viewport corner** (e.g. bottom-left overlay) to reclaim vertical space, mirroring the minimap top-right. Optional once the viewport exists.

### Suggested sequencing

1. ~~**Foundation** (bounded viewport + refs).~~ ✅ done 2026-06-18.
2. ~~**Item 3** (`overscroll-contain`) and **Item 4** (button move).~~ ✅ done 2026-06-18.
3. ~~**Item 1** (wider + viewport-accurate fit).~~ ✅ done 2026-06-18.
4. ~~**Item 2** (minimap).~~ ✅ done 2026-06-18.
5. Optional polish (all open): ~~zoom-to-cursor~~ (✅ wheel done) · persist zoom+scroll · touch-pinch focal · smarter "fit to box bounding-box" · minimap hide/show toggle.

### Risks / watch-outs

- `react-grid-layout`'s `useContainerWidth` + the `width={Math.max(width, gridWidth)}` interplay must keep working when the container becomes a bounded scroller — verify drag/resize hit-testing still lands correctly at all zoom levels (the library positions items from `width`/`rowHeight`, which don't change here).
- `touch-action` on tiles vs. native pan (see foundation note) — test one-finger pan that begins on a tile in non-edit mode.
- Full-bleed/width changes must not introduce a horizontal scrollbar on the `<body>` (keep overflow contained to the viewport).
- Verify on a real Mac trackpad that `overscroll-contain` actually kills the back-swipe (it's the documented fix, but confirm in-browser per the project's end-to-end habit).

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

## Phase F — Harvest tracking — ✅ SHIPPED 2026-06-18

**Goal:** close the loop on which plantings actually paid off — input for next year's planning.

**What landed:**
- `Planting.harvestYield?: string` (`src/types/index.ts`) — free-text yield ("5 kg", "3 bøtter", "1 sekk"). Optional, no migration.
- **Yield prompt on the Høst action** (`src/components/PlantingRow.tsx`): clicking **Høst** now reveals an inline *"Avling (valgfritt)"* text field (placeholder *"f.eks. 5 kg, 3 bøtter"*) + **Bekreft høst** / **Avbryt**, instead of harvesting immediately. The field is optional — confirm with it blank and nothing is stored. Local `harvesting`/`yieldInput` state in the row; no extra surface.
- **Store** (`src/store/useGardenStore.ts`): `markHarvested(id, opts?: { harvestYield?: string; date?: string })` — was `(id, date?)`. Trims the yield and stores `undefined` for blank so empty fields don't litter the data. `BoxDetail`'s `onHarvest` passes the yield through.
- **Display:** harvested rows show a *"Avling: …"* line beside *"Høstet: …"* (`PlantingRow`, renders in both the Nå and Historikk sections).
- **Export/Import:** round-trips untouched — `isPlantingLike` only gates required fields, no `version` bump.
- **Testhage:** the harvested gulrot (`demo-pl-0203`, Pallekarm Sør) carries `"harvestYield": "3 kg"` so the display is live in the fixture.
- **Verified end-to-end in browser** (Testhage, Tunnel 1): Høst → inline yield form → *"8 agurker"* → Bekreft → planting moves to Historikk 2026 as *Høstet* with *"Avling: 8 agurker"*.

**Why now:** cheap addition, aligns with regenerative philosophy — track what works, drop what doesn't.

**Unlocks (Cohort 3):** this is the prerequisite for **Increment I** (multi-year intelligence — calibrate sow/harvest dates against logged history) and the yield-based parts of **Increment J** (dashboards: yield-over-time, box-productivity ranking). The "best performers per box" history view named in the original scope is deferred into J. Per-variety/per-box calibration wants ≥1 full season of this data before it pays off.

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

1. ~~**D3.1 — edit/extend existing planting from QuickAdd.**~~ ✅ Shipped 2026-06-17. See the D3.1 section. The natural follow-on is a per-row "Rediger" button on `PlantingRow` (for harvested/historical rows), which reuses the same `updatePlanting` seam.
2. ~~**Hagekalender Cohort 1** (G + B + C)~~ ✅ Shipped 2026-06-17. ~~**Cohort 2** (F + E + D)~~ ✅ Shipped 2026-06-17 — companion hints, succession nudges, Sesongoversikt timeline. See the Hagekalender roadmap section. **Cohort 3 needs Phase F (harvest tracking) first** — that's the next real piece of new product surface.
3. **Real-user feedback loop on the calendar** — get the SowNowCard + box picker + timeline in a real Norwegian gardener's hand across a couple of weeks before locking sowRule/companion/succession values. Pair with a targeted NLR/Hageselskapet cross-check on the plants the user actually grows.
4. ~~**Phase F (harvest tracking)**~~ ✅ Shipped 2026-06-18 — unlocks Cohort 3 (multi-year intelligence + yield dashboards). Those now wait on **≥1 logged season**, not on code.

**Big bets — hold for signal before starting:**

- **Phase H** (accounts/sync/tiers) — wait for at least one tester to explicitly ask for cross-device or shared editing.
- **Phase G** (photos) — wait until users ask, and pair with H since localStorage can't hold many images.

~~After D1+D2 ship and get real use, **Phase F (harvest tracking)** is a cheap follow-on (~1 day) that closes the loop.~~ ✅ Shipped 2026-06-18 — the loop is closed; multi-year intelligence (I) + yield dashboards (J) now wait on a logged season, not on code.

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

---

## Dev tooling — Test garden (seed fixture) — ✅ SHIPPED 2026-06-17

> **Idea (user, 2026-06-17):** a one-click "test garden" loaded from a button on the front page — a ready-made fixture with ~10 boxes, each carrying multi-year planting history and planter metadata, so we can develop and exercise features (rotation warnings, the coming smart box picker, calendar) against realistic data without hand-building a garden every time.

**Shipped as planned, with three deviations from the design below (all per user direction):**
1. **Fixture is a JSON file** (`src/resources/demo-garden.json`), statically imported like `mvp-mygarden-v2.json` — not the `src/data/demoGarden.ts` + dynamic-import split sketched below. Simpler and matches the existing "Standardoppsett" pattern the user asked to mirror.
2. **Un-gated** — the "🧪 Testhage" button is always visible on the landing page (test phase). The `isDemoEnabled()` gating below is *not* wired; it's a one-line follow-up before public launch.
3. **`depthCm` included now** — the fixture already carries box depths (forward-seed) even though `Box.depthCm` doesn't exist until Increment B. It's inert extra JSON until B reads it.
   The dev drift-guard shipped as `warnUnknownDemoPlantKeys()` inside `startDemo()` (console.warn), as planned. Verified end-to-end in-browser. The rest of this section is retained as the design record / B's reference.

**Why it's worth building now.** Every Cohort 1 feature (G shipped, B + C next) is only testable with *history*: rotation warnings need prior-year families, the smart box picker needs sun/bed/depth + history to rank, the reverse-lookup banner needs constraints to surface. Today we hand-create that each time we test. A seed fixture makes every one of these reproducible and demo-able in one tap.

### Key insight: reuse the import seam — there is no new write path

The codebase **already** has the exact bulk-write path this needs. `GardenMap.tsx` ships an onboarding "Standardoppsett" option that loads a bundled garden (`src/resources/mvp-mygarden-v2.json`) through:

```
startBundled() → setPendingImport({ boxes, plantings, customPlants }) → <ConfirmModal> → confirmImport()
confirmImport(): saveBoxes() + savePlantings() + replaceCustomPlants() + ensureGridFits(gridFootprint) + reloadFromStorage()
```

The test garden is **just another `PendingImport`** fed through this same flow. **No new store action, no new persistence code** — that keeps the Phase H sync seam intact (everything still goes through `storage.ts` + `reloadFromStorage`). The only extension needed is to carry optional **location** through the payload (see below), because the calendar features are half the reason to seed.

### Test garden ≠ "Standardoppsett"

They are different artifacts with different audiences — don't conflate them:
- **Standardoppsett** (`mvp-mygarden-v2.json`) — a tidy, realistic *starter* garden shown to **every** new user. No deliberately-broken rotations.
- **Testhage** (new) — a **gated dev fixture** whose histories are engineered to trip every code path (rotation conflicts, harvested→replant, shallow/shaded boxes, custom plant, free-text planting, seeded location). **Never shown to real users.**

### Entry points & gating

- `isDemoEnabled()` = `import.meta.env.DEV || new URLSearchParams(location.search).has("demo")`. Dev builds always; deployed builds only with `?demo=1` (so a tester on the PWA can opt in).
- **Onboarding (primary, the "front page"):** a third gated button beside "Tom hage" / "Standardoppsett" → `startDemo()` builds the `PendingImport` from the fixture and reuses the existing confirm modal. This is the smallest change and the user's literal ask.
- **Settings (secondary):** a gated "Last inn testhage" in a `🧪 Utvikler` section, so the fixture can be reloaded **mid-session** without first clearing to the empty-state onboarding. Reuses the same loader behind a confirm (Settings already imports `ConfirmModal` for reset).

### Files

- **`src/data/demoGarden.ts`** — pure, data-only fixture. Exports `DEMO_GARDEN: { boxes: Box[]; plantings: Planting[]; customPlants: PlantInfo[]; location: { postnummer; elevationM; frostJusteringDays } }`. Stable hardcoded ids (`demo-box-01`, `demo-pl-01`) and hardcoded `createdAt` strings — **no `Date.now()` / `nanoid()` / `Math.random()`** so reloads are deterministic and demo data is recognizable (ids prefixed `demo-`). Each `Planting` carries an explicit `year` matching its `plantedDate` (the raw `savePlantings` write does not recompute it).
- **`src/lib/demoGarden.ts`** — `isDemoEnabled()`, a dev-only `validateDemoGarden()` (below), and a thin `buildDemoImport()` returning the `PendingImport`-shaped payload. **Dynamically imported** (`await import("../data/demoGarden")`) from the button handlers so the ~10 KB fixture stays out of the main bundle for real users (the prod chunk is already ~1.2 MB).
- **`GardenMap.tsx`** — extend the `PendingImport` interface (and `confirmImport`) with an optional `location`; when present, apply it via `useLocationStore` setters (`setPostnummer` → `setElevation` → `setFrostJustering`) right after the garden write. Real backup imports leave it `undefined` → no-op, so this is forward-compatible (backups could carry location later).

### Fixture content (~11 boxes — each earns its place)

Histories use **2024 + 2025** (prior seasons, inside the 2-year `ROTATION_LOOKBACK_YEARS` window from 2026) and **2026** (active / cleared current season). Vary `w`×`h` so B's size-vs-plant ranking is testable. All `plantKey`s are real `plants.json` keys.

| # | Box (name) | sun / bed / depth | History | Exercises |
|---|---|---|---|---|
| 1 | Drivhus 1 | sun / greenhouse / 30 | 2024 `tomat_cherry`, 2025 `paprika`, **2026 `tomat_stor` failed** | G **red** multi-year ("2024, 2025 og 2026") incl. cleared-failed counting; B greenhouse match; Frarådes for Solanaceae |
| 2 | Pallekarm Sør | sun / raised / 40 | 2024 `salat`, 2025 `bønner`, **2026 `gulrot` harvested** (variety "Nantes") | G **amber** same-season (harvest→replant `gulrot`); harvest flow; variety display |
| 3 | Pallekarm Nord | partial / raised / 40 | 2025 `potet` | G **red** single prior year (severity wording) |
| 4 | Grunt krukke | sun / container / **20** | 2025 `salat`; 2026 active `basilikum` | B shallow-depth discourages root veg; small-plant-good-fit; active herb |
| 5 | Skyggebed | **shade** / open / — | 2025 `spinat` | B sun-mismatch (tomato discouraged, leaf OK) |
| 6 | Åpen seng A | sun / open / — | *(empty, clean)* | B "empty + no conflict" → Anbefalt baseline |
| 7 | Åpen seng B | sun / open / — | 2024 `mais`, 2025 `squash`; 2026 active `erter` | active planting; varied families; no current conflict |
| 8 | Tunnel 1 | sun / tunnel / — | 2026 active `agurk` (variety "Marketmore", sown ~20 May) | tunnel bed; SowNow "Høst snart" grouping; variety |
| 9 | Bøtte krydder | sun / container / 25 | 2025 `gressløk`; 2026 active `timian` | container; herb |
| 10 | Eksperimentkasse | sun / open / — | 2025 free-text planting `customName:"Ukjent staude"`, no `plantKey` | `familyOf` undefined path (rotation skip); `customName` rendering |
| 11 | Egne-planter-kasse | sun / open / — | 2025 `salat` (asteraceae) | pick the **seeded custom plant** (asteraceae) → custom-plant lookup + custom family participating in rotation → fires G |

- **Seeded custom plant** (in `DEMO_GARDEN.customPlants`): one entry, e.g. `Jordskokk` (family `asteraceae`, with `sowRules`/`harvestRule`), so the picker's "Egne planter" section is populated and box 11 demonstrates a custom plant flowing through merge → lookup → rotation.
- **Seeded indoor seedlings (Increment K, added 2026-06-19):** two boxId-less plantings — `demo-seed-01` `tomat_cherry` 'Sungold' ×6 (sown inne 20 May) + `demo-seed-02` `paprika` ×4 (sown inne 10 May). They exercise the **prior-state load path**: on Testhage import the 🌱 Forkultivering badge reads **2**, both populate the `/seedlings` tray with age + readiness, and neither leaks into a box, the Sesongoversikt, or "Høst snart" (the global-scan guards). No box claims them — that's the point.
- **Seeded location:** postnummer **6857 @ 5 m** (the doc's canonical Sogndal LH case — late corrected frost ≈ 15 Apr/5 Nov), so the SowNow card, frost dates, and harvest rules all light up immediately and match the documented end-to-end verification.

### Correctness guards (no test runner exists — `tsc -b && vite build` only)

- **Drift guard:** `validateDemoGarden()` builds `new Set([...plants.json keys, ...DEMO_GARDEN.customPlants keys])` and `console.warn`s any `planting.plantKey` that is non-empty and unresolved. Call it inside `startDemo()` under `import.meta.env.DEV`. (A real unit test would be better — but adding a test runner is its own task; note it, don't block on it.)
- **No nondeterminism** in the fixture (see Files) — required because there's no journal/seed reset and we want reload idempotency.
- **Years must match dates** — explicit `year` on every planting; the raw write trusts it.

### Out of scope / cautions

- Not a substitute for a future Supabase seed — local-only dev aid.
- Keep the fixture in sync with `plants.json`: a renamed bundled key silently breaks a planting (caught only by the dev `console.warn`).
- The button overwrites the current garden — always behind the confirm modal, always gated.

**Effort:** ~½–¾ day. Fixture (~½ day, it's the bulk) + onboarding button + `PendingImport.location` extension + Settings dev button + drift guard. Reusing `confirmImport` is what keeps it small.

### Build order (when we pick this up)

1. `src/data/demoGarden.ts` fixture + `src/lib/demoGarden.ts` (`isDemoEnabled`, `buildDemoImport`, `validateDemoGarden`).
2. Extend `PendingImport` + `confirmImport` with optional `location`; wire the gated onboarding button.
3. Gated Settings `🧪 Utvikler` reload button.
4. Eyeball each box against its "Exercises" column; fix any fixture/feature mismatch.

> **Note:** boxes carry `depthCm` in the table above, but that field doesn't exist on `Box` yet — it arrives with **Increment B**. Until then, seed only `sunExposure` + `bedType`; add the `depthCm` values to the fixture in the same PR that introduces the field, so the shallow-box scenarios become live exactly when B can read them.
