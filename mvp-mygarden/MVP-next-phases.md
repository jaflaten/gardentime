# MyGarden — Next Phases Planned

## Status

**Shipped:**
- MVP v1 — garden grid, box CRUD, plantings, history, mobile pinch-zoom
- MVP v2 (test-user readiness) — onboarding choice screen, reset garden, one-step layout undo, view-only share mode, "Sist lagret" badge, configurable grid size, import preview modal
- Phase A — plant `family` metadata + "Forrige sesong" hint on add-planting + family chip on planting rows
- Bullet 6 — `sunExposure` + `bedType` on `Box`, inline edit on BoxDetail
- Phase B — NYLIG BRUKT pinned in PlantPicker, long-press quick-add gesture, always-visible "+" badge on every tile, bottom-sheet QuickAdd
- Phase C — user-extensible plant DB (custom plants persisted in `gt_custom_plants`, merged into picker + lookup, Egne planter section in Settings, Export/Import round-trips them with `version: 2`)
- Cleanup — DinoGarden import surfaces removed (Settings + onboarding), legacy importer module deleted

**Guiding principles (still hold):**

1. **Show the data, not prescriptions.** Let the gardener decide. Suggestion engines come after metadata adoption.
2. **Tiny metadata additions unlock the most future features.** Prefer extending `PlantInfo` / `Box` over new surfaces.
3. **localStorage-first stays the default for free-tier users.** Sync is opt-in via account.
4. **Match scale to the user.** A free hobbyist's small bed shouldn't feel limited; paid power-users get more.

---

## Phase D — Calendar + season awareness

**Goal:** surface *"what to sow now?"* so gardeners stop missing planting windows.

**Scope:**
- Extend `PlantInfo` with `sowIndoorWindow` / `sowOutdoorWindow` / `harvestWindow` (month ranges, e.g. `"3-4"` for March–April).
- Tag the bundled 32 plants with sensible Norwegian-climate defaults.
- Custom plants get the same optional fields in `CustomPlantForm`.
- New dismissable **"Hva passer å så nå?"** card on the garden map. Filters bundled + custom plants by current month against their sowing windows.
- Plant variety tracking: optional `variety?: string` on `Planting` (Sungold / Roma / Beefsteak). Surface in the picker and on history rows.

**Open question — geolocation / hardiness zone.** Without it, calendar advice is generic ("plant carrots in April") rather than zoned ("plant carrots April–May at your latitude"). Options:
- Free-text "by/region" in Settings.
- Browser geolocation API (with consent) → lookup Norwegian hardiness zone.
- Skip zoning for v1; ship national-average windows; add zoning later if testers ask.

**Recommendation:** ship national defaults first. Add a single `Hvilken sone er du i?` select in Settings only if real users ask for it.

