import { getBedTypeLabel, getSunLabel } from "./boxMeta";
import { companionHints } from "./companions";
import { getFamilyName } from "./families";
import { getPlantName } from "./plants";
import { boxRotationHistory, familyConflictYears, formatYearList } from "./rotation";
import type { PlantLanguage } from "../store/useUiStore";
import type { Box, Planting, PlantInfo } from "../types";

export type BoxFitTier = "good" | "ok" | "avoid";

interface Fit {
  tier: BoxFitTier;
  /** Human-readable Norwegian reasons, most important first. The UI joins these into a why-line. */
  reasons: string[];
  /** Higher = better within a tier (used for ordering). */
  score: number;
}

export interface BoxFit extends Fit {
  box: Box;
}

export interface PlantFit extends Fit {
  plant: PlantInfo;
}

const TIER_RANK: Record<BoxFitTier, number> = { good: 0, ok: 1, avoid: 2 };

/**
 * Rank every box by how well it fits `plant` today (Increment B — the SowBoxPicker consumer).
 * See {@link evaluateFit} for the criteria.
 */
export function rankBoxesForPlant(
  plant: PlantInfo,
  boxes: Box[],
  plantings: Planting[],
  findPlant: (key: string) => PlantInfo | undefined,
  referenceYear: number,
  language: PlantLanguage,
): BoxFit[] {
  return boxes
    .map((box) => ({ box, ...evaluateFit(plant, box, plantings, findPlant, referenceYear, language) }))
    .sort(
      (a, b) =>
        TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.score - a.score || a.box.name.localeCompare(b.box.name, "nb"),
    );
}

/**
 * Inverse of {@link rankBoxesForPlant} (Increment C — "Hva passer her nå?"): rank every plant by how
 * well it fits a single box today. Same criteria, keyed by plant instead of box.
 */
export function rankPlantsForBox(
  box: Box,
  plants: PlantInfo[],
  plantings: Planting[],
  findPlant: (key: string) => PlantInfo | undefined,
  referenceYear: number,
  language: PlantLanguage,
): PlantFit[] {
  return plants
    .map((plant) => ({ plant, ...evaluateFit(plant, box, plantings, findPlant, referenceYear, language) }))
    .sort(
      (a, b) =>
        TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
        b.score - a.score ||
        getPlantName(a.plant, language).localeCompare(getPlantName(b.plant, language), "nb"),
    );
}

/**
 * Score how well `plant` fits `box` today. Orthogonal criteria, each either a **blocker**
 * (→ avoid), a **caution** (→ ok), or a **positive** (context for a good fit):
 *  - family rotation (reuses {@link boxRotationHistory}): same family within the lookback → blocker
 *  - sun: a full-sun plant in a shaded box → blocker; in partial shade → caution; in sun → positive
 *  - soil depth: box shallower than the plant needs → blocker; deep enough → positive
 *  - bed type: box outside the plant's preferred beds → caution; inside → positive
 *  - occupancy: box already has active plantings → caution; empty → positive
 *
 * Every input field is optional in the data model; a missing field simply contributes nothing
 * (no blocker, no caution), so untagged plants/boxes degrade gracefully to "good unless rotation".
 */
function evaluateFit(
  plant: PlantInfo,
  box: Box,
  plantings: Planting[],
  findPlant: (key: string) => PlantInfo | undefined,
  referenceYear: number,
  language: PlantLanguage,
): Fit {
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

  // Companion planting — how the plant pairs with what's already growing here (Increment F).
  const activeInBox = plantings.filter((p) => p.boxId === box.id && p.status === "active");
  const hints = companionHints(plant, activeInBox.map((p) => p.plantKey).filter(Boolean), findPlant);
  const goodCompanions = hints.filter((h) => h.kind === "good").map((h) => getPlantName(h.plant, language));
  const badCompanions = hints.filter((h) => h.kind === "bad").map((h) => getPlantName(h.plant, language));
  if (goodCompanions.length > 0) {
    positives.push(`🌿 Trives med ${joinNo(goodCompanions)}`);
  }
  if (badCompanions.length > 0) {
    cautions.push(`Dårlig naboskap med ${joinNo(badCompanions)}`);
  }

  // Occupancy.
  const activeCount = activeInBox.length;
  if (activeCount > 0) {
    cautions.push(activeCount === 1 ? "1 plante her allerede" : `${activeCount} planter her allerede`);
  } else {
    positives.push("Ledig");
  }

  if (blockers.length > 0) {
    return { tier: "avoid", reasons: blockers, score: -blockers.length };
  }
  if (cautions.length > 0) {
    return { tier: "ok", reasons: cautions, score: positives.length - cautions.length };
  }
  return { tier: "good", reasons: positives, score: positives.length };
}

/** Join names into a Norwegian list: ["a","b","c"] → "a, b og c". */
function joinNo(items: string[]): string {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  return `${items.slice(0, -1).join(", ")} og ${items[items.length - 1]}`;
}

/**
 * Passive "what not to plant here, and why" notes for a box (Increment C's context banner).
 * Derived purely from the box's own data + the plant DB — no interaction. Returns an empty array
 * when nothing is worth flagging (e.g. an in-ground bed with no recent family conflict).
 */
export function boxContextNotes(
  box: Box,
  plants: PlantInfo[],
  plantings: Planting[],
  findPlant: (key: string) => PlantInfo | undefined,
  referenceYear: number,
  language: PlantLanguage,
): string[] {
  const notes: string[] = [];

  // Rotation — every family grown here within the lookback window.
  const history = boxRotationHistory(plantings, box.id, (p) => findPlant(p.plantKey)?.family, referenceYear);
  for (const [family, years] of history.byFamily) {
    notes.push(`Du hadde ${getFamilyName(family, language)} her i ${formatYearList(years)} — vurder en annen familie i år.`);
  }

  // Depth — name the plants that are too deep-rooted for this box.
  if (box.depthCm != null) {
    const tooDeep = plants.filter((plant) => plant.minDepthCm != null && box.depthCm! < plant.minDepthCm);
    if (tooDeep.length > 0) {
      const names = tooDeep.slice(0, 4).map((plant) => getPlantName(plant, language).toLowerCase());
      const tail = tooDeep.length > 4 ? " m.fl." : ".";
      notes.push(`Denne kassen er ${box.depthCm} cm dyp — for grunt for ${joinNo(names)}${tail}`);
    }
  }

  // Sun.
  if (box.sunExposure === "shade") {
    notes.push("Kassen er skygget — løvgrønnsaker trives, men ikke solelskere som tomat og paprika.");
  }

  return notes;
}
