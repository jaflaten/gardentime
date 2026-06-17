import { useMemo } from "react";
import { resolveLocation, type ResolvedLocation } from "./location";
import { useLocationStore } from "../store/useLocationStore";

/**
 * Subscribe to the user's resolved location (postnummer → station + lapse-rate-corrected frost dates).
 * Returns null when no postnummer is set. Re-derives whenever any input changes.
 */
export function useResolvedLocation(): ResolvedLocation | null {
  const postnummer = useLocationStore((state) => state.postnummer);
  const elevationM = useLocationStore((state) => state.elevationM);
  const frostJusteringDays = useLocationStore((state) => state.frostJusteringDays);

  return useMemo(() => {
    if (!postnummer) {
      return null;
    }
    return resolveLocation({
      postnummer,
      userElevationM: elevationM ?? undefined,
      frostJusteringDays,
    });
  }, [postnummer, elevationM, frostJusteringDays]);
}
