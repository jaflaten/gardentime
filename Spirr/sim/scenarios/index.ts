// Scenario registry. Add new scenarios here so the runner can resolve them by key (or "all").
import type { Scenario } from "./types";
import precultivation from "./precultivation-windowsill-feb.scenario";
import firstTime from "./first-time-empty-vestland-march.scenario";
import multiYear from "./multi-year-rotation-veteran.scenario";
import directVsTransplant from "./direct-sow-vs-transplant.scenario";
import midsummer from "./midsummer-harvest-rush.scenario";
import coldStation from "./cold-station-wont-ripen.scenario";
import neglectedHarvest from "./neglected-harvest.scenario";

export const SCENARIOS: Scenario[] = [
  precultivation,
  firstTime,
  multiYear,
  directVsTransplant,
  midsummer,
  coldStation,
  neglectedHarvest,
];

export function getScenarios(keys: string): Scenario[] {
  if (keys === "all") {
    return SCENARIOS;
  }
  const wanted = keys.split(",").map((k) => k.trim());
  const found = SCENARIOS.filter((s) => wanted.includes(s.key));
  const missing = wanted.filter((k) => !SCENARIOS.some((s) => s.key === k));
  if (missing.length) {
    throw new Error(`unknown scenario(s): ${missing.join(", ")}. Have: ${SCENARIOS.map((s) => s.key).join(", ")}`);
  }
  return found;
}
