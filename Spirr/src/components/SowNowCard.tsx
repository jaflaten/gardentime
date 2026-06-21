import { useMemo, useState } from "react";
import { now } from "../lib/clock";
import { getPlantName, useMergedPlantList } from "../lib/plants";
import { groupHarvestSoon, groupSowNow, groupSuccession, type SowNowRow } from "../lib/sowNowGroups";
import { todayDoy } from "../lib/sowWindow";
import { useResolvedLocation } from "../lib/useResolvedLocation";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore, type PlantLanguage } from "../store/useUiStore";

const SESSION_DISMISS_KEY = "gt_sownow_dismissed_at";

interface Grouped {
  indoor: SowNowRow[];
  outdoor: SowNowRow[];
  transplant: SowNowRow[];
  succession: SowNowRow[];
  harvestSoon: SowNowRow[];
}

interface SowNowCardProps {
  /** Called when the user taps "+ Legg til" on a row — wires to GardenMap's sow-mode flow. */
  onPickPlant?: (plantKey: string) => void;
  /** Called from the "Så inne" group instead of onPickPlant — starts an indoor seedling (Increment K). */
  onStartIndoor?: (plantKey: string) => void;
}

function dismissedThisSession(): boolean {
  return Boolean(sessionStorage.getItem(SESSION_DISMISS_KEY));
}

export function SowNowCard({ onPickPlant, onStartIndoor }: SowNowCardProps) {
  const location = useResolvedLocation();
  const plants = useMergedPlantList();
  const plantings = useGardenStore((state) => state.plantings);
  const boxes = useGardenStore((state) => state.boxes);
  const language = useUiStore((state) => state.plantLanguage);
  const [dismissed, setDismissed] = useState(() => dismissedThisSession());

  const grouped = useMemo<Grouped>(() => {
    if (!location) {
      return { indoor: [], outdoor: [], transplant: [], succession: [], harvestSoon: [] };
    }
    const today = now();
    const doy = todayDoy();
    const sow = groupSowNow(plants, location.lastFrostDoy, doy);
    return {
      ...sow,
      succession: groupSuccession(plantings, plants, location.lastFrostDoy, doy, today),
      harvestSoon: groupHarvestSoon(plantings, plants, boxes, location, doy, today),
    };
  }, [location, plants, plantings, boxes]);

  if (!location || dismissed) {
    return null;
  }

  const total =
    grouped.indoor.length +
    grouped.outdoor.length +
    grouped.transplant.length +
    grouped.succession.length +
    grouped.harvestSoon.length;
  if (total === 0) {
    return null;
  }

  const dismiss = () => {
    sessionStorage.setItem(SESSION_DISMISS_KEY, new Date().toISOString());
    setDismissed(true);
  };

  return (
    <section
      className="space-y-3 rounded-xl border p-3 sm:p-4"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold sm:text-xl">🌱 Hva passer å så nå?</h2>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Skjul"
          className="tap-target rounded-full px-3 text-lg"
          style={{ color: "var(--text-muted)" }}
        >
          ✕
        </button>
      </div>

      <SowGroup
        title="Så inne"
        rows={grouped.indoor}
        language={language}
        onPickPlant={onStartIndoor ?? onPickPlant}
        actionLabel={onStartIndoor ? "+ Start inne" : undefined}
      />
      <SowGroup title="Så ute" rows={grouped.outdoor} language={language} onPickPlant={onPickPlant} />
      <SowGroup title="Plant ut" rows={grouped.transplant} language={language} onPickPlant={onPickPlant} />
      <SowGroup title="Suksesjon" rows={grouped.succession} language={language} onPickPlant={onPickPlant} />
      <SowGroup title="Høst snart" rows={grouped.harvestSoon} language={language} onPickPlant={onPickPlant} />
    </section>
  );
}

interface SowGroupProps {
  title: string;
  rows: SowNowRow[];
  language: PlantLanguage;
  onPickPlant?: (plantKey: string) => void;
  /** Override the per-row button label (defaults to "+ Legg til"). */
  actionLabel?: string;
}

function SowGroup({ title, rows, language, onPickPlant, actionLabel }: SowGroupProps) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {title}
      </h3>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li
            key={`${title}-${row.plant.key}-${row.plantingId ?? ""}`}
            className="flex items-center justify-between gap-2 rounded-lg border p-2"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.plant.emoji} {getPlantName(row.plant, language)}
                {row.count != null && row.count > 1 && (
                  <span style={{ color: "var(--text-muted)" }}> ×{row.count}</span>
                )}
              </p>
              <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                {row.helper}
              </p>
              {row.note && (
                <p className="text-xs" style={{ color: "var(--amber)" }}>
                  ☔ {row.note}
                </p>
              )}
            </div>
            {onPickPlant && (
              <button
                type="button"
                onClick={() => onPickPlant(row.plant.key)}
                className="rounded-lg border px-2 py-1 text-xs font-medium"
                style={{ borderColor: "var(--green)", color: "var(--green)", backgroundColor: "var(--surface)" }}
              >
                {actionLabel ?? "+ Legg til"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
