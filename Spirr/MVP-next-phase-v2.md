# Spirr — Way Forward (v2)

> **What this is.** A short, current map of where Spirr stands and what's next — a truncated starting point so we don't have to re-read the 900-line `MVP-next-phases.md` every time. That file stays as the **full historical record + as-built logs**; this file is the **planning source of truth going forward**. Keep updating *this* file after each task (per the working rule).
>
> Created 2026-06-22.

---

## 1. What's shipped (condensed)

Full details + browser-verification notes live in `MVP-next-phases.md`. The short version:

- **Core app** — garden grid, box CRUD, plantings & history, pinch-zoom, onboarding, reset/undo, view-only share, configurable grid, import preview. (MVP v1 + v2)
- **Plants** — family metadata (A), custom plants (C), variety tracking (D3), **37 bundled plants** (incl. rosenkål/grønnkål/hodekål/koriander/dill added 2026-06-22).
- **Location calendar (Phase D)** — postnummer→frost dates (132 stations / 5132 postnumre), elevation lapse-rate correction, *"Hva passer å så nå?"* card.
- **Hagekalender increments** — B smart box-picker · C reverse "hva passer her" · D Sesongoversikt timeline · E succession nudges · F companion hints · G rotation warnings.
- **GDD model (I Layer 0)** — harvest dates from growing-degree-days over each station's real temp curve, greenhouse bonus, won't-ripen note; **I Layer 1** retrospective backfill.
- **Dashboards (J Layers 1+2)** — "Hagen i tall": composition donut, season status, Neste til høsting, Høstekalender, Vekstskifte heatmap, Hageaktivitet.
- **K Forkultivering** — indoor seedling tray (`/seedlings`), "Plant ut" preserves the indoor sow date.
- **L direct-vs-forkultivert** — per-planting sow method adjusts the GDD harvest math.
- **Phase F** harvest tracking · grid/map UX overhaul · rebrand to **Spirr** + logo.
- **Test Simmer** — headless LLM-gardener sim harness (M1 + most of M2/M3); the visit-loop + falsifiable harvest-rate metric (Rev 1–3).

---

## 2. New directions (user, 2026-06-22)

Three things came out of the latest review. These are the priorities.

### 2.1 Såplan + sowing reminders — *the flagship new feature* — ✅ v1 SHIPPED 2026-07-06

**The idea (user).** Use pre-cultivation as a **planning** tool, not just tracking. In February a gardener wants to decide *what they'll grow this year*, and then be **reminded when to start each seed** (especially forkultivering / indoor sowing). "An app that reminds me when to sow the seeds for the plants I'm going to have."

**Shipped (v1, as-built log in `MVP-next-phases.md`):**
1. **Min såplan** — per-year wishlist card at the top of GardenMap (`SowPlanCard.tsx`, `useSowPlanStore`, `gt_sowplan` — the 4th localStorage namespace, Phase-H-ready). Each planned crop shows its **next action + date** from a new pure lib (`sowPlan.ts` — `nextActionForPlant`: open window → "Så inne nå — til ca. 14.03", else nearest upcoming → "Plant ut fra ca. 02.05", else "over for i år"); crops already planted this year show "✓ Startet i år".
2. **Reminder strip (Increment H v1)** — "🔔 På tide: Cherrytomater (så inne)" at the top of the card when a planned crop's window is open and it isn't started yet. Dedupe via `gt_reminders` (`year:kind:plantKey` → timestamp): dismissed/acted nudges stay gone for the season, but a *later* window (plant-ut after så-inne) re-surfaces the crop. Web push stays future work (§3).
3. **Hand-off into K** — "Start inne" on a due crop opens the Forkultivering form pre-filled (`/seedlings?start=…`); ute/plant-ut rows reuse GardenMap's sow-mode flow.
4. **SowNowCard pinning** — planned crops sort first in every group with a ⭐.
5. Backup export/import round-trips `sowPlan` (optional field, version 2 unchanged).

**Verified:** 72 vitest green (incl. new `sow-plan.test.ts`), `tsc -b`/eslint/`vite build` clean; in-browser via `?simNow=2026-03-10` (strip → Start inne → seedling form → dedupe on return).

