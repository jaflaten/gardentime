import { useMemo, useState } from "react";
import { coverGddFactor, gddHarvestWindow } from "../lib/gdd";
import { getPlantName, useMergedPlantList } from "../lib/plants";
import { dateToDoy, mmddToDoy, seasonalShiftForPlant, type GddCurves } from "../lib/seasonTimeline";
import { isSowableNow, todayDoy, weeksFromLastFrost, withinAfterLFWindow, withinIndoorWindow } from "../lib/sowWindow";
import { useResolvedLocation } from "../lib/useResolvedLocation";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore, type PlantLanguage } from "../store/useUiStore";
import type { PlantInfo, Planting } from "../types";

const SESSION_DISMISS_KEY = "gt_sownow_dismissed_at";

interface GroupedRow {
  plant: PlantInfo;
  helper: string;
  /** Optional planting id for "Høst snart" rows so they can later link to the right history entry. */
  plantingId?: string;
  /** How many active plantings this row represents (>1 shows a "×N" badge). Used by "Høst snart". */
  count?: number;
  /** Optional amber caveat shown under the helper (e.g. rain-sensitive → "sett under tak"). */
  note?: string;
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
  /** Called from the "Så inne" group instead of onPickPlant — starts an indoor seedling (Increment K). */
  onStartIndoor?: (plantKey: string) => void;
}

function harvestSoonForPlanting(
  planting: Planting,
  plant: PlantInfo,
  todayDoy: number,
  firstFrostDoy: number,
  seasonalShift: number,
  curves?: GddCurves,
  coverFactor = 1,
): { matches: boolean; helper: string } {
  const rule = plant.harvestRule;
  if (!rule) {
    return { matches: false, helper: "" };
  }
  if ("seasonal" in rule) {
    // Absolute calendar window (perennials) — matches whenever today falls within it, any year.
    // Shifted toward the user's frost dates so a cold garden doesn't show "harvest now" too early.
    const year = new Date().getFullYear();
    const start = mmddToDoy(rule.seasonal[0], year) + seasonalShift;
    const end = mmddToDoy(rule.seasonal[1], year) + seasonalShift;
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
  // weeksFromSowing — prefer the GDD model when the plant is tagged and a station curve is available
  // (location-aware ripening), else the fixed weeks-since-sowing window. GDD anchors on the outdoor
  // start (transplant date if present, else sow date) and only applies to a planting started this year.
  const refYear = new Date().getFullYear();
  const transplantDoy =
    planting.transplantedDate && Number(planting.transplantedDate.slice(0, 4)) === refYear
      ? dateToDoy(new Date(`${planting.transplantedDate}T00:00:00`))
      : null;
  const plantedDoyThisYear =
    Number(planting.plantedDate.slice(0, 4)) === refYear
      ? dateToDoy(new Date(`${planting.plantedDate}T00:00:00`))
      : null;
  const anchorDoy = transplantDoy ?? plantedDoyThisYear;
  const gdd = curves && anchorDoy !== null ? gddHarvestWindow(plant, anchorDoy, curves.base5, curves.base10, coverFactor) : null;
  if (gdd && gdd.ripens && gdd.window) {
    const [start, end] = gdd.window;
    // "Soon" = within ~2 weeks before the predicted first harvest, through the end of the band.
    if (todayDoy >= start - 14 && todayDoy <= end) {
      const helper = todayDoy >= start ? "Moden nå" : `Moden om ca. ${Math.max(1, Math.round((start - todayDoy) / 7))} uker`;
      return { matches: true, helper };
    }
    return { matches: false, helper: "" };
  }
  if (gdd && !gdd.ripens && coverFactor <= 1) {
    // Won't ripen outdoors here — never "harvest soon".
    return { matches: false, helper: "" };
  }
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
            note: plant.rainSensitive ? "Liker ikke regn — sett under tak (drivhus/tunnel)" : undefined,
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
      // Skip indoor seedlings (no boxId) — they're not yet a sown batch in a bed.
      if (planting.status !== "active" || !planting.plantKey || !planting.boxId) continue;
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
      // Indoor seedlings (no boxId) can't be "harvest soon" — they haven't been planted out.
      if (planting.status !== "active" || !planting.boxId) continue;
      const plant = plants.find((p) => p.key === planting.plantKey);
      if (!plant?.harvestRule) continue;
      const shift = seasonalShiftForPlant(plant.key, location.lastFrostDoy);
      const coverFactor = coverGddFactor(boxes.find((b) => b.id === planting.boxId)?.bedType);
      const check = harvestSoonForPlanting(
        planting,
        plant,
        doy,
        location.firstFrostDoy,
        shift,
        { base5: location.stationFrost.gddCurve5, base10: location.stationFrost.gddCurve10 },
        coverFactor,
      );
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
  rows: GroupedRow[];
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
