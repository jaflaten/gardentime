import { useMemo, useState } from "react";
import { CATEGORY_LABELS, type PlantCategory } from "../lib/categories";
import { FAMILY_INFO, type PlantFamily } from "../lib/families";
import {
  computeActivityByMonth,
  computeGardenStats,
  computeRotationMatrix,
  type CountEntry,
  type RotationMatrix,
  type StatusKey,
} from "../lib/gardenStats";
import { getPlantName, usePlantLookup } from "../lib/plants";
import { ROTATION_LOOKBACK_YEARS } from "../lib/rotation";
import {
  buildSeasonTimeline,
  dateToDoy,
  doyToDate,
  harvestCountByMonth,
  maturityRows,
  type MaturityRow,
} from "../lib/seasonTimeline";
import { useResolvedLocation } from "../lib/useResolvedLocation";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore, type PlantLanguage } from "../store/useUiStore";
import type { PlantInfo } from "../types";

const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

// Breakdown the composition donut can show. "Art" (species) is the default — it answers the literal
// "how much of my garden is this plant" question; Familie ties into the rotation story; Kategori is
// the coarse veg/herb/fruit/flower split.
type Breakdown = "species" | "family" | "category";

// Earthy, harmonious palette for the slices (greens → ochres → clay), distinct enough to read at a
// glance against the parchment card. The long tail beyond TOP_SLICES collapses into one muted "Annet"
// slice so the donut never fragments into unreadable slivers.
const SLICE_COLORS = ["#3d6b4f", "#6b9b6e", "#a9c47f", "#c47c2b", "#d8a05a", "#8c6f53"];
const REST_COLOR = "#b3a995";
const TOP_SLICES = 6;

interface Slice {
  id: string;
  label: string;
  emoji: string;
  count: number;
  pct: number;
  color: string;
}

const BREAKDOWN_TABS: Array<{ value: Breakdown; label: string }> = [
  { value: "species", label: "Art" },
  { value: "family", label: "Familie" },
  { value: "category", label: "Kategori" },
];

const STATUS_META: Record<StatusKey, { label: string; color: string }> = {
  active: { label: "Vokser", color: "var(--green)" },
  harvested: { label: "Høstet", color: "var(--amber)" },
  failed: { label: "Mislyktes", color: "var(--red)" },
  removed: { label: "Fjernet", color: "var(--text-muted)" },
};

/**
 * 📊 Hagen i tall — an insight panel beneath the garden grid. Turns the plantings the user already
 * recorded into a few at-a-glance reads: what the garden is made of (composition donut), the running
 * season's status, how full the beds are, and — once more than one season is logged — growth over the
 * years. Pure derivation from existing data (see {@link computeGardenStats}); a foundation to build on.
 */
export function GardenInsights() {
  const plantings = useGardenStore((state) => state.plantings);
  const boxes = useGardenStore((state) => state.boxes);
  const findPlant = usePlantLookup();
  const language = useUiStore((state) => state.plantLanguage);
  const [open, setOpen] = useState(true);
  const [breakdown, setBreakdown] = useState<Breakdown>("species");

  const location = useResolvedLocation();

  const stats = useMemo(() => computeGardenStats(plantings, boxes, findPlant), [plantings, boxes, findPlant]);

  const entries = breakdown === "species" ? stats.bySpecies : breakdown === "family" ? stats.byFamily : stats.byCategory;
  const slices = useMemo(
    () => buildSlices(entries, breakdown, findPlant, language),
    [entries, breakdown, findPlant, language],
  );

  const activity = useMemo(() => computeActivityByMonth(plantings), [plantings]);
  const rotation = useMemo(() => computeRotationMatrix(plantings, boxes, findPlant), [plantings, boxes, findPlant]);

  // Harvest-window-derived views (maturity + harvest calendar) reuse the season timeline, so they
  // need a resolved location like Sesongoversikt does — hidden when no postnummer is set.
  const year = new Date().getFullYear();
  const timeline = useMemo(() => {
    if (!location) {
      return null;
    }
    return buildSeasonTimeline(
      plantings,
      findPlant,
      location.lastFrostDoy,
      location.firstFrostDoy,
      year,
      { base5: location.gddCurve5, base10: location.gddCurve10 },
      boxes,
    );
  }, [location, plantings, findPlant, year, boxes]);

  const todayDoy = dateToDoy(new Date());
  const maturity = useMemo(() => (timeline ? maturityRows(timeline, todayDoy) : []), [timeline, todayDoy]);
  const harvestMonths = useMemo(() => (timeline ? harvestCountByMonth(timeline) : null), [timeline]);

  const hasGarden = boxes.length > 0;

  return (
    <section
      className="space-y-3 rounded-xl border p-3 sm:p-4"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2"
      >
        <h2 className="text-lg font-semibold sm:text-xl">📊 Hagen i tall</h2>
        <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open &&
        (!hasGarden ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Legg til kasser og planter, så viser vi nøkkeltall og fordelingen i hagen din her.
          </p>
        ) : (
          <div className="space-y-5">
            <StatChips stats={stats} />

            {stats.totalActive === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Ingen aktive planter akkurat nå. Når du planter noe, viser vi fordelingen her.
              </p>
            ) : (
              <Composition
                breakdown={breakdown}
                onBreakdown={setBreakdown}
                slices={slices}
                total={stats.totalActive}
              />
            )}

            {maturity.length > 0 && <MaturityList rows={maturity} language={language} year={year} />}

            {harvestMonths && harvestMonths.some((n) => n > 0) && <HarvestCalendar counts={harvestMonths} />}

            <SeasonStatus stats={stats} />

            {rotation.rows.length > 0 && rotation.years.length > 1 && <RotationHeatmap matrix={rotation} />}

            {stats.byYear.length > 1 && <YearHistory stats={stats} />}

            {(activity.sow.some((n) => n > 0) || activity.harvest.some((n) => n > 0)) && (
              <ActivityHeatmap activity={activity} />
            )}
          </div>
        ))}
    </section>
  );
}

