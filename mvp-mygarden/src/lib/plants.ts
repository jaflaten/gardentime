import plants from "../data/plants.json";
import type { PlantInfo } from "../types";
import type { PlantLanguage } from "../store/useUiStore";

export const plantList: PlantInfo[] = plants as PlantInfo[];

export function findPlant(plantKey: string) {
  return plantList.find((entry) => entry.key === plantKey);
}

export function getPlantName(plant: PlantInfo, language: PlantLanguage) {
  return language === "pl" ? plant.name_pl : plant.name_no;
}
