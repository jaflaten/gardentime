import { coverGddFactor, gddHarvestWindow, type GddHarvest } from "./gdd";
import { isBundledPlantKey } from "./plants";
import { effectiveGddToMaturity, resolveSowMethod } from "./sowMethod";
import type { Box, HarvestRule, PlantInfo, Planting } from "../types";

/** Station GDD curves (base 5 + base 10) for location-aware harvest prediction (Layer 0). */
export interface GddCurves {
  base5: number[];
  base10: number[];
}

// Pure date/window math for the Sesongoversikt timeline (Increment D). Everything works in
// day-of-year (1–366) within a single reference year so positions map cleanly to an x-axis.
// Kept separate from the component so the windowing is testable without React.

const MS_PER_DAY = 86_400_000;

// Warm-lowland Norwegian baseline that the bundled `seasonal` perennial windows were authored
// against — Oslo/Stavanger/Bergen friland sit at last frost ≈ DOY 110 (~20 Apr), where mid-June
// strawberries are realistic. A cooler garden (later last frost) pushes the harvest band later.
// This is a frost proxy for ripening, not true phenology (limitation 4) — good enough to stop a
// premature "harvest now" in cold gardens; per-garden calibration still wants Phase F.
export const SEASONAL_REFERENCE_LAST_FROST_DOY = 110;

/** Days to shift a BUNDLED `seasonal` window for a location (cooler ⇒ later). Clamped to a sane range. */
export function seasonalShiftDays(lastFrostDoy: number): number {
  const raw = Math.round(lastFrostDoy - SEASONAL_REFERENCE_LAST_FROST_DOY);
  return Math.max(-30, Math.min(75, raw));
}

/**
 * Resolve a plant's `seasonal` harvest window to a location-aware day shift. Bundled plants shift
 * from the warm-lowland baseline toward the user's last frost; custom plants (entered for the user's
 * own garden) are left as-is.
 */
export function seasonalShiftForPlant(plantKey: string | undefined, lastFrostDoy: number): number {
  return plantKey && isBundledPlantKey(plantKey) ? seasonalShiftDays(lastFrostDoy) : 0;
}

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
  /**
   * True when the GDD model says this crop won't reach maturity outdoors at this location *and* it's
   * in an uncovered bed — i.e. it genuinely needs a greenhouse/tunnel here. Drives the
   * "modnes neppe ute" note in place of a harvest bar. (A covered crop the crude model still can't
   * ripen falls back to weeksFromSowing instead, to avoid a contradictory "needs greenhouse" note.)
   */
  wontRipen?: boolean;
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
  durationWeeks = 0,
  seasonalShift = 0,
): [number, number] | null {
  if (!rule) {
    return null;
  }
  if ("seasonal" in rule) {
    // Absolute calendar window, repeats yearly (perennials) — independent of the sow date, but
    // shifted toward the user's frost dates so a cold garden's band lands later (limitation 4 fix).
    return [mmddToDoy(rule.seasonal[0], year) + seasonalShift, mmddToDoy(rule.seasonal[1], year) + seasonalShift];
  }
  if ("weeksFromSowing" in rule) {
    // Sow-relative — needs a sow date on this year's axis. A planting from a prior season has none.
    if (plantedDoy === null) {
      return null;
    }
    const [min, max] = rule.weeksFromSowing;
    // Band starts at the earliest possible first-harvest and runs to the latest first-harvest plus
    // the picking duration, so continuous croppers draw a longer bar than one-shot roots.
    return [plantedDoy + min * 7, plantedDoy + (max + durationWeeks) * 7];
  }
  // weeksBeforeFirstFrost — ready in the run-up to the first autumn frost.
  return [firstFrostDoy - rule.weeksBeforeFirstFrost * 7, firstFrostDoy];
}

/**
 * Combine the GDD prediction with the weeksFromSowing field rule into the harvest window we draw.
 *
 * The GDD model's job is to pull a harvest *earlier* in a warm garden, and to flag a genuinely
 * too-cold crop as "won't ripen". It must NOT push a harvest *later* than the field rule: a base-10
 * warm-season crop in a cool maritime climate accumulates degree-days so slowly that raw GDD drifts
 * past first frost (squash sown in June at Sogndal predicted late October), which contradicts real
 * Norwegian harvests (≈ August). So when GDD ripens but no earlier than the field window's first
 * harvest, we trust the weeksFromSowing field rule instead — GDD may only move a harvest earlier.
 *
 * (Known limitation: the underlying base-10 heat budget itself may be under-credited at some stations;
 * that's a separate climate-data question. This keeps the *prediction* honest in the meantime — it
 * never claims a frost-tender crop ripens after the killing frost.)
 */
