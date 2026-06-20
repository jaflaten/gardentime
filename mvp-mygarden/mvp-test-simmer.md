# MVP Test Simmer — LLM-Gardener Simulation Harness

> Design doc for a locally-runnable test harness where a **local LLM acts as the gardener**, driving the MyGarden app through every life stage across simulated seasons — without waiting for real time or real users. Implementation deferred; this is the plan to build from.

## Context

MyGarden's identity is **calendar / rotation / GDD intelligence**: "hva passer å så nå?", rotation (vekstskifte) warnings, GDD harvest-window prediction, multi-year insights ("Hagen i tall"). Today the only verification is hand-driving the browser with Chrome DevTools MCP — one date, one garden at a time (every "Verified in browser" line in `MVP-next-phases.md`). That doesn't scale: interesting behaviour only appears at specific points in a plant's life — **pre-cultivation → indoor sow → plant-out → growth → harvest → next-season rotation** — across seasons, locations, and garden ages.

**Goal:** a local LLM observes what the app would show, decides, and acts, while a **simulated clock** marches through the gardening year. The harness exercises every life stage, asserts hard correctness invariants, and captures qualitative friction ("what the gardener struggled with / ignored") as product feedback.

**Locked decisions:**
- Target = **`mvp-mygarden/` only** (Vite + React 19 + Zustand + localStorage, client-only). The Next.js/Spring track is out of scope.
- Mode = **headless simulation primary** (real stores + pure libs in Node, simulated clock); **Chrome DevTools MCP browser replay as occasional tier-2**.
- First deliverable = **walking skeleton** (one scenario, one model, full pipeline green) → then expand.
- LLM gardener = **Ollama**: `qwen2.5:32b` for thorough runs, an 8B model (`qwen2.5:7b` / `llama3.1:8b`) for fast iteration.

## Why this is feasible (codebase findings)

The app is unusually well-seamed for headless simulation:
- **Intelligence is in pure libs that already take an injectable "today":** `matchingSowKind / isSowableNow / transplantReadiness(plant, lastFrostDoy, doy = todayDoy())` (`src/lib/sowWindow.ts`), plus `gdd.ts`, `rotation.ts`, `seasonTimeline.ts`, `boxRanking.ts`, `gardenStats.ts`. Callable directly with a simulated `doy`/year — no React, no DOM.
- **Stores are plain Zustand** (`src/store/{useGardenStore,useLocationStore,useCustomPlantsStore}.ts`) persisting through one seam, `src/lib/storage.ts` (`loadBoxes/saveBoxes/loadPlantings/savePlantings`), which only touches `localStorage` — shimmable in Node. Drive them via `useGardenStore.getState().<action>()` (no hook needed).
- **Mutations are the gardener's exact verbs:** `addBox`, `updateBox`, `deleteBox`, `addPlanting`, `updatePlanting`, `deletePlanting`, `markHarvested`. Plant-out = `updatePlanting(id, {boxId, transplantedDate})`; fail/remove = `updatePlanting(id, {status})`.
- **Fixtures to reuse:** `src/resources/demo-garden.json` (Testhage), `src/data/plants.json` (32 tagged plants), `src/data/{frost-normals,postnummer,stations}.json` (real climate).

Only true "now" sources to control: `todayDoy()` in `sowWindow.ts`, and `new Date()` in the store (`addBox` `createdAt`, `markHarvested` default date) and in `planting.ts` / `seasonTimeline.ts` / `gardenStats.ts` (age labels, today-line, current-year filter).

## The one production change: a clock seam

Add `src/lib/clock.ts`:
```ts
let override: number | null = null;            // epoch ms, or null = real time
export function setNow(d: Date | number | null) { override = d == null ? null : +new Date(d); }
export function now(): Date { return override == null ? new Date() : new Date(override); }
```
Replace **"now" reads only** (never parsing of stored ISO strings) with `now()`:
- `src/lib/sowWindow.ts` → `todayDoy()`.
- `src/store/useGardenStore.ts` → `addBox` `createdAt`, `markHarvested` default date.
- `src/lib/planting.ts` (`daysSince`/`plantedAgeLabel` defaults), `src/lib/seasonTimeline.ts` (today line), `src/lib/gardenStats.ts` (current-year filter).

Backward-compatible (defaults to real `new Date()`), ~10–15 mechanical edits, and independently useful (enables a future "time-travel/preview" feature). For the **browser tier**, the harness sets the same override via a CDP/Playwright init script or a `?simNow=ISO` param read in `src/main.tsx`. This single seam makes seasonal simulation possible — everything else is additive code under `sim/`.

