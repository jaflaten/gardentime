// Hard, deterministic invariants. These catch real bugs (and, because the LLM generates weird-but-valid
// sequences, double as a lightweight fuzzer over the pure libs). Each returns ok/detail; a run is "green"
// when every invariant holds.

import type { SimContext } from "../runtime/bootstrap";
import type { Transcript } from "../observe/log";
import { isIndoorSeedling } from "../../src/lib/planting";
import { buildSeasonTimeline } from "../../src/lib/seasonTimeline";
import { computeGardenStats, computeRotationMatrix } from "../../src/lib/gardenStats";
import { ROTATION_LOOKBACK_YEARS } from "../../src/lib/rotation";

export interface InvariantResult {
  name: string;
  ok: boolean;
  detail: string;
}

function parseIso(d: string): number {
  return new Date(`${d}T00:00:00`).getTime();
}

export function checkInvariants(ctx: SimContext, transcript: Transcript): InvariantResult[] {
  const results: InvariantResult[] = [];
  const plantings = ctx.gardenStore.getState().plantings;
  const boxes = ctx.gardenStore.getState().boxes;
  const boxIds = new Set(boxes.map((b) => b.id));
  const findPlant = ctx.findPlant;

  const add = (name: string, ok: boolean, detail: string) => results.push({ name, ok, detail });

  // 1. Every planting id is unique.
  const ids = plantings.map((p) => p.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  add("unique planting ids", dupes.length === 0, dupes.length ? `duplicates: ${dupes.join(", ")}` : `${ids.length} unique`);

  // 2. Every boxed planting references an existing box (no orphan / no "in two boxes" — single boxId field).
  const orphans = plantings.filter((p) => p.boxId && !boxIds.has(p.boxId));
  add("boxed plantings reference a real box", orphans.length === 0, orphans.length ? `${orphans.length} orphans` : "ok");

  // 3. year === year(plantedDate) — derived from the SOW date, preserved through plant-out.
  const yearMismatch = plantings.filter((p) => p.year !== new Date(`${p.plantedDate}T00:00:00`).getFullYear());
  add(
    "year matches plantedDate",
    yearMismatch.length === 0,
    yearMismatch.length ? yearMismatch.map((p) => `${p.plantKey}:${p.year}≠${p.plantedDate}`).join(", ") : "ok",
  );

  // 4. harvestDate >= plantedDate for everything harvested.
  const badHarvest = plantings.filter((p) => p.harvestDate && parseIso(p.harvestDate) < parseIso(p.plantedDate));
  add("harvestDate >= plantedDate", badHarvest.length === 0, badHarvest.length ? `${badHarvest.length} reversed` : "ok");

  // 5. transplantedDate (plant-out) >= plantedDate (indoor sow) and same calendar year membership for `year`.
  const badTransplant = plantings.filter(
    (p) => p.transplantedDate && parseIso(p.transplantedDate) < parseIso(p.plantedDate),
  );
  add(
    "transplantedDate >= plantedDate (identity continuity)",
    badTransplant.length === 0,
    badTransplant.length ? `${badTransplant.length} reversed` : "ok",
  );

  // 6. No NaN / unparseable dates anywhere (fuzzer guard over the store derivations).
  const nanDates = plantings.filter(
    (p) =>
      Number.isNaN(parseIso(p.plantedDate)) ||
      !Number.isFinite(p.year) ||
      (p.harvestDate != null && Number.isNaN(parseIso(p.harvestDate))) ||
      (p.transplantedDate != null && Number.isNaN(parseIso(p.transplantedDate))),
  );
  add("no NaN/unparseable dates", nanDates.length === 0, nanDates.length ? `${nanDates.length} bad` : "ok");

  // 7. Indoor seedlings (no boxId) never leak into the season timeline (a garden/box view).
  const resolved = ctx.locationStore.getState().resolved();
  if (resolved) {
    const years = Array.from(new Set(plantings.map((p) => p.year)));
    let leaked = 0;
    for (const year of years) {
      const timeline = buildSeasonTimeline(
        plantings,
        findPlant,
        resolved.lastFrostDoy,
        resolved.firstFrostDoy,
        year,
        { base5: resolved.gddCurve5, base10: resolved.gddCurve10 },
        boxes,
      );
      leaked += timeline.items.filter((it) => isIndoorSeedling(it.planting)).length;
    }
    add("indoor seedlings excluded from timeline", leaked === 0, leaked ? `${leaked} leaked` : "ok");
  }

  // 8. Garden stats compose without NaN and only count boxed actives in composition.
  const stats = computeGardenStats(plantings, boxes, findPlant);
  const statsFinite =
    Number.isFinite(stats.totalActive) &&
    Number.isFinite(stats.totalPlants) &&
    Number.isFinite(stats.bedsUsed) &&
    stats.bySpecies.every((s) => Number.isFinite(s.count));
  add("garden stats finite", statsFinite, statsFinite ? `${stats.totalActive} active` : "NaN in stats");
  const seedlingInComposition = stats.totalActive !== plantings.filter((p) => p.status === "active" && p.boxId).length;
  add(
    "composition counts boxed actives only",
    !seedlingInComposition,
    seedlingInComposition ? "seedling leaked into composition" : "ok",
  );

  // 9. Rotation flags are SOUND: every flagged conflict corresponds to a real same-(non-perennial)-family
  // repeat in that box within the lookback window, and no perennial is ever flagged. Independent
  // re-derivation from the plantings (not the matrix), so it catches an over-flagging regression.
  const matrix = computeRotationMatrix(plantings, boxes, findPlant);
  let unsoundFlags = 0;
  let perennialFlagged = 0;
  const boxNameToId = new Map(boxes.map((b) => [b.name, b.id]));
  for (const row of matrix.rows) {
    const boxId = boxNameToId.get(row.boxName);
    for (const cell of row.cells) {
      if (!cell.conflict || !cell.family) {
        continue;
      }
      // Distinct years this box grew this family among boxed, non-perennial plantings, within lookback.
      const yearsWithFamily = new Set(
        plantings
          .filter((p) => p.boxId === boxId && !isIndoorSeedling(p))
          .filter((p) => (findPlant(p.plantKey)?.family ?? "other") === cell.family)
          .filter((p) => !findPlant(p.plantKey)?.perennial)
          .filter((p) => p.year >= cell.year - ROTATION_LOOKBACK_YEARS && p.year <= cell.year)
          .map((p) => p.year),
      );
      if (yearsWithFamily.size < 2) {
        unsoundFlags += 1;
      }
    }
  }
  // Perennials must never be the flagged family.
  for (const row of matrix.rows) {
    for (const cell of row.cells) {
      if (cell.conflict && cell.family) {
        const anyPerennial = plantings.some(
          (p) => (findPlant(p.plantKey)?.family ?? "other") === cell.family && findPlant(p.plantKey)?.perennial,
        );
        const onlyPerennial =
          anyPerennial &&
          !plantings.some(
            (p) => (findPlant(p.plantKey)?.family ?? "other") === cell.family && !findPlant(p.plantKey)?.perennial,
          );
        if (onlyPerennial) {
          perennialFlagged += 1;
        }
      }
    }
  }
  add(
    "rotation flags are sound (real repeat within lookback)",
    unsoundFlags === 0,
    unsoundFlags ? `${unsoundFlags} false-positive flags` : `${matrix.rows.length} box-rows checked`,
  );
  add("no perennial-only family flagged for rotation", perennialFlagged === 0, perennialFlagged ? `${perennialFlagged} flagged` : "ok");

  // 10. Every action in the transcript resolved to a structured result (nothing threw).
  const unstructured = transcript.actions().filter((a) => typeof a.result.ok !== "boolean");
  add("all actions structured (no throw)", unstructured.length === 0, unstructured.length ? `${unstructured.length} bad` : "ok");

  return results;
}

export function allGreen(results: InvariantResult[]): boolean {
  return results.every((r) => r.ok);
}
