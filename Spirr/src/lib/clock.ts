// Clock seam (single source of "now"). Production reads real time; the simulation harness
// (sim/) and a future "time-travel / preview" feature override it. Replace *now-reads only* with
// `now()` — never the parsing of stored ISO date strings, whose meaning is fixed regardless of today.
//
// Backward-compatible: with no override, `now()` is just `new Date()`.

let override: number | null = null; // epoch ms, or null = real time

/** Override the clock. Pass a Date/epoch-ms/ISO-parsable value, or null to return to real time. */
export function setNow(d: Date | number | string | null): void {
  if (d == null) {
    override = null;
    return;
  }
  // Date-only strings ("2026-03-15") parse as UTC midnight, which can shift the local
  // calendar day in negative-offset zones. Anchor to local noon (as SimClock does) so the
  // frozen day matches the intent regardless of timezone/DST.
  const value = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d;
  const ms = +new Date(value);
  if (Number.isNaN(ms)) return; // ignore unparsable input — stay on real time
  override = ms;
}

/** The current moment — real time, or the override when one is set. */
export function now(): Date {
  return override == null ? new Date() : new Date(override);
}

/** Whether the clock is currently overridden (simulation/preview mode). */
export function isOverridden(): boolean {
  return override != null;
}
