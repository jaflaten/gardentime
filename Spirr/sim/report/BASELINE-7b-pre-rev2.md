# Baseline (qwen2.5:7b, pre-Revision-2) — 2026-06-21 night

Current single-action loop, current config (Oct horizons, maxSteps 70–80). Captured before the
visit-loop + salience + metric changes, as the before/after reference for the harvest goal.

| scenario | sown | plantedOut | harvested | everRipe | ripeUnharvested@end | notes |
|---|---|---|---|---|---|---|
| precultivation | 9 | 3 | 0 | 1 | 0 | 6 seedlings stranded indoors (link-2 leak) |
| first-time-empty | 0 | 0 | 0 | 0 | 0 | 48/48 errors — postnummer 4065 dead-end (A5) |
| multi-year-rotation | 7 | 6 | 1 | 9 | 0 | ❌ invariant: transplantedDate < plantedDate (seeded future-dated seedling planted out early) |
| direct-sow-vs-transplant | 2 | 1 | 1 | 2 | 0 | |
| midsummer-harvest-rush | 2 | 2 | 1 | 7 | 2 | established garden, 7 ripe but only 1 harvested |
| cold-station | 3 | 1 | 0 | 1 | 0 | low harvest partly correct (won't-ripen) |

**Aggregate: 20 crops ever ripe, 3 harvested (~15%).** Runs reach the Oct horizon (maturation is no
longer the blocker) — the leak is sow→plant-out (over-sow indoors, strand seedlings) and ripe→harvest
(handle confusion: model harvests the wrong/already-harvested handle; ready signal re-shown for months,
ignored).

Reports archived in `sim/report/out-stale-archive/` (the prior, even-shorter runs).
