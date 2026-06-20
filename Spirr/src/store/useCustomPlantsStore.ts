import { create } from "zustand";
import { generateCustomKey, loadCustomPlants, saveCustomPlants } from "../lib/customPlants";
import type { PlantInfo } from "../types";
import { useGardenStore } from "./useGardenStore";

export type CustomPlantInput = Omit<PlantInfo, "key">;

interface CustomPlantsStore {
  plants: PlantInfo[];
  addPlant: (input: CustomPlantInput) => PlantInfo;
  updatePlant: (key: string, patch: Partial<CustomPlantInput>) => void;
  deletePlant: (key: string) => void;
  replaceAll: (plants: PlantInfo[]) => void;
  reloadFromStorage: () => void;
}

function persist(plants: PlantInfo[]) {
  const lastSavedAt = saveCustomPlants(plants);
  useGardenStore.setState({ lastSavedAt });
}

export const useCustomPlantsStore = create<CustomPlantsStore>((set, get) => ({
  plants: loadCustomPlants(),

  addPlant: (input) => {
    const plant: PlantInfo = { ...input, key: generateCustomKey() };
    const plants = [...get().plants, plant];
    persist(plants);
    set({ plants });
    return plant;
  },

  updatePlant: (key, patch) => {
    const plants = get().plants.map((plant) => (plant.key === key ? { ...plant, ...patch } : plant));
    persist(plants);
    set({ plants });
  },

  deletePlant: (key) => {
    const plants = get().plants.filter((plant) => plant.key !== key);
    persist(plants);
    set({ plants });
  },

  replaceAll: (plants) => {
    persist(plants);
    set({ plants });
  },

  reloadFromStorage: () => {
    set({ plants: loadCustomPlants() });
  },
}));
