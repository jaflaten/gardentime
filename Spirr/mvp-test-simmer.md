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

---

## Revision 2 — closing the harvest gap (2026-06-21, night session)

> **STATUS: IMPLEMENTED & VALIDATED 2026-06-22.** All three changes (visit loop, salience, north-star
> metric) shipped; `tsc` + `eslint` clean, `npm test` 49 green, 6 fixtures re-frozen. 7b harvest-of-ripe
> ~15% → 100% (total harvests 3 → 33); 32b precultivation 100%/100%. Results + remaining gaps in
> `sim/FINDINGS.md` → "Revision 2". The one tried-and-rejected extension (tray-pressure suppression) and the
> still-open link-2 (plant-out) leak are documented there. The sections below are the as-built record.

> The harness is built and green; the open problem from `sim/FINDINGS.md` A1 is that **the LLM
> gardener under-harvests systemically** — it rarely harvests the plants it plants. This revision
> reasons that problem down to fundamentals and redesigns the agent loop around it. North star:
> **the gardener should harvest most of what it plants.**

### What the baseline actually shows (current config, qwen2.5:7b)
With the Oct horizons + `maxSteps 70–80` now in place, runs **do complete the season** (precultivation
reached 2026-10-30, 15 advances). So "the run ends before crops mature" is *fixed* — yet harvest is still
near-zero. precultivation 7b: **sowed 9 · planted out 3 · 1 ever ripe · 0 harvested.** The chain leaks at
*every* link, not just the last one.

