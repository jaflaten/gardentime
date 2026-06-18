import { useMemo, useState } from "react";
import { getPlantName, useMergedPlantList } from "../lib/plants";
import { mmddToDoy } from "../lib/seasonTimeline";
import { isSowableNow, todayDoy, weeksFromLastFrost, withinAfterLFWindow, withinIndoorWindow } from "../lib/sowWindow";
import { useResolvedLocation } from "../lib/useResolvedLocation";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore, type PlantLanguage } from "../store/useUiStore";
import type { HarvestRule, PlantInfo, Planting } from "../types";

const SESSION_DISMISS_KEY = "gt_sownow_dismissed_at";

interface GroupedRow {
  plant: PlantInfo;
  helper: string;
  /** Optional planting id for "Høst snart" rows so they can later link to the right history entry. */
  plantingId?: string;
  /** How many active plantings this row represents (>1 shows a "×N" badge). Used by "Høst snart". */
  count?: number;
}

interface Grouped {
  indoor: GroupedRow[];
  outdoor: GroupedRow[];
  transplant: GroupedRow[];
  succession: GroupedRow[];
  harvestSoon: GroupedRow[];
}

interface SowNowCardProps {
  /** Called when the user taps "+ Legg til" on a row — wires to GardenMap's sow-mode flow. */
  onPickPlant?: (plantKey: string) => void;
}

