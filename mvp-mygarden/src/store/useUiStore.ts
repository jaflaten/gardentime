import { create } from "zustand";

export type PlantLanguage = "no" | "pl";

export interface GridSize {
  cols: number;
  rows: number;
}

export const GRID_COLS_MIN = 12;
export const GRID_COLS_MAX = 80;
export const GRID_ROWS_MIN = 8;
export const GRID_ROWS_MAX = 60;
export const DEFAULT_GRID_SIZE: GridSize = { cols: 51, rows: 26 };

const LANGUAGE_KEY = "gt_language";
const GRID_SIZE_KEY = "gt_grid_size";

interface UiStore {
  plantLanguage: PlantLanguage;
  setPlantLanguage: (language: PlantLanguage) => void;
  togglePlantLanguage: () => void;
  gridSize: GridSize;
  setGridSize: (size: GridSize) => void;
  ensureGridFits: (minCols: number, minRows: number) => void;
}

function loadLanguage(): PlantLanguage {
  const language = localStorage.getItem(LANGUAGE_KEY);
  return language === "pl" ? "pl" : "no";
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

function loadGridSize(): GridSize {
  const raw = localStorage.getItem(GRID_SIZE_KEY);
  if (!raw) {
    return DEFAULT_GRID_SIZE;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<GridSize>;
    return {
      cols: clamp(Number(parsed.cols ?? DEFAULT_GRID_SIZE.cols), GRID_COLS_MIN, GRID_COLS_MAX),
      rows: clamp(Number(parsed.rows ?? DEFAULT_GRID_SIZE.rows), GRID_ROWS_MIN, GRID_ROWS_MAX),
    };
  } catch {
    return DEFAULT_GRID_SIZE;
  }
}

function persistGridSize(size: GridSize) {
  localStorage.setItem(GRID_SIZE_KEY, JSON.stringify(size));
}

export const useUiStore = create<UiStore>((set, get) => ({
  plantLanguage: loadLanguage(),
  setPlantLanguage: (language) => {
    localStorage.setItem(LANGUAGE_KEY, language);
    set({ plantLanguage: language });
  },
  togglePlantLanguage: () => {
    const next = get().plantLanguage === "no" ? "pl" : "no";
    localStorage.setItem(LANGUAGE_KEY, next);
    set({ plantLanguage: next });
  },

  gridSize: loadGridSize(),
  setGridSize: (size) => {
    const next: GridSize = {
      cols: clamp(size.cols, GRID_COLS_MIN, GRID_COLS_MAX),
      rows: clamp(size.rows, GRID_ROWS_MIN, GRID_ROWS_MAX),
    };
    persistGridSize(next);
    set({ gridSize: next });
  },
  ensureGridFits: (minCols, minRows) => {
    const current = get().gridSize;
    const cols = Math.max(current.cols, Math.min(GRID_COLS_MAX, Math.ceil(minCols)));
    const rows = Math.max(current.rows, Math.min(GRID_ROWS_MAX, Math.ceil(minRows)));
    if (cols === current.cols && rows === current.rows) {
      return;
    }
    const next: GridSize = { cols, rows };
    persistGridSize(next);
    set({ gridSize: next });
  },
}));
