# Test Simmer — findings & next steps

What the first runs of the LLM-gardener harness revealed. Two buckets: **(A) signals about the Spirr
product/model** and **(B) gaps in the harness itself**. Grounded in the 7 runs under `sim/report/out/`
(6 scenarios on `qwen2.5:7b`, precultivation also on `qwen2.5:32b`), 2026-06-21.

> Framing (per the design doc's "show the data, not prescriptions"): the sim **reports**; whether a
> signal is a real product bug or just model behaviour is a human call. Flagged accordingly below.

---

## ⭐ Revision 2 (2026-06-22) — the structural under-harvest is fixed; the "100%" headline is oversold

The visit-loop redesign is a **real structural fix** (the baseline's ~15% harvest-of-ripe was a genuine
failure — seasons often didn't complete and ripe crops were never re-offered; now they are). But an
adversarial review of the *results* (below, "⚠️ Results critique") shows the **"100% in every scenario, both
models" headline is largely a measurement artifact, not proof of gardener skill** — read that section before
quoting the 100% number. The genuinely defensible claim is narrower: *the loop now reliably surfaces ripe
crops and the gardener harvests them same-visit.* See `mvp-test-simmer.md` → "Revision 2" for the design
reasoning. Summary of what shipped:

**Root cause was structural, not just model weakness.** Reasoned the harvest down to a 4-link chain
(sow → plant out → ripen → harvest) and found it leaked at every link. The dominant tax: the old loop made
the LLM *also* march the clock (`advance_*`), so it forgot (watchdog fired), and every advance burned a
turn from the same budget the real decisions needed.

**The fix (shipped):**
1. **Visit loop** (`gardener/agent.ts`) — the harness owns the calendar. It marches weekly visits to the
   horizon and asks the gardener for a *batch* of actions per visit (`{"actions":[…]}`). The gardener never
   advances time. Season always completes → crops always mature; 100% of LLM calls are decisions; ripe
   crops are re-offered every visit. Advance verbs stay valid in the schema (replay/fixtures untouched) but
   aren't offered to the gardener.
2. **Salience** (`observe/render.ts` + prompt) — a `⚡ Gjør først` block leads every observation with
   `🌾 HØST NÅ (moden)` and `🌱 PLANT UT NÅ (klar)` listing the **exact handle** to use; status is Norwegian
   (`moden`/`snart`), and a prompt rule says "harvest ripe crops first, plant out before sowing more."
   Directly addresses the A1 product point: the in-app "Høst snart" card should likewise be an imperative CTA.
3. **North-star metric** (`eval/outcome.ts`) — `harvestRate = ripeHarvested / everRipe` (cumulative
   denominator, so misses are penalised) + `plantOutRate` (the link-2 funnel).

**Results — `qwen2.5:7b`, baseline vs Revision 2** (`sim/report/BASELINE-7b-pre-rev2.md`):

| scenario | harvested (before → after) | harvest-rate after |
|---|---|---|
| precultivation | 0 → 6 | 100% (5/5 ripe) |
| first-time-empty | 0 (48/48 errors) → 2 | 100% (2/2) |
| multi-year-rotation | 1 → 10 | 100% (8/8) |
| direct-sow-vs-transplant | 1 → 6 | 100% (6/6) |
| midsummer-harvest-rush | 1 → 7 | 100% (6/6) |
| cold-station | 0 → 2 | — (0 ripened; correctly low) |

**Total harvests 3 → 33; harvest-rate of ripe crops ~15% → 100%** across every scenario where anything
ripened. All 6 green (baseline had a multi-year invariant failure, see A6). first-time's A5 postnummer
dead-end also cleared (48 errors → 2) via the "try a nearby postnummer on failure" prompt rule.

> Numbers are one representative run; Ollama isn't fully deterministic (a re-run with the final S1/S2 code
> gave 27 total harvests, e.g. multi-year 7 not 10, and one cold-station run where the maximise gardener
> sowed nothing) — but the **harvest-rate of ripe crops is a stable 100%** whenever the gardener engages,
> vs the baseline's ~15%. The rate is the headline; absolute counts wobble run-to-run. The deterministic
> replay/invariant suite is unaffected (it replays recorded actions, not the model).

**`qwen2.5:32b` — full all-6 run confirms it scales to the stronger model** (one clean run, ~10 min/scenario,
**6/6 green**). 32b harvests far more in absolute terms than 7b and barely strands a seedling:

| scenario | 32b harvested | harvest-rate (ripe) | plant-out-rate |
|---|---|---|---|
| precultivation | **20** | 100% (18/18) | 100% (10/10) |
| first-time-empty | **20** | 100% (15/15) | 92% (11/12) |
| multi-year-rotation | **21** | 100% (18/18) | — (pre-seeded) |
| direct-sow-vs-transplant | **12** | 100% (6/6) | 83% (5/6) |
| midsummer-harvest-rush | **10** | 100% (8/8) | — (pre-seeded) |
| cold-station | **14** | 100% (9/9) | 100% (14/14) |

**32b total 97 harvests, harvest-rate 100% in every scenario, all green.** The decisive contrast with 7b is
**link 2 (plant-out)**: 32b runs **83–100%** plant-out on from-scratch gardens (≈0 stranded seedlings), where
7b sits at 50–64%. So the redesign gets *both* models to 100% harvest-of-ripe; closing the harvest-of-*sown*
gap is largely **model capability** (the over-sow leak is a 7B weakness the visit loop alone doesn't fix —
see "the next lever"). (Earlier single clean precultivation-32b run gave 23 harvests / 17-17 plant-out — same
100% story; absolute counts wobble with Ollama non-determinism, the rate doesn't.)

### ⚠️ Results critique (adversarial review, 2026-06-22) — read before quoting "100%"
A read-only adversarial review of the *results* (evidence pulled from the 14 frozen JSON transcripts, no
re-runs) found the 100% headline is **real but structurally near-unfalsifiable, and oversells what was fixed.**
Ranked:

1. **The metric is pinned to 100% by construction (strongest).** `harvestRate = ripeHarvested / everReady`,
   and **`ripeHarvested == everReady` in all 14 runs** (verified). Why: an observation samples "(ready)" at
   visit start, then the gardener harvests it that same visit, and `markHarvested` flips it out of `active` so
   it can never be observed ready again (`snapshot.ts` filters `status==="active"`). To record a *miss* the
   gardener would have to skip a ready crop AND see it still-ready next visit — but the hard "HØST FØRST" CTA
   means it never skips. **Proof it's not a skill measure: the `forgetful` persona also scored 100%** (midsummer
   9/9, multi-year 8/8). A metric that the persona *designed to under-harvest* still maxes out isn't measuring
   harvesting skill — it's measuring "does the loop re-offer ripe crops + does the prompt force a same-visit
   harvest," which is yes-by-design.
2. **Absolute counts are inflated by un-ripe over-harvest, which the rate hides.** `rawHarvested ≫ everReady`
   everywhere (cold-station-32b **14 harvested vs 9 ever-ready**; the 5 extra were "snart moden gresskar"/purre
   — *not* ripe). The driver's `harvest()` has no ripeness guard and no invariant flags it, so unripe harvests
   silently succeed and are excluded from the denominator — they can only flatter the rate (ripe ⊂ harvested).
   So "32b: 97 harvests" overstates *good* harvests (≈21 of those 97 were never flagged ripe). See A7.
3. **The headline ≠ the actual goal.** Goal = "harvest most of what you *plant*." 100% is harvest-of-*ripe*.
   True sow→ripeHarvest yield on from-scratch gardens: **precultivation-7b 29%, first-time-7b 44%,
   precultivation-32b 69%, first-time-32b 62%, direct-sow-32b 38%** — the chain still loses 30–70% of sown
   crops before they ripen (the plant-out leak, "next lever"). That yield, not the ripe-rate, is the honest goal metric.
4. **A degenerate run passes green, and it's a frozen fixture.** `cold-station-7b` did **1 action total**
   (`set_location`), sowed nothing → `harvestRate=null` → rendered "—" → marked green, and **that inert run is
   the frozen regression fixture** (`__tests__/fixtures/cold-station-7b.json` = 1 action, 0 plantings). A
   do-nothing run is indistinguishable in the headline from a legitimately "correctly low" cold garden.
5. **Fair: the improvement is real and the deterministic layer is sound.** Harvest success and the "ready"
   signal are decoupled (no circularity), `npm test` 49 green, all fixtures replay. The gardener genuinely
   harvests crops it's shown — the *loop* is a real fix. It's the *100% framing + the metric* that oversell.

**Fixes recommended ((a) shipped 2026-06-22 — see "Revision 3" below; b–e await direction):** (a) add a
deterministic *visit-skip* persona so `everReady` can finally accumulate a recorded miss → makes the metric
falsifiable; (b) headline `harvested`
vs `ripeHarvested` vs a new `unripeHarvested` side-by-side; (c) replace null/"—" with an explicit
`engaged:false` flag so a do-nothing run can't pass silently, and re-freeze cold-station-7b from a real run;
(d) make sow→ripeHarvest yield the primary number; (e) track "harvested while not flagged ready" (A7).

**Newly surfaced (lower priority):**
- **A6 (harness/product) — ✅ FIXED (2026-06-22).** Baseline multi-year hit `transplantedDate < plantedDate`
  — the model planted out a *pre-seeded, future-dated* seedling (demo-garden's May-2026 seedlings, seen from
  a March start) before its own sow date. Two-part fix: (1) `sim/observe/snapshot.ts` now only surfaces
  plantings whose `plantedDate <= today` (a not-yet-sown planting isn't observable — in the real app "now"
  is the clock so this only corrects the back-dated-fixture case); (2) `AppDriver.plantOut`/`harvest` guard
  `clock < plantedDate` and reject. This is why the Rev2 multi-year run is green where the baseline was red.
  The product think remains: a real UI also shouldn't let you transplant/harvest a seedling before it was sown.
- **B6 (harness).** `plantOutRate` divides gardener `plantedOut` by `sownIndoor`, but `plantedOut` includes
  pre-seeded seedlings → ratios >100% / `/0` in pre-seeded gardens. Only meaningful for from-scratch
  scenarios; treat as `—` otherwise.
- **B7 (harness flake) — ✅ FIXED (2026-06-22).** `custom-plant.test.ts:37` failed ~1 in 5 runs. *Real root
  cause (not store isolation, as first guessed):* the test extracted the created plant's key with
  `/key (custom_\w+)/`, but the key is `custom_${nanoid(8)}` and nanoid's alphabet includes `-`, which `\w`
  excludes — so whenever the random suffix held a `-` (~12%) the regex truncated the key and `findPlant`
  missed. Fixed by matching `custom_[\w-]+`. Green on 18× repeated full runs since. (The interim
  `vitest.config.ts` isolation tweak was reverted — vitest's forks pool already isolates per file, and it
  wasn't the cause.) *Lesson for the harness: never regex-`\w` a nanoid; match `[\w-]` or return the key directly.*

### ⭐ The next lever — harvest-of-*ripe* is solved; harvest-of-*sown* is not *(the real remaining gap)*
The 100% headline is **harvest of what RIPENED**. But the chain still leaks at link 2 (plant-out):
`plantOutRate` is **9/14 = 64%** (precultivation) and **4/8 = 50%** (first-time) on 7b — the gardener keeps
**over-sowing indoors and stranding 1/3–1/2 of its seedlings in the tray**, where they can never ripen or be
harvested. So counted from the *sow*, the literal goal ("harvest most of what they plant") is closer to
**~40%**, not 100%. The salience prompt ("ikke så flere frø enn du planter ut") helps but a 7B model still
over-sows.

**Tried & rejected — tray-pressure suppression (A/B, 2026-06-22).** Hid the "Så inne" menu + added a
"🌱 frøbrett fyller seg, ikke så mer" warning once ≥3 seedlings waited. Result was **net-negative**: it
throttled the whole pipeline instead of just the over-sow. Single-run 7b A/B (Ollama-noisy):

| scenario | without | with suppression |
|---|---|---|
| precultivation | sown 15 · plantet ut 9 · **høstet 6** · plant-out 64% | sown 7 · plantet ut 2 · **høstet 2** · plant-out 40% |
| first-time | sown 10 · plantet ut 4 · **høstet 2** · plant-out 50% | sown 9 · plantet ut 5 · **høstet 4** · plant-out 56% |

Improving the plant-out *ratio* by sowing less is gaming the metric — precultivation's absolute harvest
**halved (6→2)**. Reverted. **Lesson:** don't *suppress* the sow menu; the throughput cost outweighs the
leak. Better next attempts (un-tried): a **warn-only** nudge that keeps the menu, or only fire on `overdue`
seedlings (not a raw count), or cap indoor sows per visit (≤2) rather than gating on tray size — each needs a
multi-run A/B (the single-run signal is too noisy to tune a threshold on). Or accept it as model capability:
32b stranded **0** seedlings unaided (plant-out 17/17), so a stronger gardener closes it on its own.

### A7. Over-eager harvest of un-ripe crops *(behaviour signal, low priority)*
In cold-station the maximise-harvest gardener harvested **bønner + gulrot that were never flagged ripe**
(`høstet 2`, `modne signaler 0`). Not a bug (the app's harvest button is always available; the metric
correctly excludes these from `harvestRate`), but the strong "HØST FØRST" imperative can tip an eager persona
into harvesting before ripeness. Track the raw-`harvested` vs `ripeHarvested` gap; if it widens, soften the
imperative to "høst det som står som MODEN" (only the ready ones).

### B8. The salience nudge dominates persona disposition *(realism caveat for the harness)*
Ran the *forgetful* persona ("travel og glemsom… glemmer ofte å høste") on the two harvest-rich scenarios:
it harvested **100%** of ripe crops (midsummer 9/9, multi-year 8/8) — *more* than the maximise/methodical
defaults (7/7). So the `🌾 HØST NÅ` CTA + "harvest ripe first" rule is strong enough that even a neglectful
gardener clears the board. **Two reads:** (product, positive) a sufficiently imperative harvest CTA gets even
forgetful users to harvest — supports the in-app card redesign. (harness) the harness can no longer model an
under-harvesting user via *persona disposition* — because the harness now owns the clock, "forgetful" is best
modelled as **skipped/sparser visits** (a user who doesn't open the app weekly), not a gardener who sees
"MODEN" and ignores it. A deterministic per-persona visit-skip pattern is the clean future enhancement (left
out of this pass to keep the simple weekly cadence). **✅ DONE 2026-06-22 — see "Revision 3" above** (the
`visit-skip` persona + `neglected-harvest` scenario; harvest-rate now 63%, not 100%). Together with A7 + the "next lever" plant-out gap, this
says the remaining sim work is about *behavioural diversity* (under-harvest, over-sow, neglect), now that the
*capability* (can the gardener harvest what's ripe?) is solved.

---

## ⭐ Revision 3 (2026-06-22) — the metric is now falsifiable (visit-skip persona shipped)

Critique fix (a) is shipped: a deterministic **visit-skip** persona ("Travel byboer") + a dedicated
pre-seeded scenario (`neglected-harvest`, Testhage into early Oct) drive the headline **below 100% for the
first time** — `harvestRate = 5/8 = 63%` on 7b (3 of 8 ever-ripe crops stranded). The metric is no longer
pinned by construction.

**Root cause of the pin, and the fix.** The 100% lock had two halves: (1) a ready crop was harvested the
same visit (so a miss never accrued), and (2) the harvest "ready" window **expires** — `harvestSoonForPlanting`
only matches inside a finite `[start, end]`, past which the crop silently drops out of `harvestSoon`. So a
gardener who merely *visits less* produces an **invisible** miss (the ripe window passes unobserved → never
even enters `everReady`). The fix splits **observation from action**:
- The harness **samples ripeness every calendar week** (builds the snapshot + records the `observe` entry, so
  `everReady` reflects ground-truth "ever offerable") — even on weeks the gardener is away.
- It **only calls the LLM / applies actions on attended weeks**.
A crop whose ripe window falls entirely inside an absence is then in `everReady` but never harvested → a
**recorded** miss. No new metric bookkeeping — `computeSeasonOutcome` already derives `everReady` from
`observe` entries and the harvested set from `action` entries.

**Why a holiday block, not a probabilistic taper.** First attempt was a season-attendance taper; it stayed
at 100% twice. Two reasons, both instructive: (i) the Testhage harvest is **front-loaded** (crops ripen
late-Jun→early-Sep), so a "fades-in-autumn" taper puts its gaps where nothing is ripe; (ii) ready windows are
**2–3 weeks**, so scattered single skips are caught on the next attended week. A *contiguous* multi-week
absence is required to outlast a window. Modelled as a **summer holiday** (`attendance: { awayFrom, awayTo }`,
mid-Jul → late-Aug — the Norwegian fellesferie over peak harvest): robust (a ~6-week block categorically
exceeds any 2–3 week window, so the miss is structural, not luck), realistic (a city-dweller travelling), and
fully deterministic (date comparison, no RNG → reproducible across Ollama noise). In the frozen run
**#15 erter, #17 agurk, #11 persille** ripened entirely during the holiday and were stranded; crops whose
window extended past the return (jordbær, timian, tomat_cherry) were correctly caught.

**Shipped:** `gardener/persona.ts` (`Persona.attendance` + `visit-skip`), `gardener/attendance.ts`
(`shouldAttend`, store-free + unit-tested), the observe/act split in `gardener/agent.ts` (+ `attendedVisits`
on the summary, surfaced as "oppmøte: N/M uker" in the report/console), `scenarios/neglected-harvest.scenario.ts`,
and the frozen fixture `__tests__/fixtures/neglected-harvest-7b.json` (table-driven replay + a `shouldAttend`
unit test). `tsc`/`eslint` clean, `npm test` 57 green (was 49). **Backward-compatible:** `attendance` is
opt-in, so all other personas keep the unchanged every-week loop and the 6 existing fixtures replay green.

> Operationalises **B8**: now that the harness owns the clock, "neglectful" is modelled as *skipped visits*
> (a user who isn't there), not a gardener who sees MODEN and ignores it. The remaining critique fixes (b–e:
> side-by-side harvested/ripe/unripe counts, an explicit `engaged` flag, sow→ripeHarvest as the primary
> number, the unripe-harvest gap) are still open and independent of this pass.

### ⚠️ B9 (harness limitation) — the 63% overstates real loss: there's no retroactive-harvest model
**The visit-skip miss ≠ a lost crop.** Spirr is a log/planner — the physical vegetables keep growing whether
or not the app is opened, and a real user back from a holiday can still mark a planting harvested
retroactively (`markHarvested` is available on any active planting). But the harness gardener can only act on
crops shown as *currently* ready on an *attended* visit; it has **no backfill path** ("on return, log the peas
I picked two weeks ago"). So the sim's gardener is **more constrained than a real user**, and the 63% conflates
two different things: *was-away* and *the-harness-can't-reconcile-later*. **Do not quote "users lose 37% of
their crops"** — the number is recorded-harvest coverage under a no-backfill assumption, not physical loss.
What *does* survive as a (narrower) product signal: because the "ready" window expires silently, on return the
app neither prompts you to log the harvest you made nor flags what you missed — backfill is *possible* but not
*surfaced*. **Honest v2 of the persona:** let the returning visit-skip gardener harvest crops that ripened
during the absence even after they've dropped out of the live "ready" list — then the metric measures
*engagement-driven* loss, not *can't-reach-it* loss. Until then, read the 63% as a falsifiability proof (the
metric *can* move), not as a real-world loss rate.

---

## A. Product / app signals

### A1. Under-harvesting is systemic — the "Høst snart" nudge isn't compelling enough — ✅ ADDRESSED (2026-06-22, see Revision 2 above)
*The harness redesign took 7b from ~15% → 100% harvest-of-ripe. The original analysis below stands as the
"why"; the product takeaway — make the in-app "Høst snart" card an imperative CTA with the exact crop — is
the human decision that remains.*
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
