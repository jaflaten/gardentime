import { useMemo } from "react";
import { now } from "../lib/clock";
import { getPlantName, useMergedPlantList } from "../lib/plants";
import { seasonHarvestPreview, type SeasonHarvestRow } from "../lib/seasonHarvest";
import { todayDoy } from "../lib/sowWindow";
import { useResolvedLocation } from "../lib/useResolvedLocation";
import { useUiStore, type PlantLanguage } from "../store/useUiStore";

interface SeasonHarvestCardProps {
  /** Compact = the onboarding preview (tighter, no outer chrome duplication). */
  compact?: boolean;
}

/**
 * "Bær & frukt i sesong der du bor" — a location-only harvest calendar for perennials/berries/fruit.
 * Needs a postnummer, nothing else (no boxes, no logged plantings), so it's the zero-setup value moment
 * and the summer onboarding hook. Hidden when no location is set or nothing is in/near season.
 */
export function SeasonHarvestCard({ compact = false }: SeasonHarvestCardProps) {
  const location = useResolvedLocation();
  const plants = useMergedPlantList();
  const language = useUiStore((state) => state.plantLanguage);

  const preview = useMemo(() => {
    if (!location) {
      return null;
    }
    return seasonHarvestPreview(plants, location.lastFrostDoy, todayDoy(), now().getFullYear());
  }, [location, plants]);

  if (!location || !preview) {
    return null;
  }
  if (preview.ripe.length === 0 && preview.soon.length === 0 && preview.later.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-3 rounded-xl border p-3 sm:p-4"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div>
        <h2 className="text-lg font-semibold sm:text-xl">🫐 Bær &amp; frukt i sesong</h2>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Flerårige vekster nær {location.postnummer.kommune} — beregnet for din værstasjon og høyde.
        </p>
      </div>

      <SeasonGroup title="Klart å høste nå" rows={preview.ripe} language={language} tone="ripe" />
      <SeasonGroup title="På vei" rows={preview.soon} language={language} tone="soon" />
      {!compact && <SeasonGroup title="Senere i år" rows={preview.later} language={language} tone="later" />}
    </section>
  );
}

interface SeasonGroupProps {
  title: string;
  rows: SeasonHarvestRow[];
  language: PlantLanguage;
  tone: "ripe" | "soon" | "later";
}

function helperColor(tone: SeasonGroupProps["tone"]): string {
  if (tone === "ripe") return "var(--green)";
  return "var(--text-muted)";
}

function SeasonGroup({ title, rows, language, tone }: SeasonGroupProps) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {title}
      </h3>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.plant.key}
            className="flex items-center justify-between gap-2 rounded-lg border p-2"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
          >
            <p className="min-w-0 truncate text-sm font-medium">
              {row.plant.emoji} {getPlantName(row.plant, language)}
            </p>
            <p className="shrink-0 text-xs" style={{ color: helperColor(tone) }}>
              {row.helper}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
