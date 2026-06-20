import { create } from "zustand";
import { findPostnummer, resolveLocation, type ResolvedLocation } from "../lib/location";

const LOCATION_KEY = "gt_location";

export interface LocationState {
  postnummer: string | null;
  elevationM: number | null;
  frostJusteringDays: number;
}

interface LocationStore extends LocationState {
  setPostnummer: (postnummer: string | null) => void;
  setElevation: (elevationM: number | null) => void;
  setFrostJustering: (days: number) => void;
  clearLocation: () => void;
  resolved: () => ResolvedLocation | null;
}

const DEFAULT_STATE: LocationState = {
  postnummer: null,
  elevationM: null,
  frostJusteringDays: 0,
};

function loadLocation(): LocationState {
  const raw = localStorage.getItem(LOCATION_KEY);
  if (!raw) {
    return DEFAULT_STATE;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<LocationState>;
    return {
      postnummer: typeof parsed.postnummer === "string" && /^\d{4}$/.test(parsed.postnummer) ? parsed.postnummer : null,
      elevationM:
        typeof parsed.elevationM === "number" && Number.isFinite(parsed.elevationM) ? Math.round(parsed.elevationM) : null,
      frostJusteringDays:
        typeof parsed.frostJusteringDays === "number" && Number.isFinite(parsed.frostJusteringDays)
          ? Math.round(parsed.frostJusteringDays)
          : 0,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(state: LocationState) {
  localStorage.setItem(LOCATION_KEY, JSON.stringify(state));
}

function snapshot(store: LocationStore): LocationState {
  return {
    postnummer: store.postnummer,
    elevationM: store.elevationM,
    frostJusteringDays: store.frostJusteringDays,
  };
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  ...loadLocation(),

  setPostnummer: (postnummer) => {
    const trimmed = postnummer?.trim() ?? "";
    const validated = /^\d{4}$/.test(trimmed) ? trimmed : null;
    const matched = validated ? findPostnummer(validated) : null;
    // Reset elevation to the postnummer centroid when the postnummer changes,
    // so users see the resolved default without an extra step.
    const elevationM = matched ? matched.centroidElevationM : null;
    const next: LocationState = { ...snapshot(get()), postnummer: validated, elevationM };
    persist(next);
    set(next);
  },

  setElevation: (elevationM) => {
    const validated =
      typeof elevationM === "number" && Number.isFinite(elevationM) ? Math.max(0, Math.round(elevationM)) : null;
    const next: LocationState = { ...snapshot(get()), elevationM: validated };
    persist(next);
    set(next);
  },

  setFrostJustering: (days) => {
    const validated = Number.isFinite(days) ? Math.max(-60, Math.min(60, Math.round(days))) : 0;
    const next: LocationState = { ...snapshot(get()), frostJusteringDays: validated };
    persist(next);
    set(next);
  },

  clearLocation: () => {
    localStorage.removeItem(LOCATION_KEY);
    set(DEFAULT_STATE);
  },

  resolved: () => {
    const state = get();
    if (!state.postnummer) {
      return null;
    }
    return resolveLocation({
      postnummer: state.postnummer,
      userElevationM: state.elevationM ?? undefined,
      frostJusteringDays: state.frostJusteringDays,
    });
  },
}));
