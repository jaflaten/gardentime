import { useCallback, useMemo } from "react";
import plants from "../data/plants.json";
import { useCustomPlantsStore } from "../store/useCustomPlantsStore";
import type { PlantLanguage } from "../store/useUiStore";
import type { PlantInfo } from "../types";

export const bundledPlants: PlantInfo[] = plants as PlantInfo[];

const bundledKeySet = new Set(bundledPlants.map((entry) => entry.key));

/**
 * True for keys that ship with the app (vs. user-created custom plants). Used to decide whether a
 * `seasonal` harvest window should be location-shifted: bundled windows are authored for a warm-lowland
 * baseline and shift toward the user's frost dates; custom windows are entered for the user's own garden.
 */
export function isBundledPlantKey(key: string): boolean {
  return bundledKeySet.has(key);
}

// Non-reactive lookup. Reads the current store snapshot; safe outside React
// but does not subscribe — components that need to re-render when custom
// plants change should use usePlantLookup or useMergedPlantList instead.
export function findPlant(plantKey: string): PlantInfo | undefined {
  if (!plantKey) {
    return undefined;
  }
  return (
    bundledPlants.find((entry) => entry.key === plantKey) ??
    useCustomPlantsStore.getState().plants.find((entry) => entry.key === plantKey)
  );
}

export function usePlantLookup() {
  const custom = useCustomPlantsStore((state) => state.plants);
  return useCallback(
    (plantKey: string): PlantInfo | undefined => {
      if (!plantKey) {
        return undefined;
      }
      return (
        bundledPlants.find((entry) => entry.key === plantKey) ?? custom.find((entry) => entry.key === plantKey)
      );
    },
    [custom],
  );
}

export function useMergedPlantList(): PlantInfo[] {
  const custom = useCustomPlantsStore((state) => state.plants);
  return useMemo(() => [...bundledPlants, ...custom], [custom]);
}

export function getPlantName(plant: PlantInfo, language: PlantLanguage) {
  return language === "pl" ? plant.name_pl : plant.name_no;
}
