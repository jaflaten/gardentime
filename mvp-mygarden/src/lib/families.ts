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
}

export const FAMILY_INFO: Record<PlantFamily, FamilyInfo> = {
  solanaceae:     { name_no: "Søtvierfamilien",      name_pl: "Psiankowate",       name_en: "Nightshades", emoji: "🍅" },
  brassicaceae:   { name_no: "Korsblomstfamilien",   name_pl: "Kapustowate",       name_en: "Brassicas",   emoji: "🥬" },
  fabaceae:       { name_no: "Erteblomstfamilien",   name_pl: "Bobowate",          name_en: "Legumes",     emoji: "🫛" },
  apiaceae:       { name_no: "Skjermplantefamilien", name_pl: "Selerowate",        name_en: "Apiaceae",    emoji: "🥕" },
  cucurbitaceae:  { name_no: "Gresskarfamilien",     name_pl: "Dyniowate",         name_en: "Cucurbits",   emoji: "🎃" },
  amaryllidaceae: { name_no: "Løkfamilien",          name_pl: "Amarylkowate",      name_en: "Alliums",     emoji: "🧅" },
  asteraceae:     { name_no: "Kurvblomstfamilien",   name_pl: "Astrowate",         name_en: "Composites",  emoji: "🌼" },
  lamiaceae:      { name_no: "Leppeblomstfamilien",  name_pl: "Jasnotowate",       name_en: "Mints",       emoji: "🌿" },
  amaranthaceae:  { name_no: "Amarantfamilien",      name_pl: "Szarłatowate",      name_en: "Amaranths",   emoji: "🌱" },
  rosaceae:       { name_no: "Rosefamilien",         name_pl: "Różowate",          name_en: "Roses",       emoji: "🌹" },
  poaceae:        { name_no: "Grasfamilien",         name_pl: "Wiechlinowate",     name_en: "Grasses",     emoji: "🌾" },
  ericaceae:      { name_no: "Lyngfamilien",         name_pl: "Wrzosowate",        name_en: "Heaths",      emoji: "🫐" },
  convolvulaceae: { name_no: "Vindelfamilien",       name_pl: "Powojowate",        name_en: "Bindweeds",   emoji: "🍠" },
  other:          { name_no: "Annet",                name_pl: "Inne",              name_en: "Other",       emoji: "🌱" },
};

export function getFamilyName(family: PlantFamily, language: PlantLanguage): string {
  const info = FAMILY_INFO[family];
  return language === "pl" ? info.name_pl : info.name_no;
}

export function getFamilyEmoji(family: PlantFamily): string {
  return FAMILY_INFO[family].emoji;
}
