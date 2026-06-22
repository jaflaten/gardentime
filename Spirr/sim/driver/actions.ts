// AppDriver — the gardener's verbs. Translates a validated GardenAction into real store mutations,
// stamping every date from the SimClock so derived `year`/age/GDD anchors are correct. New box/planting
// nanoids are captured via `.at(-1)` immediately after the (void-returning) store action and mapped to
// short handles. Nothing here throws on bad input — invalid handles/keys return a structured result.

import type { SimContext } from "../runtime/bootstrap";
import type { SimClock, SeasonalEvent } from "../runtime/clock";
import type { HandleRegistry } from "./handles";
import type { GardenAction } from "./schema";
import type { ActionResult } from "../observe/log";
import { isIndoorSeedling } from "../../src/lib/planting";
import { frostTenderPlantOutCaution } from "../../src/lib/sowWindow";
import type { CustomPlantInput } from "../../src/store/useCustomPlantsStore";

export interface ApplyOutcome extends ActionResult {
  /** The seasonal event crossed by an advance action, if any (for the transcript). */
  event?: SeasonalEvent;
}

export class AppDriver {
  constructor(
    private readonly ctx: SimContext,
    private readonly clock: SimClock,
    private readonly handles: HandleRegistry,
  ) {}

  private get garden() {
    return this.ctx.gardenStore.getState();
  }

  apply(action: GardenAction): ApplyOutcome {
    switch (action.action) {
      case "set_location":
        return this.setLocation(action);
      case "add_box":
        return this.addBox(action);
      case "sow_indoor":
        return this.sow(action.plant, undefined, action.variety, action.quantity);
      case "sow_outdoor":
        return this.sow(action.plant, action.box, action.variety, action.quantity);
      case "plant_out":
        return this.plantOut(action.planting, action.box);
      case "harvest":
        return this.harvest(action.planting, action.yield);
      case "remove_planting":
        return this.removePlanting(action.planting, action.reason);
      case "advance_days":
        this.clock.advanceDays(action.days);
        return { ok: true, note: `→ ${this.clock.iso()} (doy ${this.clock.doy()})` };
      case "advance_to_next_event": {
        const event = this.clock.advanceToNextEvent();
        return { ok: true, event, note: `→ ${event.label} ${this.clock.iso()}` };
      }
      case "note":
        return { ok: true, note: action.text };
      case "add_custom_plant":
        return this.addCustomPlant(action);
    }
  }

  private addCustomPlant(a: Extract<GardenAction, { action: "add_custom_plant" }>): ApplyOutcome {
    const input: CustomPlantInput = {
      name_no: a.name_no,
      name_pl: a.name_no,
      name_en: a.name_no,
      emoji: a.emoji ?? "🌱",
      category: a.category,
      family: a.family,
      gddToMaturity: a.gddToMaturity,
      gddBase: a.gddBase,
      frostTender: a.frostTender,
      sowRules: a.sowRules,
      harvestRule: a.harvestRule,
    };
    const plant = this.ctx.customPlantsStore.getState().addPlant(input);
    return { ok: true, note: `lagde egendefinert plante «${a.name_no}» (key ${plant.key})` };
  }

  private setLocation(a: Extract<GardenAction, { action: "set_location" }>): ApplyOutcome {
    const loc = this.ctx.locationStore.getState();
    loc.setPostnummer(a.postnummer);
    if (a.elevationM != null) {
      loc.setElevation(a.elevationM);
    }
    if (a.frostJusteringDays != null) {
      loc.setFrostJustering(a.frostJusteringDays);
    }
    const resolved = this.ctx.locationStore.getState().resolved();
    if (!resolved) {
      return { ok: false, error: `postnummer ${a.postnummer} did not resolve to a station` };
    }
    return { ok: true, note: `${resolved.station.name} (siste frost doy ${resolved.lastFrostDoy})` };
  }

  private addBox(a: Extract<GardenAction, { action: "add_box" }>): ApplyOutcome {
    this.garden.addBox(a.name, {
      bedType: a.bedType,
      sunExposure: a.sunExposure,
      depthCm: a.depthCm,
      widthCm: a.widthCm,
      lengthCm: a.lengthCm,
    });
    const box = this.garden.boxes.at(-1);
    if (!box) {
      return { ok: false, error: "addBox produced no box" };
    }
    const handle = this.handles.registerBox(box.id);
    return { ok: true, handle, note: `kasse ${handle} «${a.name}»` };
  }

