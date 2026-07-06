import { create } from "zustand";
import { loadSowPlan, saveSowPlan, type SowPlanEntry } from "../lib/sowPlanStorage";
import { useGardenStore } from "./useGardenStore";

interface SowPlanStore {
  entries: SowPlanEntry[];
  /** Adds the crop to the given season's plan, or removes it if already planned. */
  toggle: (plantKey: string, year: number) => void;
  remove: (plantKey: string, year: number) => void;
  replaceAll: (entries: SowPlanEntry[]) => void;
  reloadFromStorage: () => void;
}

function persist(entries: SowPlanEntry[]) {
  const lastSavedAt = saveSowPlan(entries);
  useGardenStore.setState({ lastSavedAt });
}

const without = (entries: SowPlanEntry[], plantKey: string, year: number) =>
  entries.filter((e) => !(e.plantKey === plantKey && e.year === year));

export const useSowPlanStore = create<SowPlanStore>((set, get) => ({
  entries: loadSowPlan(),

  toggle: (plantKey, year) => {
    const current = get().entries;
    const has = current.some((e) => e.plantKey === plantKey && e.year === year);
    const entries = has ? without(current, plantKey, year) : [...current, { plantKey, year }];
    persist(entries);
    set({ entries });
  },

  remove: (plantKey, year) => {
    const entries = without(get().entries, plantKey, year);
    persist(entries);
    set({ entries });
  },

  replaceAll: (entries) => {
    persist(entries);
    set({ entries });
  },

  reloadFromStorage: () => {
    set({ entries: loadSowPlan() });
  },
}));
