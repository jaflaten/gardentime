import type { Scenario } from "./types";

// Beginner cold-start: NO location set, empty garden, 1 March. Forces the full onboarding arc —
// the gardener must set_location first (the snapshot shouts that it's missing), then box → indoor
// sow → plant-out at frost → growth → harvest. Exercises the "location not set" code path that the
// pre-seeded scenarios skip.
export const scenario: Scenario = {
  key: "first-time-empty-vestland-march",
  title: "Første sesong fra blanke ark (Sogndal, mars)",
  seed: {
    boxes: [],
    plantings: [],
    // No location — the gardener must set it.
  },
  startDate: "2026-03-01",
  endDate: "2026-09-30",
  persona: "eager-beginner",
  maxSteps: 70,
  maxNoAdvance: 6,
  exercises: "set_location som første handling, full nybegynnerbue: sted → kasse → så → plant ut → høst",
};

export default scenario;
