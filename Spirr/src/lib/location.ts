import frostNormalsJson from "../data/frost-normals.json";
import postnummerJson from "../data/postnummer.json";
import stationsJson from "../data/stations.json";

export interface PostnummerEntry {
  postnummer: string;
  kommune: string;
  fylke: string;
  centroidLat: number;
  centroidLon: number;
  centroidElevationM: number;
  stationId: string;
}

export interface FrostNormalEntry {
  key: string;
  lastFrostDoy: number;
  firstFrostDoy: number;
  gdd5: number;
  /**
   * Cumulative growing-degree-day curve (median 1991-2020), 13 month-boundary checkpoints:
   * index 0 = year start (0), index k = cumulative GDD through the end of month k, index 12 =
   * annual total. base 5 for cool crops, base 10 for warm crops. Drives location-aware harvest
   * prediction (Increment I, Layer 0); see `src/lib/gdd.ts`.
   */
  gddCurve5: number[];
  gddCurve10: number[];
  /**
   * Cumulative count of growing days (Tmean above base 5 / base 10) at the same 13 checkpoints.
   * Lets the app lapse-correct the GDD heat budget for the user's elevation: a garden below its
   * station is warmer, worth ~ΔT extra GDD per growing day. Optional — pre-fix data lacks them,
   * in which case no elevation adjustment is applied (curves fall back to the raw station values).
   */
  growDays5?: number[];
  growDays10?: number[];
}

export interface StationEntry {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevationM: number;
}

const postnummerByCode: Map<string, PostnummerEntry> = new Map(
  (postnummerJson as PostnummerEntry[]).map((entry) => [entry.postnummer, entry]),
);

const stationById: Map<string, StationEntry> = new Map(
  (stationsJson as StationEntry[]).map((entry) => [entry.id, entry]),
);

const frostNormalByStationId: Map<string, FrostNormalEntry> = new Map(
  (frostNormalsJson as FrostNormalEntry[]).map((entry) => [entry.key, entry]),
);

// ~0.65°C per 100 m × ~10 days per °C ≈ 0.065 days per metre of elevation difference.
export const LAPSE_DAYS_PER_METRE = 0.065;

// Environmental lapse rate for the GDD heat budget: ~0.65°C cooler per 100 m of elevation gain
// (≈ 0.0065°C per metre). A garden below its station is this much warmer, worth ~ΔT extra GDD per
// growing day. This is the temperature half of LAPSE_DAYS_PER_METRE (which folds in ~10 days/°C).
export const LAPSE_C_PER_METRE = 0.0065;

/**
 * Lapse-correct a station GDD curve to the user's elevation. Each checkpoint gains `deltaT` extra
 * degree-days per growing day accumulated so far (`deltaT > 0` when the garden sits below the
 * station, i.e. warmer). Clamped to ≥0 and forced non-decreasing so it stays a valid cumulative
 * curve even at extreme elevation differences. Returns the raw curve unchanged when growing-day
 * counts are missing (pre-fix data) or there's no elevation difference.
 */
export function elevationAdjustedGddCurve(
  rawCurve: number[],
  growDays: number[] | undefined,
  deltaT: number,
): number[] {
  if (!growDays || deltaT === 0) {
    return rawCurve;
  }
  let running = 0;
  return rawCurve.map((value, k) => {
    const adjusted = Math.max(0, value + deltaT * (growDays[k] ?? 0));
    running = Math.max(running, adjusted);
    return Math.round(running);
  });
}

export function findPostnummer(postnummer: string): PostnummerEntry | undefined {
  return postnummerByCode.get(postnummer.trim());
}

export function isValidPostnummer(postnummer: string): boolean {
  return /^\d{4}$/.test(postnummer.trim());
}

export interface ResolveLocationInput {
  postnummer: string;
  userElevationM?: number;
  frostJusteringDays?: number;
}

export interface ResolvedLocation {
  postnummer: PostnummerEntry;
  station: StationEntry;
  stationFrost: FrostNormalEntry;
  userElevationM: number;
  /** Adjusted last spring frost DOY for the user's elevation + offset. */
  lastFrostDoy: number;
  /** Adjusted first autumn frost DOY for the user's elevation + offset. */
  firstFrostDoy: number;
  /** Lapse-rate shift in days applied for elevation difference (informational). */
  elevationShiftDays: number;
  /**
   * GDD curves lapse-corrected to the user's elevation (base 5 / base 10). Use these — not
   * `stationFrost.gddCurve*` — for any harvest prediction, so a garden below its (often colder,
   * higher) station gets the warmth it actually has. Falls back to the raw station curve when
   * growing-day data is missing or the elevation matches.
   */
  gddCurve5: number[];
  gddCurve10: number[];
}

/**
 * Apply lapse-rate correction + user offset to the station's frost normals.
 * Returns null if the postnummer is unknown, or the resolved station/normals are missing.
 */
export function resolveLocation(input: ResolveLocationInput): ResolvedLocation | null {
  const postnummer = findPostnummer(input.postnummer);
  if (!postnummer) {
    return null;
  }
  const station = stationById.get(postnummer.stationId);
  const stationFrost = frostNormalByStationId.get(postnummer.stationId);
  if (!station || !stationFrost) {
    return null;
  }

  const userElevationM = input.userElevationM ?? postnummer.centroidElevationM;
  const offsetDays = input.frostJusteringDays ?? 0;

  const elevationShiftDays = LAPSE_DAYS_PER_METRE * (userElevationM - station.elevationM);
  // Higher user elevation ⇒ later spring frost, earlier autumn frost.
  // frostJustering ⇒ positive = more conservative (later spring, earlier autumn).
  const lastFrostDoy = Math.round(stationFrost.lastFrostDoy + elevationShiftDays + offsetDays);
  const firstFrostDoy = Math.round(stationFrost.firstFrostDoy - elevationShiftDays - offsetDays);

  // Warmer below the station (positive ΔT) ⇒ more degree-days; the GDD curves shift up accordingly.
  const deltaT = LAPSE_C_PER_METRE * (station.elevationM - userElevationM);
  const gddCurve5 = elevationAdjustedGddCurve(stationFrost.gddCurve5, stationFrost.growDays5, deltaT);
  const gddCurve10 = elevationAdjustedGddCurve(stationFrost.gddCurve10, stationFrost.growDays10, deltaT);

  return {
    postnummer,
    station,
    stationFrost,
    userElevationM,
    lastFrostDoy,
    firstFrostDoy,
    elevationShiftDays,
    gddCurve5,
    gddCurve10,
  };
}

const MONTHS_NO = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

/**
 * Format a day-of-year (1-366) as "d. mmm" in Norwegian using a non-leap reference year.
 */
export function formatDoy(doy: number, referenceYear = 2025): string {
  if (!Number.isFinite(doy)) {
    return "?";
  }
  const clamped = Math.max(1, Math.min(366, Math.round(doy)));
  const date = new Date(referenceYear, 0, 1);
  date.setDate(date.getDate() + clamped - 1);
  return `${date.getDate()}. ${MONTHS_NO[date.getMonth()]}`;
}
