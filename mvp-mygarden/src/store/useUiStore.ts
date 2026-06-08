import { create } from "zustand";

export type PlantLanguage = "no" | "pl";

const LANGUAGE_KEY = "gt_language";

interface UiStore {
  plantLanguage: PlantLanguage;
  setPlantLanguage: (language: PlantLanguage) => void;
  togglePlantLanguage: () => void;
}

function loadLanguage(): PlantLanguage {
  const language = localStorage.getItem(LANGUAGE_KEY);
  return language === "pl" ? "pl" : "no";
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
}));
