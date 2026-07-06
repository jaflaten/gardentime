// Unit tests for the Såplan pure lib (§2.1): next-action derivation from sow rules, started-this-year
// detection, and the due-reminder set. sowPlan.ts is dependency-light (types only) — no shim needed.
import { describe, expect, it } from "vitest";
import {
  dueSowActions,
  isStartedThisYear,
  nextActionForPlant,
  reminderId,
  sowActionWindows,
} from "../../src/lib/sowPlan";
import type { PlantInfo, Planting } from "../../src/types";

const LAST_FROST = 140; // ~20 May

function plant(over: Partial<PlantInfo>): PlantInfo {
  return {
    key: "tomat",
    name_no: "Tomat",
    name_pl: "Pomidor",
    name_en: "Tomato",
    emoji: "🍅",
    category: "vegetable",
    family: "solanaceae",
    ...over,
  } as PlantInfo;
}

// Indoor 6–8 uker før frost → doy [84, 98]; transplant 1–2 uker etter → doy [147, 154].
const tomato = plant({
  sowRules: [
    { type: "indoor", weeksBeforeLastFrost: [6, 8] },
    { type: "transplant", weeksAfterLastFrost: [1, 2] },
  ],
});

// Outdoor 2–4 uker etter frost → doy [154, 168].
const carrot = plant({ key: "gulrot", name_no: "Gulrot", sowRules: [{ type: "outdoor", weeksAfterLastFrost: [2, 4] }] });

const noRules = plant({ key: "custom_x", name_no: "Egen", sowRules: undefined });

function sownPlanting(over: Partial<Planting>): Planting {
  return {
    id: "p1",
    plantKey: "tomat",
    plantedDate: "2026-03-25",
    status: "active",
    year: 2026,
    ...over,
  };
}

describe("sowActionWindows", () => {
  it("converts indoor rules to before-frost windows and outdoor/transplant to after-frost windows", () => {
    expect(sowActionWindows(tomato, LAST_FROST)).toEqual([
      { kind: "indoor", startDoy: 84, endDoy: 98 },
      { kind: "transplant", startDoy: 147, endDoy: 154 },
    ]);
    expect(sowActionWindows(carrot, LAST_FROST)).toEqual([{ kind: "outdoor", startDoy: 154, endDoy: 168 }]);
    expect(sowActionWindows(noRules, LAST_FROST)).toEqual([]);
  });
});

describe("nextActionForPlant", () => {
  it("reports an open indoor window as 'now' with its end date", () => {
    const action = nextActionForPlant(tomato, LAST_FROST, 90);
    expect(action).toMatchObject({ kind: "indoor", state: "now", startDoy: 84, endDoy: 98 });
    expect(action?.helper).toContain("Så inne nå");
    expect(action?.helper).toContain("08.04"); // doy 98
  });

  it("reports the nearest future window as 'upcoming' before the season starts", () => {
    const action = nextActionForPlant(tomato, LAST_FROST, 60);
    expect(action).toMatchObject({ kind: "indoor", state: "upcoming", startDoy: 84 });
    expect(action?.helper).toContain("Så inne fra ca.");
  });

  it("moves on to the transplant window once the indoor window has passed", () => {
    const action = nextActionForPlant(tomato, LAST_FROST, 120);
    expect(action).toMatchObject({ kind: "transplant", state: "upcoming", startDoy: 147 });
    expect(action?.helper).toContain("Plant ut fra ca.");
  });

  it("reports 'past' after every window is over", () => {
    const action = nextActionForPlant(tomato, LAST_FROST, 200);
    expect(action).toMatchObject({ kind: "transplant", state: "past" });
    expect(action?.helper).toContain("over");
  });

  it("handles outdoor-only crops and returns null without sow rules", () => {
    expect(nextActionForPlant(carrot, LAST_FROST, 160)).toMatchObject({ kind: "outdoor", state: "now" });
    expect(nextActionForPlant(noRules, LAST_FROST, 160)).toBeNull();
  });
});

describe("isStartedThisYear", () => {
  it("counts active and harvested plantings of the crop this year, not removed/failed or other years", () => {
    expect(isStartedThisYear([sownPlanting({})], "tomat", 2026)).toBe(true);
    expect(isStartedThisYear([sownPlanting({ status: "harvested" })], "tomat", 2026)).toBe(true);
    expect(isStartedThisYear([sownPlanting({ status: "failed" })], "tomat", 2026)).toBe(false);
    expect(isStartedThisYear([sownPlanting({ year: 2025, plantedDate: "2025-03-25" })], "tomat", 2026)).toBe(false);
    expect(isStartedThisYear([sownPlanting({})], "gulrot", 2026)).toBe(false);
  });
});

describe("dueSowActions", () => {
  it("returns only planned crops with an open window that aren't already started", () => {
    // doy 90: tomato indoor window open, carrot outdoor window not yet.
    const due = dueSowActions([tomato, carrot], [], LAST_FROST, 90, 2026);
    expect(due).toHaveLength(1);
    expect(due[0].plant.key).toBe("tomat");
    expect(due[0].id).toBe(reminderId(2026, "indoor", "tomat"));
  });

  it("drops crops that are already underway this season", () => {
    const due = dueSowActions([tomato], [sownPlanting({})], LAST_FROST, 90, 2026);
    expect(due).toHaveLength(0);
  });

  it("re-surfaces a crop when a later window opens (new reminder id per action)", () => {
    const due = dueSowActions([tomato], [], LAST_FROST, 150, 2026);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe(reminderId(2026, "transplant", "tomat"));
  });
});
