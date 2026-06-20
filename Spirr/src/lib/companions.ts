import type { PlantInfo } from "../types";

export interface CompanionHint {
  /** "good" = beneficial neighbour, "bad" = poor neighbour. */
  kind: "good" | "bad";
  /** The plant already growing nearby that this hint is about. */
  plant: PlantInfo;
}

/**
 * Companion pairings between `plant` and the plants already growing in a box (Increment F).
 * Soft information only — like rotation, it never blocks. The bundled data is symmetric, but we
 * check both directions so a one-sided custom-plant tag still surfaces. One hint per distinct
 * neighbour, with "bad" winning over "good" if a plant somehow appears on both lists.
 *
 * A neighbour of the *same* plant is skipped — two lettuces beside each other isn't a pairing.
 */
export function companionHints(
  plant: PlantInfo,
  neighbourKeys: string[],
  findPlant: (key: string) => PlantInfo | undefined,
): CompanionHint[] {
  const good = new Set(plant.companionsGood ?? []);
  const bad = new Set(plant.companionsBad ?? []);
  const seen = new Set<string>();
  const hints: CompanionHint[] = [];

  for (const key of neighbourKeys) {
    if (!key || key === plant.key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    const neighbour = findPlant(key);
    if (!neighbour) {
      continue;
    }
    const isBad = bad.has(key) || (neighbour.companionsBad?.includes(plant.key) ?? false);
    const isGood = good.has(key) || (neighbour.companionsGood?.includes(plant.key) ?? false);
    if (isBad) {
      hints.push({ kind: "bad", plant: neighbour });
    } else if (isGood) {
      hints.push({ kind: "good", plant: neighbour });
    }
  }
  return hints;
}