**Out of scope for D:** actually telling the user *what* to plant (that's E).

---

## Phase E — Active rotation + companion suggestions

**Goal:** turn the family data + calendar data into actionable guidance.

**Scope:**
- Soft rotation warning in the add-planting form: *"⚠ Du hadde Solanaceae her i 2024 og 2025. Vurder en annen familie."* Non-blocking, dismissable.
- Companion data on `PlantInfo`: `companionsGood?: PlantKey[]` and `companionsBad?: PlantKey[]`. Tag bundled plants from the existing `plant-data-aggregator/plant-data-aggregator/docs/companionship/companionship.json` (already scraped, sitting in repo).
- When picking a plant for a box with active plantings, surface inline pairs: *"🌿 Trives med basilikum"* or *"⚠ Dårlig kombinasjon med dill"*.
- Stretch: nutrient-flow hints (heavy feeder → light feeder → nitrogen fixer rotation).

**Caveat.** Every gardener has slightly different rotation rules. Design these as soft *information*, never blocking validation. Always allow the user to override. **Don't ship E until A's family chip has been in real-world use for a season** — we want to see how the gardener actually uses the data before automating recommendations.

---

## Phase F — Harvest tracking

**Goal:** close the loop on which plantings actually paid off — input for next year's planning.

**Scope:**
- Optional `harvestYield?: string` on `Planting` (free text: "5 kg", "3 bøtter", "1 sekk").
- On the Høst action, optionally prompt for yield.
- History view (already grouped by year) could later show "best performers" per box.

**Why now:** cheap addition, aligns with regenerative philosophy — track what works, drop what doesn't.

---

## Phase G — Photos

**Goal:** visual diary per planting and per box.

**Scope:**
- `Planting.photo?: string` (compressed JPEG, target ~200 KB).
- `Box.coverPhoto?: string`.
- Camera API on mobile, file picker on desktop.
- Client-side image compression before storage.

**Storage caveat.** localStorage caps at ~5 MB total per origin. Photos blow that budget fast (~25 photos at 200 KB and you're done). This phase likely needs IndexedDB *or* a backend — natural pairing with Phase H sync.

---

## Phase H — Accounts, sync, and tiers

**Goal:** garden follows the gardener across devices. Spouse can co-edit. Paid tier unlocks power-user shapes.

### Architecture

- Supabase backend with magic-link auth.
- Replace `src/lib/storage.ts` with `src/lib/supabase.ts`. Same store actions, just a different persistence layer. **The store API (`useGardenStore` / `useCustomPlantsStore` / `useUiStore`) stays unchanged** — that's the seam.
- Garden ownership model: each user owns N gardens; each garden has 0+ collaborators.
- Migration: on first login with existing localStorage data, prompt *"Vil du knytte hagen din til en konto?"* and bulk-upload to backend.

### Free vs paid tier *(placeholder — confirm against user feedback)*

**Free (default, generous):**
- 1 garden, single-device.
- Sensible cap on box count / grid size that comfortably covers a typical home garden.
- Read-only share links (`?view=1`) already work.
- All Phase A–F features (family hints, custom plants, calendar, harvest tracking).
- Local Export/Import is the manual sync path.

**Paid (working name: "Hagentøy Pro" — placeholder):**
- Multiple gardens (allotment + home + community plot).
- Larger grid + higher box cap.
- Cross-device sync via account.
- Co-edit with spouse / family.
- (Maybe) photo storage backed by backend.
- (Maybe) calendar reminders by email.

### Principles for the paid line

1. Free should never feel **crippled** — limits target power-user shapes, not basic shapes.
2. Paid features unlock **more**, never **required**. Avoid antipatterns like *"you can't reset until you upgrade"*.
3. The boundary should be a meaningful jump in value, not artificial friction.
4. Sync is the headline upgrade. Everything else is a bundle around it.

### Open questions for monetization

- What's a "typical" home garden in terms of box count / grid size? **Need real user data before setting the free-tier cap.** Watch what testers actually build.
- Photo storage costs scale per user. Must be priced into the paid tier, OR use heavily compressed thumbnails only.
- Co-editing requires conflict resolution (CRDT or last-write-wins). Out of scope until paid demand is real.
- Pricing model: monthly, annual, or one-time? Norwegian market expectations differ.

---

## Phases NOT planned (yet)

Explicitly deferred:

- **Multi-language UI beyond plant names.** App chrome stays Norwegian-only by design. Polish toggle only swaps plant labels.
- **ML-driven yield prediction.** Too brittle without years of personal data.
- **Social features.** Sharing gardens publicly, plant trading, community feeds — not part of the gardening-tool identity.
- **Native mobile app.** PWA is enough. If iOS/Android wraps become valuable, Capacitor over the existing web app — not a rewrite.

---

## What to ship next (recommendation)

**Phase D (calendar + season awareness) is the highest-leverage next step.** It:

- Builds on Phase A's `family` data.
- Gives users actionable *"what to sow now"* without us having to define rotation rules.
- Naturally extends `PlantInfo` with one more layer of metadata.
- Doesn't depend on Phase H (geolocation can be deferred — national defaults are fine for v1).

After D ships and gets real use, **Phase F (harvest tracking)** is a cheap follow-on (~1 day) that fills in the loop.

**Phase E and Phase H are the big bets** — they shape the product story (E) and the business story (H). Hold both until user feedback gives concrete demand signals:

- **Hold E** until the family chip has been in the user's hand for a growing season. Watch which "which family was here last year?" decisions get repeated — those are the candidates for soft warnings.
- **Hold H** until at least one tester explicitly asks for cross-device or shared editing. Build the paid tier around demonstrated demand, not assumed demand.

---

## Architecture note for future H

The data layer is already shaped for sync. Three localStorage namespaces map cleanly to three Supabase tables:

| Local key | Maps to | Notes |
|---|---|---|
| `gt_boxes` | `boxes` (FK to garden) | Layout `{x,y,w,h}` + optional `sunExposure` + `bedType` |
| `gt_plantings` | `plantings` (FK to box) | Existing structure already includes `year`, `status` |
| `gt_custom_plants` | `custom_plants` (FK to user, NOT garden) | Vocabulary follows the gardener, not the garden |
| `gt_grid_size`, `gt_language`, `gt_lastSavedAt` | per-user preferences | Move to a `user_preferences` table |

`useGardenStore` and `useCustomPlantsStore` are the seams. Swap `src/lib/storage.ts` for `src/lib/supabase.ts` and the rest of the app doesn't notice.

**Don't break this seam.** If a future phase couples the store directly to localStorage outside `storage.ts`, it makes H harder. Keep persistence centralized.
