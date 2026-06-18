import type { BedType, SunExposure, SunNeed } from "../lib/boxMeta";
import type { PlantFamily } from "../lib/families";

export interface Box {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  zoneType?: "BOX" | "BUCKET" | string;
  sunExposure?: SunExposure;
  bedType?: BedType;
  /** Soil depth in cm. Drives the depth-fit check in box ranking; missing = unknown/unlimited (e.g. in-ground). */
  depthCm?: number;
  /** Real-world footprint in cm (independent of the abstract grid `layout` units). Both optional; shown as a chip. */
  widthCm?: number;
  lengthCm?: number;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface Planting {
  id: string;
  boxId: string;
  plantKey: string;
  customName?: string;
  variety?: string;
  plantedDate: string;
  harvestDate?: string;
  /** Free-text yield logged at harvest (Phase F), e.g. "5 kg", "3 bøtter", "1 sekk". Optional. */
  harvestYield?: string;
  notes?: string;
  status: "active" | "harvested" | "removed" | "failed";
  year: number;
}

export type SowRule =
  | { type: "indoor"; weeksBeforeLastFrost: [number, number] }
  | { type: "outdoor"; weeksAfterLastFrost: [number, number]; minSoilTempC?: number }
  | { type: "transplant"; weeksAfterLastFrost: [number, number] };

export type HarvestRule =
  | { weeksFromSowing: [number, number] }
  | { weeksBeforeFirstFrost: number }
  // Absolute calendar harvest window that repeats every year, e.g. ["06-15", "07-31"] for
  // strawberries (mid-June→July). Used for perennials whose harvest is seasonal, not sow-relative.
  | { seasonal: [string, string] };

export interface PlantInfo {
  key: string;
  name_no: string;
  name_pl: string;
  name_en: string;
  emoji: string;
  category: "vegetable" | "herb" | "fruit" | "flower";
  family: PlantFamily;
  sowRules?: SowRule[];
  harvestRule?: HarvestRule;
  // Box-ranking metadata (Increment B). All optional; missing = no constraint / no penalty.
  /** Minimum sunlight the plant needs. `full` plants are discouraged in shaded boxes. */
  sunNeed?: SunNeed;
  /** Bed types the plant does best in (e.g. heat-lovers prefer greenhouse/tunnel). A box outside this list is a soft mismatch. */
  prefersBedType?: BedType[];
  /** Minimum soil depth in cm the plant needs (root veg). A shallower box is discouraged. */
  minDepthCm?: number;
  // Companion planting (Increment F). Lists hold OTHER plant keys; missing = no known pairing.
  /** Plants this one grows well beside — surfaced as a green hint when added near them. */
  companionsGood?: string[];
  /** Plants this one does poorly beside — surfaced as a soft amber caution. */
  companionsBad?: string[];
  /** Succession interval in weeks (Increment E): re-sow every N weeks for a continuous harvest (salat, reddik). */
  successionWeeks?: number;
  /**
   * Perennial — stays in the bed across seasons and re-fruits each year (jordbær, rabarbra, urter).
   * Its harvest window should be a `{ seasonal }` rule (absolute, repeats yearly) rather than sow-relative,
   * and the season timeline draws that band every year regardless of which year it was planted.
   */
  perennial?: boolean;
  /**
   * Rain-sensitive (Increment B follow-up) — foliage dislikes rain (fungal disease, fruit splitting),
   * so the plant really wants a cover (greenhouse/tunnel), not just prefers it. Surfaces a note in the
   * D2 card's "Plant ut" group and turns an uncovered-bed placement into a soft caution in box ranking.
   */
  rainSensitive?: boolean;
}
