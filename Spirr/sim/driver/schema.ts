// The JSON action vocabulary the LLM gardener speaks. Validation is intentionally strict-but-forgiving:
// it coerces obvious types and returns a structured error (never throws) so a malformed action becomes
// one reprompt, not a crashed run.

import type { BedType, SunExposure } from "../../src/lib/boxMeta";
import type { PlantInfo } from "../../src/types";

export type GardenAction =
  | { action: "set_location"; postnummer: string; elevationM?: number; frostJusteringDays?: number }
  | {
      action: "add_box";
      name: string;
      bedType?: BedType;
      sunExposure?: SunExposure;
      depthCm?: number;
      widthCm?: number;
      lengthCm?: number;
    }
  | { action: "sow_indoor"; plant: string; variety?: string; quantity?: number }
  | { action: "sow_outdoor"; box: string; plant: string; variety?: string; quantity?: number }
  | { action: "plant_out"; planting: string; box: string }
  | { action: "harvest"; planting: string; yield?: string }
  | { action: "remove_planting"; planting: string; reason: "removed" | "failed" }
  | { action: "advance_days"; days: number }
  | { action: "advance_to_next_event" }
  | { action: "note"; text: string };

export const ACTION_NAMES = [
  "set_location",
  "add_box",
  "sow_indoor",
  "sow_outdoor",
  "plant_out",
  "harvest",
  "remove_planting",
  "advance_days",
  "advance_to_next_event",
  "note",
] as const;

const BED_TYPES: BedType[] = ["open", "raised", "container", "greenhouse", "tunnel"];
const SUN_EXPOSURES: SunExposure[] = ["sun", "partial", "shade"];

export interface ValidationOk {
  ok: true;
  action: GardenAction;
}
export interface ValidationErr {
  ok: false;
  error: string;
}

function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

/** Validate + coerce a raw object into a GardenAction. Never throws. */
export function validateAction(raw: unknown): ValidationOk | ValidationErr {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "action must be a JSON object" };
  }
  const o = raw as Record<string, unknown>;
  const a = str(o.action);
  if (!a) {
    return { ok: false, error: `missing "action" field; expected one of ${ACTION_NAMES.join(", ")}` };
  }
  switch (a) {
    case "set_location": {
      const postnummer = str(o.postnummer);
      if (!postnummer || !/^\d{4}$/.test(postnummer)) {
        return { ok: false, error: "set_location needs a 4-digit `postnummer`" };
      }
      return { ok: true, action: { action: "set_location", postnummer, elevationM: num(o.elevationM), frostJusteringDays: num(o.frostJusteringDays) } };
    }
    case "add_box": {
      const name = str(o.name);
      if (!name) {
        return { ok: false, error: "add_box needs a `name`" };
      }
      const bedType = str(o.bedType) as BedType | undefined;
      if (bedType && !BED_TYPES.includes(bedType)) {
        return { ok: false, error: `bedType must be one of ${BED_TYPES.join(", ")}` };
      }
      const sunExposure = str(o.sunExposure) as SunExposure | undefined;
      if (sunExposure && !SUN_EXPOSURES.includes(sunExposure)) {
        return { ok: false, error: `sunExposure must be one of ${SUN_EXPOSURES.join(", ")}` };
      }
      return { ok: true, action: { action: "add_box", name, bedType, sunExposure, depthCm: num(o.depthCm), widthCm: num(o.widthCm), lengthCm: num(o.lengthCm) } };
    }
    case "sow_indoor": {
      const plant = str(o.plant);
      if (!plant) {
        return { ok: false, error: "sow_indoor needs a `plant` key" };
      }
      return { ok: true, action: { action: "sow_indoor", plant, variety: str(o.variety), quantity: num(o.quantity) } };
    }
    case "sow_outdoor": {
      const plant = str(o.plant);
      const box = str(o.box);
      if (!plant || !box) {
        return { ok: false, error: "sow_outdoor needs `plant` and `box`" };
      }
      return { ok: true, action: { action: "sow_outdoor", plant, box, variety: str(o.variety), quantity: num(o.quantity) } };
    }
    case "plant_out": {
      const planting = str(o.planting);
      const box = str(o.box);
      if (!planting || !box) {
        return { ok: false, error: "plant_out needs `planting` (e.g. #1) and `box` (e.g. A)" };
      }
      return { ok: true, action: { action: "plant_out", planting, box } };
    }
    case "harvest": {
      const planting = str(o.planting);
      if (!planting) {
        return { ok: false, error: "harvest needs a `planting` handle" };
      }
      return { ok: true, action: { action: "harvest", planting, yield: str(o.yield) } };
    }
    case "remove_planting": {
      const planting = str(o.planting);
      const reason = str(o.reason);
      if (!planting) {
        return { ok: false, error: "remove_planting needs a `planting` handle" };
      }
      if (reason !== "removed" && reason !== "failed") {
        return { ok: false, error: "remove_planting `reason` must be 'removed' or 'failed'" };
      }
      return { ok: true, action: { action: "remove_planting", planting, reason } };
    }
    case "advance_days": {
      const days = num(o.days);
      if (days == null || days <= 0) {
        return { ok: false, error: "advance_days needs a positive `days`" };
      }
      return { ok: true, action: { action: "advance_days", days: Math.round(days) } };
    }
    case "advance_to_next_event":
      return { ok: true, action: { action: "advance_to_next_event" } };
    case "note": {
      const text = str(o.text);
      if (!text) {
        return { ok: false, error: "note needs `text`" };
      }
      return { ok: true, action: { action: "note", text } };
    }
    default:
      return { ok: false, error: `unknown action "${a}"; expected one of ${ACTION_NAMES.join(", ")}` };
  }
}

export interface LeanPlant {
  key: string;
  name_no: string;
  emoji: string;
  category: PlantInfo["category"];
}

/** The trimmed plant catalog handed to the model — just enough to choose by name/category. */
export function leanCatalog(plants: PlantInfo[]): LeanPlant[] {
  return plants.map((p) => ({ key: p.key, name_no: p.name_no, emoji: p.emoji, category: p.category }));
}
