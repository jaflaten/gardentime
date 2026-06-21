// Unit tests for the production clock seam + the sow-window intelligence it feeds. Pure — no store,
// no shim needed (we craft a minimal PlantInfo instead of importing the store-backed catalog).
import { afterEach, describe, expect, it } from "vitest";
import { setNow, now, isOverridden } from "../../src/lib/clock";
import { todayDoy, transplantReadiness, matchingSowKind } from "../../src/lib/sowWindow";
import type { PlantInfo } from "../../src/types";

const tomato: PlantInfo = {
  key: "tomat_cherry",
  name_no: "Tomat",
  name_pl: "Pomidor",
  name_en: "Tomato",
  emoji: "🍅",
  category: "vegetable",
  family: "solanaceae",
  sowRules: [
    { type: "indoor", weeksBeforeLastFrost: [6, 8] },
    { type: "transplant", weeksAfterLastFrost: [1, 2] },
  ],
};

afterEach(() => setNow(null));

describe("clock seam", () => {
  it("returns real time by default and overrides with setNow", () => {
    expect(isOverridden()).toBe(false);
    setNow("2026-03-15");
    expect(isOverridden()).toBe(true);
    expect(now().getFullYear()).toBe(2026);
    expect(now().getMonth()).toBe(2); // March
    setNow(null);
    expect(isOverridden()).toBe(false);
  });

  it("anchors date-only strings to the local calendar day (not UTC midnight)", () => {
    setNow("2026-03-15");
    expect(now().getFullYear()).toBe(2026);
    expect(now().getMonth()).toBe(2); // March
    expect(now().getDate()).toBe(15); // not the 14th in negative-offset zones
  });

  it("ignores unparsable input and stays on real time", () => {
    setNow("not-a-date");
    expect(isOverridden()).toBe(false);
    expect(Number.isNaN(now().getTime())).toBe(false);
  });

  it("todayDoy() follows the simulated clock", () => {
    setNow("2026-01-01");
    expect(todayDoy()).toBe(1);
    setNow("2026-02-10");
    expect(todayDoy()).toBe(41);
  });
});

describe("sow-window over the sim clock (Sogndal last frost ~ doy 114)", () => {
  const LF = 114;

  it("tomato is not sowable in early February (too early for the indoor window)", () => {
    expect(matchingSowKind(tomato, LF, 41)).toBeNull();
    expect(transplantReadiness(tomato, LF, 41)?.status).toBe("soon");
  });

  it("tomato indoor window opens ~6-8 weeks before last frost", () => {
    // 7 weeks before LF (doy 114 - 49 = 65) is inside indoor[6,8].
    expect(matchingSowKind(tomato, LF, 65)).toBe("indoor");
  });

  it("tomato plant-out window opens after last frost and goes overdue later", () => {
    expect(transplantReadiness(tomato, LF, LF + 10)?.status).toBe("ready");
    expect(transplantReadiness(tomato, LF, LF + 40)?.status).toBe("overdue");
  });
});
