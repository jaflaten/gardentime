import type { PlantLanguage } from "../store/useUiStore";
import type { PlantInfo } from "../types";

export type PlantCategory = PlantInfo["category"];

interface CategoryLabel {
  name_no: string;
  name_pl: string;
  emoji: string;
  /** Colour for the composition donut's Kategori mode. */
  color: string;
}

export const CATEGORY_LABELS: Record<PlantCategory, CategoryLabel> = {
  vegetable: { name_no: "Grønnsak", name_pl: "Warzywo", emoji: "🥕", color: "#6f9e44" },
  herb:      { name_no: "Urt",      name_pl: "Zioło",   emoji: "🌿", color: "#3f9e8a" },
  fruit:     { name_no: "Frukt",    name_pl: "Owoc",    emoji: "🍓", color: "#d64545" },
  flower:    { name_no: "Blomst",   name_pl: "Kwiat",   emoji: "🌸", color: "#e07baf" },
};

export const CATEGORY_VALUES: PlantCategory[] = ["vegetable", "herb", "fruit", "flower"];

export function getCategoryLabel(category: PlantCategory, language: PlantLanguage): string {
  const info = CATEGORY_LABELS[category];
  return language === "pl" ? info.name_pl : info.name_no;
}
