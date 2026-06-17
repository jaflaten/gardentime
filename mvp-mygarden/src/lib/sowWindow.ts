import type { PlantInfo, SowRule } from "../types";

// Shared frost-relative sow-window math. Used by the SowNowCard (D2) and the BoxDetail
// "Hva passer her nå?" panel (C2) so the "is this sowable today?" rule lives in one place.

/** Today's day-of-year (1–366). */
export function todayDoy(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Signed weeks between today and the last spring frost (positive = today is after the frost). */
export function weeksFromLastFrost(doy: number, lastFrostDoy: number): number {
  return (doy - lastFrostDoy) / 7;
}

export function withinIndoorWindow(rule: Extract<SowRule, { type: "indoor" }>, weeksFromLF: number): boolean {
  // weeksBeforeLastFrost is positive; we're inside the window when today is between
  // (LF - max weeks) and (LF - min weeks), i.e. -max <= weeksFromLF <= -min.
  const [min, max] = rule.weeksBeforeLastFrost;
  return weeksFromLF >= -max && weeksFromLF <= -min;
}

export function withinAfterLFWindow(weeks: [number, number], weeksFromLF: number): boolean {
  return weeksFromLF >= weeks[0] && weeksFromLF <= weeks[1];
}

export type SowKind = "indoor" | "outdoor" | "transplant";

/** The first sow action whose window includes today, or null if the plant isn't sowable/plantable now. */
export function matchingSowKind(plant: PlantInfo, lastFrostDoy: number, doy = todayDoy()): SowKind | null {
  if (!plant.sowRules) {
    return null;
  }
  const weeksFromLF = weeksFromLastFrost(doy, lastFrostDoy);
  for (const rule of plant.sowRules) {
    if (rule.type === "indoor" && withinIndoorWindow(rule, weeksFromLF)) {
      return "indoor";
    }
    if (rule.type === "outdoor" && withinAfterLFWindow(rule.weeksAfterLastFrost, weeksFromLF)) {
      return "outdoor";
    }
    if (rule.type === "transplant" && withinAfterLFWindow(rule.weeksAfterLastFrost, weeksFromLF)) {
      return "transplant";
    }
  }
  return null;
}

export function isSowableNow(plant: PlantInfo, lastFrostDoy: number, doy = todayDoy()): boolean {
  return matchingSowKind(plant, lastFrostDoy, doy) !== null;
}
