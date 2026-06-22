// CLI: run scenario(s) × model(s) through the LLM-gardener loop, assert invariants, write reports.
//
//   npx tsx sim/run.ts --scenario precultivation-windowsill-feb --model qwen2.5:7b
//   npx tsx sim/run.ts --scenario all --model qwen2.5:7b,qwen2.5:32b --persona methodical-veteran
//
// Flags: --scenario <key|all|a,b>  --model <m|m1,m2>  --persona <key>  --max-steps N  --temperature T  --seed N

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bootstrap } from "./runtime/bootstrap";
import { SimClock } from "./runtime/clock";
import { HandleRegistry, seedHandlesFromState } from "./driver/handles";
import { AppDriver } from "./driver/actions";
import { Transcript } from "./observe/log";
import { runAgent } from "./gardener/agent";
import { getPersona } from "./gardener/persona";
import { ollamaUp } from "./gardener/ollama";
import { checkInvariants, allGreen } from "./eval/invariants";
import { judgeTranscript } from "./eval/judge";
import { buildReport, reportToMarkdown } from "./report/report";
import { getScenarios } from "./scenarios/index";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

const OUT_DIR = join(process.cwd(), "sim", "report", "out");

async function main() {
  const scenarioKey = arg("scenario", "precultivation-windowsill-feb")!;
  const models = arg("model", "qwen2.5:7b")!.split(",").map((m) => m.trim());
  const personaOverride = arg("persona");
  const maxStepsOverride = arg("max-steps");
  const temperature = arg("temperature");
  const seed = arg("seed");
  const judge = process.argv.includes("--judge");

  if (!(await ollamaUp())) {
    console.error(`❌ Ollama is not reachable at ${process.env.OLLAMA_HOST ?? "http://localhost:11434"}. Start it (\`ollama serve\`) and retry.`);
    process.exit(1);
  }

  const scenarios = getScenarios(scenarioKey);
  mkdirSync(OUT_DIR, { recursive: true });
  const overall: Array<{ scenario: string; model: string; green: boolean; steps: number; finalDate: string }> = [];

  for (const scenario of scenarios) {
    for (const model of models) {
      const personaKey = personaOverride ?? scenario.persona;
      const persona = getPersona(personaKey);
      console.log(`\n▶ ${scenario.key} × ${model} (persona: ${personaKey})`);

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

      const t0 = performance.now();
      const summary = await runAgent(ctx, clock, driver, handles, transcript, {
        persona,
        ollama: {
          model,
          temperature: temperature != null ? Number(temperature) : persona.temperature,
          seed: seed != null ? Number(seed) : 1,
        },
        endDate: scenario.endDate,
        maxSteps: maxStepsOverride != null ? Number(maxStepsOverride) : scenario.maxSteps,
        maxNoAdvance: scenario.maxNoAdvance,
      });
      const wallSec = ((performance.now() - t0) / 1000).toFixed(1);

      // Restore real time before invariants/timestamps (the clock is still pinned to the sim end date).
      ctx.clock.setNow(null);
      const invariants = checkInvariants(ctx, transcript);
      const green = allGreen(invariants);

      let friction;
      if (judge) {
        console.log(`  ⚖  judging transcript with ${model}…`);
        friction = await judgeTranscript(transcript, scenario, {
          model,
          temperature: 0.2,
          seed: seed != null ? Number(seed) : 1,
        });
        console.log(`     ${friction.length} friction finding(s)`);
      }

      const generatedAt = new Date().toISOString();
      const report = buildReport(scenario, model, personaKey, summary, invariants, transcript, generatedAt, friction);
      const base = `${scenario.key}__${model.replace(/[^a-z0-9.]/gi, "-")}__${personaKey}`;
      writeFileSync(join(OUT_DIR, `${base}.md`), reportToMarkdown(report));
      writeFileSync(join(OUT_DIR, `${base}.json`), JSON.stringify(report, null, 2));

      console.log(
        `  ${green ? "✅" : "❌"} invariants · ${summary.steps} steps (${summary.attendedVisits} attended) · ${summary.llmCalls} LLM calls · ${summary.advances} advances · ${summary.errors} errors · ${summary.evalTokens} tokens · ${wallSec}s → ${summary.finalDate}`,
      );
      if (!green) {
        for (const inv of invariants.filter((i) => !i.ok)) {
          console.log(`     ❌ ${inv.name}: ${inv.detail}`);
        }
      }
      console.log(`  📄 sim/report/out/${base}.md`);
      overall.push({ scenario: scenario.key, model, green, steps: summary.steps, finalDate: summary.finalDate });
    }
  }

  console.log(`\n=== DONE: ${overall.length} run(s), ${overall.filter((o) => o.green).length} green ===`);
  if (overall.some((o) => !o.green)) {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
