# MyGarden — Next Phases Planned

## Status

**Shipped:**
- MVP v1 — garden grid, box CRUD, plantings, history, mobile pinch-zoom
- MVP v2 (test-user readiness) — onboarding choice screen, reset garden, one-step layout undo, view-only share mode, "Sist lagret" badge, configurable grid size, import preview modal
- Phase A — plant `family` metadata + "Forrige sesong" hint on add-planting + family chip on planting rows
- Bullet 6 — `sunExposure` + `bedType` on `Box`, inline edit on BoxDetail
- Phase B — NYLIG BRUKT pinned in PlantPicker, long-press quick-add gesture, always-visible "+" badge on every tile, bottom-sheet QuickAdd
- Phase C — user-extensible plant DB (custom plants persisted in `gt_custom_plants`, merged into picker + lookup, Egne planter section in Settings, Export/Import round-trips them with `version: 2`)
- Cleanup — DinoGarden import surfaces removed (Settings + onboarding), legacy importer module deleted

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

**Ship this first.** D2 and D3 should be re-planned only after D1 is in real users' hands. The hard part — and the highest-risk piece — is the build pipeline; the UI on top is thin.

**Data shipped with the app (precomputed at build time, no runtime API calls):**
- `postnummer.json` (~4 500 entries) — `{ postnummer, kommune, fylke, centroidLat, centroidLon, centroidElevationM, stationId }`
- `frost-normals.json` — `{ key, lastFrostDoy, firstFrostDoy, gdd5 }` keyed by station or seNorge 1km grid cell (decided at pipeline time — prefer the seNorge gridded source since it terrain-follows and handles elevation natively)
- `stations.json` — `{ id, name, lat, lon, elevationM }` for the trust line in UI (*"vi bruker Sogndal–Selsenghaugen, 287 moh"*)

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

**Open question — elevation within one postnummer.** Postal centroid misses microclimate. Sogndal `6857` covers fjord-level fruit-growing zones *and* 300+ m hillside gardens that are ~2°C colder with ~3–4 weeks shorter growing season. Two-pronged fix:
- Manual elevation override in Settings (covers the user's own case today).
- seNorge 1km gridded data terrain-follows, so re-sampling at the user's `(lat, lon, elevation)` is more accurate than lapse-rate correction from the centroid.

Address-level lookup (yr.no-style locale name → lat/lon/elevation) is a future enhancement, not D1.

**Explicitly out of scope for D1:**
- Calendar UI ("Hva passer å så nå?" card) → D2
- Variety tracking → D3
- Day-length adjustment for high latitudes → deferred, revisit if Tromsø-area testers ask
- GPS auto-detect → deferred
- Address-level granularity (yr.no-style) → deferred
- Sweden/Denmark UI → deferred (data model already multi-region)

### D2 — "Hva passer å så nå?" card

**Re-plan after D1 ships and gets real use.** Current sketch:
- New dismissable card on the garden map.
- Filters bundled + custom plants against today + user's location.
- Groups by action: *Så inne* / *Så ute* / *Plant ut* / *Høst snart*.
- Each row links to add-planting prefilled with that plant.

Things that may shift based on D1 feedback: whether national-fallback users see this card at all (vs. a "legg inn postnummer" prompt), how aggressive the time windows are (NLR vs. Hageselskapet define them differently), whether the trust line repeats per card.

### D3 — Variety tracking (independent)

Cheap, ship anytime — can land before, during, or after D1/D2:
- Optional `variety?: string` on `Planting` (Sungold / Roma / Beefsteak).
- Surface in PlantPicker and on history rows.
- No dependency on D1 or D2.

### Sources

- [Frost API (frost.met.no)](https://frost.met.no/) — REST API for per-station MET data, free with client credentials, returns `"license": "CC BY 3.0 NO"` directly in every response
- [seNorge_2018 gridded datasets (Lussana et al., 2019)](https://essd.copernicus.org/articles/11/1531/2019/) — 1 km gridded daily Tmin/Tmax/Tmean over Norway, 1957→present; the right source for elevation-aware frost-date derivation
- [MET report 05/2021 — Free Norwegian standard climate normals 1991–2020](https://www.met.no/kss/_/attachment/download/5a8e178e-48b0-4b5a-8410-8628804299f8:3ac4fec6cf3fb7919aefe42db2b63ad8e8b9e6a6/METreport%2005_2021_New_Norwegian_standard_climate_normals_1991_2020-signert.pdf) — what MET publishes as normals
- [MET report 9/2025 — Frost i vekstsesongen](https://www.met.no/publikasjoner/met-report/_/attachment/inline/6a85d48d-c7d0-4014-9c17-64842d1392df:692b728eab7afabde90b851ecff442cd2879bc05/MET%20rapport%209_2025%20-%20Frost%20i%20vekstsesong,%20KiN%20bakgrunnsrapport.pdf) — MET's 2025 analysis of growing-season frost, useful for definitions
- [frostr R package](https://cran.r-project.org/web/packages/frostr/frostr.pdf) — third-party client showing Frost API element model in practice
- [Norsk Klimaservicesenter (seklima)](https://seklima.met.no/) — interactive frontend over the same data, useful for cross-checks
- Bring/Posten open postnummer dataset — source for `postnummer.json`

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

Note from user: I had an idea that could perhaps add some interesting graphs and visuals at some points to see how the garden is doing, what we have planted, status of boxes etc. Perhaps we could make some interesting visuals, even the calendar features might have interesting data that we could visualize. We need to discuss and plan this further. 
---

## Phases NOT planned (yet)

Explicitly deferred:

- **Multi-language UI beyond plant names.** App chrome stays Norwegian-only by design. Polish toggle only swaps plant labels.
- **ML-driven yield prediction.** Too brittle without years of personal data.
- **Social features.** Sharing gardens publicly, plant trading, community feeds — not part of the gardening-tool identity.
- **Native mobile app.** PWA is enough. If iOS/Android wraps become valuable, Capacitor over the existing web app — not a rewrite.

---

## What to ship next (recommendation)

**Phase D1 (location + frost-relative data model) is the highest-leverage next step.** It:

- Establishes the *"this app knows my conditions"* moment that defines the product against international competitors.
- Builds on Phase A's `family` data and extends `PlantInfo` with one more (portable, frost-relative) metadata layer.
- Ships the only piece D2 truly depends on; D2 then becomes a thin UI on top.
- Does not depend on Phase H (offline lookup tables, no backend required).

The build-pipeline step (postnummer + seNorge → frost normals) is the riskiest part. Ship that first, then layer D2's *"Hva passer å så nå?"* card on top once real users confirm the dates feel right.

**D3 (variety tracking) is independent** and can ship before, during, or after D1/D2. ~1 day of work; land it whenever it fits.

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