## Directory layout (all new, additive)

```
mvp-mygarden/sim/
  runtime/
    localStorage.ts     # in-memory localStorage polyfill
    bootstrap.ts        # install shim -> seed keys -> dynamic-import stores -> reloadFromStorage()
    clock.ts            # SimClock over src/lib/clock.ts: setDate/advanceDays/advanceToNextEvent
  driver/
    actions.ts          # AppDriver: typed facade over the three stores (the gardener's verbs)
    handles.ts          # stable short handles (box "A", planting "#1") <-> nanoid mapping
    schema.ts           # JSON action schema + validation + 32-plant catalog accessor
  observe/
    snapshot.ts         # ObservedGarden from stores + pure libs (mirrors what the UI shows)
    render.ts           # ObservedGarden -> compact text prompt block
    log.ts              # transcript: offered / chosen / ignored / no-op / error / note
  gardener/
    ollama.ts           # Ollama /api/chat client (model, temperature, seed; OLLAMA_HOST)
    agent.ts            # observe -> prompt -> validated action -> apply -> advance loop (+ guardrails)
    persona.ts          # personas/goals
  eval/
    invariants.ts       # hard deterministic assertions
    judge.ts            # optional LLM-judge over the transcript for UX friction
  scenarios/*.scenario.ts
  report/report.ts
  run.ts                # CLI: scenario(s) x model(s) -> report
  replay.ts             # re-apply a recorded transcript deterministically (no LLM)
```
Run the long LLM simulation with **`tsx`**; add **Vitest** (mvp-mygarden has no tests yet) for the invariant/replay regression suite. Both live inside `mvp-mygarden/` to reuse its tsconfig/module resolution.

## Components

### 1. Time controller (`runtime/clock.ts`)
`SimClock` wraps `src/lib/clock.ts`: `setDate(iso)`, `advanceDays(n)`, `advanceToDoy(doy)`, `advanceToNextEvent()`. Derives **seasonal events** from the scenario's resolved location (`lastFrostDoy`/`firstFrostDoy` via `useLocationStore.resolved()`): `last-frost`, `first-frost`, `month-start`, `solstice`. The loop steps by a fixed cadence (e.g. weekly) or jumps event-to-event to keep runs short. **Must support multi-year horizons** (crossing Dec 31 so `year`-derivation and rotation lookback get exercised). Crossing an event is recorded in the transcript.

### 2. AppState driver (`driver/`)
Typed facade translating validated LLM decisions into real store calls (headless, after `bootstrap`):
- `setLocation(postnummer, elevationM?, frostJusteringDays?)`
- `addBox(name, {bedType, sunExposure, depthCm, w, h})`
- `sowIndoor(plantKey, {variety, quantity})` → `addPlanting` with **no `boxId`** (forkultivering seedling)
- `sowOutdoor(boxHandle, plantKey, {variety, quantity})` → `addPlanting` with `boxId`
- `plantOut(plantingHandle, boxHandle)` → `updatePlanting{boxId, transplantedDate: now}` — **preserves `plantedDate`** (Increment K identity continuity)
- `harvest(plantingHandle, {yield})` → `markHarvested`
- `removePlanting(plantingHandle, reason: "removed"|"failed")`
- `addCustomPlant(...)`
- `advanceTime(days)` / `advanceToNextEvent()`

All dates come from the SimClock so `addPlanting`'s derived `year` is correct. **The LLM never sees or emits `nanoid`s** — `handles.ts` exposes stable short handles (box "A/B", planting "#1/#2") and maps them to real ids; invalid handles return a structured validation error, not a throw. Every action is recorded for deterministic replay.

### 3. Observation layer (`observe/`)
`buildSnapshot()` composes the **same pure functions the components call** into an `ObservedGarden`:
- Header: simulated date, season phase, resolved location (station, last/first frost).
- **"Hva passer å så nå?"** groups (Så inne / Så ute / Plant ut / Høst snart) — reuse the sow-window logic over `useMergedPlantList()`.
- Garden: each box (handle, name, bedType, sun, depth, occupancy) + active plantings (plant, variety, age via `plantedAgeLabel`, status).
- Seedling tray: indoor seedlings (`isIndoorSeedling`) + `transplantReadiness` (soon/ready/overdue).
- Harvest-ready: `gddHarvestWindow`/`seasonTimeline` + `harvestRule`.
- Insights: `computeGardenStats` composition + rotation-risk cells (`computeRotationMatrix`).
- **Decision-time signals:** when the gardener proposes a sow, compute the would-be `RotationWarning` + `boxRanking` tier so the prompt carries the same caution the UI would.

