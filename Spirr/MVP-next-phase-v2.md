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

### 2.1 Såplan + sowing reminders — *the flagship new feature*

**The idea (user).** Use pre-cultivation as a **planning** tool, not just tracking. In February a gardener wants to decide *what they'll grow this year*, and then be **reminded when to start each seed** (especially forkultivering / indoor sowing). "An app that reminds me when to sow the seeds for the plants I'm going to have."

**What we already have vs. the gap:**
- ✅ The *timing math* exists — `SowNowCard` already computes **Så inne / Så ute / Plant ut** windows for every tagged plant against the user's frost dates.
- ✅ The *tracking* exists — Increment **K** (Forkultivering tray) records seedlings once started.
- ❌ **Missing: the plan + the nudge.** There's no way to say "I intend to grow tomatoes, paprika, grønnkål this year," and nothing proactively tells you "start tomatoes inne **this week**." Today you have to open the app and read the card.

**Proposed shape (to design, not yet locked):**
1. **Min såplan** — a lightweight list of *intended* crops for the season (a wishlist, no box yet). Likely reuses `PlantInfo` keys + a tiny store; the plan **filters/pins** the existing SowNowCard windows to the crops you care about, so each planned crop shows its next action + date ("Så inne ~uke 9", "Plant ut etter 17. mai").
2. **Reminders (= Increment H, see §3)** — surface "på tide å så X inne" as a **session banner v1** (cheap, no infra), later opt-in web push. Dedupe via `gt_reminders` timestamps.
3. **Hand-off into K** — "start nå" on a planned crop creates the indoor seedling in the Forkultivering tray (closes plan → cultivate → plant out → harvest).

**Why it fits.** It's the natural capstone over D2 + K + H, it's the "calendar intelligence is the identity" bet, and it serves a real unmet need (hobby gardeners aren't served by pro ag scheduling tools).

### 2.2 Harvest-readiness status progression — "Klar for høsting"

**The point (user).** "HØST NÅ" is too blunt for real humans. But does **"Høst snart"** ever escalate to **"Klar for høsting"**? → **No, not today.** The "Høst snart" signal is effectively one state.

**Proposed (small, shippable now, no signal needed):** derive a gentle ripeness *progression* from the crop's position in its GDD/harvest window, e.g.
`Snart klar (~N uker)` → `Klar for høsting` (in-window) → (optionally) `Bør høstes snart` near window end.
This is the human-friendly version of the sim's A1 finding (systemic under-harvesting) — clarity, not nagging. Touches `SowNowCard` "Høst snart" + the "Neste til høsting" chart wording.

### 2.3 Better GDD values — NLR / Hageselskapet cross-check

**The point (user).** "I'd definitely like better GDD values so we can predict better." The `gddToMaturity` / `harvestRule` numbers are **literature-grade first estimates** (flagged in `MVP-next-phases.md` Increment D limitation 2 + I Layer 0). The 5 new plants (rosenkål/grønnkål/hodekål/koriander/dill) are estimates too.

**Plan (a concrete mini-project, no code risk):**
1. Build the worklist: every bundled plant's `gddToMaturity`, `gddBase`, `harvestRule`, `sowRules`, `harvestDurationWeeks` (and the crops the user actually grows first).
2. Cross-reference against **NLR**, **Hageselskapet**, **Felleskjøpet**, **Plantepleien**, **Frøportalen/seed-packet days-to-maturity** — prefer Norwegian sources.
3. Convert days-to-maturity → GDD where needed; correct `plants.json`; note the source per crop.
4. Validate in-browser at a couple of stations (warm Oslo vs. cold valley) that the harvest months read sensibly.
5. Layer 2 self-calibration (logged harvests) remains the long-term refinement — this is the cheap interim that doesn't wait a season.

### 2.4 More weather stations + better station siting — ✅ SHIPPED 2026-06-23

The pipeline (`gardentime/climate-data/`, sibling of the app, tracked in the parent repo — **not** inside `Spirr/`) shipped **132 stations**. Now **564**.

**Result:** `132 → 564 stations (4.3×)`. **70% of postnumre (3612/5132) reassigned to a closer station** (median 8.6 km closer); **1711 got a better elevation match** (median 53 m). **Sogndal town (6856/6857) now resolves to Rv5 Kaupanger (170 m, valley) instead of the 497 m airport** — GDD5 1270 vs ~946, a realistically warmer/longer season. Confidence split: 246 high / 318 low. Integrity verified (no missing keys, all postnumre resolve, stations==normals); app `tsc -b && vite build` clean.

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
| **Increment H — reminders/notifications** | **Promoted** → see §2.1 | Session banner v1 ≈ ½ day; web push (service worker) 2–3 days. Was Cohort 4. |
| **I Layer 0.5 — live-weather GDD** | Candidate | This year's real temps + ~9-day forecast (MET/yr.no) → harvest estimate tightens as season runs. Needs a runtime weather API → pairs with **Phase H** (online tier). |
| **I Layer 2 — self-calibration** | Waits on data | Needs ≥1 logged season of the user's own harvests. §2.3 cross-check is the interim. |
| **I Layer 3 — cross-user regional aggregate** | Waits on Phase H | "Gardeners near you sowed tomato ≈ 12 May." The long-term data moat. |
| **J — remaining charts** | Partly waits on F data | Yield-over-time + box-productivity need logged `harvestYield` (free-text → needs parse step). Diversity-over-time line is cheap & buildable now. Clickable donut/heatmap → grid filter is an interaction, not a chart. |
| **Phase G — photos** | Hold for signal | localStorage can't hold many images → needs IndexedDB or backend. Pair with H. |
| **Phase H — accounts/sync/tiers** | Big bet, hold for signal | Build only when a tester explicitly asks for cross-device / shared editing. Free = all intelligence; paid = scale + sync. Data layer already shaped for it (3 localStorage namespaces → 3 Supabase tables). |
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
1. **§2.2 Harvest-readiness labels** — tiny, shippable now, no signal needed; humane version of the sim's A1 finding.
2. **§2.3 GDD cross-check** — data quality; everything downstream leans on prediction trust. Make the worklist, then correct `plants.json` crop-by-crop (start with what the user grows + the 5 new plants).
3. **§2.1 Såplan + reminders** — the flagship. Design first (plan entity + how it reuses SowNowCard windows), then build **reminders v1 as a session banner** (Increment H ½-day) and the pinned "Min såplan" list, with hand-off into the K tray.
4. **Test Simmer Rev 4** — when returning to harness work.

**Held for explicit user signal:** Phase G (photos), Phase H (accounts/sync), I Layers 0.5/2/3.
