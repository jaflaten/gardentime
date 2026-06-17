import { nanoid } from "nanoid";
import { create } from "zustand";
import { loadBoxes, loadLastSaved, loadPlantings, resetGarden as resetGardenStorage, saveBoxes, savePlantings } from "../lib/storage";
import type { Box, Planting } from "../types";

const NEW_BOX_WRAP_COLS = 12;
// Default footprint for a freshly created box. Sized to comfortably hold the name plus a
// couple of plant rows without text spilling — matches the scale of the bundled garden.
const NEW_BOX_W = 4;
const NEW_BOX_H = 3;

interface AddBoxOptions {
  description?: string;
  sunExposure?: Box["sunExposure"];
  bedType?: Box["bedType"];
  depthCm?: Box["depthCm"];
}

interface GardenStore {
  boxes: Box[];
  plantings: Planting[];
  lastSavedAt: string | null;
  previousBoxes: Box[] | null;
  addBox: (name: string, options?: AddBoxOptions) => void;
  updateBox: (id: string, patch: Partial<Box>) => void;
  updateBoxLayout: (id: string, layout: Box["layout"]) => void;
  saveGridLayout: (layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => void;
  undoLastLayout: () => void;
  clearUndo: () => void;
  deleteBox: (id: string) => void;
  addPlanting: (p: Omit<Planting, "id" | "year">) => void;
  updatePlanting: (id: string, patch: Partial<Planting>) => void;
  deletePlanting: (id: string) => void;
  markHarvested: (id: string, date?: string) => void;
  resetGarden: () => void;
  reloadFromStorage: () => void;
}

function findNextY(boxes: Box[]): number {
  return boxes.reduce((max, box) => Math.max(max, box.layout.y + box.layout.h), 0);
}

export const useGardenStore = create<GardenStore>((set, get) => ({
  boxes: loadBoxes(),
  plantings: loadPlantings(),
  lastSavedAt: loadLastSaved(),
  previousBoxes: null,

  addBox: (name, options) => {
    const existing = get().boxes.length;
    const box: Box = {
      id: nanoid(),
      name,
      description: options?.description,
      sunExposure: options?.sunExposure,
      bedType: options?.bedType,
      depthCm: options?.depthCm,
      createdAt: new Date().toISOString(),
      zoneType: "BOX",
      layout: {
        x: (existing * NEW_BOX_W) % NEW_BOX_WRAP_COLS,
        y: findNextY(get().boxes),
        w: NEW_BOX_W,
        h: NEW_BOX_H,
      },
    };
    const boxes = [...get().boxes, box];
    const lastSavedAt = saveBoxes(boxes);
    set({ boxes, lastSavedAt, previousBoxes: null });
  },

  updateBox: (id, patch) => {
    const boxes = get().boxes.map((box) => (box.id === id ? { ...box, ...patch } : box));
    const lastSavedAt = saveBoxes(boxes);
    set({ boxes, lastSavedAt, previousBoxes: null });
  },

  updateBoxLayout: (id, layout) => {
    const boxes = get().boxes.map((box) => (box.id === id ? { ...box, layout } : box));
    const lastSavedAt = saveBoxes(boxes);
    set({ boxes, lastSavedAt });
  },

  saveGridLayout: (layout) => {
    const snapshot = get().boxes;
    const layoutById = new Map(layout.map((item) => [item.i, item]));
    const boxes = snapshot.map((box) => {
      const item = layoutById.get(box.id);
      if (!item) {
        return box;
      }
      return {
        ...box,
        layout: {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        },
      };
    });
    const lastSavedAt = saveBoxes(boxes);
    set({ boxes, lastSavedAt, previousBoxes: snapshot });
  },

  undoLastLayout: () => {
    const previous = get().previousBoxes;
    if (!previous) {
      return;
    }
    const lastSavedAt = saveBoxes(previous);
    set({ boxes: previous, lastSavedAt, previousBoxes: null });
  },

  clearUndo: () => {
    if (get().previousBoxes === null) {
      return;
    }
    set({ previousBoxes: null });
  },

  deleteBox: (id) => {
    const boxes = get().boxes.filter((box) => box.id !== id);
    const plantings = get().plantings.filter((planting) => planting.boxId !== id);
    saveBoxes(boxes);
    const lastSavedAt = savePlantings(plantings);
    set({ boxes, plantings, lastSavedAt, previousBoxes: null });
  },

  addPlanting: (p) => {
    const planting: Planting = { ...p, id: nanoid(), year: new Date(p.plantedDate).getFullYear() };
    const plantings = [...get().plantings, planting];
    const lastSavedAt = savePlantings(plantings);
    set({ plantings, lastSavedAt });
  },

  updatePlanting: (id, patch) => {
    const plantings = get().plantings.map((p) => {
      if (p.id !== id) {
        return p;
      }
      const plantedDate = patch.plantedDate ?? p.plantedDate;
      return {
        ...p,
        ...patch,
        year: new Date(plantedDate).getFullYear(),
      };
    });
    const lastSavedAt = savePlantings(plantings);
    set({ plantings, lastSavedAt });
  },

  deletePlanting: (id) => {
    const plantings = get().plantings.filter((p) => p.id !== id);
    const lastSavedAt = savePlantings(plantings);
    set({ plantings, lastSavedAt });
  },

  markHarvested: (id, date) => {
    const today = date ?? new Date().toISOString().split("T")[0];
    const plantings = get().plantings.map((p) => (p.id === id ? { ...p, status: "harvested" as const, harvestDate: today } : p));
    const lastSavedAt = savePlantings(plantings);
    set({ plantings, lastSavedAt });
  },

  resetGarden: () => {
    const lastSavedAt = resetGardenStorage();
    set({ boxes: [], plantings: [], lastSavedAt, previousBoxes: null });
  },

  reloadFromStorage: () => {
    set({
      boxes: loadBoxes(),
      plantings: loadPlantings(),
      lastSavedAt: loadLastSaved(),
      previousBoxes: null,
    });
  },
}));