export function resolveHarvestWindow(
  gdd: GddHarvest | null,
  fieldWindow: [number, number] | null,
  coverFactor: number,
): { window: [number, number] | null; wontRipen: boolean } {
  if (gdd && gdd.ripens && gdd.window) {
    const window = fieldWindow && gdd.window[0] > fieldWindow[0] ? fieldWindow : gdd.window;
    return { window, wontRipen: false };
  }
  if (gdd && !gdd.ripens && coverFactor <= 1) {
    return { window: null, wontRipen: true };
  }
  return { window: fieldWindow, wontRipen: false };
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
  gddCurves?: GddCurves,
  boxes?: Box[],
): SeasonTimeline {
  const bedTypeById = new Map((boxes ?? []).map((box) => [box.id, box.bedType]));
  const active = plantings
    // Indoor seedlings (no boxId) aren't in the garden yet — they don't belong on the season axis.
    .filter((planting) => planting.status === "active" && planting.boxId)
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
    const seasonalShift = seasonalShiftForPlant(plant?.key, lastFrostDoy);
    // GDD accumulates from the *outdoor* start: the transplant date when present (an indoor-started
    // seedling's windowsill weeks don't count), otherwise the sow date.
    const transplantedDoy =
      planting.transplantedDate && Number(planting.transplantedDate.slice(0, 4)) === year
        ? dateToDoy(new Date(`${planting.transplantedDate}T00:00:00`))
        : null;
    const anchorDoy = transplantedDoy ?? plantedDoy;
    const coverFactor = coverGddFactor(bedTypeById.get(planting.boxId ?? ""));
    // Increment L: adjust maturity for the sow method (forkultivert vs direkte) before the GDD
    // prediction, so the establishment credit can also flip a borderline crop's "won't ripen" verdict.
    const effMaturity = effectiveGddToMaturity(plant, resolveSowMethod(planting, plant));
    const gdd =
      gddCurves && anchorDoy !== null
        ? gddHarvestWindow(plant, anchorDoy, gddCurves.base5, gddCurves.base10, coverFactor, effMaturity)
        : null;
    // The frost-relative `weeksFromSowing`/seasonal rule — the Norwegian field baseline, and the
    // fallback for covered crops the crude cover model still can't ripen (so we never tell a
    // greenhouse crop it "needs a greenhouse").
    const fieldWin = harvestWindow(
      plant?.harvestRule,
      plantedDoy,
      firstFrostDoy,
      year,
      plant?.harvestDurationWeeks ?? 0,
      seasonalShift,
    );
    // GDD pulls the window earlier in a warm garden / flags a too-cold crop, but never later than
    // the field rule (see resolveHarvestWindow — squash-in-October fix).
    const { window: win, wontRipen } = resolveHarvestWindow(gdd, fieldWin, coverFactor);
    if (plantedDoy !== null) {
      startDoy = Math.min(startDoy, plantedDoy);
    }
    if (win) {
      startDoy = Math.min(startDoy, win[0]);
      endDoy = Math.max(endDoy, win[1]);
    }
    return { planting, plant, plantedDoy, win, wontRipen };
  });

  // Snap to month boundaries. Clamp into the calendar year *before* snapping: monthStart/EndDoy run
  // doyToDate, which rolls a DOY past 31 Dec into the next year — a late long-season harvest band can
  // overshoot (e.g. a crop that just ripens in late Oct with a 10-week band reaches ~DOY 367). Snapping
  // that wrapped date returns late January, making endDoy < startDoy and collapsing the whole axis (no
  // month ticks, every bar at 0 % width). Clamping the inputs first keeps the snap inside the year.
  const lastDoyOfYear = dateToDoy(new Date(year, 11, 31));
  startDoy = monthStartDoy(Math.max(1, Math.min(startDoy, lastDoyOfYear)), year);
  endDoy = monthEndDoy(Math.max(1, Math.min(endDoy, lastDoyOfYear)), year);

  const clamp = (doy: number) => Math.max(startDoy, Math.min(endDoy, doy));
  const items: TimelineItem[] = raw.map(({ planting, plant, plantedDoy, win, wontRipen }) => ({
    planting,
    plant,
    plantedDoy: plantedDoy === null ? null : clamp(plantedDoy),
    harvestWindow: win ? [clamp(win[0]), clamp(win[1])] : null,
    wontRipen,
  }));

  return { range: { startDoy, endDoy }, year, lastFrostDoy, firstFrostDoy, items };
}

