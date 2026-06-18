import type { HarvestRule, PlantInfo, Planting } from "../types";

// Pure date/window math for the Sesongoversikt timeline (Increment D). Everything works in
// day-of-year (1–366) within a single reference year so positions map cleanly to an x-axis.
// Kept separate from the component so the windowing is testable without React.

const MS_PER_DAY = 86_400_000;

export interface TimelineItem {
  planting: Planting;
  plant: PlantInfo | undefined;
  /** Day-of-year the planting was sown/planted, clamped into the visible range. */
  plantedDoy: number;
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
  plantedDoy: number,
  firstFrostDoy: number,
): [number, number] | null {
  if (!rule) {
    return null;
  }
  if ("weeksFromSowing" in rule) {
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
    const plantedDoy = dateToDoy(new Date(`${planting.plantedDate}T00:00:00`));
    const win = harvestWindow(plant?.harvestRule, plantedDoy, firstFrostDoy);
    startDoy = Math.min(startDoy, plantedDoy);
    if (win) {
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
    plantedDoy: clamp(plantedDoy),
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
