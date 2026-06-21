// CLI: collate the LLM-judge friction findings from every run report in sim/report/out/*.json into a
// single FRICTION.md, grouped by severity then scenario. The cheapest way to turn a batch of --judge
// runs into one product-feedback doc (FINDINGS D1).
//
//   npx tsx sim/report/friction-summary.ts
//
// Run `npx tsx sim/run.ts --scenario all --model qwen2.5:7b --judge` first to populate the reports.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RunReport } from "./report";
import type { FrictionFinding } from "../eval/judge";

const OUT_DIR = join(process.cwd(), "sim", "report", "out");
const SEVERITIES = ["high", "medium", "low"] as const;
const SEV_LABEL: Record<FrictionFinding["severity"], string> = { high: "🔴 High", medium: "🟠 Medium", low: "🟡 Low" };

interface Row extends FrictionFinding {
  scenario: string;
  model: string;
  persona: string;
}

function main() {
  const files = readdirSync(OUT_DIR).filter((f) => f.endsWith(".json"));
  const rows: Row[] = [];
  let judged = 0;
  let unjudged = 0;
  for (const file of files) {
    const report = JSON.parse(readFileSync(join(OUT_DIR, file), "utf8")) as RunReport;
    if (report.friction === undefined) {
      unjudged += 1;
      continue;
    }
    judged += 1;
    for (const finding of report.friction) {
      rows.push({ ...finding, scenario: report.scenario, model: report.model, persona: report.persona });
    }
  }

  const lines: string[] = [];
  lines.push(`# Friction findings — LLM-judge summary`);
  lines.push("");
  lines.push(
    `Collated from ${judged} judged report(s) in \`sim/report/out/\` (${unjudged} report(s) had no judge pass). ` +
      `${rows.length} finding(s) total. Re-run with \`npx tsx sim/run.ts --scenario all --model <m> --judge\` then this script.`,
  );

  for (const severity of SEVERITIES) {
    const inSev = rows.filter((r) => r.severity === severity);
    if (inSev.length === 0) continue;
    lines.push("");
    lines.push(`## ${SEV_LABEL[severity]} (${inSev.length})`);
    const scenarios = [...new Set(inSev.map((r) => r.scenario))];
    for (const scenario of scenarios) {
      lines.push("");
      lines.push(`### ${scenario}`);
      for (const r of inSev.filter((x) => x.scenario === scenario)) {
        lines.push("");
        lines.push(`- **${r.title}** _(${r.model} · ${r.persona})_`);
        lines.push(`  - Evidence: ${r.evidence}`);
        lines.push(`  - Suggestion: ${r.suggestion}`);
      }
    }
  }

  if (rows.length === 0) {
    lines.push("");
    lines.push(`_No friction findings — either the runs were clean or no judge pass has been run yet._`);
  }

  const outPath = join(OUT_DIR, "FRICTION.md");
  writeFileSync(outPath, lines.join("\n") + "\n");
  console.log(`📄 ${rows.length} finding(s) from ${judged} judged report(s) → sim/report/out/FRICTION.md`);
}

main();
