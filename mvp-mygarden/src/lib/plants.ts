import { useCallback, useMemo } from "react";
import plants from "../data/plants.json";
import { useCustomPlantsStore } from "../store/useCustomPlantsStore";
import type { PlantLanguage } from "../store/useUiStore";
import type { PlantInfo } from "../types";

export const bundledPlants: PlantInfo[] = plants as PlantInfo[];

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
