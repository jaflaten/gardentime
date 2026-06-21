// Tier-2 browser fidelity (B3): prove the *rendered* SowNowCard / GardenInsights / Seedlings cards
// match the headless snapshot, so the extracted pure libs (src/lib/sowNowGroups) really are the single
// source of truth. The headless tier asserts the logic; this asserts the screen agrees with it.
//
// Chrome DevTools MCP is interactive (a Claude/developer tool, not a node API), so this script does the
// deterministic half — replay a frozen fixture, serialize the exact localStorage the browser needs, and
// compute the expected card contents — then prints the steps to drive the browser and a `check` mode to
// compare what you scrape.
//
// Usage:
//   1) npx tsx sim/browser-fidelity.ts emit [fixturePath]   # default: precultivation fixture
//        → writes sim/report/out/fidelity-<scenario>.json and prints the browser steps.
//   2) Start the app:  npm run dev   (or `npm run build && npm run preview`)
//   3) In the browser (or via Chrome DevTools MCP), for the printed simNow date:
//        - evaluate_script: for each [key,value] in the artifact's `localStorage`, localStorage.setItem(key, value)
//        - navigate to  http://localhost:5173/?simNow=<simNow>
//        - scrape the cards into a JSON file shaped like the artifact's `expected` (see keys below)
//   4) npx tsx sim/browser-fidelity.ts check <scrapedPath> [fixturePath]
//        → diffs scraped vs expected and exits non-zero on mismatch.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { bootstrap } from "./runtime/bootstrap";
import { SimClock } from "./runtime/clock";
import { HandleRegistry, seedHandlesFromState } from "./driver/handles";
import { AppDriver } from "./driver/actions";
import { buildSnapshot } from "./observe/snapshot";
import { getScenarios } from "./scenarios/index";
import type { RunReport } from "./report/report";
import type { GardenAction } from "./driver/schema";

const OUT_DIR = join(process.cwd(), "sim", "report", "out");
const DEFAULT_FIXTURE = join(process.cwd(), "sim", "__tests__", "fixtures", "precultivation-7b.json");

/** Card contents the browser can scrape, by plant *name* (what the DOM renders), for diffing. */
interface ExpectedCards {
  sowNow: { indoor: string[]; outdoor: string[]; plantOut: string[] };
  harvestSoon: string[];
  seedlings: string[];
  stats: { totalActive: number; distinctSpecies: number; distinctFamilies: number; bedsInUse: number };
}

interface FidelityArtifact {
  scenario: string;
  simNow: string;
  localStorage: Record<string, string>;
  expected: ExpectedCards;
}

const uniq = (xs: string[]) => [...new Set(xs)];

/** Replay a fixture's actions (no LLM), then build the snapshot at the run's final sim date. */
async function replayToSnapshot(report: RunReport) {
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
  for (const entry of report.transcript) {
    if (entry.kind === "action") {
      driver.apply(entry.action as GardenAction);
    }
  }
  const snapshot = buildSnapshot(ctx, clock, handles);
  return { ctx, clock, snapshot };
}

