// The visit-skip attendance model (FINDINGS critique fix a / B8). Kept in its own module — free of any
// store/snapshot imports — so it's unit-testable without the localStorage bootstrap.
import type { Persona } from "./persona";

/**
 * Whether the gardener opens the app on a visit dated `visitIso`. Models a single contiguous "away" window
 * (a summer holiday — the "Travel byboer" is literally travelling): every weekly visit whose date falls in
 * `[awayFrom, awayTo]` is skipped. This is deterministic (date comparison, no `Math.random`) and, crucially,
 * ROBUST: a multi-week block categorically outlasts a crop's 2–3 week ripe window, so any crop whose window
 * falls inside the absence is stranded regardless of Ollama's run-to-run timing — that's what lets the
 * harvest-rate metric drop below 100%. (A probabilistic taper can't guarantee this: scattered single skips
 * are caught on the next attended week still inside the window.) Personas with no `attendance` always attend
 * → every existing persona's loop behaviour is unchanged.
 */
export function shouldAttend(visitIso: string, persona: Persona): boolean {
  const a = persona.attendance;
  if (!a) return true;
  return !(visitIso >= a.awayFrom && visitIso <= a.awayTo); // ISO dates compare lexically
}
