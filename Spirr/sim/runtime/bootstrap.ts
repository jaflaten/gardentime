// Headless bootstrap: stand the real Spirr stores up in Node.
//
// Order matters. src/lib/storage.ts and the three Zustand stores call localStorage at module-init
// (loadBoxes()/loadLocation()/loadCustomPlants() run inside `create(...)`). So we install the
// in-memory shim FIRST, then **dynamically** import the stores — a static import would hoist above
// the shim install and read a non-existent localStorage. After that, seeding is just: write the
// storage keys + `reloadFromStorage()` on each store.

import "./install"; // MUST be first: installs the localStorage shim before any store module loads.
import { installMemoryStorage, type MemoryStorage } from "./localStorage";
import type { Box, Planting, PlantInfo } from "../../src/types";
import type { LocationState } from "../../src/store/useLocationStore";

export interface SeedState {
  boxes?: Box[];
  plantings?: Planting[];
  location?: Partial<LocationState>;
  customPlants?: PlantInfo[];
}

const KEYS = {
  boxes: "gt_boxes",
  plantings: "gt_plantings",
  customPlants: "gt_custom_plants",
} as const;

// Garden + custom-plant state is seeded through storage (those stores expose reloadFromStorage()).
// Location has no reload method, so it's applied via its real store actions instead (applyLocation).
function seedToKeys(seed: SeedState): Record<string, string> {
  return {
    [KEYS.boxes]: JSON.stringify(seed.boxes ?? []),
    [KEYS.plantings]: JSON.stringify(seed.plantings ?? []),
    [KEYS.customPlants]: JSON.stringify(seed.customPlants ?? []),
  };
}

export type SimContext = Awaited<ReturnType<typeof bootstrap>>;

/**
 * Install the storage shim, import the real stores + clock + plant lookups, and seed initial state.
 * The returned context exposes the live stores (drive via `.getState().<action>()`), the clock seam,
 * the plant catalog, and `reseed()` to reset state between scenarios in the same process.
 */
export async function bootstrap(seed: SeedState = {}) {
  let storage: MemoryStorage = installMemoryStorage(seedToKeys(seed));

  // Dynamic imports — must run AFTER the shim is on globalThis.
  const clock = await import("../../src/lib/clock");
  const gardenMod = await import("../../src/store/useGardenStore");
  const locationMod = await import("../../src/store/useLocationStore");
  const customMod = await import("../../src/store/useCustomPlantsStore");
  const plantsMod = await import("../../src/lib/plants");

  const gardenStore = gardenMod.useGardenStore;
  const locationStore = locationMod.useLocationStore;
  const customPlantsStore = customMod.useCustomPlantsStore;

  function applyLocation(loc: SeedState["location"]) {
    if (!loc?.postnummer) {
      locationStore.getState().clearLocation();
      return;
    }
    locationStore.getState().setPostnummer(loc.postnummer);
    if (loc.elevationM != null) {
      locationStore.getState().setElevation(loc.elevationM);
    }
    if (loc.frostJusteringDays != null) {
      locationStore.getState().setFrostJustering(loc.frostJusteringDays);
    }
  }

  function loadGardenState(s: SeedState) {
    gardenStore.getState().reloadFromStorage();
    customPlantsStore.getState().reloadFromStorage();
    applyLocation(s.location);
  }

  // The stores were created against whatever localStorage held at import time; force a reload so the
  // seed we installed above is authoritative (covers the case where modules were cached from a prior run).
  loadGardenState(seed);

  /** Reset all state to a new seed (storage wiped + stores reloaded). For scenario isolation. */
  function reseed(next: SeedState) {
    storage = installMemoryStorage(seedToKeys(next));
    clock.setNow(null);
    loadGardenState(next);
  }

  return {
    get storage() {
      return storage;
    },
    clock,
    gardenStore,
    locationStore,
    customPlantsStore,
    findPlant: plantsMod.findPlant,
    bundledPlants: plantsMod.bundledPlants,
    reseed,
  };
}