### First-principles: a harvest requires an unbroken 4-link chain
1. **Sow** a crop.
2. **Plant out** the seedling into a bed (indoor seedlings never ripen — they're not in the ground).
3. **Ripen** — time must advance to maturity *and* the crop must be able to ripen in this location.
4. **Harvest** — the gardener sees "moden" and acts on it.

Mapping the baseline leak to links:
- **Link 2 leak (the biggest surprise):** sowed 9 indoor, planted out only 3 → **6 seedlings stranded
  in the tray forever.** The gardener over-sows indoors and forgets to plant out.
- **Link 3 leak:** of 3 planted out, only 1 ripened — partly correct (cold Sogndal won't ripen heat-lovers),
  partly mistiming.
- **Link 4 leak:** 1 ripe, 0 harvested — the A1 salience problem (the "Høst snart" CTA reads as info, not a verb).
- **Hidden tax on all links — the LLM is a bad clock.** The single-action loop forces the model to *also*
  emit `advance_*` to march time; it forgets (watchdog force-advanced), and every advance burns a step from
  the same budget that the real decisions need. Budget and horizon fight each other.

### The redesign: the harness owns the clock; the gardener acts in batches per visit
Delete the LLM's responsibility for time (per the project philosophy — question the requirement, then
subtract). A real gardener never "advances time"; they just open the app on a later day. So:

```
for visitDate in schedule(startDate, endDate):     # harness-owned calendar
    clock.setDate(visitDate)
    snapshot = buildSnapshot()
    actions[] = ask LLM: "what do you do today?" → JSON {"actions":[ ... ]}  (0..N, may be empty)
    for a in actions: driver.apply(a); record       # advance verbs are not offered
    # harness advances to the next visit automatically
```

Why this dissolves three leaks at once:
- **Season always completes** regardless of model quality → crops always reach maturity (link 3 time-half).
- **100% of LLM calls are decisions** (no advance bookkeeping) → more harvests per token; watchdog/stall
  machinery becomes a vestigial safety net, not a load-bearing part.
- **Ripe + ready-to-plant-out crops are re-presented every visit until acted on** → links 2 and 4 stop
  leaking silently; a missed harvest gets another chance next week instead of vanishing.

**Schedule:** weekly cadence is the robust v1 (Feb→Oct ≈ 36 visits ≈ 36–72 LLM calls — comparable cost,
strictly more decisions). Optionally jump-to-next-event while the garden is dormant (winter / nothing
sowable or ripe) to keep visit counts down. Cap total visits + batch size (≤ ~8 actions/visit) as the cost
ceiling, replacing `maxSteps`.

**Batch actions:** the model returns `{"actions":[...]}`; `parseActionReply` already tolerates arrays (it
currently keeps only the first — change it to keep all). Apply sequentially against the live store; a handle
created earlier in a batch is registered immediately so later actions in the same batch can reference it;
invalid actions return the existing structured error and are skipped, not fatal. Empty array = "nothing to
do today" — the legitimate replacement for the old `advance` no-op.

**Backward-compat:** the action schema and `AppDriver` are unchanged (advance verbs stay valid, just not
offered in the visit prompt), so `replay.ts` + the frozen fixtures + determinism tests keep working. Re-freeze
fixtures from new transcripts after the change.

### Salience fixes (link 4, mirrors product finding A1) — independent, ship regardless
- Render the **harvest-ready** and **ready-to-plant-out** sections *first* (right after the header), in
  Norwegian, with an imperative CTA and explicit handles: `🌾 HØST NÅ (moden): #26 tomat_cherry, #12 salat`
  and `🌱 PLANT UT NÅ (klare): #1 tomat`. Translate `ready→moden`, `soon→snart` (no English in a NO prompt).
- System-prompt rule: "Hvis noe står som MODEN, høst det denne turen. Hvis en frøplante er KLAR til
  utplanting, plant den ut." (Acting on these isn't optional bookkeeping; it's the goal.)
- This is *also* a concrete product signal: the same imperative should make the in-app "Høst snart" card an
  actionable CTA (the A1 decision the human owes).

### Measuring it — the north-star metric (`eval/outcome.ts`)
Add a true harvest-rate over gardener-sown crops, computable from the transcript:
- `sownThisRun` → of those, `everRipe` (handle ever shown "moden") → of those, `harvested`.
- **`harvestRate = harvested / everRipe`** (the headline), plus `plantOutRate = plantedOut / sownIndoor`
  (link-2 leak) and `ripeUnharvestedAtEnd` (pure misses). Reported per run + aggregated across the matrix so
  7b-vs-32b and before/after are one glance.

### Fairness note on scenarios
"Harvest what you plant" is only achievable where crops *can* ripen. The clean harvest tests are
**midsummer-harvest-rush** (warm, established Testhage) and **first-time-empty / direct-sow** in milder spots.
cold-station and heat-lovers-in-Sogndal *should* show low harvest (correctly un-ripenable) — judge those on
"did it avoid planting what can't ripen," not on harvest count.

### Build order (this session)
1. ✅ Baseline captured (all scenarios, 7b) for before/after.
2. Harvest-rate metric (`outcome.ts`) — measure first.
3. Visit-loop agent + batch actions; rewire `run.ts`; keep schema/driver stable.
4. Salience (render harvest/plant-out first + NO imperative; prompt rules).
5. `tsc`/`lint`, smoke 1 scenario on 7b, then full 7b run; compare harvest-rate to baseline.
6. 32b on the harvest-critical scenarios; re-freeze fixtures; `vitest` green.
7. Update `FINDINGS.md`, this doc, and `MVP-next-phases.md`.

### Rubberduck — Revision 2 holes
| # | Concern | Resolution |
|---|---------|-----------|
| R1 | Visit-loop is a big swing; could break the green harness | Schema + driver + replay untouched; loop is the only rewrite; re-freeze fixtures; gate on tsc/lint/vitest |
| R2 | Batch handle-staleness (action references a handle made earlier in the same batch) | Apply sequentially; driver registers handles on creation; invalid → structured skip, not fatal |
| R3 | Weekly cadence inflates LLM calls | Comparable to old `maxSteps`; every call now a decision; optional event-jump while dormant; cap visits + batch size |
| R4 | Low harvest might be *correct* (won't-ripen) and look like a regression | Harvest-rate denominator is `everRipe`, so un-ripenable crops don't count against it; judge cold scenarios separately |
| R5 | Forgetful persona *should* under-harvest | Metric is descriptive, never pass/fail; compare across personas/models, don't gate |

### Post-implementation review (read-only agent, 2026-06-22) — no blockers, two should-fixes shipped
A focused adversarial review of the implemented code (loop termination, batch apply, snapshot filter, driver
guards, metric, determinism) found **no state-corrupting or invariant-breaking bugs** and confirmed the
season-completion guarantee (loop exits exactly at the horizon, 36/70 steps). Two should-fixes were applied:
- **S1 (fixed).** The empty-batch reprompt couldn't tell a *valid* `{"actions":[]}` ("nothing to do this
  week") from unparseable junk, so every quiet winter week burned a wasted second LLM call (and falsified
  "100% of calls are decisions"). `parseActionBatch` now returns `{parsed, actions}`; the loop reprompts
  only when `!parsed`.
- **S2 (fixed).** The per-visit cap counted *invalid* actions and could silently drop trailing **harvests**
  if the model front-loaded sows — a muted re-introduction of the under-harvest leak. The loop now
  validates, drops time-verbs/invalids for free, **priority-sorts** (location/box → harvest/plant-out →
  remove → sow) so the goal-critical moves always survive the cap, and logs any truncation.
- **S3 (accepted, documented).** Weekly cadence means a crop first ripening in the final ≤7-day window
  before the horizon is never offered. Inherent to the cadence; in practice 7b still hit 100% harvest-rate,
  so accepted as a known granularity limit rather than adding daily-cadence complexity near season end.

---

## Revision 3 — visit-skip persona: making the harvest-rate metric falsifiable (2026-06-22)

> **STATUS: IMPLEMENTED & VALIDATED 2026-06-22.** `tsc`/`eslint` clean, `npm test` 57 green. Full results +
> reasoning in `sim/FINDINGS.md` → "Revision 3". This is the as-built record.

The Revision-2 adversarial review (`sim/FINDINGS.md` → "Results critique") showed the **100% harvest-rate was
pinned by construction**: a ready crop was always harvested the same visit (so a miss never accrued), and the
harvest window *expires* (so a crop unobserved during its window is an *invisible* miss). Fix (a) from that
critique — a **deterministic visit-skip persona** — is now shipped.

**First principles.** A *recorded* miss needs a crop to be (1) observed ready at least once **and** (2) never
harvested. Because the ready window expires, "just visit less" fails both ways — the window can pass entirely
between visits, unobserved. So the mechanism **splits observation from action**: the harness samples ripeness
**every** calendar week (the `observe` entry feeds `everReady` = ground-truth "ever offerable"), but only
calls the gardener on **attended** weeks. A crop ripe only during an absence is then in `everReady` but never
harvested → a recorded miss. `computeSeasonOutcome` needed **no change** — it already derives `everReady`
from observations and harvests from actions.

**The absence model — a holiday block, not a taper.** A probabilistic season-taper was tried first and stayed
at 100% (the Testhage harvest is front-loaded, so a late taper misses nothing ripe; and 2–3 week windows are
caught on the next attended week after any single skip). The robust model is a **contiguous summer holiday**
(`Persona.attendance = { awayFrom, awayTo }`, mid-Jul → late-Aug): a ~6-week block categorically outlasts any
window, so the miss is **structural and deterministic** (date comparison, no RNG → reproducible across Ollama
noise), and it's realistic — a city-dweller ("Travel byboer") away over the fellesferie. Result on 7b:
**harvest-rate 63% (5/8)**, with erter/agurk/persille stranded by the holiday.

**Build (this session):**
1. `Persona.attendance` + `visit-skip` persona (`gardener/persona.ts`); `shouldAttend` extracted to a
   store-free `gardener/attendance.ts` so it's unit-testable without the localStorage bootstrap.
2. Observe/act split in the visit loop (`gardener/agent.ts`) + `attendedVisits` on the summary, surfaced as
   "oppmøte: N/M uker" in the report and run console.
3. Dedicated `scenarios/neglected-harvest.scenario.ts` (pre-seeded Testhage into early Oct, pinned to the
   persona) + registry entry; frozen fixture `__tests__/fixtures/neglected-harvest-7b.json` in the
   table-driven replay suite; a `shouldAttend` determinism unit test.
4. `eval/outcome.ts` doc-comment clarified (`everReady` is sampled every week, attendance-independent).

**Backward-compatible:** `attendance` is opt-in, so every other persona keeps the unchanged every-week loop
and the 6 existing fixtures replay green. **Open (critique b–e), unchanged by this pass:** side-by-side
harvested/ripe/unripe counts, an explicit `engaged` flag, sow→ripeHarvest as the primary metric.

### Rubberduck — Revision 3 holes
| # | Concern | Resolution |
|---|---------|-----------|
| R1 | "Just visit less" — why insufficient? | The ready window expires; an unobserved window is an *invisible* miss. Observe every week (act only when attended) surfaces it. |
| R2 | Does observing on an absent week distort `everReady`? | It redefines it from "shown to the user" to "ever ripe/offerable" (ground truth) — the honest denominator for "of all that ripened, how much did this absent gardener catch?" |
| R3 | Is sub-100% luck (Ollama noise)? | No — the holiday weeks are fixed dates and a ~6-week block exceeds any 2–3 week window, so crops ripening mid-holiday are stranded structurally; only *which* extend past the return wobbles. |
| R4 | Breaks the green harness? | `attendance` opt-in → other personas' loop path byte-identical; schema/driver/replay untouched; 6 existing fixtures + 57 tests green. |
| R5 | Degenerate empty run (cf. cold-station)? | Scenario is pre-seeded harvest-rich, so `everReady > 0` and the gardener harvests the non-holiday crops — no null/"—" headline. |
