// Pure derivation of "Hagen i tall" (garden insights) numbers from the existing garden data —
// no new metadata, no store change. Kept out of the component (like seasonTimeline.ts) so the
// math is testable in isolation and the view stays dumb.
//
// Scoping rule (the subtle part, learned from Increment K): the *composition* charts describe the
// garden as it stands now, so they count **active boxed plantings only** — a planting that is
// `active` and has a `boxId`. Indoor seedlings (no `boxId`) live on the windowsill, not in the
// grid, so they are excluded here exactly as they are from every other garden view. Harvested /
// removed / failed rows are past, so they drop out of composition too (but they DO feed the
// season-status and per-year history, which is where looking back is the point).

import { now } from "./clock";
import { FAMILY_INFO, type PlantFamily } from "./families";
import { isIndoorSeedling } from "./planting";
import { ROTATION_LOOKBACK_YEARS } from "./rotation";
import type { Box, PlantInfo, Planting } from "../types";

export interface CountEntry {
  /** Stable identifier for the bucket. Species: a plantKey, or `custom:<name>` for free-text rows.
   *  Family: a PlantFamily key (or "other"). Category: a PlantCategory key (or "unknown"). */
  id: string;
  count: number;
}

export type StatusKey = "active" | "harvested" | "failed" | "removed";

export interface GardenStats {
  /** Number of active boxed planting *rows*. */
  totalActive: number;
  /** Sum of `quantity` (a row with no quantity counts as 1) over active boxed plantings. */
  totalPlants: number;
  /** Distinct species (plantKey or free-text name) currently growing. */
  distinctSpecies: number;
  /** Distinct plant families currently growing. */
  distinctFamilies: number;
  bedsUsed: number;
  bedsTotal: number;
  /** Composition breakdowns, each sorted by count desc (ties broken by id for stable order). */
  byCategory: CountEntry[];
  byFamily: CountEntry[];
  bySpecies: CountEntry[];
  /** Status mix of *this calendar year's* plantings (boxed) — the arc of the running season. */
  statusThisYear: Record<StatusKey, number>;
  /** Plantings per year (boxed, all statuses), ascending. The multi-year flywheel made visible. */
  byYear: Array<{ year: number; count: number }>;
  currentYear: number;
}

/** A planting that occupies a bed right now: active and assigned to a box (not a windowsill seedling). */
function isActiveInGarden(p: Planting): boolean {
  return p.status === "active" && !isIndoorSeedling(p);
}

/** Activity counts by calendar month (index 0–11) — sow events (plantedDate) and harvest events. */
export interface ActivityByMonth {
  sow: number[];
  harvest: number[];
  /** Largest single value across both rows, for scaling cell intensity (≥1). */
  max: number;
}

/**
 * Aggregate sow/harvest activity by month-of-year across *all* boxed plantings (every season folded
 * together) — the garden's seasonal rhythm. Indoor seedlings are excluded; a sow counts on its
 * `plantedDate`, a harvest on its `harvestDate`. Drives the "Hageaktivitet" heatmap.
 */
export function computeActivityByMonth(plantings: Planting[]): ActivityByMonth {
  const sow = new Array(12).fill(0);
  const harvest = new Array(12).fill(0);
  for (const p of plantings) {
    if (isIndoorSeedling(p)) {
      continue;
    }
    const sowMonth = Number(p.plantedDate.slice(5, 7)) - 1;
    if (sowMonth >= 0 && sowMonth < 12) {
      sow[sowMonth] += 1;
    }
    if (p.harvestDate) {
      const hMonth = Number(p.harvestDate.slice(5, 7)) - 1;
      if (hMonth >= 0 && hMonth < 12) {
        harvest[hMonth] += 1;
      }
    }
  }
  const max = Math.max(1, ...sow, ...harvest);
  return { sow, harvest, max };
}

export interface RotationCell {
  year: number;
  /** Dominant family grown in this box that year, or null when nothing was grown. */
  family: PlantFamily | null;
  emoji: string;
  color: string;
  /** Plantings in the box that year (all families). */
  count: number;
  /** The dominant family is a rotated (non-perennial) crop that also appeared here within the lookback window. */
  conflict: boolean;
}

export interface RotationRow {
  boxId: string;
  boxName: string;
  cells: RotationCell[];
}

export interface RotationMatrix {
  years: number[];
  rows: RotationRow[];
}

/** Cap the heatmap width so it stays readable; show the most recent N seasons. */
const ROTATION_MAX_YEARS = 6;

/**
 * Build the crop-rotation heatmap: boxes (rows) × recent years (columns), each cell coloured by the
 * dominant plant family grown there that year, flagged when a *rotated* family repeats within
 * {@link ROTATION_LOOKBACK_YEARS}. Perennials are shown but never flagged (they're meant to stay put).
 * Only boxes with at least one boxed planting in the window appear.
 */