async function emit(fixturePath: string) {
  const report = JSON.parse(readFileSync(fixturePath, "utf8")) as RunReport;
  const { ctx, clock, snapshot } = await replayToSnapshot(report);
  const loc = ctx.locationStore.getState();
  const artifact: FidelityArtifact = {
    scenario: report.scenario,
    simNow: clock.iso(),
    localStorage: {
      gt_boxes: JSON.stringify(ctx.gardenStore.getState().boxes),
      gt_plantings: JSON.stringify(ctx.gardenStore.getState().plantings),
      gt_custom_plants: JSON.stringify(ctx.customPlantsStore.getState().plants),
      gt_location: JSON.stringify({ postnummer: loc.postnummer, elevationM: loc.elevationM, frostJusteringDays: loc.frostJusteringDays }),
      gt_language: JSON.stringify("no"),
    },
    expected: {
      sowNow: {
        indoor: snapshot.sowNow.indoor.map((p) => p.name),
        outdoor: snapshot.sowNow.outdoor.map((p) => p.name),
        plantOut: snapshot.sowNow.plantOut.map((p) => p.name),
      },
      harvestSoon: uniq(snapshot.harvestSoon.map((h) => h.name)),
      seedlings: snapshot.seedlings.map((s) => s.name),
      stats: snapshot.stats,
    },
  };
  ctx.clock.setNow(null);

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, `fidelity-${report.scenario}.json`);
  writeFileSync(outPath, JSON.stringify(artifact, null, 2) + "\n");

  console.log(`📄 wrote ${outPath}`);
  console.log(`\nBrowser steps (simNow = ${artifact.simNow}):`);
  console.log(`  1. Start the app (npm run dev → http://localhost:5173).`);
  console.log(`  2. In DevTools console / Chrome DevTools MCP evaluate_script, seed localStorage:`);
  for (const key of Object.keys(artifact.localStorage)) {
    console.log(`       localStorage.setItem(${JSON.stringify(key)}, <value from ${outPath}>);`);
  }
  console.log(`  3. Navigate to  http://localhost:5173/?simNow=${artifact.simNow}`);
  console.log(`  4. Scrape the cards into scraped.json shaped like the artifact's "expected", then:`);
  console.log(`       npx tsx sim/browser-fidelity.ts check scraped.json ${fixturePath}`);
}

function diffList(label: string, expected: string[], actual: string[]): string[] {
  const e = uniq(expected).sort();
  const a = uniq(actual).sort();
  const missing = e.filter((x) => !a.includes(x));
  const extra = a.filter((x) => !e.includes(x));
  const errs: string[] = [];
  if (missing.length) errs.push(`${label}: rendered is missing ${JSON.stringify(missing)}`);
  if (extra.length) errs.push(`${label}: rendered has unexpected ${JSON.stringify(extra)}`);
  return errs;
}

async function check(scrapedPath: string, fixturePath: string) {
  const report = JSON.parse(readFileSync(fixturePath, "utf8")) as RunReport;
  const { ctx, snapshot } = await replayToSnapshot(report);
  ctx.clock.setNow(null);
  const expected: ExpectedCards = {
    sowNow: {
      indoor: snapshot.sowNow.indoor.map((p) => p.name),
      outdoor: snapshot.sowNow.outdoor.map((p) => p.name),
      plantOut: snapshot.sowNow.plantOut.map((p) => p.name),
    },
    harvestSoon: uniq(snapshot.harvestSoon.map((h) => h.name)),
    seedlings: snapshot.seedlings.map((s) => s.name),
    stats: snapshot.stats,
  };
  const scraped = JSON.parse(readFileSync(scrapedPath, "utf8")) as ExpectedCards;

  const errs: string[] = [
    ...diffList("sowNow.indoor", expected.sowNow.indoor, scraped.sowNow?.indoor ?? []),
    ...diffList("sowNow.outdoor", expected.sowNow.outdoor, scraped.sowNow?.outdoor ?? []),
    ...diffList("sowNow.plantOut", expected.sowNow.plantOut, scraped.sowNow?.plantOut ?? []),
    ...diffList("harvestSoon", expected.harvestSoon, scraped.harvestSoon ?? []),
    ...diffList("seedlings", expected.seedlings, scraped.seedlings ?? []),
  ];
  for (const key of Object.keys(expected.stats) as (keyof ExpectedCards["stats"])[]) {
    if (expected.stats[key] !== scraped.stats?.[key]) {
      errs.push(`stats.${key}: expected ${expected.stats[key]}, rendered ${scraped.stats?.[key]}`);
    }
  }

  if (errs.length) {
    console.log(`❌ ${errs.length} fidelity mismatch(es):`);
    for (const e of errs) console.log(`   ${e}`);
    process.exit(2);
  }
  console.log(`✅ rendered cards match the headless snapshot for ${report.scenario}`);
}

const [mode, ...rest] = process.argv.slice(2);
if (mode === "check") {
  await check(rest[0], rest[1] ?? DEFAULT_FIXTURE);
} else {
  await emit((mode === "emit" ? rest[0] : mode) ?? DEFAULT_FIXTURE);
}
