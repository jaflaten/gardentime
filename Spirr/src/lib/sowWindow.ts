import { now } from "./clock";
import type { PlantInfo, SowRule } from "../types";

// Shared frost-relative sow-window math. Used by the SowNowCard (D2) and the BoxDetail
// "Hva passer her nå?" panel (C2) so the "is this sowable today?" rule lives in one place.

/** Today's day-of-year (1–366). */
export function todayDoy(): number {
  const today = now();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
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

/**
 * When should an indoor seedling go out? Derived purely from the plant's existing `transplant`
 * sow rule (Increment K — no new metadata). Returns null if the plant has no transplant window.
 * - `soon`: today is before the window — `weeks` ≈ how many weeks until it opens.
 * - `ready`: today is inside the plant-out window.
 * - `overdue`: the window has passed (the seedling is getting leggy indoors).
 */
export function transplantReadiness(
  plant: PlantInfo,
  lastFrostDoy: number,
  doy = todayDoy(),
): { status: "soon" | "ready" | "overdue"; weeks: number } | null {
  const rule = plant.sowRules?.find((r) => r.type === "transplant");
  if (!rule || rule.type !== "transplant") {
    return null;
  }
  const [min, max] = rule.weeksAfterLastFrost;
  const weeksFromLF = weeksFromLastFrost(doy, lastFrostDoy);
  if (weeksFromLF < min) {
    return { status: "soon", weeks: Math.max(0, Math.round(min - weeksFromLF)) };
  }
  if (weeksFromLF > max) {
    return { status: "overdue", weeks: Math.round(weeksFromLF - max) };
  }
  return { status: "ready", weeks: 0 };
}

/** A warm-season crop that frost kills/damages (set from the catalog's `frostTender` flag). */
export function isFrostTender(plant: PlantInfo): boolean {
  return plant.frostTender === true;
}

/**
 * Soft caution shown when an indoor seedling of a frost-tender crop is planted out *before* the last
 * spring frost (`doy < lastFrostDoy`) — a late frost can kill it. Mirrors the rotation / won't-ripen
 * cautions: returns a Norwegian message, or null when there's nothing to warn about. Pure (formats the
 * frost date from a fixed reference year — last frost is always in spring, so no leap-day ambiguity).
 */
export function frostTenderPlantOutCaution(
  plant: PlantInfo,
  lastFrostDoy: number,
  doy = todayDoy(),
): string | null {
  if (!isFrostTender(plant) || doy >= lastFrostDoy) {
    return null;
  }
  // Format the frost day-of-year as dd.mm off a fixed non-leap year (last frost is always in spring,
  // so no Feb-29 ambiguity). Inlined to keep this module free of the store-backed seasonTimeline chain.
  const frostDate = new Date(2001, 0, 1);
  frostDate.setDate(frostDate.getDate() + Math.round(lastFrostDoy) - 1);
  const dd = String(frostDate.getDate()).padStart(2, "0");
  const mm = String(frostDate.getMonth() + 1).padStart(2, "0");
  return `Frostømfintlig plante — siste vårfrost er ca. ${dd}.${mm}. Frost før det kan skade utplantede planter.`;
}
