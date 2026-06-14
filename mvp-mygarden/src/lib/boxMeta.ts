import type { PlantLanguage } from "../store/useUiStore";

export type SunExposure = "sun" | "partial" | "shade";
export type BedType = "open" | "raised" | "container" | "greenhouse" | "tunnel";

interface MetaLabel {
  name_no: string;
  name_pl: string;
  emoji: string;
}

export const SUN_EXPOSURE_LABELS: Record<SunExposure, MetaLabel> = {
  sun:     { name_no: "Full sol",   name_pl: "Pełne słońce", emoji: "☀️" },
  partial: { name_no: "Halvskygge", name_pl: "Półcień",      emoji: "⛅" },
  shade:   { name_no: "Skygge",     name_pl: "Cień",         emoji: "🌥" },
};

export const BED_TYPE_LABELS: Record<BedType, MetaLabel> = {
  open:       { name_no: "Åpen seng",    name_pl: "Otwarta grządka", emoji: "🟫" },
  raised:     { name_no: "Pallekarm",    name_pl: "Podwyższona",      emoji: "🪵" },
  container:  { name_no: "Bøtte/krukke", name_pl: "Pojemnik",         emoji: "🪴" },
  greenhouse: { name_no: "Drivhus",      name_pl: "Szklarnia",        emoji: "🏠" },
  tunnel:     { name_no: "Tunnel",       name_pl: "Tunel",            emoji: "⛺" },
};

export const SUN_EXPOSURE_VALUES: SunExposure[] = ["sun", "partial", "shade"];
export const BED_TYPE_VALUES: BedType[] = ["open", "raised", "container", "greenhouse", "tunnel"];

export function getSunLabel(value: SunExposure, language: PlantLanguage): string {
  const info = SUN_EXPOSURE_LABELS[value];
  return language === "pl" ? info.name_pl : info.name_no;
}

export function getBedTypeLabel(value: BedType, language: PlantLanguage): string {
  const info = BED_TYPE_LABELS[value];
  return language === "pl" ? info.name_pl : info.name_no;
}
