import type { BedType } from "./boxMeta";
import type { PlantInfo } from "../types";

// Growing-degree-day harvest model (Increment I, Layer 0). Pure math over the station's cumulative
// GDD curve (shipped in frost-normals.json), kept out of React so it's testable in isolation.
//
// A crop matures after accumulating ~`gddToMaturity` degree-days above its base temperature. How
// many *calendar* days that takes depends on the location's warmth, so the same number gives an
// earlier harvest in Oslo than in a cold valley — the calibration the fixed `weeksFromSowing` rule
// can't express. Returns null whenever the inputs don't support a GDD estimate, so callers fall
// back to `weeksFromSowing` with no behaviour change for untagged/custom plants or no-location users.

// Day-of-year anchors for the 13 cumulative checkpoints (end of each month, non-leap reference).
// index 0 = year start (DOY 0, value 0); index k = last DOY of month k. Leap years drift ≤1 day,
// negligible at monthly resolution.
const CHECKPOINT_DOYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365] as const;

/**
 * Heat bonus for a covered bed: a greenhouse/tunnel traps warmth, so the crop accumulates GDD
 * faster than the outdoor curve. A first-order multiplier on post-anchor accumulation — crude
 * (a real greenhouse is solar-driven, not air-proportional, so this *under*-credits cold-region
 * greenhouses), but enough to stop a mild-climate covered tomato reading "won't ripen". 1 = uncovered.
 */
export function coverGddFactor(bedType: BedType | undefined): number {
  if (bedType === "greenhouse") {
    return 1.5;
  }
  if (bedType === "tunnel") {
    return 1.25;
  }
  return 1;
}

/** Cumulative GDD at an arbitrary day-of-year, linearly interpolated between monthly checkpoints. */
export function cumulativeGddAtDoy(curve: number[], doy: number): number {
  if (doy <= 0) {
    return 0;
  }
  if (doy >= CHECKPOINT_DOYS[12]) {
    return curve[12];
  }
  for (let k = 0; k < 12; k += 1) {
    const d0 = CHECKPOINT_DOYS[k];
    const d1 = CHECKPOINT_DOYS[k + 1];
    if (doy <= d1) {
      const t = (doy - d0) / (d1 - d0);
      return curve[k] + t * (curve[k + 1] - curve[k]);
    }
  }
  return curve[12];
}

/**
 * Day-of-year at which `gddToMaturity` degree-days have accumulated past the anchor, or null if the
 * curve never reaches that total within the year (the crop won't ripen outdoors at this location).
 */
export function predictHarvestDoy(
  curve: number[],
  gddToMaturity: number,
  anchorDoy: number,
  coverFactor = 1,
): number | null {
  // A covered bed makes each post-anchor day worth `coverFactor`× — equivalently, the crop needs
  // fewer *outdoor* degree-days to reach maturity, so divide the requirement by the factor.
  const target = cumulativeGddAtDoy(curve, anchorDoy) + gddToMaturity / coverFactor;
  if (curve[12] < target) {
    return null;
  }
  for (let k = 0; k < 12; k += 1) {
    const g0 = curve[k];
    const g1 = curve[k + 1];
    if (g1 >= target) {
      if (g1 === g0) {
        continue;
      }
      const d0 = CHECKPOINT_DOYS[k];
      const d1 = CHECKPOINT_DOYS[k + 1];
      const t = (target - g0) / (g1 - g0);
      return Math.round(d0 + t * (d1 - d0));
    }
  }
  return null;
}

export interface GddHarvest {
  /** Estimated harvest band [startDoy, endDoy] for the timeline. Null when the crop won't ripen. */
  window: [number, number] | null;
  /** False ⇒ the curve never reaches maturity within the year (needs greenhouse/tunnel here). */
  ripens: boolean;
}

/**
 * GDD-based harvest window for a planting, or null when the GDD model doesn't apply (plant has no
 * `gddToMaturity`, or no station curve) — caller should then use the `weeksFromSowing` rule.
 *
 * `anchorDoy` is the outdoor start (transplant date if the plant transplants, else sow date).
 * The band runs from the predicted first harvest for `harvestDurationWeeks` (continuous croppers
 * draw a longer bar), with a 2-week floor so one-shot crops still show a visible window.
 */
export function gddHarvestWindow(
  plant: PlantInfo | undefined,
  anchorDoy: number,
  curve5: number[] | undefined,
  curve10: number[] | undefined,
  coverFactor = 1,
): GddHarvest | null {
  if (!plant?.gddToMaturity) {
    return null;
  }
  const curve = (plant.gddBase ?? 5) === 10 ? curve10 : curve5;
  if (!curve || curve.length < 13) {
    return null;
  }
  const start = predictHarvestDoy(curve, plant.gddToMaturity, anchorDoy, coverFactor);
  if (start === null) {
    return { window: null, ripens: false };
  }
  const bandWeeks = Math.max(plant.harvestDurationWeeks ?? 0, 2);
  return { window: [start, start + bandWeeks * 7], ripens: true };
}
