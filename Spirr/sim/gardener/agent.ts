// The agent loop: observe -> prompt -> validated action -> apply -> advance, until horizon or budget.
// Guardrails keep a confused local model from stalling the season or looping forever.

import type { SimContext } from "../runtime/bootstrap";
import type { SimClock } from "../runtime/clock";
import type { AppDriver } from "../driver/actions";
import type { HandleRegistry } from "../driver/handles";
import { leanCatalog, validateAction, type GardenAction } from "../driver/schema";
import { buildSnapshot, type ObservedGarden } from "../observe/snapshot";
import { renderSnapshot } from "../observe/render";
import { Transcript, type OfferedSummary } from "../observe/log";
import type { Persona } from "./persona";
import { ollamaChat, parseActionReply, type OllamaConfig, type ChatMessage } from "./ollama";

export interface AgentConfig {
  persona: Persona;
  ollama: OllamaConfig;
  /** Stop at this ISO date (inclusive horizon). */
  endDate: string;
  /** Hard cap on LLM turns (cost ceiling). */
  maxSteps: number;
  /** Force a season advance after this many consecutive non-advancing actions. */
  maxNoAdvance: number;
}

export interface AgentRunSummary {
  steps: number;
  llmCalls: number;
  advances: number;
  errors: number;
  forcedAdvances: number;
  evalTokens: number;
  finalDate: string;
}

function summarizeOffered(g: ObservedGarden): OfferedSummary {
  return {
    sowIndoor: g.sowNow.indoor.map((p) => p.key),
    sowOutdoor: g.sowNow.outdoor.map((p) => p.key),
    plantOut: g.sowNow.plantOut.map((p) => p.key),
    harvestSoon: g.harvestSoon.map((h) => `${h.handle} ${h.plantKey} (${h.status})`),
    warnings: g.boxes.flatMap((b) => b.rotationCautions.map((c) => `kasse ${b.handle}: ${c}`)),
  };
}

function buildSystemPrompt(persona: Persona, catalog: ReturnType<typeof leanCatalog>): string {
  const plants = catalog.map((p) => `${p.key} (${p.name_no}, ${p.category})`).join("; ");
  return [
    `Du er en hagebruker i Norge som bruker appen Spirr for å drive en kjøkkenhage gjennom sesongen.`,
    ``,
    `MÅL: ${persona.goal}`,
    ``,
    `Hver tur viser appen deg en tilstand ("Hagen i dag"). Du svarer med NØYAKTIG ÉN handling som et JSON-objekt — ingen prosa, bare JSON.`,
    ``,
    `Handlinger (felt i parentes):`,
    `- {"action":"set_location","postnummer":"NNNN"} — sett sted (4-sifret postnummer). Gjør dette FØRST hvis sted mangler.`,
    `- {"action":"add_box","name":"...","bedType":"open|raised|container|greenhouse|tunnel","sunExposure":"sun|partial|shade","depthCm":N} — lag en dyrkingskasse.`,
    `- {"action":"sow_indoor","plant":"<key>","quantity":N} — forkultiver inne (ingen kasse ennå). For varmekjære arter.`,
    `- {"action":"sow_outdoor","box":"<A>","plant":"<key>","quantity":N} — så direkte i en kasse ute.`,
    `- {"action":"plant_out","planting":"<#1>","box":"<A>"} — plant en forkultivert frøplante ut i en kasse når den er klar.`,
    `- {"action":"harvest","planting":"<#1>","yield":"valgfri tekst"} — høst en aktiv planting.`,
    `- {"action":"remove_planting","planting":"<#1>","reason":"removed|failed"} — fjern/marker mislykket.`,
    `- {"action":"advance_days","days":N} — la N dager gå.`,
    `- {"action":"advance_to_next_event"} — hopp til neste sesonghendelse (frost, månedsskifte, solverv).`,
    `- {"action":"note","text":"..."} — skriv en kort observasjon (hvis du synes noe er forvirrende eller mangler).`,
    ``,
    `Regler:`,
    `- Bruk PLANTENØKLER (key), ikke norske navn, i plant-feltet.`,
    `- Forkultivering: sow_indoor uten kasse → senere plant_out i en kasse. Direktesåing: sow_outdoor i en kasse.`,
    `- Kasser refereres med bokstav (A, B, ...); plantinger med #-nummer (#1, #2, ...). Disse vises i tilstanden.`,
    `- Når det ikke er noe meningsfullt å gjøre akkurat nå, MÅ du la tiden gå (advance_to_next_event eller advance_days), ellers stopper sesongen.`,
    `- Følg appens forslag når de gir mening for målet ditt.`,
    ``,
    `Plantekatalog (key (navn, kategori)): ${plants}`,
  ].join("\n");
}

