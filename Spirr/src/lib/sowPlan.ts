// Såplan (§2.1) — the pure math behind "Min såplan": for each *intended* crop, what's the next sow
// action and when? Derived entirely from the plant's existing `sowRules` against the user's frost
// dates — no new plant metadata. Pure and clock-free (day-of-year passed in), like sowNowGroups.
// Kept free of the store-backed seasonTimeline chain (date formatting inlined, cf. sowWindow.ts).

import type { PlantInfo, Planting } from "../types";

export type SowActionKind = "indoor" | "outdoor" | "transplant";

export const SOW_ACTION_LABEL: Record<SowActionKind, string> = {
  indoor: "Så inne",
  outdoor: "Så ute",
  transplant: "Plant ut",
};

export interface SowActionWindow {
  kind: SowActionKind;
  startDoy: number;
  endDoy: number;
}

/** Day-of-year → "dd.mm" off a fixed non-leap year (sow windows never straddle new year). */
function formatDoy(doy: number): string {
  const date = new Date(2001, 0, 1);
  date.setDate(date.getDate() + Math.round(doy) - 1);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

/** Every sow rule as an absolute doy window for this location, in the plant's rule order. */
export function sowActionWindows(plant: PlantInfo, lastFrostDoy: number): SowActionWindow[] {
  if (!plant.sowRules) {
    return [];
  }
  const windows: SowActionWindow[] = [];
  for (const rule of plant.sowRules) {
    if (rule.type === "indoor") {
      const [min, max] = rule.weeksBeforeLastFrost;
      windows.push({ kind: "indoor", startDoy: lastFrostDoy - max * 7, endDoy: lastFrostDoy - min * 7 });
    } else {
      const [min, max] = rule.weeksAfterLastFrost;
      windows.push({ kind: rule.type, startDoy: lastFrostDoy + min * 7, endDoy: lastFrostDoy + max * 7 });
    }
  }
  return windows;
}

export type NextSowActionState = "now" | "upcoming" | "past";

export interface NextSowAction {
  kind: SowActionKind;
  state: NextSowActionState;
  startDoy: number;
  endDoy: number;
  /** Norwegian helper line for the plan row, e.g. "Så inne nå — til ca. 15.04". */
  helper: string;
}

/**
 * The next relevant sow action for a planned crop: an *open* window wins (first rule whose window
 * includes today — same convention as groupSowNow), else the nearest upcoming window, else "past"
 * (all of this year's windows are over). Null when the plant has no sow rules (custom plants).
 */
export function nextActionForPlant(plant: PlantInfo, lastFrostDoy: number, doy: number): NextSowAction | null {
  const windows = sowActionWindows(plant, lastFrostDoy);
  if (windows.length === 0) {
    return null;
  }
  const active = windows.find((w) => doy >= w.startDoy && doy <= w.endDoy);
  if (active) {
    return {
      ...active,
      state: "now",
      helper: `${SOW_ACTION_LABEL[active.kind]} nå — til ca. ${formatDoy(active.endDoy)}`,
    };
  }
  const upcoming = windows.filter((w) => w.startDoy > doy).sort((a, b) => a.startDoy - b.startDoy)[0];
  if (upcoming) {
    return {
      ...upcoming,
      state: "upcoming",
      helper: `${SOW_ACTION_LABEL[upcoming.kind]} fra ca. ${formatDoy(upcoming.startDoy)}`,
    };
  }
  const last = windows.reduce((a, b) => (b.endDoy > a.endDoy ? b : a));
  return { ...last, state: "past", helper: "Så-vinduene for i år er over" };
}

/**
 * Whether a planned crop is already underway this season — any planting of it this year that wasn't
 * removed/failed (an indoor seedling counts). Started crops drop out of the reminder strip and show
 * "✓ Startet" in the plan instead.
 */
export function isStartedThisYear(plantings: Planting[], plantKey: string, year: number): boolean {
  return plantings.some(
    (p) => p.plantKey === plantKey && p.year === year && (p.status === "active" || p.status === "harvested"),
  );
}

/** Stable id for the gt_reminders dedupe map — one nudge per crop × action × season. */
export function reminderId(year: number, kind: SowActionKind, plantKey: string): string {
  return `${year}:${kind}:${plantKey}`;
}

export interface DueSowAction {
  plant: PlantInfo;
  action: NextSowAction;
  id: string;
}

/**
 * Planned crops whose sow window is open *today* and that aren't already started this season —
 * the reminder strip's content. Dismissal filtering (gt_reminders) is the caller's concern.
 */
export function dueSowActions(
  planned: PlantInfo[],
  plantings: Planting[],
  lastFrostDoy: number,
  doy: number,
  year: number,
): DueSowAction[] {
  const due: DueSowAction[] = [];
  for (const plant of planned) {
    if (isStartedThisYear(plantings, plant.key, year)) {
      continue;
    }
    const action = nextActionForPlant(plant, lastFrostDoy, doy);
    if (action?.state === "now") {
      due.push({ plant, action, id: reminderId(year, action.kind, plant.key) });
    }
  }
  return due;
}
