// Regression layer: replay each recorded LLM transcript with NO model. Asserts (a) determinism — two
// replays of the same actions produce byte-identical normalized state — and (b) all hard invariants
// hold on the replayed state. This is the flywheel: an interesting LLM-generated sequence, frozen into
// a cheap deterministic test. Ollama non-determinism is irrelevant here (we replay actions, not the model).
//
// One fixture per scenario is frozen under fixtures/. To add or refresh one: run the scenario
// (`npx tsx sim/run.ts --scenario <key> --model qwen2.5:7b`), confirm it replays green
// (`npx tsx sim/replay.ts sim/report/out/<run>.json`), then copy the JSON here and add a row below.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { replayReport } from "../replay";
import type { RunReport } from "../report/report";

interface FixtureSpec {
  /** Scenario key (for the describe label). */
  name: string;
  /** Filename under fixtures/. */
  file: string;
  /** True when the run exercises the full forkultivering → plant-out → harvest arc. */
  arc?: boolean;
}

const FIXTURES: FixtureSpec[] = [
  { name: "precultivation-windowsill-feb", file: "precultivation-7b.json", arc: true },
  { name: "cold-station-wont-ripen", file: "cold-station-7b.json" },
  { name: "direct-sow-vs-transplant", file: "direct-sow-vs-transplant-7b.json" },
  { name: "first-time-empty-vestland-march", file: "first-time-empty-7b.json" },
  { name: "midsummer-harvest-rush", file: "midsummer-harvest-rush-7b.json" },
  { name: "multi-year-rotation-veteran", file: "multi-year-rotation-7b.json" },
  { name: "neglected-harvest", file: "neglected-harvest-7b.json" },
];

function loadFixture(file: string): RunReport {
  return JSON.parse(readFileSync(join(process.cwd(), "sim/__tests__/fixtures", file), "utf8")) as RunReport;
}

describe.each(FIXTURES)("transcript replay — $name", ({ file, arc }) => {
  const fixture = loadFixture(file);

  it("is deterministic (same actions → identical normalized state)", async () => {
    const a = await replayReport(fixture);
    const b = await replayReport(fixture);
    expect(a.normalized).toEqual(b.normalized);
    expect(a.appliedActions).toBeGreaterThan(0);
  });

  it("replayed state satisfies every hard invariant", async () => {
    const { invariants } = await replayReport(fixture);
    const broken = invariants.filter((i) => !i.ok);
    expect(broken, broken.map((b) => `${b.name}: ${b.detail}`).join("; ")).toHaveLength(0);
  });

  it("preserves identity continuity (sow date ≤ plant-out date; harvested rows have a date)", async () => {
    const { normalized } = await replayReport(fixture);
    for (const p of normalized.plantings) {
      if (p.transplantedDate) {
        expect(p.plantedDate <= p.transplantedDate).toBe(true);
      }
      if (p.status === "harvested") {
        expect(p.harvestDate).toBeTruthy();
      }
    }
  });

  if (arc) {
    it("reproduces the full life-stage arc (forkultivering → plant-out → harvest)", async () => {
      const { normalized } = await replayReport(fixture);
      const plantedOut = normalized.plantings.filter((p) => p.transplantedDate && p.box);
      expect(plantedOut.length).toBeGreaterThan(0);
      expect(normalized.plantings.some((p) => p.status === "harvested" && p.harvestDate)).toBe(true);
    });
  }
});
