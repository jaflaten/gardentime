import type { SeedState } from "../runtime/bootstrap";

export interface Scenario {
  key: string;
  title: string;
  /** Initial state. Location here is applied via the store so frost dates resolve before the run. */
  seed: SeedState;
  /** ISO start date the SimClock is set to. */
  startDate: string;
  /** ISO horizon — the run stops once the clock reaches it. */
  endDate: string;
  /** Persona key (see gardener/persona.ts). */
  persona: string;
  /** Cost ceiling: max LLM turns. */
  maxSteps: number;
  /** Watchdog: force a season advance after this many non-advancing actions. */
  maxNoAdvance: number;
  /** Plain-language note about what life stages this scenario is meant to exercise. */
  exercises: string;
}