const ADVANCING = new Set(["advance_days", "advance_to_next_event"]);

export async function runAgent(
  ctx: SimContext,
  clock: SimClock,
  driver: AppDriver,
  handles: HandleRegistry,
  transcript: Transcript,
  config: AgentConfig,
): Promise<AgentRunSummary> {
  const catalog = leanCatalog([...ctx.bundledPlants, ...ctx.customPlantsStore.getState().plants]);
  const system = buildSystemPrompt(config.persona, catalog);
  const recent: string[] = [];
  const summary: AgentRunSummary = {
    steps: 0,
    llmCalls: 0,
    advances: 0,
    errors: 0,
    forcedAdvances: 0,
    evalTokens: 0,
    finalDate: clock.iso(),
  };
  let noAdvanceStreak = 0;

  const forceAdvance = (why: string) => {
    const out = driver.apply({ action: "advance_to_next_event" });
    transcript.system(summary.steps, clock.iso(), `watchdog: ${why} → ${out.note ?? "advanced"}`);
    if (out.event) {
      transcript.event(summary.steps, clock.iso(), out.event.label, out.event.kind);
    }
    summary.forcedAdvances += 1;
    summary.advances += 1;
    noAdvanceStreak = 0;
  };

  while (summary.steps < config.maxSteps && clock.iso() < config.endDate) {
    summary.steps += 1;
    const snapshot = buildSnapshot(ctx, clock, handles);
    transcript.observe(summary.steps, clock.iso(), clock.doy(), summarizeOffered(snapshot));

    const userContent =
      renderSnapshot(snapshot) +
      (recent.length ? `\n\n## Nylige handlinger\n${recent.slice(-6).join("\n")}` : "") +
      `\n\nVelg ÉN handling som JSON.`;
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ];

    let action: GardenAction | null = null;
    let lastError = "";
    for (let attempt = 0; attempt < 2 && !action; attempt += 1) {
      const turnMessages =
        attempt === 0
          ? messages
          : [...messages, { role: "user" as const, content: `Forrige svar var ugyldig: ${lastError}. Svar med ett gyldig JSON-handlingsobjekt.` }];
      const reply = await ollamaChat(turnMessages, config.ollama);
      summary.llmCalls += 1;
      summary.evalTokens += reply.evalCount;
      const validated = validateAction(parseActionReply(reply.content));
      if (validated.ok) {
        action = validated.action;
      } else {
        lastError = validated.error;
      }
    }

    if (!action) {
      summary.errors += 1;
      transcript.system(summary.steps, clock.iso(), `ugyldig handling etter 2 forsøk: ${lastError}`);
      noAdvanceStreak += 1;
      if (noAdvanceStreak >= config.maxNoAdvance) {
        forceAdvance("for mange ugyldige/ikke-fremdrift handlinger");
      }
      continue;
    }

    const result = driver.apply(action);
    transcript.action(summary.steps, clock.iso(), action, result);
    recent.push(`- ${clock.iso()}: ${action.action}${result.ok ? "" : " (FEIL: " + result.error + ")"}${result.note ? " — " + result.note : ""}`);
    if (action.action === "note") {
      transcript.note(summary.steps, clock.iso(), action.text);
    }
    if (!result.ok) {
      summary.errors += 1;
    }
    if (result.event) {
      transcript.event(summary.steps, clock.iso(), result.event.label, result.event.kind);
    }

    if (ADVANCING.has(action.action) && result.ok) {
      summary.advances += 1;
      noAdvanceStreak = 0;
    } else {
      noAdvanceStreak += 1;
      if (noAdvanceStreak >= config.maxNoAdvance) {
        forceAdvance(`${config.maxNoAdvance} handlinger uten å la tiden gå`);
      }
    }
  }

  summary.finalDate = clock.iso();
  return summary;
}
