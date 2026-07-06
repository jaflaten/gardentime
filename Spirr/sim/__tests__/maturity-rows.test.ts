// Regression for the perennial "Klar nå" bug: an active planting whose seasonal harvest window has
// fully closed must drop out of maturityRows ("Neste til høsting"), not linger as a false ready row.
// buildSeasonTimeline → maturityRows pull the store-backed plants chain, so install the shim first.
import "../runtime/install";
import { describe, expect, it } from "vitest";
import { buildSeasonTimeline, maturityRows } from "../../src/lib/seasonTimeline";
import type { PlantInfo, Planting } from "../../src/types";

// A rhubarb-like perennial: seasonal window ~1 May–24 Jun (doy 121–175). Bundled-key shifting doesn't
// apply here (custom key), so the window stays put — easy to reason about.
const rabarbra: PlantInfo = {
  key: "custom_rabarbra",
  name_no: "Rabarbra",
  name_pl: "Rabarbar",
  name_en: "Rhubarb",
  emoji: "🌿",
  category: "vegetable",
  family: "polygonaceae",
  perennial: true,
  harvestRule: { seasonal: ["05-01", "06-24"] },
};

const find = (key: string) => (key === "custom_rabarbra" ? rabarbra : undefined);

const planting: Planting = {
  id: "p1",
  boxId: "b1",
  plantKey: "custom_rabarbra",
  plantedDate: "2025-05-10", // established in a prior year → active all season
  status: "active",
  year: 2025,
};

function rowsAt(todayDoy: number) {
  const tl = buildSeasonTimeline([planting], find, 110, 280, 2026);
  return maturityRows(tl, todayDoy);
}

describe("maturityRows — closed windows drop out", () => {
  it("shows the perennial as ready inside its window (10 Jun, doy 161)", () => {
    const rows = rowsAt(161);
    expect(rows).toHaveLength(1);
    expect(rows[0].ready).toBe(true);
  });

  it("omits the perennial once its window has fully closed (5 Aug, doy 217)", () => {
    // The bug: daysToHarvest < 0 rendered as "Klar nå" even though the season was long over.
    expect(rowsAt(217)).toHaveLength(0);
  });

  it("still lists it as upcoming before the window opens (1 Apr, doy 91)", () => {
    const rows = rowsAt(91);
    expect(rows).toHaveLength(1);
    expect(rows[0].ready).toBe(false);
    expect(rows[0].daysToHarvest).toBeGreaterThan(0);
  });
});
