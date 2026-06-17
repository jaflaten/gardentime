import type { BedType, SunExposure } from "../lib/boxMeta";
import type { PlantFamily } from "../lib/families";

export interface Box {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  zoneType?: "BOX" | "BUCKET" | string;
  sunExposure?: SunExposure;
  bedType?: BedType;
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
}
