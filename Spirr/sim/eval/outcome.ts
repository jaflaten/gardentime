// Season outcome telemetry — DESCRIPTIVE, not pass/fail. Correctness lives in invariants (did the app
// break?); this is the other axis: did the gardener get a good outcome? Derived purely from the
// transcript, so it recomputes from any RunReport. It quantifies FINDINGS A1 (systemic under-harvesting):
// `harvestSignalsOffered` vs `harvested` is the "app said ready, gardener never picked" gap, and
// `ripeAtSeasonEnd` is the ripe-but-unharvested count when the season ended.
//
// NB: a forgetful/eager-beginner persona under-harvesting is *correct* persona behaviour — never gate
// green/red on these numbers; they're a cross-persona/cross-model comparison read for a human + the judge.

import type { TranscriptEntry } from "../observe/log";

// Action counts measure what the gardener *did* this run (they exclude plantings the scenario seeded —
// so `harvested` can exceed `sown` in a pre-seeded garden; that's expected, these aren't a garden census).
// The signal counts come from the observations, so they reflect the whole garden's ripe crops.
export interface SeasonOutcome {
  /** Plantings created this run (successful sow_indoor + sow_outdoor). */
  sown: number;
  /** Successful indoor sows this run (the plant-out funnel's mouth). */
  sownIndoor: number;
  /** Successful plant_out (seedling → bed). */
  plantedOut: number;
  /** Successful harvest actions. */
  harvested: number;
  /** Successful remove_planting (removed or failed). */
  removedOrFailed: number;
  /**
   * Distinct plantings that were ripe ("(ready)") at any point in the run (cumulative). Ripeness is
   * sampled EVERY calendar week — including weeks a visit-skip gardener was absent — so this is
   * ground-truth "ever offerable," not "ever shown to an attentive user." That's what lets the rate
   * penalise a crop whose ripe window passed while the gardener was away (FINDINGS critique fix a).
   */
  harvestSignalsOffered: number;
  /** Distinct plantings still flagged "(ready)" in the final observation — ripe, unharvested at season end. */
  ripeAtSeasonEnd: number;

  // --- North-star: did the gardener harvest what it planted? (FINDINGS A1) ---
  // everReady is CUMULATIVE and sampled every week regardless of attendance (a handle ripe mid-season
  // counts even if it later rotted, and even if the gardener never opened the app that week), so the rate
  // honestly penalises misses; a crop that's harvested without ever being flagged ready (early harvest)
  // still counts as harvested but not against the denominator. With a visit-skip persona, ripe crops in an
  // absence gap go unharvested → everReady > ripeHarvested → the rate finally drops below 100%.
  /** Distinct ever-ripe handles that got a successful harvest (∩ of harvested handles and everReady). */
  ripeHarvested: number;
  /** ripeHarvested / harvestSignalsOffered — the headline "harvest most of what's ripe" rate (null if nothing ripened). */
  harvestRate: number | null;
  /** plantedOut / sownIndoor — the link-2 funnel: did seedlings reach a bed, or strand in the tray? (null if none sown indoors). */
  plantOutRate: number | null;
}

/** "A tomat (ready)" → "A"; null when the item isn't a ready signal. */
function readyHandle(item: string): string | null {
  return item.includes("(ready)") ? item.split(" ")[0] : null;
}

export function computeSeasonOutcome(entries: TranscriptEntry[]): SeasonOutcome {
  const okActions = (action: string) =>
    entries.filter(
      (e): e is Extract<TranscriptEntry, { kind: "action" }> =>
        e.kind === "action" && e.action.action === action && e.result.ok,
    );

  const sownIndoor = okActions("sow_indoor").length;
  const sown = sownIndoor + okActions("sow_outdoor").length;
  const harvested = okActions("harvest").length;
  const removedOrFailed = okActions("remove_planting").length;
  const plantedOut = okActions("plant_out").length;

  // Distinct handles the gardener successfully harvested (the action carries the planting handle).
  const harvestedHandles = new Set<string>();
  for (const e of okActions("harvest")) {
    if (e.action.action === "harvest") harvestedHandles.add(e.action.planting);
  }

  const everReady = new Set<string>();
  let finalReady = new Set<string>();
  for (const e of entries) {
    if (e.kind !== "observe") continue;
    const ready = new Set<string>();
    for (const item of e.offered.harvestSoon) {
      const h = readyHandle(item);
      if (h) {
        everReady.add(h);
        ready.add(h);
      }
    }
    finalReady = ready; // ends as the last observation's ready set
  }

  let ripeHarvested = 0;
  for (const h of harvestedHandles) {
    if (everReady.has(h)) ripeHarvested += 1;
  }

  return {
    sown,
    sownIndoor,
    plantedOut,
    harvested,
    removedOrFailed,
    harvestSignalsOffered: everReady.size,
    ripeAtSeasonEnd: finalReady.size,
    ripeHarvested,
    harvestRate: everReady.size > 0 ? ripeHarvested / everReady.size : null,
    plantOutRate: sownIndoor > 0 ? plantedOut / sownIndoor : null,
  };
}
