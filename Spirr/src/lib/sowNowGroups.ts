// The grouping logic behind the SowNowCard ("Hva passer å så nå?") — extracted from the component so
// the headless sim snapshot (sim/observe/snapshot.ts) and the rendered screen build the same groups
// from one source of truth. Pure: takes the day-of-year and a `now` Date explicitly (no `new Date()` /
// no clock seam), so a pinned clock (`?simNow=`, sim runs) is honoured and the result is testable.

import { coverGddFactor, gddHarvestWindow } from "./gdd";
import { dateToDoy, mmddToDoy, seasonalShiftForPlant, type GddCurves } from "./seasonTimeline";
import { effectiveGddToMaturity, resolveSowMethod } from "./sowMethod";
import { isSowableNow, weeksFromLastFrost, withinAfterLFWindow, withinIndoorWindow } from "./sowWindow";
import type { Box, PlantInfo, Planting } from "../types";

export interface SowNowRow {
  plant: PlantInfo;
  helper: string;
  /** Planting id for "Suksesjon"/"Høst snart" rows so they can link to the right history entry. */
  plantingId?: string;
  /** How many active plantings this row represents (>1 shows a "×N" badge). Used by "Høst snart". */
  count?: number;
  /** Optional amber caveat under the helper (e.g. rain-sensitive → "sett under tak"). */
  note?: string;
}

export interface SowNowGroups {
  indoor: SowNowRow[];
  outdoor: SowNowRow[];
  transplant: SowNowRow[];
}

/** Location fields the harvest-soon math needs (a structural subset of ResolvedLocation). */
export interface HarvestLocation {
  lastFrostDoy: number;
  firstFrostDoy: number;
  gddCurve5: number[];
  gddCurve10: number[];
}

export type HarvestStatus = "ready" | "soon";

const MS_PER_WEEK = 7 * 86_400_000;

/** Whole weeks between a planting's sow date and `now` (clock-safe — `now` is passed in). */
function weeksSince(plantedDate: string, now: Date): number {
  const sown = new Date(`${plantedDate}T00:00:00`);
  return Math.floor((now.getTime() - sown.getTime()) / MS_PER_WEEK);
}

/** "Så inne / Så ute / Plant ut" — the first sow rule whose window includes today, per plant. */
export function groupSowNow(plants: PlantInfo[], lastFrostDoy: number, doy: number): SowNowGroups {
  const wks = weeksFromLastFrost(doy, lastFrostDoy);
  const indoor: SowNowRow[] = [];
  const outdoor: SowNowRow[] = [];
  const transplant: SowNowRow[] = [];
  for (const plant of plants) {
    if (!plant.sowRules) continue;
    for (const rule of plant.sowRules) {
      if (rule.type === "indoor" && withinIndoorWindow(rule, wks)) {
        indoor.push({ plant, helper: `${rule.weeksBeforeLastFrost[0]}–${rule.weeksBeforeLastFrost[1]} uker før vårfrost` });
        break;
      }
      if (rule.type === "outdoor" && withinAfterLFWindow(rule.weeksAfterLastFrost, wks)) {
        const soilNote = rule.minSoilTempC != null ? ` (jord ≥${rule.minSoilTempC}°C)` : "";
        outdoor.push({
          plant,
          helper: `${rule.weeksAfterLastFrost[0]}–${rule.weeksAfterLastFrost[1]} uker etter vårfrost${soilNote}`,
        });
        break;
      }
      if (rule.type === "transplant" && withinAfterLFWindow(rule.weeksAfterLastFrost, wks)) {
        transplant.push({
          plant,
          helper: `${rule.weeksAfterLastFrost[0]}–${rule.weeksAfterLastFrost[1]} uker etter vårfrost`,
          note: plant.rainSensitive ? "Liker ikke regn — sett under tak (drivhus/tunnel)" : undefined,
        });
        break;
      }
    }
  }
  return { indoor, outdoor, transplant };
}

/**
 * "Suksesjon" — crops that reward staggered sowing (salat, reddik). Once the most recent active batch
 * of such a crop is at least its `successionWeeks` old, nudge a fresh sowing. Keyed on the latest batch
 * (so re-sowing clears the nudge for another interval) and gated on the crop still being sowable today.
 */
export function groupSuccession(
  plantings: Planting[],
  plants: PlantInfo[],
  lastFrostDoy: number,
  doy: number,
  now: Date,
): SowNowRow[] {
  const succession: SowNowRow[] = [];
  const latestActiveByKey = new Map<string, Planting>();
  for (const planting of plantings) {
    // Skip indoor seedlings (no boxId) — they're not yet a sown batch in a bed.
    if (planting.status !== "active" || !planting.plantKey || !planting.boxId) continue;
    const prev = latestActiveByKey.get(planting.plantKey);
    if (!prev || planting.plantedDate > prev.plantedDate) {
      latestActiveByKey.set(planting.plantKey, planting);
    }
  }
  for (const [key, planting] of latestActiveByKey) {
    const plant = plants.find((p) => p.key === key);
    if (!plant?.successionWeeks || !isSowableNow(plant, lastFrostDoy, doy)) continue;
    const weeks = weeksSince(planting.plantedDate, now);
    if (weeks >= plant.successionWeeks) {
      succession.push({
        plant,
        helper: `Sist sådd for ${weeks} uker siden — så en ny pott for jevn høst`,
        plantingId: planting.id,
      });
    }
  }
  return succession;
}

/**
 * Whether a single boxed planting is "harvest soon" today, and how soon. Prefers the GDD model when the
 * plant is tagged and a station curve is available (location-aware ripening), else the fixed
 * weeks-since-sowing window. GDD anchors on the outdoor start (transplant date if present, else sow date)
 * and only applies to a planting started this year. `now` is passed in so the clock seam is honoured.
 */