/**
 * One row in the grouped ("Gruppert") Sesongoversikt: all active plantings of the same plant merged
 * into a single timeline row. Used as the overview when a garden has many plantings; each group
 * expands back into its individual {@link TimelineItem} rows (the default detailed view).
 */
export interface TimelineGroup {
  /** Stable grouping key — the plant key, or `custom:<name>` for unkeyed free-text plantings. */
  key: string;
  /** Representative plant metadata (emoji/name); shared by every item in the group. */
  plant: PlantInfo | undefined;
  /** The underlying plantings, in the same chronological order as the flat item list. */
  items: TimelineItem[];
  /** All sow markers to draw on the merged bar (prior-season plantings contribute none). */
  plantedDoys: number[];
  /** Union of the members' harvest windows [start, end], or null when none have one. */
  harvestWindow: [number, number] | null;
  /** True when the group has no harvest band and at least one member won't ripen outdoors here. */
  wontRipen?: boolean;
  /** Distinct box ids the group occupies, in first-seen order (for the "· Kasse A, B" label). */
  boxIds: string[];
}

/**
 * Collapse a flat timeline-item list into one group per plant. Same-plant duplicates share a
 * `harvestRule`, so their windows overlap and the union reads as a single clean band. Insertion
 * order is preserved, so groups appear in the order their first planting was sown.
 */
export function groupTimelineItems(items: TimelineItem[]): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();
  for (const item of items) {
    const key = item.planting.plantKey || `custom:${item.planting.customName ?? "?"}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, plant: item.plant, items: [], plantedDoys: [], harvestWindow: null, boxIds: [] };
      groups.set(key, group);
    }
    group.items.push(item);
    if (item.plantedDoy !== null) {
      group.plantedDoys.push(item.plantedDoy);
    }
    if (item.harvestWindow) {
      group.harvestWindow = group.harvestWindow
        ? [Math.min(group.harvestWindow[0], item.harvestWindow[0]), Math.max(group.harvestWindow[1], item.harvestWindow[1])]
        : [item.harvestWindow[0], item.harvestWindow[1]];
    }
    if (item.planting.boxId && !group.boxIds.includes(item.planting.boxId)) {
      group.boxIds.push(item.planting.boxId);
    }
    if (item.wontRipen) {
      group.wontRipen = true;
    }
  }
  // A "won't ripen" flag only stands when the group has no harvest band of its own.
  for (const group of groups.values()) {
    if (group.harvestWindow) {
      group.wontRipen = false;
    }
  }
  return [...groups.values()];
}

/**
 * One crop's progress toward harvest, derived from the same {@link buildSeasonTimeline} windows.
 * Feeds the "Neste til høst" maturity list — a per-planting growth bar + days-to-harvest.
 */
export interface MaturityRow {
  item: TimelineItem;
  /** 0–100 growth from sow/anchor to first harvest; null for a prior-season planting (no sow dot). */
  progress: number | null;
  /** Days until first harvest. ≤0 means the window has opened (ready/picking). */
  daysToHarvest: number;
  /** Today is inside the harvest window. */
  ready: boolean;
}

/**
 * Build the maturity rows for every active planting that has an estimated harvest window, soonest
 * first (already-ready crops lead). Plantings with no window (no rule, or "won't ripen") are omitted.
 */
export function maturityRows(timeline: SeasonTimeline, todayDoy: number): MaturityRow[] {
  const rows: MaturityRow[] = [];
  for (const item of timeline.items) {
    if (!item.harvestWindow) {
      continue;
    }
    const [start, end] = item.harvestWindow;
    const ready = todayDoy >= start && todayDoy <= end;
    const daysToHarvest = start - todayDoy;
    const progress =
      item.plantedDoy !== null && start > item.plantedDoy
        ? Math.max(0, Math.min(100, ((todayDoy - item.plantedDoy) / (start - item.plantedDoy)) * 100))
        : null;
    rows.push({ item, progress, daysToHarvest, ready });
  }
  // Soonest-to-harvest first; ready crops (daysToHarvest ≤ 0) naturally sort to the top.
  return rows.sort((a, b) => a.daysToHarvest - b.daysToHarvest);
}

/**
 * Count active plantings whose *first harvest* falls in each calendar month (index 0–11). Drives the
 * "Høstekalender" — a forward-looking bar of how busy each month's harvest will be.
 */
export function harvestCountByMonth(timeline: SeasonTimeline): number[] {
  const counts = new Array(12).fill(0);
  for (const item of timeline.items) {
    if (!item.harvestWindow) {
      continue;
    }
    const month = doyToDate(item.harvestWindow[0], timeline.year).getMonth();
    counts[month] += 1;
  }
  return counts;
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