  private sow(plantKey: string, boxHandle: string | undefined, variety?: string, quantity?: number): ApplyOutcome {
    if (!this.ctx.findPlant(plantKey)) {
      return { ok: false, error: `unknown plant "${plantKey}" — use a key from the catalog` };
    }
    let boxId: string | undefined;
    if (boxHandle) {
      boxId = this.handles.boxId(boxHandle);
      if (!boxId) {
        return { ok: false, error: `no box with handle "${boxHandle}" (known: ${this.handles.boxHandles().join(", ") || "none"})` };
      }
    }
    this.garden.addPlanting({
      plantKey,
      boxId,
      variety,
      quantity,
      plantedDate: this.clock.iso(),
      status: "active",
    });
    const pl = this.garden.plantings.at(-1);
    if (!pl) {
      return { ok: false, error: "addPlanting produced no planting" };
    }
    const handle = this.handles.registerPlanting(pl.id);
    const where = boxHandle ? `ute i kasse ${boxHandle}` : "inne (forkultivering)";
    return { ok: true, handle, note: `sådde ${plantKey} ${where} som ${handle}` };
  }

  private plantOut(plantingHandle: string, boxHandle: string): ApplyOutcome {
    const id = this.handles.plantingId(plantingHandle);
    if (!id) {
      return { ok: false, error: `no planting with handle "${plantingHandle}"` };
    }
    const boxId = this.handles.boxId(boxHandle);
    if (!boxId) {
      return { ok: false, error: `no box with handle "${boxHandle}"` };
    }
    const pl = this.garden.plantings.find((p) => p.id === id);
    if (!pl) {
      return { ok: false, error: `planting ${plantingHandle} no longer exists` };
    }
    if (!isIndoorSeedling(pl)) {
      return { ok: false, error: `${plantingHandle} is already planted out (in a box)`, noop: true };
    }
    if (this.clock.iso() < pl.plantedDate) {
      // Guard: a seedling can't be planted out before it was sown (would reverse transplantedDate<plantedDate).
      return { ok: false, error: `${plantingHandle} er ikke sådd ennå (sådd ${pl.plantedDate})` };
    }
    // Preserve plantedDate (indoor sow date); only set boxId + transplantedDate. Identity continuity.
    this.garden.updatePlanting(id, { boxId, transplantedDate: this.clock.iso() });
    // A2: a frost-tender seedling planted out before last frost gets a soft caution (the app would
    // show one here) — recorded on the result note so the transcript/judge can see the early plant-out.
    const plant = this.ctx.findPlant(pl.plantKey);
    const resolved = this.ctx.locationStore.getState().resolved();
    const caution = plant && resolved ? frostTenderPlantOutCaution(plant, resolved.lastFrostDoy, this.clock.doy()) : null;
    return { ok: true, note: `plantet ut ${plantingHandle} i kasse ${boxHandle}${caution ? ` — ⚠ ${caution}` : ""}` };
  }

  private harvest(plantingHandle: string, harvestYield?: string): ApplyOutcome {
    const id = this.handles.plantingId(plantingHandle);
    if (!id) {
      return { ok: false, error: `no planting with handle "${plantingHandle}"` };
    }
    const pl = this.garden.plantings.find((p) => p.id === id);
    if (!pl) {
      return { ok: false, error: `planting ${plantingHandle} no longer exists` };
    }
    if (pl.status !== "active") {
      return { ok: false, error: `${plantingHandle} is ${pl.status}, not active`, noop: true };
    }
    if (isIndoorSeedling(pl)) {
      return { ok: false, error: `${plantingHandle} is still an indoor seedling — plant it out before harvest` };
    }
    if (this.clock.iso() < pl.plantedDate) {
      // Guard: can't harvest a planting before it was sown (would reverse harvestDate<plantedDate).
      return { ok: false, error: `${plantingHandle} er ikke sådd ennå (sådd ${pl.plantedDate})` };
    }
    this.garden.markHarvested(id, { date: this.clock.iso(), harvestYield });
    return { ok: true, note: `høstet ${plantingHandle}${harvestYield ? ` (${harvestYield})` : ""}` };
  }

  private removePlanting(plantingHandle: string, reason: "removed" | "failed"): ApplyOutcome {
    const id = this.handles.plantingId(plantingHandle);
    if (!id) {
      return { ok: false, error: `no planting with handle "${plantingHandle}"` };
    }
    const pl = this.garden.plantings.find((p) => p.id === id);
    if (!pl) {
      return { ok: false, error: `planting ${plantingHandle} no longer exists` };
    }
    this.garden.updatePlanting(id, { status: reason });
    return { ok: true, note: `${reason === "failed" ? "feilet" : "fjernet"} ${plantingHandle}` };
  }
}
