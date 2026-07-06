import { useMemo, useState } from "react";
import { now } from "../lib/clock";
import { getPlantName, useMergedPlantList } from "../lib/plants";
import { dueSowActions, isStartedThisYear, nextActionForPlant, SOW_ACTION_LABEL, type NextSowAction } from "../lib/sowPlan";
import { dismissReminders, loadDismissedReminders } from "../lib/sowPlanStorage";
import { todayDoy } from "../lib/sowWindow";
import { useResolvedLocation } from "../lib/useResolvedLocation";
import { useGardenStore } from "../store/useGardenStore";
import { useSowPlanStore } from "../store/useSowPlanStore";
import { useUiStore, type PlantLanguage } from "../store/useUiStore";
import type { PlantInfo } from "../types";

interface SowPlanCardProps {
  /** "+ Legg til" on an open ute/plant-ut window — wires to GardenMap's sow-mode flow. */
  onPickPlant?: (plantKey: string) => void;
  /** "Start inne" on an open indoor window — hands off to the Forkultivering tray (Increment K). */
  onStartIndoor?: (plantKey: string) => void;
}

interface PlanRow {
  plantKey: string;
  plant?: PlantInfo;
  next: NextSowAction | null;
  started: boolean;
}

/** Sort: open windows first (most urgent end first), then upcoming (soonest start), then the rest. */
function rowRank(row: PlanRow): number {
  if (row.started) return 3;
  if (row.next?.state === "now") return 0;
  if (row.next?.state === "upcoming") return 1;
  return 2;
}

