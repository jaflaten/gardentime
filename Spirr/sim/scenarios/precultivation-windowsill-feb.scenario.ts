import type { Scenario } from "./types";

// The walking-skeleton scenario. Empty garden in Sogndal (cold Vestland station, last frost ~ DOY 114),
// starting early February — squarely in forkultivering territory. Exercises the full pre-cultivation arc:
// start heat-lovers indoors (no boxId) → seedling tray + transplantReadiness soon→ready→overdue as the
// last frost approaches → plant-out preserving the indoor plantedDate → growth → harvest.
export const scenario: Scenario = {
  key: "precultivation-windowsill-feb",
  title: "Forkultivering på vinduskarmen (Sogndal, februar)",
  seed: {
    location: { postnummer: "6857" },
    boxes: [],
    plantings: [],
  },
  startDate: "2026-02-05",
  endDate: "2026-10-15",
  persona: "eager-beginner",
  maxSteps: 70,
  maxNoAdvance: 6,
  exercises:
    "forkultivering (sow_indoor uten kasse), frøbrett + transplantReadiness, plant-out med bevart plantedDate, vekst, høsting",
};

export default scenario;
