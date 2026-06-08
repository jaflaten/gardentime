import type { Box, Planting } from "../types";

const BOXES_KEY = "gt_boxes";
const PLANTINGS_KEY = "gt_plantings";

export const loadBoxes = (): Box[] => JSON.parse(localStorage.getItem(BOXES_KEY) ?? "[]");
export const saveBoxes = (v: Box[]) => localStorage.setItem(BOXES_KEY, JSON.stringify(v));
export const loadPlantings = (): Planting[] => JSON.parse(localStorage.getItem(PLANTINGS_KEY) ?? "[]");
export const savePlantings = (v: Planting[]) => localStorage.setItem(PLANTINGS_KEY, JSON.stringify(v));
