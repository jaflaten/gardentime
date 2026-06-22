// The agent loop — VISIT model (Revision 2). The harness owns the clock: it marches a calendar of
// weekly "visits" from startDate to the horizon and, at each visit, asks the gardener "what do you do
// today?". The gardener answers with a BATCH of actions (0..N) — sow, plant out, harvest — and the
// harness advances to the next visit automatically. The gardener never advances time itself.
//
// Why: under the old single-action loop the model also had to emit `advance_*` to march the season; it
// forgot (watchdog force-advances), and every advance burned a turn from the same budget the real
// decisions needed. Making the harness own time means the season ALWAYS completes (crops always reach
// maturity), 100% of LLM calls are decisions, and ripe/ready crops are re-offered every visit until
// acted on — closing the systemic under-harvest gap (FINDINGS A1). The advance verbs stay valid in the
// schema (replay/fixtures untouched) but are no longer offered to the gardener.

import type { SimContext } from "../runtime/bootstrap";
import type { SimClock } from "../runtime/clock";
import type { AppDriver } from "../driver/actions";
import type { HandleRegistry } from "../driver/handles";
import { leanCatalog, validateAction, type GardenAction } from "../driver/schema";
import { buildSnapshot, type ObservedGarden } from "../observe/snapshot";
import { renderSnapshot } from "../observe/render";
import { Transcript, type OfferedSummary } from "../observe/log";
import type { Persona } from "./persona";
import { shouldAttend } from "./attendance";
import { ollamaChat, parseActionBatch, type OllamaConfig, type ChatMessage } from "./ollama";

export interface AgentConfig {
  persona: Persona;
  ollama: OllamaConfig;
  /** Stop at this ISO date (inclusive horizon). */
  endDate: string;
  /** Safety cap on the number of visits (cost ceiling). The horizon usually binds first. */
  maxSteps: number;
  /** Unused in the visit loop (the harness always advances); kept for config/back-compat. */
  maxNoAdvance: number;
  /** Days between visits (the harness's calendar cadence). Default 7. */
  visitCadenceDays?: number;
  /** Cap on actions applied per visit (bounds a runaway batch). Default 8. */
  maxActionsPerVisit?: number;
}

export interface AgentRunSummary {
  /** Weekly calendar ticks (ripeness is sampled on every one; the gardener only acts on `attendedVisits`). */
  steps: number;
  /** Ticks the gardener actually opened the app and acted (== steps for personas with no attendance taper). */
  attendedVisits: number;
  llmCalls: number;
  /** Calendar advances (one per visit). */
  advances: number;
  errors: number;
  /** Always 0 in the visit loop — kept for report/back-compat. */
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
    warnings: [
      ...g.boxes.flatMap((b) => b.rotationCautions.map((c) => `kasse ${b.handle}: ${c}`)),
      ...(g.wontRipen.length ? [`modner ikke ute: ${g.wontRipen.map((p) => p.key).join(", ")}`] : []),
      ...(g.seedlings.some((s) => s.frostRisk)
        ? [`frostrisiko ved utplanting nå: ${g.seedlings.filter((s) => s.frostRisk).map((s) => s.plantKey).join(", ")}`]
        : []),
    ],
  };
}

