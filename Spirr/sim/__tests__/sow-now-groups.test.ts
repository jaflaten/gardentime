// Unit tests for the extracted SowNowCard grouping libs (B3) and the frost-tender plant-out caution
// (A2). The functions take plants/plantings as args, but sowNowGroups statically pulls in store-backed
// libs (seasonTimeline → plants → useGardenStore), whose module-init touches localStorage — so install
// the in-memory shim FIRST, before that import chain evaluates.
import "../runtime/install";
import { describe, expect, it } from "vitest";
import {
  groupHarvestSoon,
  groupSowNow,
  harvestSoonForPlanting,
  type HarvestLocation,
} from "../../src/lib/sowNowGroups";
import { frostTenderPlantOutCaution, isFrostTender } from "../../src/lib/sowWindow";
import type { Box, PlantInfo, Planting } from "../../src/types";

const LF = 114; // Sogndal last spring frost ≈ doy 114
const FF = 280; // first autumn frost (arbitrary, ~early Oct)

const tomato: PlantInfo = {
  key: "tomat_cherry",
  name_no: "Tomat",
  name_pl: "Pomidor",
  name_en: "Tomato",
  emoji: "🍅",
  category: "vegetable",
  family: "solanaceae",
  frostTender: true,
  gddBase: 10,
  sowRules: [
    { type: "indoor", weeksBeforeLastFrost: [6, 8] },
    { type: "transplant", weeksAfterLastFrost: [1, 2] },
  ],
  harvestRule: { weeksFromSowing: [12, 14] },
};

const salat: PlantInfo = {
  key: "salat",
  name_no: "Salat",
  name_pl: "Sałata",
  name_en: "Lettuce",
  emoji: "🥬",
  category: "vegetable",
  family: "asteraceae",
  gddBase: 5,
  sowRules: [{ type: "outdoor", weeksAfterLastFrost: [0, 6] }],
  harvestRule: { weeksFromSowing: [6, 8] },
};

const noCurveLocation: HarvestLocation = { lastFrostDoy: LF, firstFrostDoy: FF, gddCurve5: [], gddCurve10: [] };

function box(id: string): Box {
  return { id, name: id, createdAt: "2026-01-01", layout: { x: 0, y: 0, w: 1, h: 1 } };
}

function planting(over: Partial<Planting>): Planting {
  return { id: "p1", plantKey: "salat", plantedDate: "2026-05-01", status: "active", year: 2026, ...over };
}

describe("groupSowNow", () => {
  it("puts a frost-tender crop in 'indoor' ~7 weeks before last frost", () => {
    const g = groupSowNow([tomato, salat], LF, LF - 49); // 7 weeks before frost
    expect(g.indoor.map((r) => r.plant.key)).toContain("tomat_cherry");
    expect(g.transplant).toHaveLength(0);
  });

  it("puts the tomato in 'transplant' just after last frost", () => {
    const g = groupSowNow([tomato, salat], LF, LF + 10);
    expect(g.transplant.map((r) => r.plant.key)).toContain("tomat_cherry");
    expect(g.outdoor.map((r) => r.plant.key)).toContain("salat");
  });
});

describe("harvestSoonForPlanting (weeks-since-sowing fallback, no GDD curve)", () => {
  it("matches once the planting is inside its weeksFromSowing window and reports 'ready'", () => {
    const now = new Date("2026-06-19T00:00:00"); // ~7 weeks after 2026-05-01
    const doy = 170;
    const pl = planting({ boxId: "A", plantKey: "salat" });
    const r = harvestSoonForPlanting(pl, salat, now, doy, FF, 0, undefined, 1);
    expect(r.matches).toBe(true);
    expect(r.status).toBe("ready");
  });

  it("does not match a planting sown only days ago", () => {
    const now = new Date("2026-05-05T00:00:00");
    const r = harvestSoonForPlanting(planting({ boxId: "A" }), salat, now, 125, FF, 0, undefined, 1);
    expect(r.matches).toBe(false);
  });

  it("reports 'soon' just before the window and 'late' just past it (§2.2 progression)", () => {
    // salat weeksFromSowing [6,8]: 5 weeks → soon (pre-window grace), 9 weeks → late (post-window grace).
    const now = new Date("2026-06-19T00:00:00");
    const soon = harvestSoonForPlanting(planting({ boxId: "A", plantedDate: "2026-05-15" }), salat, now, 170, FF, 0, undefined, 1);
    expect(soon.matches).toBe(true);
    expect(soon.status).toBe("soon");
    const late = harvestSoonForPlanting(planting({ boxId: "A", plantedDate: "2026-04-17" }), salat, now, 170, FF, 0, undefined, 1);
    expect(late.matches).toBe(true);
    expect(late.status).toBe("late");
    expect(late.helper).toMatch(/Bør høstes snart/);
  });
});