function buildSlices(
  entries: CountEntry[],
  breakdown: Breakdown,
  findPlant: (key: string) => PlantInfo | undefined,
  language: PlantLanguage,
): Slice[] {
  const total = entries.reduce((sum, e) => sum + e.count, 0);
  if (total === 0) {
    return [];
  }

  // Each breakdown resolves a label + emoji + a *natural/semantic* colour: a crop's own colour
  // (strawberry red, carrot orange) for Art, the family/category colour otherwise. `color` is
  // undefined when unknown, so the caller can fall back to the generic chart palette.
  const resolve = (id: string): { label: string; emoji: string; color?: string } => {
    if (breakdown === "category") {
      const meta = CATEGORY_LABELS[id as PlantCategory];
      return meta
        ? { label: language === "pl" ? meta.name_pl : meta.name_no, emoji: meta.emoji, color: meta.color }
        : { label: "Ukjent", emoji: "🌱" };
    }
    if (breakdown === "family") {
      const meta = FAMILY_INFO[id as PlantFamily];
      return meta
        ? { label: language === "pl" ? meta.name_pl : meta.name_no, emoji: meta.emoji, color: meta.color }
        : { label: "Annet", emoji: "🌱" };
    }
    // species
    if (id.startsWith("custom:")) {
      return { label: id.slice("custom:".length) || "Ukjent", emoji: "🌱" };
    }
    const plant = findPlant(id);
    return plant
      ? { label: getPlantName(plant, language), emoji: plant.emoji, color: plant.color }
      : { label: id, emoji: "🌱" };
  };

  const head = entries.slice(0, TOP_SLICES);
  const tail = entries.slice(TOP_SLICES);

  const slices: Slice[] = head.map((entry, index) => {
    const { label, emoji, color } = resolve(entry.id);
    return {
      id: entry.id,
      label,
      emoji,
      count: entry.count,
      pct: (entry.count / total) * 100,
      color: color ?? SLICE_COLORS[index % SLICE_COLORS.length],
    };
  });

  if (tail.length > 0) {
    const restCount = tail.reduce((sum, e) => sum + e.count, 0);
    slices.push({
      id: "__rest__",
      // "Øvrige", not "Annet" — the latter is a real family/category bucket label, so reusing it
      // for the collapsed long tail would print two identical legend rows.
      label: `Øvrige (${tail.length})`,
      emoji: "•",
      count: restCount,
      pct: (restCount / total) * 100,
      color: REST_COLOR,
    });
  }

  return slices;
}

