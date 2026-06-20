import type { PlantLanguage } from "../store/useUiStore";

export type PlantFamily =
  | "solanaceae"
  | "brassicaceae"
  | "fabaceae"
  | "apiaceae"
  | "cucurbitaceae"
  | "amaryllidaceae"
  | "asteraceae"
  | "lamiaceae"
  | "amaranthaceae"
  | "rosaceae"
  | "poaceae"
  | "ericaceae"
  | "convolvulaceae"
  | "other";

interface FamilyInfo {
  name_no: string;
  name_pl: string;
  name_en: string;
  emoji: string;
  /** Distinct colour for charts (composition donut Family mode + the rotation heatmap). */
  color: string;
}

export const FAMILY_INFO: Record<PlantFamily, FamilyInfo> = {
  solanaceae:     { name_no: "Søtvierfamilien",      name_pl: "Psiankowate",       name_en: "Nightshades", emoji: "🍅", color: "#c0392b" },
  brassicaceae:   { name_no: "Korsblomstfamilien",   name_pl: "Kapustowate",       name_en: "Brassicas",   emoji: "🥬", color: "#5fa08a" },
  fabaceae:       { name_no: "Erteblomstfamilien",   name_pl: "Bobowate",          name_en: "Legumes",     emoji: "🫛", color: "#8cb24a" },
  apiaceae:       { name_no: "Skjermplantefamilien", name_pl: "Selerowate",        name_en: "Apiaceae",    emoji: "🥕", color: "#e08a2e" },
  cucurbitaceae:  { name_no: "Gresskarfamilien",     name_pl: "Dyniowate",         name_en: "Cucurbits",   emoji: "🎃", color: "#b6a23a" },
  amaryllidaceae: { name_no: "Løkfamilien",          name_pl: "Amarylkowate",      name_en: "Alliums",     emoji: "🧅", color: "#c79a52" },
  asteraceae:     { name_no: "Kurvblomstfamilien",   name_pl: "Astrowate",         name_en: "Composites",  emoji: "🌼", color: "#e6b800" },
  lamiaceae:      { name_no: "Leppeblomstfamilien",  name_pl: "Jasnotowate",       name_en: "Mints",       emoji: "🌿", color: "#4f8a4f" },
  amaranthaceae:  { name_no: "Amarantfamilien",      name_pl: "Szarłatowate",      name_en: "Amaranths",   emoji: "🌱", color: "#a13a63" },
  rosaceae:       { name_no: "Rosefamilien",         name_pl: "Różowate",          name_en: "Roses",       emoji: "🌹", color: "#e23e57" },
  poaceae:        { name_no: "Grasfamilien",         name_pl: "Wiechlinowate",     name_en: "Grasses",     emoji: "🌾", color: "#d4a843" },
  ericaceae:      { name_no: "Lyngfamilien",         name_pl: "Wrzosowate",        name_en: "Heaths",      emoji: "🫐", color: "#5a6ebf" },
  convolvulaceae: { name_no: "Vindelfamilien",       name_pl: "Powojowate",        name_en: "Bindweeds",   emoji: "🍠", color: "#8a5a9e" },
  other:          { name_no: "Annet",                name_pl: "Inne",              name_en: "Other",       emoji: "🌱", color: "#9aa17f" },
};

export function getFamilyName(family: PlantFamily, language: PlantLanguage): string {
  const info = FAMILY_INFO[family];
  return language === "pl" ? info.name_pl : info.name_no;
}

export function getFamilyEmoji(family: PlantFamily): string {
  return FAMILY_INFO[family].emoji;
}