`render.ts` serializes to a compact text block. `log.ts` records per step: **offered** (sowable plants, warnings), **chosen**, **ignored** (offered but not acted on), no-ops/errors, and free-text gardener `note`s.

> **Known limitation — observation drift (the main risk).** Some view logic lives in `.tsx` (`SowNowCard`, `GardenInsights`, `Seedlings`), not in pure libs, so a snapshot rebuilt from libs can diverge from what the screen actually renders. **Mitigation:** as harness work, extract that grouping/filtering into pure libs (the app already did this with `seasonTimeline.ts`/`gardenStats.ts` — it's independently good), and rely on the **tier-2 browser pass** to catch whatever stays in the component. The headless tier asserts *logic*; the browser tier asserts *render fidelity*.

### 4. LLM gardener (`gardener/`)
`ollama.ts` calls Ollama `/api/chat` (model + temperature + seed configurable). `agent.ts`: render observation → system prompt (persona + goal + action schema + lean 32-plant catalog: `key`, `name_no`, emoji, category) → model returns a JSON action (or short batch) → validate (invalid → one reprompt with the error) → driver applies → loop until horizon or budget.

**Guardrails:** per-run step budget; no-op/repeated-action detector; a watchdog that forces `advanceTime` if the model hasn't advanced the clock in N actions, so a confused model can't stall the season.

`persona.ts` goals: *eager beginner*, *methodical rotation-conscious veteran*, *forgetful/neglectful*, *maximise-harvest*. Different personas walk different paths through the life stages and surface different friction.

### 5. Scenarios (`scenarios/*.scenario.ts`)
Declarative: `{ seed (boxes/plantings/location/customPlants or a fixture name), startDate, clockPlan (cadence + horizon), persona, model, expectations }`. Initial set covering every life stage:

- **precultivation-windowsill-feb** *(explicit pre-cultivation)* — empty garden, Sogndal `6857`, start **early Feb**. Exercises forkultivering: start heat-lovers (tomat/paprika/chili) indoors with no `boxId`, the seedling tray, `transplantReadiness` soon→ready→overdue as frost approaches, then **plant-out preserving the indoor `plantedDate`**. Verifies seedlings never leak into box views/composition/timeline.
- **first-time-empty-vestland-march** — empty garden, Sogndal, start 1 Mar; full beginner arc: location → indoor sow → plant-out at frost → growth → harvest.
- **direct-sow-vs-transplant** — same crop sown direct outdoors vs pre-cultivated; checks identity continuity + GDD anchor (indoor sow date vs transplant date).
- **midsummer-harvest-rush** — load Testhage, start mid-Jun; harvest + succession + "Høst snart".
- **multi-year-rotation-veteran** — a 3-season garden incl. a **perennial** (jordbær/rabarbra); run a 4th year crossing year boundaries; exercises **vekstskifte** warnings, the boxes×years heatmap, and seasonal perennial harvest windows.
- **cold-station-wont-ripen** — Karasjok/high elevation; won't-ripen notes + greenhouse GDD bonus.

Each scenario is **replayable** (fixed seed + recorded transcript) and reusable across models.

### 6. Evaluation (`eval/`)
**Hard invariants** (`invariants.ts`, deterministic — catch real bugs):
- No planting in two boxes; `harvestDate >= plantedDate`; `year === year(plantedDate)`.
- Indoor seedlings (`!boxId`) never appear in any box view / composition donut / timeline lane.
- Export→import round-trips state identically (reuse `isPlantingLike` + the import path in `src/pages/Settings.tsx`).
- Rotation warning fires iff a family repeats in a box within `ROTATION_LOOKBACK_YEARS`.
- Won't-ripen crops flagged when the GDD model says so; greenhouse cover factor lowers harvest DOY.
- **No store action / lib throws or produces NaN dates** — LLM-generated weird-but-valid sequences make this a lightweight **fuzzer** for the pure libs.

**Soft friction** (`judge.ts`, optional LLM-judge over the transcript): did the gardener ignore a clear recommendation, act confused, hit a dead-end, or write a struggle `note`? Output = ranked qualitative findings → product feedback, not pass/fail.

### 7. Runner & reporting (`run.ts`, `report.ts`, `replay.ts`)
CLI: `tsx sim/run.ts --scenario all --model qwen2.5:7b`. Runs scenario(s) × model(s); collects transcript + invariant results + friction notes; writes markdown + JSON under `sim/report/out/`. `replay.ts` re-applies a saved transcript with **no LLM** for fast deterministic CI regression (Vitest wraps invariants over replays). **Replay determinism does not depend on the LLM** — it replays recorded actions, so Ollama non-determinism is irrelevant to the regression layer. The LLM is the *generator* of interesting sequences; once recorded, they become the cheap replayable suite — the flywheel.

## Build order

**Milestone 1 — walking skeleton (de-risks the whole design):**
1. `src/lib/clock.ts` + wire `todayDoy()` and the store's two `new Date()` "now" reads.
2. `runtime/localStorage.ts` + `bootstrap.ts` (shim-before-import via dynamic store import); confirm stores load/seed/mutate in Node.
3. Minimal `driver` (setLocation, addBox, sowIndoor, sowOutdoor, plantOut, harvest, advanceTime) + handles + schema.
4. Minimal `observe` (snapshot + text render + log).
5. `gardener/ollama.ts` + `agent.ts` against **one** model, with guardrails.
6. **One** scenario (`precultivation-windowsill-feb`) + ~4 invariants + friction log.
7. `run.ts` produces a report. **Green = design validated.**

**Milestone 2 — breadth:** remaining clock-seam sites; full driver (custom plants, remove/fail, events); full observation (insights + decision-time warnings); all 6 scenarios; full invariant set; Vitest + `replay.ts` regression.

**Milestone 3 — depth & feedback:** personas; LLM-judge; 8B-vs-32B coverage comparison; Chrome DevTools MCP tier-2 — replay one recorded transcript per scenario in the real UI via `?simNow=`, assert rendered SowNowCard/insights match the headless snapshot.

## Rubberduck — holes found and resolved

| # | Concern | Resolution |
|---|---------|-----------|
| 1 | Pre-cultivation only smuggled into other scenarios | Added dedicated `precultivation-windowsill-feb`, and it's the walking-skeleton scenario |
| 2 | Observation drift (view logic in `.tsx`, not libs) | Extract grouping to pure libs (as the app already does) + tier-2 browser fidelity check; documented as the main known limitation |
| 3 | LLM emitting opaque `nanoid`s is error-prone | `handles.ts` — stable short handles ("A", "#1") mapped to ids; LLM never sees nanoids |
| 4 | localStorage shim must exist before store module-init | `bootstrap.ts` installs shim, then **dynamic-imports** the stores; reuse `reloadFromStorage()` |
| 5 | Confused model could stall the season | Step budget + no-op/repeat detector + force-advance watchdog |
| 6 | Ollama isn't deterministic → flaky regression? | Regression replays **recorded actions**, not the LLM; non-determinism irrelevant. Bonus: LLM sequences fuzz the pure libs |
| 7 | Multi-year / perennials under-covered | `multi-year-rotation-veteran` crosses year boundaries and includes a perennial + seasonal harvest window |

## Critical files

- **Change (clock seam):** `src/lib/clock.ts` (new), `src/lib/sowWindow.ts`, `src/store/useGardenStore.ts`, `src/lib/planting.ts`, `src/lib/seasonTimeline.ts`, `src/lib/gardenStats.ts`, `src/main.tsx` (read `?simNow=`).
- **Reuse (read, don't duplicate):** `src/lib/storage.ts`, the three stores, `src/lib/{gdd,rotation,boxRanking,sowMethod,planting}.ts`, `useMergedPlantList`/`usePlantLookup`, `src/data/*.json`, `src/resources/demo-garden.json`, the `isPlantingLike`/import path in `src/pages/Settings.tsx`.
- **New:** everything under `mvp-mygarden/sim/`.

## Verification

1. `tsc -b` + `eslint` + `vite build` stay clean after the clock seam (project standard gate).
2. **Headless smoke:** `tsx sim/run.ts --scenario precultivation-windowsill-feb --model <8B>` runs to horizon, writes a report, invariants pass, transcript shows the pre-cultivation → plant-out → growth → harvest arc.
3. **Determinism:** `tsx sim/replay.ts <transcript>` reproduces identical final state; Vitest over recorded transcripts is green.
4. **Tier-2 fidelity:** load the same recorded scenario in the browser via `?simNow=` (Chrome DevTools MCP); confirm rendered SowNowCard groups + Hagen-i-tall figures match the headless snapshot for ≥1 scenario.
5. Run a scenario with `qwen2.5:32b` vs the 8B model; report shows both completed and lists invariant/friction differences.

## Out of scope / deferred

- The Next.js + Spring Boot track.
- Pixel/CSS regression (covered ad hoc by tier-2, not asserted).
- Auto-tuning plant GDD/sow metadata from sim results (the sim *reports*; calibration stays a human decision — "show the data, not prescriptions").
- Per the working rule in `MVP-next-phases.md`, add a section there when this lands.
