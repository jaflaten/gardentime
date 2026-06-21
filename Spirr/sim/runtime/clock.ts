// SimClock — drives src/lib/clock.ts forward through the gardening year. The harness never reads
// real time; every "now" flows through here so a multi-season run finishes in milliseconds.

export interface SeasonalEvent {
  doy: number;
  year: number;
  kind: "last-frost" | "first-frost" | "solstice" | "month-start";
  label: string;
}

const MONTHS_NO = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

/** Day-of-year (1–366) for a date, matching src/lib/sowWindow.todayDoy(). */
export function doyOf(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

/** Local-midnight Date for a (year, doy) pair. */
export function dateOfDoy(year: number, doy: number): Date {
  return new Date(year, 0, doy);
}

export interface SimClockOptions {
  lastFrostDoy?: number;
  firstFrostDoy?: number;
}

export class SimClock {
  private current: Date;
  private readonly setNow: (d: Date | number | string | null) => void;
  private readonly opts: SimClockOptions;

  constructor(setNow: (d: Date | number | string | null) => void, startIso: string, opts: SimClockOptions = {}) {
    this.setNow = setNow;
    this.opts = opts;
    this.current = new Date(`${startIso}T12:00:00`); // noon avoids DST/midnight edge cases
    this.apply();
  }

  private apply() {
    this.setNow(this.current);
  }

  now(): Date {
    return new Date(this.current);
  }

  /** ISO date (YYYY-MM-DD) — the form the stores expect for plantedDate/harvestDate. */
  iso(): string {
    return this.current.toISOString().slice(0, 10);
  }

  doy(): number {
    return doyOf(this.current);
  }

  year(): number {
    return this.current.getFullYear();
  }

  setDate(iso: string) {
    this.current = new Date(`${iso}T12:00:00`);
    this.apply();
  }

  advanceDays(n: number) {
    if (n <= 0) {
      return;
    }
    this.current = new Date(this.current.getTime() + n * 86_400_000);
    this.apply();
  }

  /** Jump to a doy; rolls into next year if the target is already behind us this year. */
  advanceToDoy(doy: number, year = this.year()) {
    let target = dateOfDoy(year, doy);
    if (target.getTime() <= this.current.getTime()) {
      target = dateOfDoy(year + 1, doy);
    }
    this.current = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 12);
    this.apply();
  }

  /** All seasonal events for a given calendar year, sorted by doy. */
  eventsForYear(year: number): SeasonalEvent[] {
    const events: SeasonalEvent[] = [];
    if (this.opts.lastFrostDoy != null) {
      events.push({ doy: this.opts.lastFrostDoy, year, kind: "last-frost", label: "siste vårfrost" });
    }
    if (this.opts.firstFrostDoy != null) {
      events.push({ doy: this.opts.firstFrostDoy, year, kind: "first-frost", label: "første høstfrost" });
    }
    events.push({ doy: doyOf(new Date(year, 5, 21)), year, kind: "solstice", label: "sommersolverv" });
    for (let m = 0; m < 12; m += 1) {
      events.push({ doy: doyOf(new Date(year, m, 1)), year, kind: "month-start", label: `1. ${MONTHS_NO[m]}` });
    }
    return events.sort((a, b) => a.doy - b.doy);
  }

  /** The next seasonal event strictly after the current date, advancing the clock to it. Returns it. */
  advanceToNextEvent(): SeasonalEvent {
    const curDoy = this.doy();
    const thisYear = this.eventsForYear(this.year()).find((e) => e.doy > curDoy);
    const next = thisYear ?? { ...this.eventsForYear(this.year() + 1)[0], year: this.year() + 1 };
    this.advanceToDoy(next.doy, next.year);
    return next;
  }
}
