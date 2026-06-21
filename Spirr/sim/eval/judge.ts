// Soft evaluation: an LLM-judge reads the transcript and surfaces qualitative UX friction — places the
// gardener ignored a clear recommendation, looked confused, hit a dead-end, or wrote a struggle note.
// Output is ranked findings → product feedback, NOT pass/fail. Opt-in (the hard invariants are the gate).

import type { Transcript, TranscriptEntry } from "../observe/log";
import type { Scenario } from "../scenarios/types";
import { ollamaChat, parseActionReply, type OllamaConfig } from "../gardener/ollama";

export interface FrictionFinding {
  severity: "low" | "medium" | "high";
  title: string;
  evidence: string;
  suggestion: string;
}

function compactTranscript(entries: TranscriptEntry[]): string {
  const lines: string[] = [];
  let lastApp = "";
  for (const e of entries) {
    switch (e.kind) {
      case "observe": {
        // Only surface the decision-relevant signals (plant-out offers, harvest-soon, warnings); skip the
        // noisy så-inne list. Dedupe consecutive identical APP lines so a long run doesn't bloat the prompt.
        const o = e.offered;
        const offered = [
          o.plantOut.length ? `plant-ut-klar:${o.plantOut.slice(0, 6).join(",")}` : "",
          o.harvestSoon.length ? `høst-snart:${o.harvestSoon.join(",")}` : "",
          o.warnings.length ? `⚠:${o.warnings.join(" | ")}` : "",
        ].filter(Boolean);
        if (offered.length) {
          const app = `APP: ${offered.join("; ")}`;
          if (app !== lastApp) {
            lines.push(`[${e.simDate}] ${app}`);
            lastApp = app;
          }
        }
        break;
      }
      case "action":
        lines.push(`[${e.simDate}] GARTNER ${e.action.action}${e.result.ok ? "" : " FEIL:" + e.result.error}${e.result.note ? " (" + e.result.note + ")" : ""}`);
        break;
      case "note":
        lines.push(`[${e.simDate}] NOTAT: ${e.text}`);
        break;
      case "event":
        lines.push(`[${e.simDate}] HENDELSE: ${e.label}`);
        break;
      case "system":
        lines.push(`[${e.simDate}] SYS: ${e.text}`);
        break;
    }
  }
  return lines.join("\n");
}

const SYSTEM = [
  "Du er en UX-forsker som vurderer hvordan en gartner brukte hageappen Spirr gjennom en simulert sesong.",
  "Du får et transkript: hva appen tilbød/advarte om (APP), hva gartneren gjorde (GARTNER), notater og hendelser.",
  "Finn KONKRET friksjon: ignorerte gartneren en tydelig anbefaling? Plantet ut for tidlig/sent? Glemte å høste i tide?",
  "Virket noe forvirrende, eller førte til blindvei/feil gjentatte ganger? Skrev gartneren et frustrasjons-notat?",
  "Svar KUN med JSON: {\"findings\":[{\"severity\":\"low|medium|high\",\"title\":\"...\",\"evidence\":\"[dato] ...\",\"suggestion\":\"produktforslag\"}]}.",
  "Maks 6 funn, rangert med viktigst først. Ingen funn = tom liste. Vær konkret og siter datoer fra transkriptet.",
].join("\n");

export async function judgeTranscript(transcript: Transcript, scenario: Scenario, cfg: OllamaConfig): Promise<FrictionFinding[]> {
  const reply = await ollamaChat(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Scenario: ${scenario.title}\nMål for scenariet: ${scenario.exercises}\n\nTranskript:\n${compactTranscript(transcript.entries)}`,
      },
    ],
    // A whole-transcript read needs more context + room for findings, and more wall-clock than a single
    // gardener turn; cap generation so JSON-mode can't run away.
    { ...cfg, numCtx: cfg.numCtx ?? 16384, numPredict: cfg.numPredict ?? 1200, timeoutMs: cfg.timeoutMs ?? 300_000 },
  );
  const parsed = parseActionReply(reply.content) as { findings?: unknown } | unknown;
  const raw = Array.isArray((parsed as { findings?: unknown })?.findings)
    ? (parsed as { findings: unknown[] }).findings
    : Array.isArray(parsed)
      ? (parsed as unknown[])
      : [];
  const findings: FrictionFinding[] = [];
  for (const f of raw) {
    if (f && typeof f === "object") {
      const o = f as Record<string, unknown>;
      const severity = o.severity === "high" || o.severity === "medium" ? o.severity : "low";
      findings.push({
        severity,
        title: String(o.title ?? "uten tittel"),
        evidence: String(o.evidence ?? ""),
        suggestion: String(o.suggestion ?? ""),
      });
    }
  }
  return findings;
}
