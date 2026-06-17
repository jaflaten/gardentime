import { getBedTypeLabel, getSunLabel } from "./boxMeta";
import { getFamilyName } from "./families";
import { boxRotationHistory, familyConflictYears, formatYearList } from "./rotation";
import type { PlantLanguage } from "../store/useUiStore";
import type { Box, Planting, PlantInfo } from "../types";

export type BoxFitTier = "good" | "ok" | "avoid";

export interface BoxFit {
  box: Box;
  tier: BoxFitTier;
  /** Human-readable Norwegian reasons, most important first. The UI joins these into a why-line. */
  reasons: string[];
  /** Higher = better within a tier (used for ordering). */
  score: number;
}

const TIER_RANK: Record<BoxFitTier, number> = { good: 0, ok: 1, avoid: 2 };

/**
 * Rank every box by how well it fits `plant` today. Orthogonal criteria, each either a
 * **blocker** (→ avoid), a **caution** (→ ok), or a **positive** (context for a good fit):
 *  - family rotation (reuses {@link boxRotationHistory}): same family within the lookback → blocker
 *  - sun: a full-sun plant in a shaded box → blocker; in partial shade → caution; in sun → positive
 *  - soil depth: box shallower than the plant needs → blocker; deep enough → positive
 *  - bed type: box outside the plant's preferred beds → caution; inside → positive
 *  - occupancy: box already has active plantings → caution; empty → positive
 *
 * Every input field is optional in the data model; a missing field simply contributes nothing
 * (no blocker, no caution), so untagged plants/boxes degrade gracefully to "good unless rotation".
 */
export function rankBoxesForPlant(
  plant: PlantInfo,
  boxes: Box[],
  plantings: Planting[],
  findPlant: (key: string) => PlantInfo | undefined,
  referenceYear: number,
  language: PlantLanguage,
): BoxFit[] {
  const fits = boxes.map((box) => evaluateBox(plant, box, plantings, findPlant, referenceYear, language));
  return fits.sort(
    (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.score - a.score || a.box.name.localeCompare(b.box.name, "nb"),
  );
}

function evaluateBox(
  plant: PlantInfo,
  box: Box,
  plantings: Planting[],
  findPlant: (key: string) => PlantInfo | undefined,
  referenceYear: number,
  language: PlantLanguage,
): BoxFit {
  const blockers: string[] = [];
  const cautions: string[] = [];
  const positives: string[] = [];

  // Family rotation — same family grown here within the lookback window.
  const history = boxRotationHistory(plantings, box.id, (p) => findPlant(p.plantKey)?.family, referenceYear);
  const conflictYears = familyConflictYears(history, plant.family);
  if (conflictYears.length > 0) {
    blockers.push(`${getFamilyName(plant.family, language)} her i ${formatYearList(conflictYears)}`);
  }

  // Sun.
  if (plant.sunNeed === "full" && box.sunExposure === "shade") {
    blockers.push("Trenger sol — kassen er skygget");
  } else if (plant.sunNeed === "full" && box.sunExposure === "partial") {
    cautions.push("Litt lite sol (halvskygge)");
  } else if (plant.sunNeed && box.sunExposure === "sun") {
    positives.push(getSunLabel("sun", language));
  }

  // Soil depth.
  if (plant.minDepthCm != null && box.depthCm != null) {
    if (box.depthCm < plant.minDepthCm) {
      blockers.push(`Trenger ${plant.minDepthCm} cm — kun ${box.depthCm} cm her`);
    } else {
      positives.push(`Dyp nok (${box.depthCm} cm)`);
    }
  }

  // Bed type preference.
  if (plant.prefersBedType?.length && box.bedType) {
    if (plant.prefersBedType.includes(box.bedType)) {
      positives.push(getBedTypeLabel(box.bedType, language));
    } else {
      const preferred = plant.prefersBedType.map((bed) => getBedTypeLabel(bed, language)).join("/");
      cautions.push(`Foretrekker ${preferred}`);
    }
  }

  // Occupancy.
  const activeCount = plantings.filter((p) => p.boxId === box.id && p.status === "active").length;
  if (activeCount > 0) {
    cautions.push(activeCount === 1 ? "1 plante her allerede" : `${activeCount} planter her allerede`);
  } else {
    positives.push("Ledig");
  }

  if (blockers.length > 0) {
    return { box, tier: "avoid", reasons: blockers, score: -blockers.length };
  }
  if (cautions.length > 0) {
    return { box, tier: "ok", reasons: cautions, score: positives.length - cautions.length };
  }
  return { box, tier: "good", reasons: positives, score: positives.length };
}
