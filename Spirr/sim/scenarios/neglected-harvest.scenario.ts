import demoGarden from "../../src/resources/demo-garden.json";
import type { Box, Planting, PlantInfo } from "../../src/types";
import type { Scenario } from "./types";

// The visit-skip companion to midsummer-harvest-rush: the SAME established, harvest-rich Testhage, but a
// busy "Travel byboer" who is away on a long summer holiday (mid-July → late August) right over peak
// harvest (persona `visit-skip`, an `attendance` away-window). Because the garden is warm and pre-seeded,
// crops genuinely ripen — so any miss is the gardener's absence, not the climate. Crops that ripen during
// the holiday are never harvested, which drives the harvest-rate metric below 100% (FINDINGS fix a / B8).
const demo = demoGarden as unknown as {
  location: { postnummer: string; elevationM?: number; frostJusteringDays?: number };
  boxes: Box[];
  plantings: Planting[];
  customPlants?: PlantInfo[];
};

export const scenario: Scenario = {
  key: "neglected-harvest",
  title: "Forsømt høst (Testhage, travel byboer)",
  seed: {
    location: {
      postnummer: demo.location.postnummer,
      elevationM: demo.location.elevationM,
      frostJusteringDays: demo.location.frostJusteringDays,
    },
    boxes: demo.boxes,
    plantings: demo.plantings,
    customPlants: demo.customPlants ?? [],
  },
  startDate: "2026-06-15",
  endDate: "2026-10-05",
  persona: "visit-skip",
  maxSteps: 70,
  maxNoAdvance: 6,
  exercises: "Visit-skip-persona: modne avlinger som aldri høstes → falsifiserbar høsterate (<100%)",
};

export default scenario;
