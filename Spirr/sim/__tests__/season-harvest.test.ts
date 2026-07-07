// Unit tests for the location-only perennial harvest preview (Bær & frukt i sesong). seasonHarvest.ts
// pulls seasonalShiftForPlant → plants (store-backed), so install the in-memory shim first.
import "../runtime/install";
import { describe, expect, it } from "vitest";
import { seasonHarvestPreview, seasonRowForPlant } from "../../src/lib/seasonHarvest";
import type { PlantInfo } from "../../src/types";

// Custom-key perennials (isBundledPlantKey false → no location shift, so windows stay exactly as authored).
function perennial(key: string, seasonal: [string, string]): PlantInfo {
  return {
    key,
    name_no: key,
    name_pl: key,
    name_en: key,
    emoji: "🫐",
    category: "fruit",
    family: "rosaceae",
    perennial: true,
    harvestRule: { seasonal },
  } as PlantInfo;
}

// jordbær-like: 15 Jun–31 Jul → doy 166–212. bringebær-like: 10 Jul–25 Aug → 191–237.
const straw = perennial("custom_straw", ["06-15", "07-31"]);
const rasp = perennial("custom_rasp", ["07-10", "08-25"]);
const apple = perennial("custom_apple", ["08-25", "10-15"]); // 237–288
const annual: PlantInfo = { ...perennial("custom_x", ["01-01", "01-02"]), harvestRule: { weeksFromSowing: [8, 10] } };

describe("seasonRowForPlant", () => {
  it("returns null for a non-seasonal (annual) harvest rule", () => {
    expect(seasonRowForPlant(annual, 110, 200, 2026)).toBeNull();
  });

  it("marks a crop ripe when today is inside its window", () => {
    const row = seasonRowForPlant(straw, 110, 190, 2026); // 9 Jul, inside 166–212
    expect(row?.state).toBe("ripe");
    expect(row?.helper).toContain("På topp nå");
  });

  it("flags the tail of the window as snart over (late)", () => {
    const row = seasonRowForPlant(straw, 110, 210, 2026); // 2 days before end 212
    expect(row?.state).toBe("ripe");
    expect(row?.helper).toContain("Snart over");
  });

  it("marks a crop soon when it opens within ~6 weeks", () => {
    const row = seasonRowForPlant(rasp, 110, 175, 2026); // start 191, 16 days out
    expect(row?.state).toBe("soon");
    expect(row?.helper).toContain("uker til");
  });

  it("marks a crop later when it opens beyond the horizon", () => {
    const row = seasonRowForPlant(apple, 110, 175, 2026); // start 237, ~62 days out
    expect(row?.state).toBe("later");
  });

  it("marks a crop over once today is past the window end", () => {
    const row = seasonRowForPlant(straw, 110, 230, 2026); // past end 212
    expect(row?.state).toBe("over");
  });
});

describe("seasonHarvestPreview", () => {
  it("buckets ripe/soon/later and drops over, sorted within buckets", () => {
    // 9 Jul (doy 190): straw ripe, rasp soon (opens 191), apple later (opens 237).
    const p = seasonHarvestPreview([straw, rasp, apple], 110, 190, 2026);
    expect(p.ripe.map((r) => r.plant.key)).toEqual(["custom_straw"]);
    expect(p.soon.map((r) => r.plant.key)).toEqual(["custom_rasp"]);
    expect(p.later.map((r) => r.plant.key)).toEqual(["custom_apple"]);
  });

  it("excludes finished seasons entirely", () => {
    // 1 Sep (doy 244): straw over (ended 212), rasp over? ends 237 → over, apple ripe (237–288).
    const p = seasonHarvestPreview([straw, rasp, apple], 110, 244, 2026);
    expect(p.ripe.map((r) => r.plant.key)).toEqual(["custom_apple"]);
    expect(p.soon).toHaveLength(0);
    expect([...p.ripe, ...p.soon, ...p.later].some((r) => r.plant.key === "custom_straw")).toBe(false);
  });
});
