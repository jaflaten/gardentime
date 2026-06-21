import type { Scenario } from "./types";

// Alta (station Alta LH): last frost ~ DOY 148, first frost ~ DOY 262, total season GDD-base10 ≈ 208 —
// far short of what a tomato (gddToMaturity 800, base 10) needs. A maximise-harvest gardener will try
// heat-lovers; the season timeline flags them "modner ikke ute her" (won't ripen). Seeding both an open
// bed and a greenhouse lets the GDD cover-factor bonus be exercised (greenhouse lowers the harvest DOY /
// can flip a borderline crop) against the same crop in the open.
export const scenario: Scenario = {
  key: "cold-station-wont-ripen",
  title: "Kald stasjon — modner ikke ute (Alta)",
  seed: {
    location: { postnummer: "9501" },
    boxes: [
      { id: "cold-open", name: "Friland", createdAt: "2026-01-01T00:00:00.000Z", zoneType: "BOX", bedType: "open", sunExposure: "sun", depthCm: 25, layout: { x: 0, y: 0, w: 4, h: 3 } },
      { id: "cold-gh", name: "Drivhus", createdAt: "2026-01-01T00:00:00.000Z", zoneType: "BOX", bedType: "greenhouse", sunExposure: "sun", depthCm: 30, layout: { x: 4, y: 0, w: 4, h: 3 } },
    ],
    plantings: [],
  },
  startDate: "2026-03-20",
  endDate: "2026-10-01",
  persona: "maximise-harvest",
  maxSteps: 70,
  maxNoAdvance: 6,
  exercises: "modner-ikke-ute-flagg for varmekjære, drivhus GDD-cover-bonus vs friland, kort vekstsesong",
};

export default scenario;
