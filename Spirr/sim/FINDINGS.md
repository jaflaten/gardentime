# Test Simmer — findings & next steps

What the first runs of the LLM-gardener harness revealed. Two buckets: **(A) signals about the Spirr
product/model** and **(B) gaps in the harness itself**. Grounded in the 7 runs under `sim/report/out/`
(6 scenarios on `qwen2.5:7b`, precultivation also on `qwen2.5:32b`), 2026-06-21.

> Framing (per the design doc's "show the data, not prescriptions"): the sim **reports**; whether a
> signal is a real product bug or just model behaviour is a human call. Flagged accordingly below.

---

## A. Product / app signals

### A1. Under-harvesting is systemic — the "Høst snart" nudge isn't compelling enough *(med confidence)*
Harvests vs. harvest-soon signals offered, across runs:

| scenario | model | harvests / signals |
|---|---|---|
| midsummer-harvest-rush | 7b | **1 / 37** |
| multi-year-rotation | 7b | **1 / 42** |
| direct-sow-vs-transplant | 7b | 3 / 14 |
| precultivation | 7b | 1 / 7 |
| precultivation | **32b** | **11 / 33** |

Every persona under-harvests relative to what the app surfaces — even the *maximise-harvest* persona at
midsummer harvested once against 37 prompts. 32B harvests far more (11) than 7B (1), so part of this is
model capability — but the gap is wide and consistent enough to suspect the **harvest CTA reads as
informational, not actionable**. Worth a UX look: does "Høst snart" tell the user *to do something*?

### A2. No caution when planting a frost-tender seedling out *before* last frost *(low confidence / product idea)*
The eager-beginner planted a tomato out on **2026-03-08 (doy 67)** in Sogndal, where last frost is
**doy 114** — ~6 weeks early, and the app's "Plant ut" group hadn't offered it. The driver allowed it
(as the real UI would — it's a button on the seedling). **Idea:** a soft caution at plant-out time when
`doy < lastFrostDoy` for a frost-tender crop, mirroring the existing rotation/won't-ripen cautions.

### A3. GDD model flags `løk` and `purre` as "won't ripen" in Alta *(calibration question)*
In the cold-station scenario, onion and leek are flagged *modner ikke ute her*. Onions/leeks **are**
grown in Finnmark (harvested immature, as salad onion, or overwintered), so this may be an over-strict
GDD threshold for alliums whose edible part doesn't need full maturity. Not necessarily a bug — but a
concrete data point for whoever calibrates `gddToMaturity`/`gddBase` per crop. (Heat-lovers like tomat/
paprika flagging won't-ripen there is correct.)

### A4. Confirmed-good behaviour (no action needed, but worth knowing it works)
- Identity continuity holds everywhere: indoor `plantedDate` preserved through plant-out, `year` never
  drifts, no NaN/throws across any run (the LLM's weird sequences fuzzed the libs clean).
- The methodical veteran **saw and avoided** the baked-in "solanaceae 3 år på rad" rotation warning.
- Rotation flags are sound (no false positives); perennials (jordbær) never flagged.

---

## B. Harness gaps — what needs improving

### B1. The qualitative layer is thin — `note` is never used, judge runs on ~nothing *(highest priority)*
- Across all 7 runs the gardener used the `note` verb **0 times**, so the design doc's "gardener wrote a
  struggle note" friction signal is never captured. Either prompt the model to note confusion explicitly,
  or accept that friction comes only from the judge.
- The **LLM-judge is opt-in and was only run on one scenario** (multi-year, which returned 0 — it was a
  clean run). The judge *does* work (a manual run on the precultivation transcript produced 6 findings
  incl. the A2 early plant-out), but it needs to run across **all** scenarios to populate the qualitative
  layer. It also timed out on long transcripts until bounded with `num_predict` — verify it now survives
  the 59-action precultivation run before trusting it in CI.

### B2. `addCustomPlant` was never implemented *(coverage gap vs. the design doc)*
The driver/schema has no `add_custom_plant` action — the gardener can't create custom plants (it only
*observes* the one seeded in demo-garden). The design doc lists `addCustomPlant(...)` as a driver verb.
Add it so the custom-plant path (and its merge into the sow-window/catalog logic) gets exercised.

### B3. Observation drift is real and unverified *(the main known risk — confirmed)*
Finding the won't-ripen gap (crops with no harvest window were invisible to the gardener) is proof this
class of bug exists: the snapshot is rebuilt from libs, not the actual `.tsx` render. Two follow-ups:
- Extract the remaining grouping logic from `SowNowCard`/`GardenInsights`/`Seedlings` into pure libs so
  the snapshot can't diverge from the screen.
- Wire the **tier-2 browser pass** (`?simNow=` + Chrome DevTools) to assert the rendered cards match the
  headless snapshot for ≥1 scenario. Nothing currently checks render fidelity.

### B4. Plant-key vs. handle confusion in the prompt *(minor)*
The model occasionally passed a planting handle (`#17`) or a typo (`rossmarin`, `hpg4`) into the `plant`
field. Validation caught all of them (structured error, recoverable), but the system prompt could more
sharply separate "plant **key** from the catalog" from "**handle** like #1/A".

### B5. Only the precultivation transcript is frozen as a regression fixture
The replay/Vitest determinism test covers one scenario. The other 5 (esp. multi-year rotation and
cold-station, which exercise the most logic) should each be frozen as a committed fixture so a lib change
that breaks them is caught by `npm test`.

---

## C. What else we should test

**Invariants not yet built:**
- **Export → import round-trip** identical (reuse `isPlantingLike` + the Settings import path). Listed in
  the design doc, not yet implemented.
- **Direct-vs-transplant GDD anchor**: the scenario now *seeds* the pair, but nothing asserts the two
  anchors actually differ (sow date vs. transplant date) and produce different predicted harvest DOYs.
- **Greenhouse cover factor lowers harvest DOY** vs. the same crop in the open (cold-station seeds both
  beds but doesn't assert the delta).
- **Succession**: re-sow interval crops (salat/reddik) — no invariant checks the succession cadence.

**Coverage breadth:**
- **Persona × scenario matrix** — personas exist but only each scenario's default runs. Run the
  forgetful/maximise personas through the same scenarios to surface different friction.
- **More models** — only qwen2.5 tested. llama3.1:8b is mentioned in the doc; worth one comparison run.
- **Watchdog stalls**: the gardener triggered forced-advances 3× in precultivation (both models) — it
  sometimes acts without advancing. Tune the prompt or accept the watchdog backstop, but track the rate.
- **Failure/removal paths**: `remove_planting` fired only 5× total; deliberately exercise the
  failed→replant-same-family→rotation-warning sequence (a real user flow).

---

## D. Suggested priority order

1. **Run `--judge` across all 6 scenarios** and read the friction findings (B1) — cheapest way to turn
   the runs into product feedback. Verify the judge survives the longest transcript first.
2. **Close observation drift** (B3): extract SowNowCard/GardenInsights grouping to pure libs, then add the
   tier-2 browser fidelity check. This is the harness's biggest correctness risk.
3. **Decide on A1 (harvest CTA)** and **A3 (allium GDD calibration)** — both are concrete, both are
   one-look human decisions.
4. Add `addCustomPlant` (B2) + the export/import and GDD-anchor invariants (C).
5. Freeze the remaining scenarios as regression fixtures (B5).
