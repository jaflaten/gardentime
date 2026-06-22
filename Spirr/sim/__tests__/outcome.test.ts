// Season-outcome telemetry (descriptive, not pass/fail). Pure over a hand-built transcript.
import { describe, expect, it } from "vitest";
import { computeSeasonOutcome } from "../eval/outcome";
import type { TranscriptEntry } from "../observe/log";

const obs = (harvestSoon: string[]): TranscriptEntry => ({
  kind: "observe",
  step: 0,
  simDate: "2026-07-01",
  doy: 182,
  offered: { sowIndoor: [], sowOutdoor: [], plantOut: [], harvestSoon, warnings: [] },
});
const act = (action: string, ok = true): TranscriptEntry =>
  ({ kind: "action", step: 0, simDate: "2026-07-01", action: { action }, result: { ok } }) as TranscriptEntry;
const harvest = (planting: string, ok = true): TranscriptEntry =>
  ({ kind: "action", step: 0, simDate: "2026-07-01", action: { action: "harvest", planting }, result: { ok } }) as TranscriptEntry;

describe("computeSeasonOutcome", () => {
  it("counts sow/plant-out/harvest/remove from successful actions only", () => {
    const o = computeSeasonOutcome([
      act("sow_indoor"),
      act("sow_outdoor"),
      act("sow_outdoor", false), // failed → not counted
      act("plant_out"),
      act("harvest"),
      act("remove_planting"),
    ]);
    expect(o.sown).toBe(2);
    expect(o.plantedOut).toBe(1);
    expect(o.harvested).toBe(1);
    expect(o.removedOrFailed).toBe(1);
  });

  it("tracks distinct ready signals offered vs ripe-at-end", () => {
    const o = computeSeasonOutcome([
      obs(["A tomat (ready)", "#3 salat (soon)"]), // 1 ready (A)
      obs(["A tomat (ready)", "B agurk (ready)"]), // ready: A, B → everReady {A,B}
      obs(["B agurk (ready)"]), // final observation: only B ripe at end
    ]);
    expect(o.harvestSignalsOffered).toBe(2); // A and B were ready at some point
    expect(o.ripeAtSeasonEnd).toBe(1); // only B in the last observation
  });

  it("computes harvest-rate over ever-ripe handles (cumulative denominator penalises misses)", () => {
    const o = computeSeasonOutcome([
      obs(["A tomat (ready)", "B agurk (ready)"]), // everReady {A,B}
      harvest("A"), // A harvested
      obs(["B agurk (ready)"]), // B still ripe, never harvested → a miss
    ]);
    expect(o.harvestSignalsOffered).toBe(2);
    expect(o.ripeHarvested).toBe(1); // only A
    expect(o.harvestRate).toBeCloseTo(0.5); // 1 of 2 ripe harvested
  });

  it("harvest of a never-ready handle counts as a harvest but not against the ripe denominator", () => {
    const o = computeSeasonOutcome([obs(["A tomat (ready)"]), harvest("Z")]);
    expect(o.harvested).toBe(1);
    expect(o.ripeHarvested).toBe(0); // Z was never flagged ready
    expect(o.harvestRate).toBe(0); // A was ripe, nothing ripe harvested
  });

  it("plant-out rate is the seedling→bed funnel", () => {
    const o = computeSeasonOutcome([act("sow_indoor"), act("sow_indoor"), act("sow_indoor"), act("plant_out")]);
    expect(o.sownIndoor).toBe(3);
    expect(o.plantedOut).toBe(1);
    expect(o.plantOutRate).toBeCloseTo(1 / 3);
  });
});