**Why it fits.** It's the natural capstone over D2 + K + H, it's the "calendar intelligence is the identity" bet, and it serves a real unmet need (hobby gardeners aren't served by pro ag scheduling tools). Also the last unshipped **free-tier** item in `MONETIZATION.md` §2 — and the retention engine that later makes premium push-alerts sellable.

### 2.2 Harvest-readiness status progression — "Klar for høsting" — ✅ SHIPPED 2026-07-02

**The point (user).** "HØST NÅ" is too blunt for real humans. The "Høst snart" signal was effectively one state.

**Shipped:** a ripeness *progression* derived from the crop's position in its harvest window:
`Snart klar (~N uker)` → `Klar for høsting` (in-window) → `Bør høstes snart` (final 7 days of the window; 14 for long seasonal windows). The human-friendly version of the sim's A1 finding (systemic under-harvesting) — clarity, not nagging.

- **Source of truth:** `harvestWindowStatus()` in `src/lib/gdd.ts` (`HarvestStatus = "soon" | "ready" | "late"`); all four harvest-rule branches in `sowNowGroups.harvestSoonForPlanting` now emit the progression (GDD window · seasonal window, 14-day tail · before-first-frost, "late" when frost ≤1 week · weeksFromSowing fallback, "late" past `maxWeeks`).
- **UI:** SowNowCard "Høst snart" helpers carry the new wording, coloured green (ready) / amber (late); "Neste til høsting" shows **"Bør høstes"** in amber via a new `MaturityRow.late` flag. Collapsed ×N rows keep the *most urgent* member's status (late > ready > soon), so one overdue bed isn't hidden behind nine merely-ready ones.
- **Sim kept honest:** "late" counts as *ripe* in the harness (`render.ts` ⚡-block, `outcome.ts` ripe-handle parsing, snapshot status type widened) — the harvest-rate metric doesn't lose crops that escalate past "ready".
- Tests: 5 new cases (fallback soon/late, GDD soon/ready/late, urgency collapse); full suite 62/62, `tsc -b` + `vite build` clean.

### 2.3 Better GDD values — NLR / Hageselskapet cross-check — ✅ DONE 2026-07-06

**The point (user).** "I'd definitely like better GDD values so we can predict better." The `gddToMaturity` numbers were **literature-grade first estimates** (flagged in `MVP-next-phases.md` Increment D limitation 2 + I Layer 0).

**What was done:** cross-checked all bundled crops against Norwegian sources (NLR, Hageselskapet/agropub, NIBIO, Felleskjøpet, Solhatt, Nelson Garden NO, Skolehager). Built a calibration harness replicating `gdd.ts` over the real station curves and tuned each suspect value against the sourced Norwegian harvest month at Oslo/Kristiansand. **Corrected 9 crops** — the base-10 warm crops were systematically far too high (7 read *"modner ikke"* in Oslo where they demonstrably ripen): cherrytomat 800→430, tomat_stor 1050→620, paprika 1150→700, agurk 550→430, gresskar 900→600, mais 1150→600, solsikke base10/850→base5/700, rødbeter 700→800, grønnkål 600→720. Base-5 roots/brassicas already predicted sensible months — left as-is. **Verified in-browser** (Oslo 0350): cherrytomat now ~2 Aug, solsikke ~5 Aug (were won't-ripen); cold Røros still withholds the marginal warm crops.

**Layer 2 self-calibration (logged harvests) remains the long-term refinement** — this was the cheap interim that doesn't wait a season.

> **⚠ Finding for §2.4 → ✅ FIXED 2026-07-06:** every one of the 5132 postnumre in `postnummer.json` carried a placeholder `centroidElevationM: 150`. Because `location.ts:154` uses that as the garden elevation when the user hasn't set one, the lapse-rate correction was anchored to a fake 150 m baseline — miscorrecting proportional to how far the serving station's real elevation is from 150 m (negligible for lowland/coastal, but ~+3 °C of false warmth for a mountain station like Røros at 628 m). **Fixed** by backfilling real per-centroid elevation from the open-meteo SRTM DEM (`climate-data/backfill_elevation.py`) — see §2.4.

### 2.4 More weather stations + better station siting — ✅ SHIPPED 2026-06-23

The pipeline (`gardentime/climate-data/`, sibling of the app, tracked in the parent repo — **not** inside `Spirr/`) shipped **132 stations**. Now **564**.

**Result:** `132 → 564 stations (4.3×)`. **70% of postnumre (3612/5132) reassigned to a closer station** (median 8.6 km closer); **1711 got a better elevation match** (median 53 m). **Sogndal town (6856/6857) now resolves to Rv5 Kaupanger (170 m, valley) instead of the 497 m airport** — GDD5 1270 vs ~946, a realistically warmer/longer season. Confidence split: 246 high / 318 low. Integrity verified (no missing keys, all postnumre resolve, stations==normals); app `tsc -b && vite build` clean.

**Real per-postnummer elevation — ✅ FIXED 2026-07-06.** All 5132 postnumre shipped a placeholder `centroidElevationM: 150` (the pipeline was never run with `--with-elevation`), so `location.ts`'s lapse-rate correction anchored to a fake baseline and over-warmed high-elevation districts (~+3 °C at Røros). Backfilled real elevation from the open-meteo SRTM DEM via a surgical, data-only script (`climate-data/backfill_elevation.py`) that fills `centroidElevationM` in place — frost normals and (distance-based) station assignment untouched. **Result:** 5122/5132 updated, 466 distinct values, 0–1783 m (median 27 m — Norway is coastal). Verified: Røros now resolves to LF 14 Jun / GDD10 185 (genuinely cold) instead of a ~3 °C-warmed fake; Oslo 27 m, Sogndal-valley 5 m, Alvdal 494 m all correct; Settings shows Røros "siste vårfrost 14. jun". `pyproject`-free (stdlib urllib), resumable + cached. **Next-level refinement (deferred):** elevation-*aware* station assignment (the old "Tier 3" — prefer a slightly-farther but better-elevation-matched station now that real centroid elevation exists).

What was done, and what we learned:

- **Tier 1 (fetch the 262 unfetched candidates) — DEAD END.** Those stations return HTTP 412: they have **no air-temperature series at all** (precipitation/snow/hydrology only). Verified Selseng `SN55730`, Fresvik `SN53130`, Hafslo `SN55550` — 43–44 series each, ZERO temperature. So **answer to "is it the source?": no** — MET Frost is authoritative; these stations genuinely don't measure temperature (Norway's precip network is far denser than its temp network). seNorge would only *model* a value there, not measure it.
- **Tier 2 (relax the window) — the real lever, DONE.** Rewrote `stations.py` to discover candidates from **temperature availability** (`availableTimeSeries`) instead of a rigid date window — no more wasted 412s on rain gauges — keeping stations with ≥10 yrs of daily-mean temp. `frost.py` now derives over **1991–2024**, min **10** contributing years (was 15), and tags each normal with **`years` + `confidence`** (`"low"` when <15 yrs). The app (`location.ts` → `ResolvedLocation.stationConfidence/Years`, surfaced as a "⚠ Kort måleserie (~N år)" caution in `Settings.tsx`) shows the flag.
- **Hourly→daily fallback — DONE (this unlocked Kaupanger).** ~188 candidates (incl. Kaupanger) have daily *mean* + *hourly* temp but **no daily *min***, so frost dates couldn't be derived. `frost.py` now falls back to fetching **sub-hourly `air_temperature` year-by-year** (a full-range request 403s — too large) and aggregating to daily min/mean. Daily-min stations (~408) keep the cheap path. This is what pulled Kaupanger (11 yrs) and the rest in.
- **Tier 3 (elevation-aware assignment) — turned out NOT needed for Sogndal** (Kaupanger is both closer *and* lower than the airport, so plain nearest-station picks it). Still a reasonable future refinement for the 1711 postnumre where a slightly-farther lower station would match better — but lower priority now. `postnummer.py` unchanged.
- **Ops note:** the full rebuild is a ~40-min fetch (cache-backed, resumable — every fetched station/year is cached under `data/raw/frost/`). The first attempt died when the laptop slept; re-running under `caffeinate` finished. The MET cache is gitignored, so a fresh machine re-fetches.
- **seNorge 1 km gridded** remains the ultimate fix (the valley floor still has no *measured* temp station — Kaupanger is the nearest real one). Noted as the long-term option; not needed now that coverage is 564.

**Not yet committed** — all changes (pipeline code in the parent repo + regenerated `src/data/*.json` + app `location.ts`/`Settings.tsx`) are in the working tree pending review.

---

## 3. Unfinished from the roadmap

| Item | Status | Notes |
|---|---|---|
| **Increment H — reminders/notifications** | **v1 shipped** with §2.1 (2026-07-06) | In-app reminder strip on the Såplan card, deduped via `gt_reminders`. Remaining: opt-in **web push** (service worker, 2–3 days) — a natural Spirr+ premium lever (`MONETIZATION.md` §2). |
| **I Layer 0.5 — live-weather GDD** | Candidate | This year's real temps + ~9-day forecast (MET/yr.no) → harvest estimate tightens as season runs. Needs a runtime weather API → pairs with **Phase H** (online tier). |
| **I Layer 2 — self-calibration** | Waits on data | Needs ≥1 logged season of the user's own harvests. §2.3 cross-check is the interim. |
| **I Layer 3 — cross-user regional aggregate** | Waits on Phase H | "Gardeners near you sowed tomato ≈ 12 May." The long-term data moat. |
| **J — remaining charts** | Partly waits on F data | Yield-over-time + box-productivity need logged `harvestYield` (free-text → needs parse step). Diversity-over-time line is cheap & buildable now. Clickable donut/heatmap → grid filter is an interaction, not a chart. |
| **Phase G — photos** | Hold for signal | localStorage can't hold many images → needs IndexedDB or backend. Pair with H. |
| **Phase H — accounts/sync/tiers** | Big bet, hold for signal | Build only when a tester explicitly asks for cross-device / shared editing. Business model now mapped in **[`MONETIZATION.md`](MONETIZATION.md)** (2026-07-06): free = current-season intelligence; Spirr+ = sync, frost-alerts (push), live-GDD, photos, multi-garden, full history — ~349 NOK/yr + founders' lifetime. Data layer already shaped for it (3 localStorage namespaces → 3 Supabase tables). |
| Perennials/bær/frukttrær content | ✅ v1 shipped 2026-07-06 | 13 crops added (bringebær ×2, solbær, rips, stikkelsbær, hageblåbær, rabarbra, asparges, jordskokk, eple, plomme, pære, morell) → 50 plants; 3 new families. The funnel gap from `MONETIZATION.md` §5. Fixed two latent bugs en route (past-season perennials showing "Klar nå"; GardenInsights ignoring the clock seam). Future: per-crop care/pruning calendar could be a Spirr+ lever. |
| Phase E nutrient-flow hints | Not planned | E's rotation + companion scope already shipped as G + F. |

---

## 4. Test Simmer — open items

The sim harness is solid (Rev 3 made the harvest-rate metric falsifiable). Open threads if/when we return to it:

- **Rev 4 — close the metric critique (b–e):** make **harvest-of-sown (sow→ripeHarvest)** the primary metric; add side-by-side harvested/ripe/unripe counts; add an explicit `engaged` flag.
- **M2/M3 tail:** export/import round-trip invariant; direct-vs-transplant GDD-anchor assertion; tier-2 Chrome-DevTools browser-fidelity check; extract the last `.tsx` grouping logic into pure libs (closes the observation-drift gap).
- **Product takeaway already extracted:** A1 (under-harvesting) → handled humanely by §2.2, not an aggressive CTA.

---

## 5. Recommended order

0. **§2.4 weather stations** — ✅ DONE 2026-06-23: 132 → **564 stations**, 70% of postnumre now on a closer station, Sogndal fixed (→ Kaupanger 170 m). Pending: commit, and a quick in-browser sanity check at a few stations. (Tier 3 elevation-aware assignment de-prioritised; seNorge gridded is the only remaining lever.)
1. **§2.2 Harvest-readiness labels** — ✅ DONE 2026-07-02: `Snart klar (~N uker)` → `Klar for høsting` → `Bør høstes snart` across all four harvest-rule branches; SowNowCard + "Neste til høsting" wording/colour; sim treats "late" as ripe.
2. **§2.3 GDD cross-check** — ✅ DONE 2026-07-06: 9 crops corrected against Norwegian sources (warm base-10 values were far too high → won't-ripen in Oslo). Surfaced a separate elevation-placeholder bug for §2.4. Layer 2 (logged harvests) is the long-term refinement.
3. **§2.1 Såplan + reminders** — ✅ v1 DONE 2026-07-06: "Min såplan" card + in-app reminder strip (`gt_reminders` dedupe) + hand-off into the K tray + ⭐ pinning in SowNowCard + backup round-trip. Remaining: web push (see §3).
4. **Test Simmer Rev 4** — when returning to harness work.

**Held for explicit user signal:** Phase G (photos), Phase H (accounts/sync), I Layers 0.5/2/3.
