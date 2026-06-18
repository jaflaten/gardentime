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
  | { weeksBeforeFirstFrost: number };

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
}