describe("harvestSoonForPlanting (GDD branch, §2.2 progression)", () => {
  // Linear cumulative curve: 100 GDD/month. Sown 2026-05-01 (doy 121, cum ≈ 403) with
  // gddToMaturity 100 → ripe ≈ doy 152, band [152, 166] (2-week floor).
  const LINEAR5 = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200];
  const curves = { base5: LINEAR5, base10: LINEAR5 };
  const gddSalat: PlantInfo = { ...salat, gddToMaturity: 100 };
  const pl = planting({ boxId: "A", plantKey: "salat", plantedDate: "2026-05-01" });

  it("is 'soon' with a weeks estimate before the window opens", () => {
    const r = harvestSoonForPlanting(pl, gddSalat, new Date("2026-05-20T00:00:00"), 140, FF, 0, curves, 1);
    expect(r.matches).toBe(true);
    expect(r.status).toBe("soon");
    expect(r.helper).toMatch(/Snart klar/);
  });

  it("is 'ready' inside the window", () => {
    const r = harvestSoonForPlanting(pl, gddSalat, new Date("2026-06-04T00:00:00"), 155, FF, 0, curves, 1);
    expect(r.status).toBe("ready");
    expect(r.helper).toBe("Klar for høsting");
  });

  it("escalates to 'late' in the window's final days", () => {
    const r = harvestSoonForPlanting(pl, gddSalat, new Date("2026-06-10T00:00:00"), 161, FF, 0, curves, 1);
    expect(r.status).toBe("late");
    expect(r.helper).toMatch(/Bør høstes snart/);
  });
});

describe("groupHarvestSoon", () => {
  it("collapses multiple plantings of one crop into a single row with a count", () => {
    const now = new Date("2026-06-19T00:00:00");
    const doy = 170;
    const plantings = [
      planting({ id: "p1", boxId: "A", plantKey: "salat" }),
      planting({ id: "p2", boxId: "B", plantKey: "salat" }),
    ];
    const rows = groupHarvestSoon(plantings, [salat], [box("A"), box("B")], noCurveLocation, doy, now);
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(2);
  });

  it("skips indoor seedlings (no boxId)", () => {
    const now = new Date("2026-06-19T00:00:00");
    const rows = groupHarvestSoon([planting({ boxId: undefined })], [salat], [], noCurveLocation, 170, now);
    expect(rows).toHaveLength(0);
  });

  it("keeps the most urgent member's status when collapsing (late > ready)", () => {
    const now = new Date("2026-06-19T00:00:00");
    const plantings = [
      planting({ id: "p1", boxId: "A", plantKey: "salat", plantedDate: "2026-05-01" }), // 7 wks → ready
      planting({ id: "p2", boxId: "B", plantKey: "salat", plantedDate: "2026-04-17" }), // 9 wks → late
    ];
    const rows = groupHarvestSoon(plantings, [salat], [box("A"), box("B")], noCurveLocation, 170, now);
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(2);
    expect(rows[0].status).toBe("late");
    expect(rows[0].plantingId).toBe("p2");
  });
});

describe("frost-tender plant-out caution (A2)", () => {
  it("flags only the frost-tender crops", () => {
    expect(isFrostTender(tomato)).toBe(true);
    expect(isFrostTender(salat)).toBe(false);
  });

  it("warns when a frost-tender seedling is planted out before last frost", () => {
    expect(frostTenderPlantOutCaution(tomato, LF, LF - 30)).toMatch(/Frostømfintlig/);
  });

  it("is silent after last frost, or for a hardy crop", () => {
    expect(frostTenderPlantOutCaution(tomato, LF, LF + 5)).toBeNull();
    expect(frostTenderPlantOutCaution(salat, LF, LF - 30)).toBeNull();
  });
});
