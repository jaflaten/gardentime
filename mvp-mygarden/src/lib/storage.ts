import type { Box, Planting } from "../types";

const BOXES_KEY = "gt_boxes";
const PLANTINGS_KEY = "gt_plantings";
const LAST_SAVED_KEY = "gt_lastSavedAt";

function touchLastSaved(): string {
  const stamp = new Date().toISOString();
  localStorage.setItem(LAST_SAVED_KEY, stamp);
  return stamp;
}

export const loadBoxes = (): Box[] => JSON.parse(localStorage.getItem(BOXES_KEY) ?? "[]");
export const saveBoxes = (v: Box[]): string => {
  localStorage.setItem(BOXES_KEY, JSON.stringify(v));
  return touchLastSaved();
};
export const loadPlantings = (): Planting[] => JSON.parse(localStorage.getItem(PLANTINGS_KEY) ?? "[]");
export const savePlantings = (v: Planting[]): string => {
  localStorage.setItem(PLANTINGS_KEY, JSON.stringify(v));
  return touchLastSaved();
};

export const loadLastSaved = (): string | null => localStorage.getItem(LAST_SAVED_KEY);

export function resetGarden(): string {
  saveBoxes([]);
  return savePlantings([]);
}
