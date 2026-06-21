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

### A2. No caution when planting a frost-tender seedling out *before* last frost — ✅ DONE (2026-06-21)
The eager-beginner planted a tomato out on **2026-03-08 (doy 67)** in Sogndal, where last frost is
**doy 114** — ~6 weeks early, and the app's "Plant ut" group hadn't offered it. The driver allowed it
(as the real UI would — it's a button on the seedling). **Shipped:** explicit `frostTender` flag on the
catalog (10 warm-season crops) + pure `frostTenderPlantOutCaution()` in `sowWindow.ts`; a soft amber
caution in the `SowBoxPicker` "Plant ut" flow; mirrored in the sim (`ObservedSeedling.frostRisk`, the
gardener's `warnings`, and the driver's plant-out note). Mirrors the rotation/won't-ripen cautions.

### A3. GDD model flags `løk` and `purre` as "won't ripen" in Alta *(calibration question)*
In the cold-station scenario, onion and leek are flagged *modner ikke ute her*. Onions/leeks **are**
grown in Finnmark (harvested immature, as salad onion, or overwintered), so this may be an over-strict
GDD threshold for alliums whose edible part doesn't need full maturity. Not necessarily a bug — but a
concrete data point for whoever calibrates `gddToMaturity`/`gddBase` per crop. (Heat-lovers like tomat/
paprika flagging won't-ripen there is correct.)

### A5. `set_location` dead-ends on a missing postnummer, and the model can't recover *(2026-06-21)*
In `first-time-empty-vestland-march` the eager-beginner kept calling `set_location` with postnummer
**4065** — which **isn't in the 5132-entry dataset** (4063/4068/4070 are, 4065 is a real-looking gap) —
got `did not resolve to a station`, and **fixated: 48 steps, 48 errors, 0 plants, watchdog force-advanced
8×**, season ended empty. The judge flagged it: *"ignored a clear error and kept doing invalid actions."*
Two angles, both worth a look:
- **Product:** postnummer **coverage gaps** are real (4065 looks valid but resolves to nothing), and the
  error message *"did not resolve to a station"* offers no recovery path. A real user typing 4065 hits the
  same wall. Consider nearest-postnummer fallback (4065 → 4063/4068) or a "fant ikke — prøv et nærliggende
  postnummer" hint. Surfaced now via the new `Sesongresultat` block (sådd 0, høstet 0 = nothing happened).
- **Harness:** a stuck model retrying the same failing action is the watchdog's job, but 48/48 errored is a
  signal the system prompt should tell the gardener to *try a different value* after a `set_location` failure
  (and scenarios that gate everything behind location could pre-seed it, like the others do).

### A4. Confirmed-good behaviour (no action needed, but worth knowing it works)
- Identity continuity holds everywhere: indoor `plantedDate` preserved through plant-out, `year` never
  drifts, no NaN/throws across any run (the LLM's weird sequences fuzzed the libs clean).
- The methodical veteran **saw and avoided** the baked-in "solanaceae 3 år på rad" rotation warning.
- Rotation flags are sound (no false positives); perennials (jordbær) never flagged.

---

## B. Harness gaps — what needs improving

> **Status (2026-06-21): B1–B5 addressed in code.** The only remaining piece is the *operational* re-run
> of `--judge` on local Ollama to see the prompt changes take effect — the existing 6 judged runs are
> already collated into `report/out/FRICTION.md`.

### B1. The qualitative layer is thin — `note` is never used, judge runs on ~nothing — ✅ DONE
- Added a light `note`-nudge line to the gardener system prompt (encourage a note when something is
  unclear/missing/surprising). Prompt-only — re-run on Ollama to measure the effect.
- New `sim/report/friction-summary.ts` collates every report's `--judge` friction into
  `report/out/FRICTION.md` (currently **29 findings from 6 judged runs**, so the judge already survives
  the long transcripts). Run `--scenario all --judge` then this script after any fresh batch.

### B2. `addCustomPlant` was never implemented — ✅ DONE
Added the `add_custom_plant` driver verb (`schema.ts` validation + `actions.ts` → `useCustomPlantsStore.addPlant`);
the generated key is surfaced via the new `ObservedGarden.customPlants` section in `render.ts` so the
gardener can sow what it just created. Exercises the custom-plant merge into the sow-window/catalog logic.

### B3. Observation drift is real and unverified — ✅ DONE (browser pass = manual step)
- Extracted the SowNowCard grouping logic into the shared pure lib `src/lib/sowNowGroups.ts`
  (`groupSowNow`/`groupSuccession`/`harvestSoonForPlanting`/`groupHarvestSoon`); both `SowNowCard.tsx`
  and `sim/observe/snapshot.ts` now build sow-now + harvest-soon from the *same* functions, so they can't
  diverge (the snapshot previously computed harvest-soon a different way than the screen).
- Added `sim/browser-fidelity.ts` — the tier-2 pass: emits the exact `gt_*` localStorage + expected card
  contents for a fixture, and a `check` mode diffs the scraped DOM (`?simNow=` + Chrome DevTools MCP)
  against the headless snapshot. *Remaining (manual):* run the live browser scrape for a scenario.
- *Still inline (minor):* GardenInsights' `groupMaturity` is already pure; `Seedlings` has no complex
  grouping; the "Suksesjon" group is on screen but not yet mirrored in the snapshot.

### B4. Plant-key vs. handle confusion in the prompt — ✅ DONE
Sharpened the *Regler* in the gardener system prompt to explicitly separate a catalog **key** (used in
`plant`/`sow` fields) from a **handle** (`#1`/`A` for the gardener's own plantings/boxes), stating "never
use a handle in the plant field" outright. Validation already caught these; this cuts the reprompt rate.

### B5. Only the precultivation transcript is frozen as a regression fixture — ✅ DONE
Froze the 5 remaining scenarios as replay fixtures under `sim/__tests__/fixtures/` (each verified green
via `sim/replay.ts` first) and made `replay-determinism.test.ts` table-driven over all 6 — `npm test` now
guards every scenario's determinism + invariants.

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

Original plan — **A2 + B1–B5 shipped 2026-06-21** (see the ✅ markers above). What's left:

1. ~~Run `--judge` across all 6 scenarios (B1)~~ — collated into `report/out/FRICTION.md`. *Remaining:*
   re-run on Ollama so the new note-nudge prompt takes effect, then re-collate.
2. ~~Close observation drift (B3)~~ — grouping extracted to `sowNowGroups.ts`; `browser-fidelity.ts`
   wired. *Remaining (manual):* the live browser scrape for ≥1 scenario.
3. **Decide on A1 (harvest CTA)** and **A3 (allium GDD calibration)** — both concrete, both one-look
   human decisions. *(Not yet done.)*
4. ~~Add `addCustomPlant` (B2)~~ done. *Remaining:* the export/import and GDD-anchor invariants (C).
5. ~~Freeze the remaining scenarios as regression fixtures (B5)~~ done (all 6 frozen + table-driven test).
