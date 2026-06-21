// Regression layer: replay a recorded LLM transcript with NO model. Asserts (a) determinism — two
// replays of the same actions produce byte-identical normalized state — and (b) all hard invariants
// hold on the replayed state. This is the flywheel: an interesting LLM-generated sequence, frozen into
// a cheap deterministic test. Ollama non-determinism is irrelevant here (we replay actions, not the model).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { replayReport } from "../replay";
import type { RunReport } from "../report/report";

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), "sim/__tests__/fixtures/precultivation-7b.json"), "utf8"),
) as RunReport;

describe("transcript replay", () => {
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

  it("reproduces the full life-stage arc (forkultivering → plant-out → harvest)", async () => {
    const { normalized } = await replayReport(fixture);
    // At least one planting was started indoors and planted out (has a transplantedDate, box set).
    const plantedOut = normalized.plantings.filter((p) => p.transplantedDate && p.box);
    expect(plantedOut.length).toBeGreaterThan(0);
    // Identity continuity: the indoor sow date precedes the plant-out date for each.
    for (const p of plantedOut) {
      expect(p.plantedDate <= (p.transplantedDate ?? p.plantedDate)).toBe(true);
    }
    // At least one harvested planting.
    expect(normalized.plantings.some((p) => p.status === "harvested" && p.harvestDate)).toBe(true);
  });
});
