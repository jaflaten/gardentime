// Deterministic replay: re-apply a recorded transcript's actions with NO LLM. Because handles are
// assigned by creation order, the same action sequence reproduces the same handle→id mapping (nanoids
// differ per run but are never referenced). This is the cheap regression layer — Ollama non-determinism
// is irrelevant here, since we replay recorded *actions*, not the model.
//
//   npx tsx sim/replay.ts sim/report/out/<run>.json

import { readFileSync } from "node:fs";
import { bootstrap } from "./runtime/bootstrap";
import { SimClock } from "./runtime/clock";
import { HandleRegistry, seedHandlesFromState } from "./driver/handles";
import { AppDriver } from "./driver/actions";
import { Transcript } from "./observe/log";
import { checkInvariants, type InvariantResult } from "./eval/invariants";
import { getScenarios } from "./scenarios/index";
import type { RunReport } from "./report/report";
import type { GardenAction } from "./driver/schema";

/** A run's final state with nanoids replaced by stable handles — comparable across replays. */
export interface NormalizedState {
  boxes: Array<{ handle: string; name: string; bedType?: string; sun?: string; depthCm?: number }>;
  plantings: Array<{
    handle: string;
    plantKey: string;
    box: string | null;
    plantedDate: string;
    transplantedDate?: string;
    harvestDate?: string;
    status: string;
    year: number;
  }>;
}

export interface ReplayResult {
  normalized: NormalizedState;
  invariants: InvariantResult[];
  appliedActions: number;
}

export async function replayReport(report: RunReport): Promise<ReplayResult> {
  const scenario = getScenarios(report.scenario)[0];
  const ctx = await bootstrap(scenario.seed);
  const resolved = ctx.locationStore.getState().resolved();
  const clock = new SimClock(ctx.clock.setNow, scenario.startDate, {
    lastFrostDoy: resolved?.lastFrostDoy,
    firstFrostDoy: resolved?.firstFrostDoy,
  });
  const handles = new HandleRegistry();
  seedHandlesFromState(handles, ctx.gardenStore.getState().boxes, ctx.gardenStore.getState().plantings);
  const driver = new AppDriver(ctx, clock, handles);
  const transcript = new Transcript();

  let applied = 0;
  for (const entry of report.transcript) {
    if (entry.kind !== "action") {
      continue;
    }
    const action = entry.action as GardenAction;
    const result = driver.apply(action);
    transcript.action(applied, clock.iso(), action, result);
    applied += 1;
  }

  ctx.clock.setNow(null);
  const invariants = checkInvariants(ctx, transcript);
  const normalized = normalizeState(ctx, handles);
  return { normalized, invariants, appliedActions: applied };
}

function normalizeState(ctx: Awaited<ReturnType<typeof bootstrap>>, handles: HandleRegistry): NormalizedState {
  const boxes = ctx.gardenStore.getState().boxes;
  const plantings = ctx.gardenStore.getState().plantings;
  return {
    boxes: boxes
      .map((b) => ({ handle: handles.boxHandle(b.id) ?? "?", name: b.name, bedType: b.bedType, sun: b.sunExposure, depthCm: b.depthCm }))
      .sort((a, b) => a.handle.localeCompare(b.handle)),
    plantings: plantings
      .map((p) => ({
        handle: handles.plantingHandle(p.id) ?? "?",
        plantKey: p.plantKey,
        box: p.boxId ? handles.boxHandle(p.boxId) ?? "?" : null,
        plantedDate: p.plantedDate,
        transplantedDate: p.transplantedDate,
        harvestDate: p.harvestDate,
        status: p.status,
        year: p.year,
      }))
      .sort((a, b) => a.handle.localeCompare(b.handle, undefined, { numeric: true })),
  };
}

// CLI
const fileArg = process.argv[2];
if (fileArg && import.meta.url === `file://${process.argv[1]}`) {
  const report = JSON.parse(readFileSync(fileArg, "utf8")) as RunReport;
  const r = await replayReport(report);
  const green = r.invariants.every((i) => i.ok);
  console.log(`Replayed ${r.appliedActions} actions from ${report.scenario} (${report.model}).`);
  console.log(`Final: ${r.normalized.boxes.length} boxes, ${r.normalized.plantings.length} plantings.`);
  console.log(`Invariants: ${green ? "✅ all green" : "❌ BROKEN"}`);
  if (!green) {
    for (const inv of r.invariants.filter((i) => !i.ok)) {
      console.log(`  ❌ ${inv.name}: ${inv.detail}`);
    }
    process.exit(2);
  }
}
