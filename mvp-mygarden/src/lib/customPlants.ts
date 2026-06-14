import { nanoid } from "nanoid";
import type { PlantInfo } from "../types";
import { touchLastSaved } from "./storage";

const CUSTOM_PLANTS_KEY = "gt_custom_plants";

export function generateCustomKey(): string {
  return `custom_${nanoid(8)}`;
}

function isCustomPlantLike(value: unknown): value is PlantInfo {
  if (!value || typeof value !== "object") {
    return false;
  }
  const plant = value as Partial<PlantInfo>;
  return (
    typeof plant.key === "string" &&
    typeof plant.name_no === "string" &&
    typeof plant.name_pl === "string" &&
    typeof plant.name_en === "string" &&
    typeof plant.emoji === "string" &&
    typeof plant.category === "string" &&
    typeof plant.family === "string"
  );
}

export function loadCustomPlants(): PlantInfo[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PLANTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCustomPlantLike) : [];
  } catch {
    return [];
  }
}

export function saveCustomPlants(plants: PlantInfo[]): string {
  localStorage.setItem(CUSTOM_PLANTS_KEY, JSON.stringify(plants));
  return touchLastSaved();
}

export { isCustomPlantLike };