function harvestSoonForPlanting(
  planting: Planting,
  rule: HarvestRule | undefined,
  todayDoy: number,
  firstFrostDoy: number,
): { matches: boolean; helper: string } {
  if (!rule) {
    return { matches: false, helper: "" };
  }
  if ("seasonal" in rule) {
    // Absolute calendar window (perennials) — matches whenever today falls within it, any year.
    const year = new Date().getFullYear();
    const start = mmddToDoy(rule.seasonal[0], year);
    const end = mmddToDoy(rule.seasonal[1], year);
    if (todayDoy >= start && todayDoy <= end) {
      return { matches: true, helper: "Høstesesong nå" };
    }
    return { matches: false, helper: "" };
  }
  if ("weeksBeforeFirstFrost" in rule) {
    const weeksUntilFrost = (firstFrostDoy - todayDoy) / 7;
    if (weeksUntilFrost >= 0 && weeksUntilFrost <= rule.weeksBeforeFirstFrost + 2) {
      return { matches: true, helper: `Frost om ca. ${Math.max(0, Math.round(weeksUntilFrost))} uker` };
    }
    return { matches: false, helper: "" };
  }
  // weeksFromSowing — match if today is within window from plantedDate
  const sown = new Date(`${planting.plantedDate}T00:00:00`);
  const today = new Date();
  const weeksSinceSowing = Math.floor((today.getTime() - sown.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const [minWeeks, maxWeeks] = rule.weeksFromSowing;
  if (weeksSinceSowing >= minWeeks - 1 && weeksSinceSowing <= maxWeeks + 1) {
    return { matches: true, helper: `Sådd for ${weeksSinceSowing} uker siden` };
  }
  return { matches: false, helper: "" };
}

function dismissedThisSession(): boolean {
  return Boolean(sessionStorage.getItem(SESSION_DISMISS_KEY));
}

/** Whole weeks between a planting's sow date and now. Module-scoped so the hook body stays pure. */
function weeksSinceSowing(plantedDate: string): number {
  const sown = new Date(`${plantedDate}T00:00:00`);
  return Math.floor((new Date().getTime() - sown.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function SowNowCard({ onPickPlant }: SowNowCardProps) {
  const location = useResolvedLocation();
  const plants = useMergedPlantList();
  const plantings = useGardenStore((state) => state.plantings);
  const language = useUiStore((state) => state.plantLanguage);
  const [dismissed, setDismissed] = useState(() => dismissedThisSession());

  const grouped = useMemo<Grouped>(() => {
    if (!location) {
      return { indoor: [], outdoor: [], transplant: [], succession: [], harvestSoon: [] };
    }
    const doy = todayDoy();
    const wks = weeksFromLastFrost(doy, location.lastFrostDoy);

    const indoor: GroupedRow[] = [];
    const outdoor: GroupedRow[] = [];
    const transplant: GroupedRow[] = [];

    for (const plant of plants) {
      if (!plant.sowRules) continue;
      for (const rule of plant.sowRules) {
        if (rule.type === "indoor" && withinIndoorWindow(rule, wks)) {
          indoor.push({ plant, helper: `${rule.weeksBeforeLastFrost[0]}–${rule.weeksBeforeLastFrost[1]} uker før vårfrost` });
          break;
        }
        if (rule.type === "outdoor" && withinAfterLFWindow(rule.weeksAfterLastFrost, wks)) {
          const soilNote = rule.minSoilTempC != null ? ` (jord ≥${rule.minSoilTempC}°C)` : "";
          outdoor.push({
            plant,
            helper: `${rule.weeksAfterLastFrost[0]}–${rule.weeksAfterLastFrost[1]} uker etter vårfrost${soilNote}`,
          });
          break;
        }
        if (rule.type === "transplant" && withinAfterLFWindow(rule.weeksAfterLastFrost, wks)) {
          transplant.push({
            plant,
            helper: `${rule.weeksAfterLastFrost[0]}–${rule.weeksAfterLastFrost[1]} uker etter vårfrost`,
          });
          break;
        }
      }
    }

    // "Suksesjon" — crops that reward staggered sowing (salat, reddik). Once the most recent
    // active batch of such a crop is at least its successionWeeks old, nudge a fresh sowing.
    // Keyed on the latest batch so sowing a new portion clears the nudge for another interval,
    // and gated on the crop still being sowable today so we don't suggest re-sowing out of season.
    const succession: GroupedRow[] = [];
    const latestActiveByKey = new Map<string, Planting>();
    for (const planting of plantings) {
      if (planting.status !== "active" || !planting.plantKey) continue;
      const prev = latestActiveByKey.get(planting.plantKey);
      if (!prev || planting.plantedDate > prev.plantedDate) {
        latestActiveByKey.set(planting.plantKey, planting);
      }
    }
    for (const [key, planting] of latestActiveByKey) {
      const plant = plants.find((p) => p.key === key);
      if (!plant?.successionWeeks || !isSowableNow(plant, location.lastFrostDoy, doy)) continue;
      const weeksSince = weeksSinceSowing(planting.plantedDate);
      if (weeksSince >= plant.successionWeeks) {
        succession.push({
          plant,
          helper: `Sist sådd for ${weeksSince} uker siden — så en ny pott for jevn høst`,
          plantingId: planting.id,
        });
      }
    }

    // "Høst snart" — active plantings whose harvestRule matches today, collapsed to one row per
    // plant with a count so a garden with ten jordbær beds shows "Jordbær ×10", not ten lines.
    const harvestSoon: GroupedRow[] = [];
    const harvestByKey = new Map<string, GroupedRow>();
    for (const planting of plantings) {
      if (planting.status !== "active") continue;
      const plant = plants.find((p) => p.key === planting.plantKey);
      if (!plant?.harvestRule) continue;
      const check = harvestSoonForPlanting(planting, plant.harvestRule, doy, location.firstFrostDoy);
      if (!check.matches) continue;
      const existing = harvestByKey.get(plant.key);
      if (existing) {
        existing.count = (existing.count ?? 1) + 1;
      } else {
        const row: GroupedRow = { plant, helper: check.helper, plantingId: planting.id, count: 1 };
        harvestByKey.set(plant.key, row);
        harvestSoon.push(row);
      }
    }

    return { indoor, outdoor, transplant, succession, harvestSoon };
  }, [location, plants, plantings]);

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

      <SowGroup title="Så inne" rows={grouped.indoor} language={language} onPickPlant={onPickPlant} />
      <SowGroup title="Så ute" rows={grouped.outdoor} language={language} onPickPlant={onPickPlant} />
      <SowGroup title="Plant ut" rows={grouped.transplant} language={language} onPickPlant={onPickPlant} />
      <SowGroup title="Suksesjon" rows={grouped.succession} language={language} onPickPlant={onPickPlant} />
      <SowGroup title="Høst snart" rows={grouped.harvestSoon} language={language} onPickPlant={onPickPlant} />
    </section>
  );
}

interface SowGroupProps {
  title: string;
  rows: GroupedRow[];
  language: PlantLanguage;
  onPickPlant?: (plantKey: string) => void;
}

function SowGroup({ title, rows, language, onPickPlant }: SowGroupProps) {
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
            </div>
            {onPickPlant && (
              <button
                type="button"
                onClick={() => onPickPlant(row.plant.key)}
                className="rounded-lg border px-2 py-1 text-xs font-medium"
                style={{ borderColor: "var(--green)", color: "var(--green)", backgroundColor: "var(--surface)" }}
              >
                + Legg til
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