function buildSystemPrompt(persona: Persona, catalog: ReturnType<typeof leanCatalog>): string {
  const plants = catalog.map((p) => `${p.key} (${p.name_no}, ${p.category})`).join("; ");
  return [
    `Du er en hagebruker i Norge som bruker appen Spirr for å drive en kjøkkenhage gjennom sesongen.`,
    ``,
    `MÅL: ${persona.goal}`,
    ``,
    `Du besøker hagen omtrent én gang i uka. Appen viser deg tilstanden ("Hagen i dag"). Du svarer med`,
    `en LISTE av handlinger du gjør i dag, som JSON: {"actions":[ {…}, {…} ]}. Ingen prosa, bare JSON.`,
    `Lista kan være tom ({"actions":[]}) hvis ingenting haster — da går du videre til neste uke.`,
    `TIDEN GÅR AV SEG SELV mellom besøk; du skal IKKE be om å hoppe i tid.`,
    ``,
    `Handlinger (felt i parentes):`,
    `- {"action":"set_location","postnummer":"NNNN"} — sett sted (4-sifret postnummer). Gjør dette FØRST hvis sted mangler.`,
    `- {"action":"add_box","name":"...","bedType":"open|raised|container|greenhouse|tunnel","sunExposure":"sun|partial|shade","depthCm":N} — lag en dyrkingskasse.`,
    `- {"action":"sow_indoor","plant":"<key>","quantity":N} — forkultiver inne (ingen kasse ennå). For varmekjære arter.`,
    `- {"action":"sow_outdoor","box":"<A>","plant":"<key>","quantity":N} — så direkte i en kasse ute.`,
    `- {"action":"plant_out","planting":"<#1>","box":"<A>"} — plant en forkultivert frøplante ut i en kasse når den er klar.`,
    `- {"action":"harvest","planting":"<#1>","yield":"valgfri tekst"} — høst en moden planting.`,
    `- {"action":"remove_planting","planting":"<#1>","reason":"removed|failed"} — fjern/marker mislykket.`,
    `- {"action":"note","text":"..."} — skriv en kort observasjon (hvis du synes noe er forvirrende eller mangler).`,
    `- {"action":"add_custom_plant","name_no":"...","category":"vegetable|herb|fruit|flower","family":"...","gddBase":5|10} — lag en egen plante som ikke finnes i katalogen. Du får en ny key tilbake; bruk den i plant-feltet etterpå.`,
    ``,
    `Regler (viktigst først):`,
    `- HØST FØRST: står en planting som MODEN ("🌾 HØST NÅ"), høst den i dag — bruk harvest med NØYAKTIG handelen som vises (f.eks. "#26"). En moden avling som ikke høstes går tapt.`,
    `- PLANT UT FØR DU SÅR MER: er en frøplante KLAR ("🌱 PLANT UT NÅ"), plant den ut i en kasse. Ikke forkultiver flere frø enn du faktisk planter ut — en frøplante som aldri kommer i jorda blir aldri høstet.`,
    `- plant_out krever en frøplante-HANDLE (#N) fra "🌱 PLANT UT NÅ"-lista. Finnes ingen slik frøplante, IKKE bruk plant_out (lista "Arter i utplantingsvindu" er bare en så-hint, ikke noe du kan plante ut).`,
    `- plant-feltet skal ALLTID være en PLANTENØKKEL (key) fra katalogen, f.eks. "tomat_cherry" — aldri det norske navnet.`,
    `- "#1", "#2" er HANDLER for DINE plantinger og "A", "B" for DINE kasser (de vises i tilstanden). Bruk ALDRI en handle (#1/A) i plant-feltet, og aldri en key der det skal stå #-nummer (planting) eller bokstav (kasse).`,
    `- Forkultivering: sow_indoor uten kasse → senere plant_out i en kasse. Direktesåing: sow_outdoor i en kasse.`,
    `- Hvis set_location feiler fordi postnummeret ikke finnes, prøv et ANNET postnummer i nærheten (±1–10), ikke samme igjen.`,
    `- Følg appens forslag når de gir mening for målet ditt. Bruk note når noe i appen er uklart eller overrasker deg.`,
    ``,
    `Plantekatalog (key (navn, kategori)): ${plants}`,
  ].join("\n");
}

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
  const cadence = config.visitCadenceDays ?? 7;
  const maxBatch = config.maxActionsPerVisit ?? 8;
  const recent: string[] = [];
  const summary: AgentRunSummary = {
    steps: 0,
    attendedVisits: 0,
    llmCalls: 0,
    advances: 0,
    errors: 0,
    forcedAdvances: 0,
    evalTokens: 0,
    finalDate: clock.iso(),
  };

  // These verbs stay valid in the schema for replay, but the harness owns the clock now — if a model
  // emits one anyway, we drop it (the gardener doesn't advance time) rather than honour it.
  const TIME_VERBS = new Set(["advance_days", "advance_to_next_event"]);

  while (summary.steps < config.maxSteps && clock.iso() < config.endDate) {
    summary.steps += 1;
    // Ripeness is sampled EVERY week (this observe feeds everReady), even when the gardener is away — so a
    // crop whose ripe window passes during an absence is still counted, and going unharvested becomes a
    // recorded miss. See FINDINGS: the harvest window expires, so an unobserved miss would be invisible.
    const snapshot = buildSnapshot(ctx, clock, handles);
    transcript.observe(summary.steps, clock.iso(), clock.doy(), summarizeOffered(snapshot));

    if (!shouldAttend(clock.iso(), config.persona)) {
      // The gardener is away (holiday) this week — no decision, no actions. Time still advances below.
      transcript.system(summary.steps, clock.iso(), "hagen ikke besøkt denne uka (bortreist)");
    } else {
      summary.attendedVisits += 1;
      await runVisit(snapshot, recent, system, clock, config, summary, driver, transcript, maxBatch, TIME_VERBS);
    }

    // The harness advances to the next visit — the season always completes regardless of the model.
    const remainingToHorizon = daysBetween(clock.iso(), config.endDate);
    if (remainingToHorizon <= 0) break;
    clock.advanceDays(Math.min(cadence, remainingToHorizon));
    summary.advances += 1;
  }

  summary.finalDate = clock.iso();
  return summary;
}

