import demoGarden from "../../src/resources/demo-garden.json";
import type { Box, Planting, PlantInfo } from "../../src/types";
import type { Scenario } from "./types";

// Drop a maximise-harvest gardener into the established Testhage at midsummer (15 June). The garden is
// already full and several crops are entering their harvest windows — exercises the "Høst snart" signal,
// active harvesting to free beds, and succession re-sowing for a continuous crop. The compressed
// late-June→September horizon keeps it focused on the harvest phase.
const demo = demoGarden as unknown as {
  location: { postnummer: string; elevationM?: number; frostJusteringDays?: number };
  boxes: Box[];
  plantings: Planting[];
  customPlants?: PlantInfo[];
};

export const scenario: Scenario = {
  key: "midsummer-harvest-rush",
  title: "Høsterush ved midtsommer (Testhage, 15. juni)",
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
  endDate: "2026-09-15",
  persona: "maximise-harvest",
  maxSteps: 70,
  maxNoAdvance: 6,
  exercises: "Høst snart-signal, aktiv høsting for å frigjøre bed, suksesjons-såing, sen-sesong arc",
};

export default scenario;
