// "Bær & frukt i sesong der du bor" (§ perennial harvest preview) — a location-only harvest calendar
// for perennials/berries/fruit. Their `seasonal` harvest windows depend only on the station + elevation
// (via seasonalShiftForPlant), NOT on a planting date, so this works with just a postnummer — no boxes,
// no logged plantings. That makes it the zero-setup value moment (and the July onboarding hook), and it
// also fills a real gap: perennials fit the box grid badly, so "Neste til høsting" (logged plantings
// only) can't show them. Pure: today's day-of-year passed in, so a pinned clock is honoured and it's
// testable without React.

import { formatDoy } from "./location";
import { harvestWindowStatus } from "./gdd";
import { mmddToDoy, seasonalShiftForPlant } from "./seasonTimeline";
import type { PlantInfo } from "../types";

/** How far ahead a not-yet-open season still counts as "på vei" (worth showing). */
const SOON_HORIZON_DAYS = 42; // ~6 weeks

export type SeasonState = "ripe" | "soon" | "later" | "over";

export interface SeasonHarvestRow {
  plant: PlantInfo;
  state: SeasonState;
  /** Location-shifted window [startDoy, endDoy] for the current year. */
  window: [number, number];
  /** Norwegian helper line, e.g. "På topp nå — til ca. 31. juli" / "~2 uker til (fra ca. 10. juli)". */
  helper: string;
  /** Sort key: ripe first (by soonest end), then soon (by soonest start), then later, then over. */
  sortKey: number;
}

function weeksBetween(from: number, to: number): number {
  return Math.max(1, Math.round((to - from) / 7));
}

/**
 * Classify one perennial's seasonal window against today. Returns null when the plant has no
 * `seasonal` harvest rule (annuals, whose harvest needs a sow date, are out of scope here).
 */
export function seasonRowForPlant(
  plant: PlantInfo,
  lastFrostDoy: number,
  todayDoy: number,
  year: number,
): SeasonHarvestRow | null {
  const rule = plant.harvestRule;
  if (!rule || !("seasonal" in rule)) {
    return null;
  }
  const shift = seasonalShiftForPlant(plant.key, lastFrostDoy);
  const start = mmddToDoy(rule.seasonal[0], year) + shift;
  const end = mmddToDoy(rule.seasonal[1], year) + shift;

  if (todayDoy > end) {
    return { plant, state: "over", window: [start, end], helper: "Sesongen er over for i år", sortKey: 3000 + start };
  }
  if (todayDoy >= start) {
    // In season. Seasonal windows run for weeks, so use a fortnight "late" tail (matches the timeline).
    const near = harvestWindowStatus(todayDoy, start, end, 14) === "late";
    const helper = near
      ? `Snart over — høst før ca. ${formatDoy(end)}`
      : `På topp nå — til ca. ${formatDoy(end)}`;
    return { plant, state: "ripe", window: [start, end], helper, sortKey: end };
  }
  const daysToStart = start - todayDoy;
  if (daysToStart <= SOON_HORIZON_DAYS) {
    const wks = weeksBetween(todayDoy, start);
    return {
      plant,
      state: "soon",
      window: [start, end],
      helper: `~${wks} ${wks === 1 ? "uke" : "uker"} til — fra ca. ${formatDoy(start)}`,
      sortKey: 1000 + start,
    };
  }
  return { plant, state: "later", window: [start, end], helper: `Fra ca. ${formatDoy(start)}`, sortKey: 2000 + start };
}

export interface SeasonHarvestPreview {
  /** In season today, soonest-to-end first. */
  ripe: SeasonHarvestRow[];
  /** Opening within ~6 weeks, soonest first. */
  soon: SeasonHarvestRow[];
  /** Opening later this year (beyond the horizon). */
  later: SeasonHarvestRow[];
}

/**
 * Build the perennial harvest preview for a location. Feed the merged plant list (bundled + custom);
 * only perennials with a `seasonal` rule contribute. "over" rows are dropped — a finished season isn't
 * "in season". Sorted within each bucket.
 */
export function seasonHarvestPreview(
  plants: PlantInfo[],
  lastFrostDoy: number,
  todayDoy: number,
  year: number,
): SeasonHarvestPreview {
  const rows: SeasonHarvestRow[] = [];
  for (const plant of plants) {
    const row = seasonRowForPlant(plant, lastFrostDoy, todayDoy, year);
    if (row && row.state !== "over") {
      rows.push(row);
    }
  }
  rows.sort((a, b) => a.sortKey - b.sortKey);
  return {
    ripe: rows.filter((r) => r.state === "ripe"),
    soon: rows.filter((r) => r.state === "soon"),
    later: rows.filter((r) => r.state === "later"),
  };
}
