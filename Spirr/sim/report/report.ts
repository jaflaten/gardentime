// Render a run into markdown + a JSON blob. The JSON is the machine record (also the replay source);
// the markdown is for a human skimming what the gardener did and whether invariants held.

import type { Scenario } from "../scenarios/types";
import type { AgentRunSummary } from "../gardener/agent";
import type { InvariantResult } from "../eval/invariants";
import type { Transcript, TranscriptEntry } from "../observe/log";
import type { FrictionFinding } from "../eval/judge";
import { computeSeasonOutcome, type SeasonOutcome } from "../eval/outcome";

export interface RunReport {
  scenario: string;
  title: string;
  model: string;
  persona: string;
  generatedAt: string;
  summary: AgentRunSummary;
  invariants: InvariantResult[];
  invariantsGreen: boolean;
  /** Descriptive season-outcome telemetry (not pass/fail) — quantifies harvest behaviour (A1). */
  outcome: SeasonOutcome;
  friction?: FrictionFinding[];
  transcript: TranscriptEntry[];
}

export function buildReport(
  scenario: Scenario,
  model: string,
  persona: string,
  summary: AgentRunSummary,
  invariants: InvariantResult[],
  transcript: Transcript,
  generatedAt: string,
  friction?: FrictionFinding[],
): RunReport {
  return {
    scenario: scenario.key,
    title: scenario.title,
    model,
    persona,
    generatedAt,
    summary,
    invariants,
    invariantsGreen: invariants.every((i) => i.ok),
    outcome: computeSeasonOutcome(transcript.entries),
    friction,
    transcript: transcript.entries,
  };
}

function transcriptLine(e: TranscriptEntry): string {
  switch (e.kind) {
    case "observe": {
      const o = e.offered;
      const bits = [
        o.sowIndoor.length ? `så-inne:${o.sowIndoor.length}` : "",
        o.sowOutdoor.length ? `så-ute:${o.sowOutdoor.length}` : "",
        o.plantOut.length ? `plant-ut:${o.plantOut.length}` : "",
        o.harvestSoon.length ? `høst:${o.harvestSoon.length}` : "",
        o.warnings.length ? `⚠:${o.warnings.length}` : "",
      ].filter(Boolean);
      return `  [${e.simDate}] 👁  ${bits.join(" ") || "—"}`;
    }
    case "action": {
      const r = e.result;
      const mark = r.ok ? "✓" : "✗";
      return `  [${e.simDate}] ${mark} ${e.action.action}${r.note ? " — " + r.note : ""}${r.error ? " — " + r.error : ""}`;
    }
    case "event":
      return `  [${e.simDate}] 📅 ${e.label}`;
    case "note":
      return `  [${e.simDate}] 📝 «${e.text}»`;
    case "system":
      return `  [${e.simDate}] ⚙  ${e.text}`;
  }
}

export function reportToMarkdown(r: RunReport): string {
  const lines: string[] = [];
  lines.push(`# Sim-rapport: ${r.title}`);
  lines.push("");
  lines.push(`- **Scenario:** \`${r.scenario}\``);
  lines.push(`- **Modell:** \`${r.model}\` · **Persona:** \`${r.persona}\``);
  lines.push(`- **Generert:** ${r.generatedAt}`);
  lines.push("");
  lines.push(`## Sammendrag`);
  lines.push(
    `Steg: ${r.summary.steps} · LLM-kall: ${r.summary.llmCalls} · tids-hopp: ${r.summary.advances} (tvungne: ${r.summary.forcedAdvances}) · feil: ${r.summary.errors} · eval-tokens: ${r.summary.evalTokens} · sluttdato: ${r.summary.finalDate}`,
  );
  if (r.outcome) {
    const o = r.outcome;
    lines.push("");
    lines.push(`### Sesongresultat (beskrivende, ikke pass/fail)`);
    lines.push(
      `Gartnerens handlinger — sådd: ${o.sown} · plantet ut: ${o.plantedOut} · høstet: ${o.harvested} · fjernet/mislyktes: ${o.removedOrFailed}`,
    );
    lines.push(
      `Høsting — modne signaler vist: ${o.harvestSignalsOffered} · faktisk høstet: ${o.harvested} · modne uhøstet ved sesongslutt: ${o.ripeAtSeasonEnd}`,
    );
  }
  lines.push("");
  lines.push(`## Invarianter — ${r.invariantsGreen ? "✅ ALLE GRØNNE" : "❌ BRUDD"}`);
  for (const inv of r.invariants) {
    lines.push(`- ${inv.ok ? "✅" : "❌"} **${inv.name}** — ${inv.detail}`);
  }
  lines.push("");
  if (r.friction && r.friction.length) {
    lines.push(`## LLM-dommer: UX-friksjon (kvalitativ, ikke pass/fail)`);
    for (const f of r.friction) {
      lines.push(`- **[${f.severity}] ${f.title}** — ${f.evidence}${f.suggestion ? `  \n  → _${f.suggestion}_` : ""}`);
    }
    lines.push("");
  }
  const notes = r.transcript.filter((e) => e.kind === "note");
  if (notes.length) {
    lines.push(`## Gartnerens notater (friksjon)`);
    for (const n of notes) {
      lines.push(`- [${(n as { simDate: string }).simDate}] ${(n as { text: string }).text}`);
    }
    lines.push("");
  }
  lines.push(`## Transkript`);
  lines.push("```");
  for (const e of r.transcript) {
    lines.push(transcriptLine(e));
  }
  lines.push("```");
  return lines.join("\n");
}
