# Spirr — Monetization Strategy

> Drafted 2026-07-06 from a codebase inventory + competitor/market research sweep. This is the revenue map future feature decisions get weighed against. It does **not** change the roadmap discipline: Phase H (accounts/sync/tiers) stays held until a tester explicitly asks for cross-device/shared editing. Strategy ≠ launch.

## 1. Philosophy

**Free = current-season intelligence. Paid = memory, foresight & scale.**

- The wedge — *"Hva passer å så nå?" that's actually right for your postnummer* — stays free forever. It's the acquisition engine and the brand promise ("ingen innlogging, dataene blir på din enhet").
- Premium sells what inherently needs a backend or accumulates value over time: sync, photos, proactive alerts, deep history, live weather, regional data.
- **Never gate JSON export/import.** Gardenize gates export and users resent it; Vera/SmartPlant dying made gardeners afraid to trust small apps with years of data. Free export is our trust answer to "what if Spirr disappears?"

## 2. Market snapshot (researched 2026-07)

| App | Origin | Free tier | Price | Notes |
|---|---|---|---|---|
| Planteplanlegger.no | **NO** | 1 bed, klimasone suggestions | 149 NOK/3 mo (~600 NOK/yr) | Only direct NO competitor; ornamental focus |
| GardenR | SE | journal + core free | 199 SEK/yr | Premium = location calendar + auto tasks |
| Gardenize | SE | unlimited journal | ~$45/yr | Journal, not planner; gates plant-ID, export; Nelson Garden data partner |
| GrowVeg / Almanac | UK/US | 7-day trial only | $29–50/yr | No free tier; dated UI complaints |
| Planter | US | 1 garden (ads) | $25/yr or $99 lifetime | Multiple gardens = paywall |
| Seedtime | US | 1 calendar, 10 AI credits/mo | $84–168/yr | Priciest; own seed store, 20% member discount |
| Seed to Spoon | US | guides, 3 AI q/day | $47/yr | Park Seed commerce channel |
| Planta | SE | reminders | $36/yr | 78% of negative reviews cite price |
| Makkelijke Moestuin | NL | 100% free app | — | App sells their physical boxes/soil/seeds |

**Takeaways:**
- The Norwegian veg-planning lane is essentially empty. Nobody anywhere combines station-level frost data × GDD prediction × crop planning — our wedge is unoccupied.
- Most common paywall lines industry-wide: **multiple gardens**, AI features (metered credits), photo ID/diagnosis, sync/desktop access, season archive/export.
- Biggest documented unmet need across planners: **perennials, berries, fruit trees** — "every planner assumes you only grow annual vegetables."
- Lifetime one-time offers ($99 Planter, £120 Leaftide) sell well to subscription-fatigued gardeners.

## 3. The freemium split

### Free (Spirr)
- 1 garden, unlimited boxes
- Full plant DB + custom plants
- Sow-now card, smart box ranking, rotation & companion warnings, forkultivering tray
- Frost dates + GDD harvest prediction for your postnummer — **the wedge, untouched**
- Current + previous season history; basic dashboards
- JSON export/import, view-only share
- In-session sowing reminders (Såplan banner, Increment H v1)

### Premium ("Spirr+" — requires Phase H)
| # | Feature | Why it sells |
|---|---|---|
| 1 | **Cloud sync + cross-device + shared editing** (household/partner) | The explicitly planned paid core; only build on demand signal |
| 2 | **Frost- & weather-alerts (push/e-post)** — "Frost natt til torsdag i 4632 — dekk til tomatene" | Station-level; no competitor can match in Norway. Highest perceived value |
| 3 | **Live-weather GDD** (I-0.5, yr.no forecast) | Harvest estimates that tighten as the season runs |
| 4 | **Photo journal** (Phase G) | Needs backend anyway; natural premium |
| 5 | **Multiple gardens** (hjem + hytte + kolonihage/parsell) | Industry's most common paywall; fits Norwegian life |
| 6 | **Full multi-year history + advanced analytics** — yield-over-time, box productivity, self-calibration ("din hages egen GDD", I-2) | Value accumulates; sticky |
| 7 | **Regional intelligence** (I-3: "gartnere nær deg sådde tomat ~12. mai") | Premium feature *and* the long-term data moat |
| 8 | **PDF sesongplan + frøhandleliste** from Såplan | Cheap to build once Såplan exists |

## 4. Pricing

- **349 NOK/yr** (~29 NOK/mo billed yearly) or 49 NOK/mo. Anchors: above GardenR (199 SEK), well under Planteplanlegger (~600 NOK) and far under Seedtime.
- **Founders' lifetime 699–999 NOK** at premium launch: rewards early testers, answers subscription fatigue, funds Phase H.

## 5. Features worth building *for* the funnel

- **Perennials/bærbusker/frukttrær/rabarbra** — the most-cited market gap; Norwegian gardens are full of them; widens the audience beyond veg beds. Basic support free; pruning/care calendar can be premium later. (Perennial flag + seasonal harvest windows already exist in the data model — this is content + a little phenology work, not a rebuild.)
- **Såplan + reminders** (already the flagship next step, §2.1 in `MVP-next-phase-v2.md`) — the retention engine that later makes premium alerts sellable.
- **Metered AI assistant** (photo diagnosis, "hvorfor gulner bladene?") — credit-based like Seedtime. Explicitly *not* before PMF.

## 6. Beyond subscriptions (rough order)

1. **Frø-affiliate / handleliste** — Såplan → shopping list → Norwegian seed suppliers (Solhatt, Nelson Garden, Impecta). Low effort once Såplan exists.
2. **B2B Norge** — Plantasjen/Felleskjøpet/hagesentre have no app; group licenses for kolonihage-foreninger & skolehager; white-label "powered by Spirr" climate data.
3. **Nordic expansion** — postnummer→station→frost-normals architecture ports to SMHI (SE), FMI (FI), DMI (DK). Sweden ≈ 2× market; Gardenize/GardenR prove Nordic willingness to pay.
4. **Data moat** — aggregated cross-user sow/harvest outcomes per region (I-3) become the asset nobody can copy. Needs Phase H + scale.

## 7. Sequencing

1. **Now:** stay free, ship Såplan, run the user-testing plan. This doc exists so feature choices are revenue-aware — nothing more.
2. **Trigger:** first testers asking for sync/photos → build Phase H with the split above (data layer already shaped: 3 localStorage namespaces → 3 Supabase tables).
3. **Premium v1 bundle:** sync + photos + frost alerts + live-GDD + multi-garden + full history. Launch with founders' lifetime offer.
4. **Later:** regional intelligence, affiliate, B2B, Nordic.

## Sources

Planter pricing (planter.garden/pricing) · Seedtime pricing (seedtime.us/pages/pricing) · GrowVeg (growveg.com/subscribeinfo.aspx) · Gardenize (gardenize.com/subscriptions) · Seed to Spoon + Park Seed press release · Planteplanlegger (app.planteplanlegger.no) · GardenR (gardenr.com/premium) · Makkelijke Moestuin (makkelijkemoestuin.nl/en/app) · Leaftide 10-app comparison (leaftide.com/learn/best-garden-planning-apps) · Vera discontinuation (insightweeds.com) · Plantasjen kundeklubb (kundeklubber.com) · Nelson Garden "Din odlarvän" content site.
