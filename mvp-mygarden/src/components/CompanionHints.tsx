import { companionHints } from "../lib/companions";
import { getPlantName, usePlantLookup } from "../lib/plants";
import { useUiStore, type PlantLanguage } from "../store/useUiStore";
import type { PlantInfo } from "../types";

interface CompanionHintsProps {
  /** The plant the user is about to add. */
  plantKey: string;
  /** Plant keys already growing in this box (its active plantings) — the strong, same-soil signal. */
  neighbourKeys: string[];
  /** Plant keys in *neighbouring* boxes (already de-duped against neighbourKeys) — softer wording. */
  nearbyKeys?: string[];
}

function joinNames(plants: PlantInfo[], language: PlantLanguage): string {
  const names = plants.map((plant) => getPlantName(plant, language));
  if (names.length <= 1) {
    return names[0] ?? "";
  }
  return `${names.slice(0, -1).join(", ")} og ${names[names.length - 1]}`;
}

/**
 * Green/amber companion-planting hints shown below the plant picker when the target box already
 * has other active plantings. Soft information, never blocks. Returns null when there's no known
 * pairing, so callers can render it unconditionally.
 */
export function CompanionHints({ plantKey, neighbourKeys, nearbyKeys = [] }: CompanionHintsProps) {
  const findPlant = usePlantLookup();
  const language = useUiStore((state) => state.plantLanguage);

  const plant = plantKey ? findPlant(plantKey) : undefined;
  if (!plant) {
    return null;
  }
  const hints = companionHints(plant, neighbourKeys, findPlant);
  const nearbyHints = companionHints(plant, nearbyKeys, findPlant);
  if (hints.length === 0 && nearbyHints.length === 0) {
    return null;
  }
  const good = hints.filter((hint) => hint.kind === "good").map((hint) => hint.plant);
  const bad = hints.filter((hint) => hint.kind === "bad").map((hint) => hint.plant);
  const nearbyGood = nearbyHints.filter((hint) => hint.kind === "good").map((hint) => hint.plant);
  const nearbyBad = nearbyHints.filter((hint) => hint.kind === "bad").map((hint) => hint.plant);

  return (
    <div className="space-y-1.5">
      {good.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-lg border p-2.5 text-sm"
          style={{ borderColor: "var(--green)", backgroundColor: "var(--green-light)", color: "var(--text)" }}
        >
          <span aria-hidden="true">🌿</span>
          <p className="flex-1">
            Trives med <strong>{joinNames(good, language)}</strong> i denne kassen.
          </p>
        </div>
      )}
      {bad.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-lg border p-2.5 text-sm"
          style={{ borderColor: "var(--amber)", backgroundColor: "var(--amber-light)", color: "var(--text)" }}
        >
          <span aria-hidden="true">⚠</span>
          <p className="flex-1">
            Dårlig naboskap med <strong>{joinNames(bad, language)}</strong> — de trives bedre hver for seg.
          </p>
        </div>
      )}
      {nearbyGood.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-lg border p-2.5 text-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text-muted)" }}
        >
          <span aria-hidden="true">🌿</span>
          <p className="flex-1">
            Trives med <strong>{joinNames(nearbyGood, language)}</strong> i nabokassen.
          </p>
        </div>
      )}
      {nearbyBad.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-lg border p-2.5 text-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text-muted)" }}
        >
          <span aria-hidden="true">⚠</span>
          <p className="flex-1">
            Mindre heldig naboskap med <strong>{joinNames(nearbyBad, language)}</strong> i nabokassen.
          </p>
        </div>
      )}
    </div>
  );
}
