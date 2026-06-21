// The transcript: an ordered, replayable record of everything that happened in a run. Hard invariants
// read the resulting state; the soft LLM-judge reads this narrative; replay.ts re-applies the `action`
// entries with no LLM. Keep entries JSON-serializable.

import type { GardenAction } from "../driver/schema";

export type TranscriptEntry =
  | { kind: "observe"; step: number; simDate: string; doy: number; offered: OfferedSummary }
  | { kind: "action"; step: number; simDate: string; action: GardenAction; result: ActionResult }
  | { kind: "event"; step: number; simDate: string; label: string; eventKind: string }
  | { kind: "note"; step: number; simDate: string; text: string }
  | { kind: "system"; step: number; simDate: string; text: string };

export interface OfferedSummary {
  sowIndoor: string[];
  sowOutdoor: string[];
  plantOut: string[];
  harvestSoon: string[];
  warnings: string[];
}

export interface ActionResult {
  ok: boolean;
  /** Resolved handle for a create action (box/planting), when applicable. */
  handle?: string;
  error?: string;
  /** True when the action had no effect (repeat/duplicate) — feeds the stall watchdog. */
  noop?: boolean;
  note?: string;
}

export class Transcript {
  readonly entries: TranscriptEntry[] = [];

  observe(step: number, simDate: string, doy: number, offered: OfferedSummary) {
    this.entries.push({ kind: "observe", step, simDate, doy, offered });
  }

  action(step: number, simDate: string, action: GardenAction, result: ActionResult) {
    this.entries.push({ kind: "action", step, simDate, action, result });
  }

  event(step: number, simDate: string, label: string, eventKind: string) {
    this.entries.push({ kind: "event", step, simDate, label, eventKind });
  }

  note(step: number, simDate: string, text: string) {
    this.entries.push({ kind: "note", step, simDate, text });
  }

  system(step: number, simDate: string, text: string) {
    this.entries.push({ kind: "system", step, simDate, text });
  }

  actions(): Array<Extract<TranscriptEntry, { kind: "action" }>> {
    return this.entries.filter((e): e is Extract<TranscriptEntry, { kind: "action" }> => e.kind === "action");
  }

  errors(): Array<Extract<TranscriptEntry, { kind: "action" }>> {
    return this.actions().filter((e) => !e.result.ok);
  }

  notes(): string[] {
    return this.entries.filter((e) => e.kind === "note").map((e) => (e as { text: string }).text);
  }
}