function StatChips({ stats }: { stats: ReturnType<typeof computeGardenStats> }) {
  const chips = [
    { emoji: "🌱", value: stats.totalPlants, label: stats.totalPlants === 1 ? "plante i jorda" : "planter i jorda" },
    { emoji: "🪴", value: stats.distinctSpecies, label: stats.distinctSpecies === 1 ? "art" : "arter" },
    { emoji: "🧬", value: stats.distinctFamilies, label: stats.distinctFamilies === 1 ? "familie" : "familier" },
    { emoji: "🛏️", value: `${stats.bedsUsed}/${stats.bedsTotal}`, label: "kasser i bruk" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
        >
          <div className="text-lg font-semibold leading-tight">
            <span aria-hidden="true">{chip.emoji}</span> {chip.value}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {chip.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Composition({
  breakdown,
  onBreakdown,
  slices,
  total,
}: {
  breakdown: Breakdown;
  onBreakdown: (value: Breakdown) => void;
  slices: Slice[];
  total: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Hva vokser i hagen</h3>
        <div
          role="group"
          aria-label="Fordeling etter"
          className="flex shrink-0 overflow-hidden rounded-lg border text-xs"
          style={{ borderColor: "var(--border)" }}
        >
          {BREAKDOWN_TABS.map((tab) => {
            const selected = breakdown === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onBreakdown(tab.value)}
                aria-pressed={selected}
                className="px-2.5 py-1 font-medium"
                style={{
                  backgroundColor: selected ? "var(--green)" : "transparent",
                  color: selected ? "white" : "var(--text-muted)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Donut slices={slices} total={total} />
        <ul className="w-full flex-1 space-y-1.5">
          {slices.map((slice) => (
            <li key={slice.id} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate">
                {slice.emoji !== "•" && <span aria-hidden="true">{slice.emoji} </span>}
                {slice.label}
              </span>
              <span className="shrink-0 tabular-nums" style={{ color: "var(--text-muted)" }}>
                {slice.count} · {Math.round(slice.pct)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Donut({ slices, total }: { slices: Slice[]; total: number }) {
  // Slices drawn as arcs on a single circle via stroke-dasharray, starting at 12 o'clock. A lone
  // 100% slice is drawn as a full ring (a 360° dash leaves a seam), so it reads as a solid colour.
  const size = 132;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Precompute each arc's length + start offset functionally (no render-time mutation). A lone 100%
  // slice is drawn as a seamless full ring; otherwise a 1px gap between arcs keeps boundaries crisp.
  const lens = slices.map((slice) => (slice.pct / 100) * circumference);
  const arcs = slices.map((slice, index) => {
    const len = lens[index];
    const offset = lens.slice(0, index).reduce((sum, l) => sum + l, 0);
    const dash =
      slices.length === 1
        ? `${circumference} 0`
        : `${Math.max(len - 1, 0)} ${circumference - Math.max(len - 1, 0)}`;
    return { slice, dash, offset };
  });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Fordeling av planter">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg)" strokeWidth={stroke} />
          {arcs.map(({ slice, dash, offset }) => (
            <circle
              key={slice.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold leading-none">{total}</span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {total === 1 ? "planting" : "plantinger"}
        </span>
      </div>
    </div>
  );
}

function SeasonStatus({ stats }: { stats: ReturnType<typeof computeGardenStats> }) {
  const order: StatusKey[] = ["active", "harvested", "failed", "removed"];
  const present = order.filter((key) => stats.statusThisYear[key] > 0);
  const total = present.reduce((sum, key) => sum + stats.statusThisYear[key], 0);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Sesong {stats.currentYear}</h3>
      {total === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Ingen plantinger registrert i år ennå.
        </p>
      ) : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg)" }}>
            {present.map((key) => (
              <span
                key={key}
                style={{ width: `${(stats.statusThisYear[key] / total) * 100}%`, backgroundColor: STATUS_META[key].color }}
                title={`${STATUS_META[key].label}: ${stats.statusThisYear[key]}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {present.map((key) => (
              <span key={key} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STATUS_META[key].color }} />
                {STATUS_META[key].label} {stats.statusThisYear[key]}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function YearHistory({ stats }: { stats: ReturnType<typeof computeGardenStats> }) {
  const max = Math.max(...stats.byYear.map((y) => y.count), 1);
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Plantinger per år</h3>
      <div className="flex items-end gap-2" style={{ height: 96 }}>
        {stats.byYear.map((entry) => {
          const isCurrent = entry.year === stats.currentYear;
          return (
            <div key={entry.year} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-medium tabular-nums">{entry.count}</span>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${(entry.count / max) * 68}px`,
                  backgroundColor: isCurrent ? "var(--green)" : "var(--green-light)",
                  border: "1px solid var(--green)",
                }}
                title={`${entry.year}: ${entry.count} plantinger`}
              />
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {entry.year}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MATURITY_LIMIT = 6;

/** One species' merged maturity row: the soonest member drives the timing, count shows how many. */
interface MaturityGroup {
  key: string;
  rep: MaturityRow;
  count: number;
}

/** Collapse maturity rows to one per plant (like the grouped timeline), soonest-to-harvest first. */
function groupMaturity(rows: MaturityRow[]): MaturityGroup[] {
  const groups = new Map<string, MaturityGroup>();
  for (const row of rows) {
    const key = row.item.planting.plantKey || `custom:${row.item.planting.customName ?? "?"}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { key, rep: row, count: 1 });
    } else {
      existing.count += 1;
      // The soonest member represents the group's timing/progress.
      if (row.daysToHarvest < existing.rep.daysToHarvest) {
        existing.rep = row;
      }
    }
  }
  return [...groups.values()].sort((a, b) => a.rep.daysToHarvest - b.rep.daysToHarvest);
}

/** "Neste til høst" — per-crop growth bars + days-to-harvest, grouped by plant, soonest first. */
function MaturityList({ rows, language, year }: { rows: MaturityRow[]; language: PlantLanguage; year: number }) {
  const groups = groupMaturity(rows);
  const shown = groups.slice(0, MATURITY_LIMIT);
  const dayLabel = (row: MaturityRow): string => {
    if (row.ready || row.daysToHarvest <= 0) {
      return "Klar nå";
    }
    if (row.daysToHarvest <= 14) {
      return `~${row.daysToHarvest} dager`;
    }
    // Beyond a fortnight, an approximate calendar date reads better than a big day count.
    return `~${formatMonthDay(row.item.harvestWindow![0], year)}`;
  };
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Neste til høsting</h3>
      <ul className="space-y-2">
        {shown.map(({ key, rep, count }) => {
          const plant = rep.item.plant;
          const name = plant ? getPlantName(plant, language) : rep.item.planting.customName || "Ukjent plante";
          const fill = plant?.color ?? "var(--green)";
          return (
            <li key={key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {plant?.emoji ?? "🌱"} {name}
                  {count > 1 ? (
                    <span style={{ color: "var(--text-muted)" }}> ×{count}</span>
                  ) : (
                    rep.item.planting.variety && (
                      <span style={{ color: "var(--text-muted)" }}> · {rep.item.planting.variety}</span>
                    )
                  )}
                </span>
                <span
                  className="shrink-0 font-medium"
                  style={{ color: rep.ready || rep.daysToHarvest <= 0 ? "var(--green)" : "var(--text-muted)" }}
                >
                  {dayLabel(rep)}
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg)" }}>
                {rep.progress !== null ? (
                  // Measurable growth: solid fill in the crop's colour.
                  <span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${rep.progress}%`, backgroundColor: fill }}
                  />
                ) : (
                  // Perennial / prior-season: no sow anchor to measure growth from, so show a striped
                  // "seasonal" track rather than a misleading 0%-filled bar; the date label carries the timing.
                  <span
                    className="absolute inset-0"
                    title="Flerårig – sesongbasert høst"
                    style={{ backgroundImage: `repeating-linear-gradient(45deg, ${fill} 0 5px, transparent 5px 11px)`, opacity: 0.55 }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {groups.length > shown.length && (
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          + {groups.length - shown.length} flere arter på vei
        </p>
      )}
    </div>
  );
}

/** "Høstekalender" — vertical bars of how many crops mature each month (trimmed to the active range). */
function HarvestCalendar({ counts }: { counts: number[] }) {
  const first = counts.findIndex((n) => n > 0);
  const last = counts.length - 1 - [...counts].reverse().findIndex((n) => n > 0);
  const months = [];
  for (let m = first; m <= last; m += 1) {
    months.push(m);
  }
  const max = Math.max(...counts, 1);
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Høstekalender</h3>
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Antall plantinger som er klare til høst hver måned (estimert).
      </p>
      <div className="flex items-end gap-1.5" style={{ height: 92 }}>
        {months.map((m) => {
          const isPeak = counts[m] === max;
          return (
            <div key={m} className="flex flex-1 flex-col items-center justify-end gap-1">
              {counts[m] > 0 && <span className="text-[11px] font-medium tabular-nums">{counts[m]}</span>}
              <div
                className="w-full rounded-t"
                style={{
                  height: `${(counts[m] / max) * 64}px`,
                  minHeight: counts[m] > 0 ? 4 : 0,
                  backgroundColor: isPeak ? "var(--green)" : "var(--green-light)",
                  border: counts[m] > 0 ? "1px solid var(--green)" : "none",
                }}
                title={`${MONTHS_SHORT[m]}: ${counts[m]} plantinger`}
              />
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {MONTHS_SHORT[m]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** "Vekstskifte" — boxes × years heatmap, family-coloured cells, ⚠ where a rotated family repeats. */
function RotationHeatmap({ matrix }: { matrix: RotationMatrix }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Vekstskifte</h3>
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Plantefamilie per kasse per år. <span style={{ color: "var(--red)" }}>⚠</span> = samme familie igjen
        innen {ROTATION_LOOKBACK_YEARS} år (vekstskifte anbefales).
      </p>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header */}
          <div className="flex items-center gap-1.5">
            <div className="w-24 shrink-0" />
            {matrix.years.map((y) => (
              <div key={y} className="w-10 shrink-0 text-center text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                {y}
              </div>
            ))}
          </div>
          {/* Rows */}
          <div className="mt-1 max-h-72 space-y-1 overflow-y-auto">
            {matrix.rows.map((row) => (
              <div key={row.boxId} className="flex items-center gap-1.5">
                <div className="w-24 shrink-0 truncate text-xs" title={row.boxName}>
                  {row.boxName}
                </div>
                {row.cells.map((cell) => (
                  <div
                    key={cell.year}
                    className="relative flex h-9 w-10 shrink-0 items-center justify-center rounded text-sm"
                    style={{
                      backgroundColor: cell.family ? cell.color : "var(--bg)",
                      border: cell.conflict ? "2px solid var(--red)" : "1px solid var(--border)",
                      opacity: cell.family ? 1 : 0.5,
                    }}
                    title={
                      cell.family
                        ? `${row.boxName} · ${cell.year} · ${FAMILY_INFO[cell.family].name_no}${cell.conflict ? " ⚠ vekstskifte" : ""}`
                        : `${row.boxName} · ${cell.year} · ingen planting`
                    }
                  >
                    {cell.emoji && <span aria-hidden="true">{cell.emoji}</span>}
                    {cell.conflict && (
                      <span className="absolute -right-1 -top-1.5 text-[10px]" aria-hidden="true">
                        ⚠
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** "Hageaktivitet" — month-of-year heatmap of sow vs. harvest activity (all seasons combined). */
function ActivityHeatmap({ activity }: { activity: ReturnType<typeof computeActivityByMonth> }) {
  const rowDefs: Array<{ label: string; data: number[] }> = [
    { label: "Sådd", data: activity.sow },
    { label: "Høstet", data: activity.harvest },
  ];
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Hageaktivitet</h3>
      <div className="space-y-1">
        {rowDefs.map((r) => (
          <div key={r.label} className="flex items-center gap-1.5">
            <div className="w-12 shrink-0 text-[11px]" style={{ color: "var(--text-muted)" }}>
              {r.label}
            </div>
            {r.data.map((n, m) => (
              <div
                key={m}
                className="flex h-6 flex-1 items-center justify-center rounded text-[10px] font-medium"
                style={{
                  // Green intensity scaled by count; 0 stays a faint track. White text on the deepest cells.
                  backgroundColor: n === 0 ? "var(--bg)" : `rgba(61, 107, 79, ${0.18 + 0.82 * (n / activity.max)})`,
                  color: n / activity.max > 0.55 ? "white" : "var(--text-muted)",
                }}
                title={`${MONTHS_SHORT[m]}: ${n}`}
              >
                {n > 0 ? n : ""}
              </div>
            ))}
          </div>
        ))}
        {/* Month axis */}
        <div className="flex items-center gap-1.5">
          <div className="w-12 shrink-0" />
          {MONTHS_SHORT.map((label) => (
            <div key={label} className="flex-1 text-center text-[9px] uppercase" style={{ color: "var(--text-muted)" }}>
              {label[0]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** "01-23" → "23. jan" style short date for a day-of-year. */
function formatMonthDay(doy: number, year: number): string {
  const date = doyToDate(doy, year);
  return `${date.getDate()}. ${MONTHS_SHORT[date.getMonth()]}`;
}