export function SowPlanCard({ onPickPlant, onStartIndoor }: SowPlanCardProps) {
  const location = useResolvedLocation();
  const plants = useMergedPlantList();
  const plantings = useGardenStore((state) => state.plantings);
  const language = useUiStore((state) => state.plantLanguage);
  const entries = useSowPlanStore((state) => state.entries);
  const toggle = useSowPlanStore((state) => state.toggle);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [dismissed, setDismissed] = useState(() => loadDismissedReminders());

  const year = now().getFullYear();
  const doy = todayDoy();
  const yearEntries = useMemo(() => entries.filter((e) => e.year === year), [entries, year]);
  const plannedKeys = useMemo(() => new Set(yearEntries.map((e) => e.plantKey)), [yearEntries]);

  const rows = useMemo<PlanRow[]>(() => {
    const built = yearEntries.map((entry) => {
      const plant = plants.find((p) => p.key === entry.plantKey);
      return {
        plantKey: entry.plantKey,
        plant,
        next: plant && location ? nextActionForPlant(plant, location.lastFrostDoy, doy) : null,
        started: isStartedThisYear(plantings, entry.plantKey, year),
      };
    });
    return built.sort((a, b) => {
      const rank = rowRank(a) - rowRank(b);
      if (rank !== 0) return rank;
      if (a.next && b.next && a.next.state === "now") return a.next.endDoy - b.next.endDoy;
      if (a.next && b.next && a.next.state === "upcoming") return a.next.startDoy - b.next.startDoy;
      return 0;
    });
  }, [yearEntries, plants, plantings, location, doy, year]);

  // The reminder strip (Increment H v1): planned crops whose window opened, minus already-started
  // and already-dismissed ones. Dedupe persists in gt_reminders so a dismissed nudge stays gone
  // for the season, but a *new* window (e.g. plant-ut after så-inne) re-surfaces the crop.
  const due = useMemo(() => {
    if (!location) return [];
    const planned = rows.flatMap((row) => (row.plant ? [row.plant] : []));
    return dueSowActions(planned, plantings, location.lastFrostDoy, doy, year).filter((d) => !dismissed[d.id]);
  }, [rows, plantings, location, doy, year, dismissed]);

  const actOn = (row: PlanRow) => {
    if (!row.next || !row.plant) return;
    setDismissed(dismissReminders([`${year}:${row.next.kind}:${row.plantKey}`]));
    if (row.next.kind === "indoor") {
      onStartIndoor?.(row.plantKey);
    } else {
      onPickPlant?.(row.plantKey);
    }
  };

  const searchLower = search.trim().toLowerCase();
  const pickerPlants = useMemo(() => {
    const matches = searchLower
      ? plants.filter((p) =>
          [p.name_no, p.name_pl, p.name_en].some((name) => name.toLowerCase().includes(searchLower)),
        )
      : plants;
    return [...matches].sort((a, b) => getPlantName(a, language).localeCompare(getPlantName(b, language), "nb"));
  }, [plants, searchLower, language]);

  return (
    <section
      className="space-y-3 rounded-xl border p-3 sm:p-4"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold sm:text-xl">🗓️ Min såplan {year}</h2>
        <button
          type="button"
          onClick={() => setShowPicker((prev) => !prev)}
          className="rounded-lg border px-2 py-1 text-xs font-medium"
          style={{ borderColor: "var(--green)", color: "var(--green)", backgroundColor: "var(--surface)" }}
        >
          {showPicker ? "Ferdig" : "+ Legg til vekster"}
        </button>
      </div>

      {due.length > 0 && (
        <div
          className="flex items-start justify-between gap-2 rounded-lg p-2.5"
          style={{ backgroundColor: "var(--green-light)", color: "var(--green)" }}
        >
          <p className="text-sm font-medium">
            🔔 På tide:{" "}
            {due
              .map((d) => `${getPlantName(d.plant, language)} (${SOW_ACTION_LABEL[d.action.kind].toLowerCase()})`)
              .join(" · ")}
          </p>
          <button
            type="button"
            onClick={() => setDismissed(dismissReminders(due.map((d) => d.id)))}
            aria-label="Skjul påminnelser"
            className="tap-target rounded-full px-2"
          >
            ✕
          </button>
        </div>
      )}

      {showPicker && (
        <div className="space-y-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Søk etter vekst …"
            className="input-touch w-full rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
          />
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {pickerPlants.map((plant) => {
              const planned = plannedKeys.has(plant.key);
              return (
                <li key={plant.key}>
                  <button
                    type="button"
                    onClick={() => toggle(plant.key, year)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border p-2 text-left text-sm"
                    style={{
                      borderColor: planned ? "var(--green)" : "var(--border)",
                      backgroundColor: "var(--bg)",
                    }}
                  >
                    <span>
                      {plant.emoji} {getPlantName(plant, language)}
                    </span>
                    <span style={{ color: planned ? "var(--green)" : "var(--text-muted)" }}>
                      {planned ? "✓ I planen" : "+ Planlegg"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {rows.length === 0 && !showPicker && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Velg vekstene du vil dyrke i år, så minner Spirr deg når det er tid for å så — inne og ute.
        </p>
      )}

      {rows.length > 0 && (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <PlanRowItem
              key={row.plantKey}
              row={row}
              year={year}
              language={language}
              onAct={actOn}
              hasLocation={Boolean(location)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface PlanRowItemProps {
  row: PlanRow;
  year: number;
  language: PlantLanguage;
  onAct: (row: PlanRow) => void;
  hasLocation: boolean;
}

function helperColor(row: PlanRow): string {
  if (row.started) return "var(--green)";
  if (row.next?.state === "now") return "var(--green)";
  return "var(--text-muted)";
}

function PlanRowItem({ row, year, language, onAct, hasLocation }: PlanRowItemProps) {
  const remove = useSowPlanStore((state) => state.remove);
  const name = row.plant ? getPlantName(row.plant, language) : row.plantKey;
  const helper = row.started
    ? "✓ Startet i år"
    : row.next
      ? row.next.helper
      : !row.plant
        ? "Ukjent plante (slettet?)"
        : !hasLocation
          ? "Velg postnummer i innstillinger for å få datoer"
          : "Ingen såregler — planten har ikke såvinduer";
  const actionable = !row.started && row.next?.state === "now" && row.plant;

  return (
    <li
      className="flex items-center justify-between gap-2 rounded-lg border p-2"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {row.plant?.emoji} {name}
        </p>
        <p className="truncate text-xs" style={{ color: helperColor(row) }}>
          {helper}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {actionable && (
          <button
            type="button"
            onClick={() => onAct(row)}
            className="rounded-lg border px-2 py-1 text-xs font-medium"
            style={{ borderColor: "var(--green)", color: "var(--green)", backgroundColor: "var(--surface)" }}
          >
            {row.next?.kind === "indoor" ? "Start inne" : "+ Legg til"}
          </button>
        )}
        <button
          type="button"
          onClick={() => remove(row.plantKey, year)}
          aria-label={`Fjern ${name} fra såplanen`}
          className="tap-target rounded-full px-2 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          ✕
        </button>
      </div>
    </li>
  );
}
