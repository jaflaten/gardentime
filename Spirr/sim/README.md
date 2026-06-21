# Spirr Test Simmer — LLM-gardener simulation harness

A local LLM (Ollama) plays the **gardener** and drives the real Spirr stores/libs through every life
stage across a simulated season — headless, in Node, in seconds. Hard invariants catch bugs; an
optional LLM-judge surfaces UX friction. Design doc: [`../mvp-test-simmer.md`](../mvp-test-simmer.md).

## Run

```bash
# one scenario, one model
npm run sim -- --scenario precultivation-windowsill-feb --model qwen2.5:7b

# all scenarios × two models, with the qualitative LLM-judge
npm run sim -- --scenario all --model qwen2.5:7b,qwen2.5:32b --judge

# deterministic replay of a recorded run (no LLM) + invariant check
npm run sim:replay -- sim/report/out/<run>.json

# regression suite (clock seam units + replay determinism) — no LLM needed
npm test
```

Flags: `--scenario <key|all|a,b>` · `--model <m|m1,m2>` · `--persona <key>` · `--max-steps N` ·
`--temperature T` · `--seed N` · `--judge`. Reports land in `sim/report/out/` (gitignored).

Requires Ollama running (`ollama serve`) with the model pulled (`ollama pull qwen2.5:7b`).
Override the host with `OLLAMA_HOST`.

## How it fits together

```
run.ts ─┬─ runtime/   bootstrap real stores in Node (localStorage shim) + SimClock over src/lib/clock.ts
        ├─ driver/    AppDriver: validated JSON action → real store call; short handles (A, #1), never nanoids
        ├─ observe/   ObservedGarden rebuilt from the SAME pure libs the UI calls → compact prompt + transcript
        ├─ gardener/  Ollama client + agent loop (observe→prompt→validate→apply→advance) + guardrails + personas
        ├─ eval/      hard invariants (the gate) + optional LLM-judge (friction)
        ├─ scenarios/ declarative seed + clock plan + persona + horizon
        └─ report/    markdown + JSON; replay.ts re-applies recorded actions deterministically
```

## The one production change

`src/lib/clock.ts` (`setNow`/`now`) is the only app change — the four real "now"-reads route through
it (`todayDoy`, `addBox.createdAt`, `markHarvested` default, `daysSince`/`computeGardenStats` defaults).
Backward-compatible (defaults to real time); the browser tier sets it via `?simNow=ISO` in `main.tsx`.

## Adding a scenario

Create `scenarios/<key>.scenario.ts` exporting a `Scenario` (seed/startDate/endDate/persona/horizon),
register it in `scenarios/index.ts`. Seed an empty garden, a fixture (`demo-garden.json`), or inline
boxes/plantings. Pre-seeded entities get handles automatically (`seedHandlesFromState`).

## Notes / gotchas

- **Shim before stores:** `runtime/install.ts` must be the first import (some libs init a store at
  module-load via `seasonTimeline → plants.ts`). Node 25 ships a built-in `localStorage` accessor that
  the shim overrides via `defineProperty`.
- **Replay determinism** doesn't depend on the LLM — handles are assigned by creation order, so the same
  recorded action sequence reproduces identical normalized state regardless of nanoid values.
- **Known limitation:** some view grouping still lives in `.tsx` (SowNowCard/GardenInsights), so the
  headless snapshot can drift from the real render. The headless tier asserts *logic*; a future tier-2
  browser pass (`?simNow=`) asserts render fidelity.