export function computeRotationMatrix(
  plantings: Planting[],
  boxes: Box[],
  findPlant: (key: string) => PlantInfo | undefined,
): RotationMatrix {
  const boxed = plantings.filter((p) => !isIndoorSeedling(p));
  if (boxed.length === 0) {
    return { years: [], rows: [] };
  }
  const allYears = Array.from(new Set(boxed.map((p) => p.year))).sort((a, b) => a - b);
  const years = allYears.slice(-ROTATION_MAX_YEARS);
  const yearSet = new Set(years);

  // Per box: year → (family → count), and a flat year → families-present set (for conflict lookups,
  // restricted to rotated/non-perennial families that aren't the generic "other").
  const byBox = new Map<string, Map<number, Map<PlantFamily, number>>>();
  const rotatedByBox = new Map<string, Map<number, Set<PlantFamily>>>();

  for (const p of boxed) {
    if (!p.boxId || !yearSet.has(p.year)) {
      continue;
    }
    const plant = findPlant(p.plantKey);
    const family = plant?.family ?? "other";

    const yearMap = byBox.get(p.boxId) ?? new Map();
    const famMap = yearMap.get(p.year) ?? new Map<PlantFamily, number>();
    famMap.set(family, (famMap.get(family) ?? 0) + 1);
    yearMap.set(p.year, famMap);
    byBox.set(p.boxId, yearMap);

    if (plant && !plant.perennial && family !== "other") {
      const rYearMap = rotatedByBox.get(p.boxId) ?? new Map();
      const set = rYearMap.get(p.year) ?? new Set<PlantFamily>();
      set.add(family);
      rYearMap.set(p.year, set);
      rotatedByBox.set(p.boxId, rYearMap);
    }
  }

  const rows: RotationRow[] = [];
  for (const box of boxes) {
    const yearMap = byBox.get(box.id);
    if (!yearMap) {
      continue;
    }
    const cells: RotationCell[] = years.map((year) => {
      const famMap = yearMap.get(year);
      if (!famMap || famMap.size === 0) {
        return { year, family: null, emoji: "", color: "transparent", count: 0, conflict: false };
      }
      // Dominant family = most plantings that year (ties broken by family key for stability).
      const [family] = [...famMap.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      const total = [...famMap.values()].reduce((s, n) => s + n, 0);
      const info = FAMILY_INFO[family];
      // Conflict: the dominant family is a rotated crop that also appeared here in a prior year
      // within the lookback window.
      const rYearMap = rotatedByBox.get(box.id);
      let conflict = false;
      if (rYearMap && family !== "other") {
        const plantIsRotated = rYearMap.get(year)?.has(family) ?? false;
        if (plantIsRotated) {
          for (let prev = year - ROTATION_LOOKBACK_YEARS; prev < year; prev += 1) {
            if (rYearMap.get(prev)?.has(family)) {
              conflict = true;
              break;
            }
          }
        }
      }
      return { year, family, emoji: info.emoji, color: info.color, count: total, conflict };
    });
    rows.push({ boxId: box.id, boxName: box.name, cells });
  }

  return { years, rows };
}

/** The species bucket id for a planting: its plantKey, or a `custom:` namespaced free-text name. */
function speciesId(p: Planting): string {
  if (p.plantKey) {
    return p.plantKey;
  }
  return `custom:${(p.customName || "Ukjent").trim().toLowerCase()}`;
}

/** Roll a list of ids into CountEntry[] sorted by count desc, then id asc for a stable tie order. */
function tally(ids: string[]): CountEntry[] {
  const map = new Map<string, number>();
  for (const id of ids) {
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return Array.from(map, ([id, count]) => ({ id, count })).sort(
    (a, b) => b.count - a.count || a.id.localeCompare(b.id),
  );
}

export function computeGardenStats(
  plantings: Planting[],
  boxes: Array<{ id: string }>,
  findPlant: (key: string) => PlantInfo | undefined,
  today: Date = now(),
): GardenStats {
  const currentYear = today.getFullYear();
  const active = plantings.filter(isActiveInGarden);

  const totalPlants = active.reduce((sum, p) => sum + (p.quantity ?? 1), 0);

  const bySpecies = tally(active.map(speciesId));
  const byFamily = tally(active.map((p) => findPlant(p.plantKey)?.family ?? "other"));
  const byCategory = tally(active.map((p) => findPlant(p.plantKey)?.category ?? "unknown"));

  // Beds in use: distinct boxIds carrying an active planting, intersected with boxes that still exist.
  const boxIds = new Set(boxes.map((b) => b.id));
  const usedBoxIds = new Set(
    active.map((p) => p.boxId).filter((id): id is string => id !== undefined && boxIds.has(id)),
  );

  const statusThisYear: Record<StatusKey, number> = { active: 0, harvested: 0, failed: 0, removed: 0 };
  for (const p of plantings) {
    if (isIndoorSeedling(p) || p.year !== currentYear) {
      continue;
    }
    statusThisYear[p.status] += 1;
  }

  const yearMap = new Map<number, number>();
  for (const p of plantings) {
    if (isIndoorSeedling(p)) {
      continue;
    }
    yearMap.set(p.year, (yearMap.get(p.year) ?? 0) + 1);
  }
  const byYear = Array.from(yearMap, ([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year);

  return {
    totalActive: active.length,
    totalPlants,
    distinctSpecies: bySpecies.length,
    distinctFamilies: byFamily.length,
    bedsUsed: usedBoxIds.size,
    bedsTotal: boxIds.size,
    byCategory,
    byFamily,
    bySpecies,
    statusThisYear,
    byYear,
    currentYear,
  };
}
