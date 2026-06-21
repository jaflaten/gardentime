import type { Scenario } from "./types";

// Empty garden in Sogndal starting at the spring crossover (mid-April), where the SAME crop can be
// started two ways: forkultivert indoors then planted out (GDD anchor = transplant date) vs sown direct
// outdoors (anchor = sow date). A methodical gardener tends to do both; the identity-continuity and
// year/anchor invariants verify the two paths stay distinct and never corrupt each other. One open and
// one greenhouse bed give the transplant path somewhere to land.
export const scenario: Scenario = {
  key: "direct-sow-vs-transplant",
  title: "Direktesåing vs forkultivering (Sogndal, april)",
  seed: {
    location: { postnummer: "6857" },
    boxes: [
      { id: "dsv-open", name: "Friland", createdAt: "2026-01-01T00:00:00.000Z", zoneType: "BOX", bedType: "open", sunExposure: "sun", depthCm: 25, layout: { x: 0, y: 0, w: 4, h: 3 } },
      { id: "dsv-gh", name: "Drivhus", createdAt: "2026-01-01T00:00:00.000Z", zoneType: "BOX", bedType: "greenhouse", sunExposure: "sun", depthCm: 30, layout: { x: 4, y: 0, w: 4, h: 3 } },
    ],
    // Seed the comparison up front so the two anchors always exist (the LLM may or may not create it on
    // its own): the SAME crop direct-sown into the open bed (anchor = sow date) and an already-planted-out
    // forkultivert seedling in the greenhouse (anchor = transplant date, indoor sow date preserved).
    plantings: [
      { id: "dsv-direct", boxId: "dsv-open", plantKey: "salat", plantedDate: "2026-04-15", startMethod: "direct", status: "active", year: 2026 },
      { id: "dsv-transplant", boxId: "dsv-gh", plantKey: "salat", plantedDate: "2026-03-10", transplantedDate: "2026-04-15", startMethod: "transplant", status: "active", year: 2026 },
    ],
  },
  startDate: "2026-04-15",
  endDate: "2026-10-05",
  persona: "methodical-veteran",
  maxSteps: 70,
  maxNoAdvance: 6,
  exercises: "samme art direkte vs forkultivert, GDD-anker (sådato vs utplantingsdato), identitet bevart på begge spor",
};

export default scenario;
