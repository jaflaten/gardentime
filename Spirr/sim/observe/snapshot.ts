// ObservedGarden — what the app *would* show the gardener right now, rebuilt from the same pure libs
// the components call (sowWindow, seasonTimeline, rotation, gardenStats). This is the headless mirror
// of the screen. Known limitation: grouping logic that still lives in .tsx can drift from this; the
// tier-2 browser pass is what catches that. The headless tier asserts the *logic*.

import type { SimContext } from "../runtime/bootstrap";
import type { SimClock } from "../runtime/clock";
import type { HandleRegistry } from "../driver/handles";
import type { PlantInfo, Planting } from "../../src/types";
import type { ResolvedLocation } from "../../src/lib/location";
import { matchingSowKind, transplantReadiness } from "../../src/lib/sowWindow";
import { isIndoorSeedling, plantedAgeLabel } from "../../src/lib/planting";
import { buildSeasonTimeline } from "../../src/lib/seasonTimeline";
import { boxRotationHistory, plantingFamilyResolver, familyConflictYears } from "../../src/lib/rotation";
import { computeGardenStats } from "../../src/lib/gardenStats";

export interface ObservedPlant {
  key: string;
  name: string;
  emoji: string;
}
export interface ObservedBoxPlanting {
  handle: string;
  plantKey: string;
  name: string;
  ageLabel: string;
  status: Planting["status"];
}
export interface ObservedBox {
  handle: string;
  name: string;
  bedType?: string;
  sun?: string;
  depthCm?: number;
  plantings: ObservedBoxPlanting[];
  /** "Same family grown here in 2024 og 2025" style cautions a sow into this box would trigger. */
  rotationCautions: string[];
}
export interface ObservedSeedling {
  handle: string;
  plantKey: string;
  name: string;
  ageLabel: string;
  readiness: "soon" | "ready" | "overdue" | null;
  weeks: number;
}
export interface ObservedHarvest {
  handle: string;
  plantKey: string;
  name: string;
  status: "ready" | "soon";
  wontRipen: boolean;
}
export interface ObservedGarden {
  date: string;
  doy: number;
  year: number;
  phase: string;
  location: { postnummer: string; station: string; lastFrostDoy: number; firstFrostDoy: number } | null;
  sowNow: { indoor: ObservedPlant[]; outdoor: ObservedPlant[]; plantOut: ObservedPlant[] };
  boxes: ObservedBox[];
  seedlings: ObservedSeedling[];
  harvestSoon: ObservedHarvest[];
  stats: { totalActive: number; distinctSpecies: number; distinctFamilies: number; bedsInUse: number };
}

function seasonPhase(doy: number, resolved: ResolvedLocation | null): string {
  if (!resolved) {
    return "ukjent (ingen lokasjon satt)";
  }
  const { lastFrostDoy, firstFrostDoy } = resolved;
  if (doy < lastFrostDoy - 8 * 7) {
    return "vinter";
  }
  if (doy < lastFrostDoy) {
    return "vår — forkultiverings- og såtid";
  }
  if (doy < firstFrostDoy - 6 * 7) {
    return "vekstsesong";
  }
  if (doy < firstFrostDoy) {
    return "sen sesong — høsting";
  }
  return "etter første frost — sesongslutt";
}

function lean(p: PlantInfo): ObservedPlant {
  return { key: p.key, name: p.name_no, emoji: p.emoji };
}

