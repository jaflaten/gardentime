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
  /** Successful plant_out (seedling → bed). */
  plantedOut: number;
  /** Successful harvest actions. */
  harvested: number;
  /** Successful remove_planting (removed or failed). */
  removedOrFailed: number;
  /** Distinct plantings the app flagged "(ready)" to harvest at any point in the run. */
  harvestSignalsOffered: number;
  /** Distinct plantings still flagged "(ready)" in the final observation — ripe, unharvested at season end. */
  ripeAtSeasonEnd: number;
}

/** "A tomat (ready)" → "A"; null when the item isn't a ready signal. */
function readyHandle(item: string): string | null {
  return item.includes("(ready)") ? item.split(" ")[0] : null;
}

export function computeSeasonOutcome(entries: TranscriptEntry[]): SeasonOutcome {
  const okCount = (action: string) =>
    entries.filter((e) => e.kind === "action" && e.action.action === action && e.result.ok).length;

  const sown = okCount("sow_indoor") + okCount("sow_outdoor");
  const harvested = okCount("harvest");
  const removedOrFailed = okCount("remove_planting");

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

  return {
    sown,
    plantedOut: okCount("plant_out"),
    harvested,
    removedOrFailed,
    harvestSignalsOffered: everReady.size,
    ripeAtSeasonEnd: finalReady.size,
  };
}
