import demoGarden from "../../src/resources/demo-garden.json";
import type { Box, Planting, PlantInfo } from "../../src/types";
import type { Scenario } from "./types";

// Seeded from the bundled Testhage (demo-garden.json): a 3-season garden (2023–2025, plus some 2026
// rows) in Sogndal with a jordbær perennial and a "Solanaceae two years running" rotation conflict
// baked in. We run a 4th-season arc that crosses no year boundary but looks BACK across years — so it
// exercises vekstskifte warnings, the boxes×years rotation matrix, perennial seasonal harvest, and the
// rotation-soundness invariants. The methodical veteran reads the warnings.
const demo = demoGarden as unknown as {
  location: { postnummer: string; elevationM?: number; frostJusteringDays?: number };
  boxes: Box[];
  plantings: Planting[];
  customPlants?: PlantInfo[];
};

export const scenario: Scenario = {
  key: "multi-year-rotation-veteran",
  title: "Vekstskifte over flere sesonger (Testhage, 4. sesong)",
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
  startDate: "2026-03-15",
  endDate: "2026-10-10",
  persona: "methodical-veteran",
  maxSteps: 80,
  maxNoAdvance: 6,
  exercises:
    "vekstskifte-advarsler over flere år, boxes×years rotasjonsmatrise, flerårig (jordbær) sesonghøsting, identitet på tvers av sesonger",
};

export default scenario;
