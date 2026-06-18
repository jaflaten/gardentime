import type { HarvestRule, PlantInfo, Planting } from "../types";

// Pure date/window math for the Sesongoversikt timeline (Increment D). Everything works in
// day-of-year (1–366) within a single reference year so positions map cleanly to an x-axis.
// Kept separate from the component so the windowing is testable without React.

const MS_PER_DAY = 86_400_000;

export interface TimelineItem {
  planting: Planting;
  plant: PlantInfo | undefined;
  /**
   * Day-of-year the planting was sown/planted, clamped into the visible range — or `null` when it
   * was planted in a previous season (e.g. an established perennial), since its sow date doesn't
   * belong on this year's axis. The harvest band still renders for such plantings.
   */
  plantedDoy: number | null;
  /** Estimated harvest window [startDoy, endDoy], or null when the plant has no harvest rule. */
  harvestWindow: [number, number] | null;
}

export interface SeasonTimeline {
  /** Visible axis, snapped to whole months. */
  range: { startDoy: number; endDoy: number };
  year: number;
  lastFrostDoy: number;
  firstFrostDoy: number;
  items: TimelineItem[];
}

export function dateToDoy(date: Date): number {
  // Normalize both endpoints to local midnight and round, so the spring DST transition
  // (a 23-hour day in late March) doesn't shift the day count by one.
  const yearStart = new Date(date.getFullYear(), 0, 1).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((day - yearStart) / MS_PER_DAY) + 1;
}

export function doyToDate(doy: number, year: number): Date {
  const date = new Date(year, 0, 1);
  date.setDate(date.getDate() + Math.round(doy) - 1);
  return date;
}

/** Convert an absolute "MM-DD" calendar marker into a day-of-year within `year`. */
export function mmddToDoy(mmdd: string, year: number): number {
  const [month, day] = mmdd.split("-").map(Number);
  return dateToDoy(new Date(year, month - 1, day));
}

/** First day-of-year of the month containing `doy`. */
function monthStartDoy(doy: number, year: number): number {
  const date = doyToDate(doy, year);
  return dateToDoy(new Date(year, date.getMonth(), 1));
}

/** Last day-of-year of the month containing `doy`. */
function monthEndDoy(doy: number, year: number): number {
  const date = doyToDate(doy, year);
  return dateToDoy(new Date(year, date.getMonth() + 1, 0));
}

function harvestWindow(
  rule: HarvestRule | undefined,
  plantedDoy: number | null,
  firstFrostDoy: number,
  year: number,
): [number, number] | null {
  if (!rule) {
    return null;
  }
  if ("seasonal" in rule) {
    // Absolute calendar window, repeats yearly (perennials) — independent of the sow date.
    return [mmddToDoy(rule.seasonal[0], year), mmddToDoy(rule.seasonal[1], year)];
  }
  if ("weeksFromSowing" in rule) {
    // Sow-relative — needs a sow date on this year's axis. A planting from a prior season has none.
    if (plantedDoy === null) {
      return null;
    }
    const [min, max] = rule.weeksFromSowing;
    return [plantedDoy + min * 7, plantedDoy + max * 7];
  }
  // weeksBeforeFirstFrost — ready in the run-up to the first autumn frost.
  return [firstFrostDoy - rule.weeksBeforeFirstFrost * 7, firstFrostDoy];
}

/**
 * Build the season timeline for the user's active plantings. The axis spans from ~8 weeks before
 * the last spring frost (covers indoor-sow context) through the first autumn frost, expanded to
 * include any planting or harvest that falls outside that band, then snapped to whole months.
 * Sorted by planted date so rows read chronologically.
 */
export function buildSeasonTimeline(
  plantings: Planting[],
  findPlant: (key: string) => PlantInfo | undefined,
  lastFrostDoy: number,
  firstFrostDoy: number,
  year: number,
): SeasonTimeline {
  const active = plantings
    .filter((planting) => planting.status === "active")
    .sort((a, b) => a.plantedDate.localeCompare(b.plantedDate));

  // Provisional band around the frost dates.
  let startDoy = lastFrostDoy - 8 * 7;
  let endDoy = firstFrostDoy + 2 * 7;

  const raw = active.map((planting) => {
    const plant = planting.plantKey ? findPlant(planting.plantKey) : undefined;
    // Only place the sow dot on the axis when the planting was sown this season. An established
    // perennial (or stale prior-year planting) has a sow date that doesn't belong on this year's axis.
    const plantedThisYear = Number(planting.plantedDate.slice(0, 4)) === year;
    const plantedDoy = plantedThisYear
      ? dateToDoy(new Date(`${planting.plantedDate}T00:00:00`))
      : null;
    const win = harvestWindow(plant?.harvestRule, plantedDoy, firstFrostDoy, year);
    if (plantedDoy !== null) {
      startDoy = Math.min(startDoy, plantedDoy);
    }
    if (win) {
      startDoy = Math.min(startDoy, win[0]);
      endDoy = Math.max(endDoy, win[1]);
    }
    return { planting, plant, plantedDoy, win };
  });

  // Snap to month boundaries and clamp into the calendar year.
  startDoy = Math.max(1, monthStartDoy(startDoy, year));
  endDoy = Math.min(366, monthEndDoy(endDoy, year));

  const clamp = (doy: number) => Math.max(startDoy, Math.min(endDoy, doy));
  const items: TimelineItem[] = raw.map(({ planting, plant, plantedDoy, win }) => ({
    planting,
    plant,
    plantedDoy: plantedDoy === null ? null : clamp(plantedDoy),
    harvestWindow: win ? [clamp(win[0]), clamp(win[1])] : null,
  }));

  return { range: { startDoy, endDoy }, year, lastFrostDoy, firstFrostDoy, items };
}

/** Whole-month tick day-of-years within the range (inclusive of the first month). */
export function monthTicks(startDoy: number, endDoy: number, year: number): number[] {
  const ticks: number[] = [];
  const startMonth = doyToDate(startDoy, year).getMonth();
  const endMonth = doyToDate(endDoy, year).getMonth();
  for (let month = startMonth; month <= endMonth; month += 1) {
    ticks.push(dateToDoy(new Date(year, month, 1)));
  }
  return ticks;
}

/** Position of `doy` as a 0–100 percentage across the range. */
export function doyToPercent(doy: number, startDoy: number, endDoy: number): number {
  if (endDoy <= startDoy) {
    return 0;
  }
  return ((doy - startDoy) / (endDoy - startDoy)) * 100;
}
