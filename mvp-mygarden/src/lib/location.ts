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

  return {
    postnummer,
    station,
    stationFrost,
    userElevationM,
    lastFrostDoy,
    firstFrostDoy,
    elevationShiftDays,
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
