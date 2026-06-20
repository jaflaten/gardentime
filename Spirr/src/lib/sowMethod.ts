// Sow-method resolution + the bounded GDD establishment credit (Increment L). Pure, React-free, so
// both GDD consumers (seasonTimeline + SowNowCard) and the add forms share one source of truth for
// the question "was this planting pre-cultivated, or direct-sown?" — and apply the *same* harvest math.

import type { PlantInfo, Planting } from "../types";

export type SowMethod = "direct" | "transplant";

/**
 * Cap the establishment credit at this fraction of a crop's total maturity. Without it, subtracting a
 * fixed credit from a fast crop (reddik is only 220 GDD) would "harvest on plant-out". Also bounds the
 * unknown-value fallback. Keep in sync with the value documented on `PlantInfo.gddEstablishment`.
 */
export const MAX_ESTABLISHMENT_FRACTION = 0.4;

/** Fallback establishment when a crop has no `gddEstablishment` tag: a modest fraction of maturity. */
const FALLBACK_ESTABLISHMENT_FRACTION = 0.3;

/** The two methods are a mutually-exclusive pair; this returns the other one. */
function otherMethod(method: SowMethod): SowMethod {
  return method === "transplant" ? "direct" : "transplant";
}

/**
 * The crop's *default* sow method = the baseline its `gddToMaturity` was calibrated against
 * (`types/index.ts`): a `transplant` sow rule ⇒ from-transplant (forkultivert), otherwise from-sow
 * (direkte). Keeping the default ≡ the calibration baseline is what makes the establishment offset
 * exactly 0 in the default state, so an untouched planting predicts identically to before Increment L.
 */
export function defaultSowMethod(plant: PlantInfo | undefined): SowMethod {
  return plant?.sowRules?.some((rule) => rule.type === "transplant") ? "transplant" : "direct";
}

/**
 * Resolve whether a planting was pre-cultivated, from one place. Order: an explicit `startMethod`
 * (the box-add ticker) wins; then Increment K's `transplantedDate` provenance (it was planted out
 * from the seedling tray); else the crop's default. Never test `startMethod`/`transplantedDate`
 * directly for this — always go through here so the three signals can't drift apart.
 */
export function resolveSowMethod(planting: Planting, plant: PlantInfo | undefined): SowMethod {
  if (planting.startMethod) {
    return planting.startMethod;
  }
  if (planting.transplantedDate) {
    return "transplant";
  }
  return defaultSowMethod(plant);
}

/**
 * Effective GDD-to-maturity for a planting given its resolved sow method. The bounded establishment
 * credit is applied **only when the method deviates from the crop's calibration baseline**:
 *  - default method ⇒ value as-is (byte-identical to pre-L behaviour — the zero-regression guarantee)
 *  - forkultivert on a natural-direct crop ⇒ `− establishment` (indoor head-start ⇒ earlier harvest)
 *  - direkte on a natural-transplant crop ⇒ `+ establishment` (seed→seedling now outdoors ⇒ later)
 *
 * The credit is clamped to {@link MAX_ESTABLISHMENT_FRACTION} of maturity so fast crops can't collapse,
 * and the result has a matching floor. Returns undefined when the plant has no GDD model, so callers
 * fall back to `weeksFromSowing` exactly as today (custom/untagged plants are unaffected — v1 is
 * GDD-only).
 */
export function effectiveGddToMaturity(plant: PlantInfo | undefined, method: SowMethod): number | undefined {
  const base = plant?.gddToMaturity;
  if (!base) {
    return undefined;
  }
  if (method === defaultSowMethod(plant)) {
    return base;
  }
  const establishment = Math.min(
    plant.gddEstablishment ?? base * FALLBACK_ESTABLISHMENT_FRACTION,
    base * MAX_ESTABLISHMENT_FRACTION,
  );
  if (method === "transplant") {
    // Pre-cultivated a natural-direct crop: credit the head-start (floored for safety).
    return Math.max(base - establishment, base * (1 - MAX_ESTABLISHMENT_FRACTION));
  }
  // Direct-sown a natural-transplant crop: the establishment phase now happens outdoors.
  return base + establishment;
}

export { otherMethod };