export function buildSnapshot(ctx: SimContext, clock: SimClock, handles: HandleRegistry): ObservedGarden {
  const resolved = ctx.locationStore.getState().resolved();
  const doy = clock.doy();
  const year = clock.year();
  const today = clock.now();
  const findPlant = ctx.findPlant;
  const mergedPlants: PlantInfo[] = [...ctx.bundledPlants, ...ctx.customPlantsStore.getState().plants];
  const plantings = ctx.gardenStore.getState().plantings;
  const boxes = ctx.gardenStore.getState().boxes;

  // "Hva passer å så nå?" — same sow-window rule the SowNowCard uses, grouped by action kind.
  const sowNow = { indoor: [] as ObservedPlant[], outdoor: [] as ObservedPlant[], plantOut: [] as ObservedPlant[] };
  if (resolved) {
    for (const plant of mergedPlants) {
      const kind = matchingSowKind(plant, resolved.lastFrostDoy, doy);
      if (kind === "indoor") {
        sowNow.indoor.push(lean(plant));
      } else if (kind === "outdoor") {
        sowNow.outdoor.push(lean(plant));
      } else if (kind === "transplant") {
        sowNow.plantOut.push(lean(plant));
      }
    }
  }

  // Boxes + occupancy + per-box rotation caution (the decision-time signal a sow here would raise).
  const familyOf = plantingFamilyResolver(findPlant);
  const observedBoxes: ObservedBox[] = boxes.map((box) => {
    const occupants = plantings.filter((p) => p.boxId === box.id && p.status === "active");
    const history = boxRotationHistory(plantings, box.id, familyOf, year);
    const cautions: string[] = [];
    for (const [family, years] of history.byFamily) {
      const conflict = familyConflictYears(history, family);
      if (conflict.length > 0) {
        cautions.push(`familie ${family} dyrket her ${years.join(", ")}`);
      }
    }
    return {
      handle: handles.boxHandle(box.id) ?? "?",
      name: box.name,
      bedType: box.bedType,
      sun: box.sunExposure,
      depthCm: box.depthCm,
      plantings: occupants.map((p) => ({
        handle: handles.plantingHandle(p.id) ?? "?",
        plantKey: p.plantKey,
        name: findPlant(p.plantKey)?.name_no ?? p.customName ?? p.plantKey,
        ageLabel: plantedAgeLabel(p.plantedDate, today),
        status: p.status,
      })),
      rotationCautions: cautions,
    };
  });

  // Seedling tray — indoor seedlings (no boxId) + plant-out readiness derived from the transplant rule.
  const seedlings: ObservedSeedling[] = plantings
    .filter((p) => isIndoorSeedling(p) && p.status === "active")
    .map((p) => {
      const plant = findPlant(p.plantKey);
      const tr = plant && resolved ? transplantReadiness(plant, resolved.lastFrostDoy, doy) : null;
      return {
        handle: handles.plantingHandle(p.id) ?? "?",
        plantKey: p.plantKey,
        name: plant?.name_no ?? p.customName ?? p.plantKey,
        ageLabel: plantedAgeLabel(p.plantedDate, today),
        readiness: tr?.status ?? null,
        weeks: tr?.weeks ?? 0,
      };
    });

  // Harvest-soon — reuse the real season timeline, then bucket each boxed planting by where today sits
  // relative to its computed harvest band.
  const harvestSoon: ObservedHarvest[] = [];
  if (resolved) {
    const timeline = buildSeasonTimeline(
      plantings,
      findPlant,
      resolved.lastFrostDoy,
      resolved.firstFrostDoy,
      year,
      { base5: resolved.gddCurve5, base10: resolved.gddCurve10 },
      boxes,
    );
    for (const item of timeline.items) {
      if (item.planting.status !== "active") {
        continue;
      }
      const win = item.harvestWindow;
      if (win) {
        const [start, end] = win;
        let status: "ready" | "soon" | null = null;
        if (doy >= start && doy <= end) {
          status = "ready";
        } else if (doy >= start - 14 && doy < start) {
          status = "soon";
        }
        if (status) {
          harvestSoon.push({
            handle: handles.plantingHandle(item.planting.id) ?? "?",
            plantKey: item.planting.plantKey,
            name: item.plant?.name_no ?? item.planting.plantKey,
            status,
            wontRipen: item.wontRipen ?? false,
          });
        }
      }
    }
  }

  const stats = computeGardenStats(plantings, boxes, findPlant, today);

  return {
    date: clock.iso(),
    doy,
    year,
    phase: seasonPhase(doy, resolved),
    location: resolved
      ? {
          postnummer: resolved.postnummer.postnummer,
          station: resolved.station.name,
          lastFrostDoy: resolved.lastFrostDoy,
          firstFrostDoy: resolved.firstFrostDoy,
        }
      : null,
    sowNow,
    boxes: observedBoxes,
    seedlings,
    harvestSoon,
    stats: {
      totalActive: stats.totalActive,
      distinctSpecies: stats.distinctSpecies,
      distinctFamilies: stats.distinctFamilies,
      bedsInUse: stats.bedsUsed,
    },
  };
}