export function harvestSoonForPlanting(
  planting: Planting,
  plant: PlantInfo,
  now: Date,
  todayDoy: number,
  firstFrostDoy: number,
  seasonalShift: number,
  curves?: GddCurves,
  coverFactor = 1,
): { matches: boolean; helper: string; status: HarvestStatus } {
  const rule = plant.harvestRule;
  if (!rule) {
    return { matches: false, helper: "", status: "soon" };
  }
  const year = now.getFullYear();
  if ("seasonal" in rule) {
    // Absolute calendar window (perennials), shifted toward the user's frost dates.
    const start = mmddToDoy(rule.seasonal[0], year) + seasonalShift;
    const end = mmddToDoy(rule.seasonal[1], year) + seasonalShift;
    if (todayDoy >= start && todayDoy <= end) {
      return { matches: true, helper: "Høstesesong nå", status: "ready" };
    }
    return { matches: false, helper: "", status: "soon" };
  }
  if ("weeksBeforeFirstFrost" in rule) {
    const weeksUntilFrost = (firstFrostDoy - todayDoy) / 7;
    if (weeksUntilFrost >= 0 && weeksUntilFrost <= rule.weeksBeforeFirstFrost + 2) {
      const status: HarvestStatus = weeksUntilFrost <= rule.weeksBeforeFirstFrost ? "ready" : "soon";
      return { matches: true, helper: `Frost om ca. ${Math.max(0, Math.round(weeksUntilFrost))} uker`, status };
    }
    return { matches: false, helper: "", status: "soon" };
  }
  // weeksFromSowing — GDD when tagged + curve present, else the fixed weeks-since-sowing window.
  const transplantDoy =
    planting.transplantedDate && Number(planting.transplantedDate.slice(0, 4)) === year
      ? dateToDoy(new Date(`${planting.transplantedDate}T00:00:00`))
      : null;
  const plantedDoyThisYear =
    Number(planting.plantedDate.slice(0, 4)) === year
      ? dateToDoy(new Date(`${planting.plantedDate}T00:00:00`))
      : null;
  const anchorDoy = transplantDoy ?? plantedDoyThisYear;
  const effMaturity = effectiveGddToMaturity(plant, resolveSowMethod(planting, plant));
  const gdd =
    curves && anchorDoy !== null
      ? gddHarvestWindow(plant, anchorDoy, curves.base5, curves.base10, coverFactor, effMaturity)
      : null;
  const [minWeeks, maxWeeks] = rule.weeksFromSowing;
  // Trust the GDD window only when it ripens no later than the weeksFromSowing field rule (see
  // resolveHarvestWindow — squash-in-October fix); otherwise fall through to the field rule below.
  const fieldStartDoy = plantedDoyThisYear !== null ? plantedDoyThisYear + minWeeks * 7 : null;
  if (gdd && gdd.ripens && gdd.window && (fieldStartDoy === null || gdd.window[0] <= fieldStartDoy)) {
    const [start, end] = gdd.window;
    if (todayDoy >= start - 14 && todayDoy <= end) {
      const ready = todayDoy >= start;
      const helper = ready ? "Moden nå" : `Moden om ca. ${Math.max(1, Math.round((start - todayDoy) / 7))} uker`;
      return { matches: true, helper, status: ready ? "ready" : "soon" };
    }
    return { matches: false, helper: "", status: "soon" };
  }
  if (gdd && !gdd.ripens && coverFactor <= 1) {
    // Won't ripen outdoors here — never "harvest soon".
    return { matches: false, helper: "", status: "soon" };
  }
  const weeks = weeksSince(planting.plantedDate, now);
  if (weeks >= minWeeks - 1 && weeks <= maxWeeks + 1) {
    return { matches: true, helper: `Sådd for ${weeks} uker siden`, status: "ready" };
  }
  return { matches: false, helper: "", status: "soon" };
}

/**
 * "Høst snart" — active boxed plantings whose harvest rule matches today, collapsed to one row per plant
 * with a count (so a garden with ten jordbær beds shows "Jordbær ×10", not ten lines).
 */
export function groupHarvestSoon(
  plantings: Planting[],
  plants: PlantInfo[],
  boxes: Box[],
  location: HarvestLocation,
  doy: number,
  now: Date,
): SowNowRow[] {
  const harvestSoon: SowNowRow[] = [];
  const byKey = new Map<string, SowNowRow>();
  for (const planting of plantings) {
    // Indoor seedlings (no boxId) can't be "harvest soon" — they haven't been planted out.
    if (planting.status !== "active" || !planting.boxId) continue;
    const plant = plants.find((p) => p.key === planting.plantKey);
    if (!plant?.harvestRule) continue;
    const shift = seasonalShiftForPlant(plant.key, location.lastFrostDoy);
    const coverFactor = coverGddFactor(boxes.find((b) => b.id === planting.boxId)?.bedType);
    const check = harvestSoonForPlanting(
      planting,
      plant,
      now,
      doy,
      location.firstFrostDoy,
      shift,
      { base5: location.gddCurve5, base10: location.gddCurve10 },
      coverFactor,
    );
    if (!check.matches) continue;
    const existing = byKey.get(plant.key);
    if (existing) {
      existing.count = (existing.count ?? 1) + 1;
    } else {
      const row: SowNowRow = { plant, helper: check.helper, plantingId: planting.id, count: 1 };
      byKey.set(plant.key, row);
      harvestSoon.push(row);
    }
  }
  return harvestSoon;
}
