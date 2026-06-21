// add_custom_plant (B2): schema validation + a driver round-trip — created plant is findable and sowable.
import { describe, expect, it } from "vitest";
import { bootstrap } from "../runtime/bootstrap";
import { SimClock } from "../runtime/clock";
import { HandleRegistry } from "../driver/handles";
import { AppDriver } from "../driver/actions";
import { validateAction } from "../driver/schema";

describe("validateAction(add_custom_plant)", () => {
  it("accepts a minimal valid plant", () => {
    const r = validateAction({ action: "add_custom_plant", name_no: "Jordskokk", category: "vegetable", family: "asteraceae" });
    expect(r.ok).toBe(true);
  });

  it("rejects a missing name and a bad family", () => {
    expect(validateAction({ action: "add_custom_plant", category: "vegetable", family: "asteraceae" }).ok).toBe(false);
    expect(validateAction({ action: "add_custom_plant", name_no: "X", category: "vegetable", family: "klingon" }).ok).toBe(false);
  });
});

describe("AppDriver add_custom_plant → sow_indoor", () => {
  it("creates a plant whose generated key is then findable and sowable", async () => {
    const ctx = await bootstrap({ location: { postnummer: "6856" } });
    const clock = new SimClock(ctx.clock.setNow, "2026-03-01");
    const driver = new AppDriver(ctx, clock, new HandleRegistry());

    const created = driver.apply({
      action: "add_custom_plant",
      name_no: "Jordskokk",
      category: "vegetable",
      family: "asteraceae",
      gddBase: 5,
    });
    expect(created.ok).toBe(true);
    const key = created.note?.match(/key (custom_\w+)/)?.[1];
    expect(key).toBeTruthy();
    expect(ctx.findPlant(key!)).toBeDefined();

    const sown = driver.apply({ action: "sow_indoor", plant: key! });
    expect(sown.ok).toBe(true);

    ctx.clock.setNow(null);
  });
});