/** One attended visit: render → ask → validate → apply (in priority order). Extracted so the visit loop
 * can gate it on attendance while keeping the per-week observe (above) unconditional. */
async function runVisit(
  snapshot: ObservedGarden,
  recent: string[],
  system: string,
  clock: SimClock,
  config: AgentConfig,
  summary: AgentRunSummary,
  driver: AppDriver,
  transcript: Transcript,
  maxBatch: number,
  TIME_VERBS: Set<string>,
): Promise<void> {
    const userContent =
      renderSnapshot(snapshot) +
      (recent.length ? `\n\n## Det du nylig gjorde\n${recent.slice(-8).join("\n")}` : "") +
      `\n\nHva gjør du i dag? Svar med {"actions":[ ... ]} (tom liste hvis ingenting haster).`;
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ];

    // One ask per visit. Reprompt ONLY when the reply was unparseable junk — a valid but empty batch
    // ({"actions":[]}, "nothing to do this week") is legitimate and must NOT cost a second call (S1).
    const first = parseActionBatch((await chat(messages, config, summary)).content);
    let rawBatch = first.actions;
    if (!first.parsed) {
      const retry = await chat(
        [...messages, { role: "user", content: `Svar KUN med gyldig JSON på formen {"actions":[ ... ]}.` }],
        config,
        summary,
      );
      rawBatch = parseActionBatch(retry.content).actions;
    }

    // Validate, then apply in PRIORITY order so the cap can never crowd out a high-value move: deps first
    // (location/box), then the goal-critical harvest/plant-out, then removals, then sowing last (S2). The
    // cap counts only actually-applied driver actions — invalid/time-verb entries are free, so garbage
    // can't push out a real harvest. Sorting is stable within a priority tier (preserves the model's order).
    const valid = rawBatch
      .map((raw) => validateAction(raw))
      .map((v, i) => {
        if (!v.ok) {
          summary.errors += 1;
          transcript.system(summary.steps, clock.iso(), `ugyldig handling hoppet over: ${v.error}`);
          return null;
        }
        return { action: v.action, i };
      })
      .filter((x): x is { action: GardenAction; i: number } => x !== null && !TIME_VERBS.has(x.action.action))
      .sort((a, b) => actionPriority(a.action.action) - actionPriority(b.action.action) || a.i - b.i);

    let applied = 0;
    for (const { action } of valid) {
      if (applied >= maxBatch) {
        const dropped = valid.length - applied;
        transcript.system(summary.steps, clock.iso(), `maks ${maxBatch} handlinger/besøk — ${dropped} lavere prioritert (såing) utsatt til neste uke`);
        break;
      }
      const result = driver.apply(action);
      transcript.action(summary.steps, clock.iso(), action, result);
      recent.push(
        `- ${clock.iso()}: ${action.action}${result.ok ? "" : " (FEIL: " + result.error + ")"}${result.note ? " — " + result.note : ""}`,
      );
      if (action.action === "note") {
        transcript.note(summary.steps, clock.iso(), action.text);
      }
      if (!result.ok) {
        summary.errors += 1;
      }
      applied += 1;
    }
}

// Within a visit, apply order = dependency order then goal priority: location/box must precede a sow into
// them; harvest + plant-out are the goal-critical moves and must survive the per-visit cap; sowing is the
// lowest priority (it's re-offered every week, so deferring it costs nothing). See review S2.
const ACTION_PRIORITY: Record<string, number> = {
  set_location: 0,
  add_box: 1,
  harvest: 2,
  plant_out: 3,
  remove_planting: 4,
  add_custom_plant: 5,
  sow_outdoor: 6,
  sow_indoor: 7,
  note: 8,
};
function actionPriority(action: string): number {
  return ACTION_PRIORITY[action] ?? 5;
}

/** Whole days from `fromIso` to `toIso` (positive when `to` is later). */
function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T12:00:00`).getTime();
  const b = new Date(`${toIso}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** One Ollama call, tallying llmCalls + evalTokens onto the summary. */
async function chat(messages: ChatMessage[], config: AgentConfig, summary: AgentRunSummary) {
  const reply = await ollamaChat(messages, config.ollama);
  summary.llmCalls += 1;
  summary.evalTokens += reply.evalCount;
  return reply;
}
