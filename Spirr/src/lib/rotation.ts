import type { PlantFamily } from "./families";
import type { PlantInfo, Planting } from "../types";

/**
 * Rotation history for a single box: which plant families were grown there in the
 * recent past, and in which years. Shared primitive — Increment G's warning chip
 * and (next) Increment B's smart box ranking both read from this, so the
 * "same family N years running" rule lives in exactly one place.
 */
export interface BoxRotationHistory {
  /** family → years it was grown in the box (descending), within the lookback window */
  byFamily: Map<PlantFamily, number[]>;
}

/** Default rotation window. Gardening ideal is a 4-year cycle; we warn at a repeat within 2. */
export const ROTATION_LOOKBACK_YEARS = 2;

/**
 * Standard `familyOf` resolver for {@link boxRotationHistory}: a planting's family via the plant
 * lookup, **excluding perennials**. A perennial (jordbær, rabarbra, …) stays in its bed across
 * seasons — it isn't a rotated crop, so its presence must not generate phantom "you grew this
 * family here in 2024 and 2025" rotation pressure against other plants of the same family. Returns
 * undefined for perennials and for free-text plantings with no known plant, both of which the
 * history then skips. Shared so the perennial rule lives in one place across all call sites.
 */
export function plantingFamilyResolver(
  findPlant: (key: string) => PlantInfo | undefined,
): (planting: Planting) => PlantFamily | undefined {
  return (planting) => {
    const plant = findPlant(planting.plantKey);
    if (!plant || plant.perennial) {
      return undefined;
    }
    return plant.family;
  };
}

/**
 * Build the rotation history for `boxId` relative to `referenceYear` (usually the year
 * the user is planting into). Past seasons within `lookbackYears` always count. The current
 * season counts only once the bed has been *cleared* (status harvested/removed/failed) —
 * replanting the same family into a just-emptied bed (e.g. carrot → Høst → carrot again) is
 * a real rotation concern and the case users hit after harvesting. A *still-active*
 * current-season planting is a companion/duplicate, not a rotation conflict, so it's skipped
 * (this also keeps an edited planting from warning against itself).
 *
 * `familyOf` resolves a planting to its family via the plant lookup; it returns undefined
 * for free-text plantings with no known plant, which are skipped. `"other"` is also skipped
 * — it's too generic to base a rotation warning on.
 */
export function boxRotationHistory(
  plantings: Planting[],
  boxId: string,
  familyOf: (planting: Planting) => PlantFamily | undefined,
  referenceYear: number,
  lookbackYears: number = ROTATION_LOOKBACK_YEARS,
): BoxRotationHistory {
  const minYear = referenceYear - lookbackYears;
  const byFamily = new Map<PlantFamily, number[]>();

  for (const planting of plantings) {
    if (planting.boxId !== boxId) {
      continue;
    }
    if (planting.year < minYear || planting.year > referenceYear) {
      continue;
    }
    if (planting.year === referenceYear && planting.status === "active") {
      continue;
    }
    const family = familyOf(planting);
    if (!family || family === "other") {
      continue;
    }
    const years = byFamily.get(family) ?? [];
    if (!years.includes(planting.year)) {
      years.push(planting.year);
      byFamily.set(family, years);
    }
  }

  for (const years of byFamily.values()) {
    years.sort((a, b) => b - a);
  }
  return { byFamily };
}

/** Years (descending) that `family` was grown in the box within the lookback window. Empty array = no conflict. */
export function familyConflictYears(history: BoxRotationHistory, family: PlantFamily): number[] {
  return history.byFamily.get(family) ?? [];
}

/** Format a year list for Norwegian prose: [2025, 2024] → "2024 og 2025"; [2025,2024,2023] → "2023, 2024 og 2025". */
export function formatYearList(years: number[]): string {
  const sorted = [...years].sort((a, b) => a - b).map(String);
  if (sorted.length <= 1) {
    return sorted[0] ?? "";
  }
  return `${sorted.slice(0, -1).join(", ")} og ${sorted[sorted.length - 1]}`;
}
