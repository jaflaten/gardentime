// ObservedGarden — what the app *would* show the gardener right now, rebuilt from the same pure libs
// the components call (sowWindow, seasonTimeline, rotation, gardenStats). This is the headless mirror
// of the screen. Known limitation: grouping logic that still lives in .tsx can drift from this; the
// tier-2 browser pass is what catches that. The headless tier asserts the *logic*.

import type { SimContext } from "../runtime/bootstrap";
import type { SimClock } from "../runtime/clock";
import type { HandleRegistry } from "../driver/handles";
import type { PlantInfo, Planting } from "../../src/types";
import type { ResolvedLocation } from "../../src/lib/location";
import { isFrostTender, transplantReadiness } from "../../src/lib/sowWindow";
import { groupSowNow, harvestSoonForPlanting } from "../../src/lib/sowNowGroups";
import { isIndoorSeedling, plantedAgeLabel } from "../../src/lib/planting";
import { buildSeasonTimeline, seasonalShiftForPlant } from "../../src/lib/seasonTimeline";
import { coverGddFactor } from "../../src/lib/gdd";
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
  /** Frost-tender crop whose plant-out now (doy < lastFrostDoy) risks frost damage — the A2 caution. */
  frostRisk: boolean;
}
export interface ObservedHarvest {
  handle: string;
  plantKey: string;
  name: string;
  /** §2.2 ripeness progression — "late" is still ripe (window closing), not a third pre-ripe state. */
  status: "ready" | "soon" | "late";
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
  /** Active boxed crops the GDD model says won't ripen outdoors here (no harvest window) — a cold-garden signal. */
  wontRipen: ObservedPlant[];
  /** Custom plants the gardener has created (add_custom_plant) — surfaced so their keys are discoverable. */
  customPlants: ObservedPlant[];
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
  // Only plantings that have actually been sown by today are observable — a planting whose plantedDate is
  // in the future hasn't happened yet. In the real app "now" is the clock, so every stored planting is
  // already in the past; this filter only corrects the sim, where a fixture can be back-dated before a
  // seeded planting's date (e.g. demo-garden's May 2026 seedlings seen from a March start). Surfacing one
  // let the gardener "plant out" a not-yet-sown seedling → transplantedDate < plantedDate (a false invariant break).
  const todayIso = clock.iso();
  const plantings = ctx.gardenStore.getState().plantings.filter((p) => p.plantedDate <= todayIso);
  const boxes = ctx.gardenStore.getState().boxes;

  // "Hva passer å så nå?" — the SAME grouper the SowNowCard renders (src/lib/sowNowGroups), so the
  // headless snapshot can't drift from the screen.
  const sowNow = { indoor: [] as ObservedPlant[], outdoor: [] as ObservedPlant[], plantOut: [] as ObservedPlant[] };
  if (resolved) {
    const groups = groupSowNow(mergedPlants, resolved.lastFrostDoy, doy);
    sowNow.indoor = groups.indoor.map((r) => lean(r.plant));
    sowNow.outdoor = groups.outdoor.map((r) => lean(r.plant));
    sowNow.plantOut = groups.transplant.map((r) => lean(r.plant));
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
        frostRisk: !!(plant && resolved && isFrostTender(plant) && doy < resolved.lastFrostDoy),
      };
    });

  // Harvest-soon — the SAME per-planting decision the SowNowCard "Høst snart" group uses
  // (src/lib/sowNowGroups.harvestSoonForPlanting), so the snapshot mirrors the screen. Crops the GDD
  // model says won't ripen here never match "harvest soon" — surface them separately from the season
  // timeline (the cold-garden "modner ikke ute" signal).
  const harvestSoon: ObservedHarvest[] = [];
  const wontRipen: ObservedPlant[] = [];
  if (resolved) {
    const curves = { base5: resolved.gddCurve5, base10: resolved.gddCurve10 };
    for (const p of plantings) {
      if (p.status !== "active" || !p.boxId) {
        continue;
      }
      const plant = findPlant(p.plantKey);
      if (!plant?.harvestRule) {
        continue;
      }
      const shift = seasonalShiftForPlant(plant.key, resolved.lastFrostDoy);
      const coverFactor = coverGddFactor(boxes.find((b) => b.id === p.boxId)?.bedType);
      const check = harvestSoonForPlanting(p, plant, today, doy, resolved.firstFrostDoy, shift, curves, coverFactor);
      if (check.matches) {
        harvestSoon.push({
          handle: handles.plantingHandle(p.id) ?? "?",
          plantKey: p.plantKey,
          name: plant.name_no ?? p.plantKey,
          status: check.status,
          wontRipen: false,
        });
      }
    }
    const timeline = buildSeasonTimeline(plantings, findPlant, resolved.lastFrostDoy, resolved.firstFrostDoy, year, curves, boxes);
    for (const item of timeline.items) {
      if (item.planting.status === "active" && item.wontRipen && item.plant) {
        wontRipen.push(lean(item.plant));
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
    wontRipen,
    customPlants: ctx.customPlantsStore.getState().plants.map(lean),
    stats: {
      totalActive: stats.totalActive,
      distinctSpecies: stats.distinctSpecies,
      distinctFamilies: stats.distinctFamilies,
      bedsInUse: stats.bedsUsed,
    },
  };
}
