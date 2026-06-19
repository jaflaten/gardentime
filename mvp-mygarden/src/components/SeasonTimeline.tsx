import { useMemo, useState } from "react";
import { formatDoy } from "../lib/location";
import { getPlantName, usePlantLookup } from "../lib/plants";
import {
  buildSeasonTimeline,
  dateToDoy,
  doyToDate,
  doyToPercent,
  groupTimelineItems,
  monthTicks,
  type TimelineGroup,
  type TimelineItem,
} from "../lib/seasonTimeline";
import { useResolvedLocation } from "../lib/useResolvedLocation";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore } from "../store/useUiStore";
import type { PlantLanguage } from "../store/useUiStore";

const MONTHS_NO = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

// Above this many active plantings the per-planting list gets unwieldy (gartnerens eget oppsett has ~46),
// so we offer a grouped overview and default to it. Small gardens never see the toggle — the
// detailed view they already know stays exactly as-is.
const GROUP_THRESHOLD = 12;

interface BarContext {
  ticks: number[];
  pct: (doy: number) => number;
  todayInRange: boolean;
  todayDoy: number;
}

/**
 * The timeline track itself: month gridlines, the harvest band, one or more sow markers, and the
 * today line. Shared by the detailed rows and the merged grouped rows so both read identically.
 */
function TimelineBar({
  plantedDoys,
  harvestWindow,
  ctx,
}: {
  plantedDoys: number[];
  harvestWindow: [number, number] | null;
  ctx: BarContext;
}) {
  const { ticks, pct, todayInRange, todayDoy } = ctx;
  return (
    <div
      className="relative h-5 rounded"
      style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
    >
      {/* month gridlines */}
      {ticks.slice(1).map((tick) => (
        <span
          key={tick}
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${pct(tick)}%`, backgroundColor: "var(--border)" }}
        />
      ))}
      {/* harvest window */}
      {harvestWindow && harvestWindow[1] > harvestWindow[0] && (
        <span
          className="absolute top-1 bottom-1 rounded"
          title="Forventet høstevindu"
          style={{
            left: `${pct(harvestWindow[0])}%`,
            width: `${pct(harvestWindow[1]) - pct(harvestWindow[0])}%`,
            backgroundColor: "var(--green-light)",
            border: "1px solid var(--green)",
          }}
        />
      )}
      {/* planted marker(s) — omitted for plantings sown in a previous season (perennials) */}
      {plantedDoys.map((doy, index) => (
        <span
          key={`${doy}-${index}`}
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          title="Plantet"
          style={{ left: `${pct(doy)}%`, backgroundColor: "var(--green)" }}
        />
      ))}
      {/* today line */}
      {todayInRange && (
        <span
          className="absolute top-0 bottom-0 w-0.5"
          style={{ left: `${pct(todayDoy)}%`, backgroundColor: "var(--green)" }}
        />
      )}
    </div>
  );
}

// Alternate lanes get a warm parchment panel; the others stay on the white card. Every top-level lane
// is bordered so the white ones still read as a panel. The bar track is a constant warm tone (lighter
// than the stripe, faintly inset on white), so the green harvest band reads identically on every row.
const laneBg = (striped: boolean) => (striped ? "var(--lane-stripe)" : "var(--surface)");

/** A single planting row — the detailed view, also reused inside an expanded group. */
function DetailRow({
  item,
  ctx,
  language,
  boxName,
  striped,
  indent = false,
  paintRow = true,
}: {
  item: TimelineItem;
  ctx: BarContext;
  language: PlantLanguage;
  boxName: (boxId: string | undefined) => string | undefined;
  striped: boolean;
  indent?: boolean;
  paintRow?: boolean;
}) {
  const name = item.plant ? getPlantName(item.plant, language) : item.planting.customName || "Ukjent plante";
  const box = boxName(item.planting.boxId);
  return (
    <li
      className={`space-y-1 rounded-lg px-2 py-1.5 ${indent ? "ml-4" : ""} ${paintRow ? "border" : ""}`}
      style={paintRow ? { backgroundColor: laneBg(striped), borderColor: "var(--lane-border)" } : undefined}
    >
      <p className="truncate text-xs font-medium">
        {item.plant?.emoji ?? "🌱"} {name}
        {item.planting.variety && <span style={{ color: "var(--text-muted)" }}> · {item.planting.variety}</span>}
        {box && <span style={{ color: "var(--text-muted)" }}> · {box}</span>}
        {item.plant?.perennial && <span style={{ color: "var(--text-muted)" }}> · flerårig</span>}
      </p>
      <TimelineBar
        plantedDoys={item.plantedDoy !== null ? [item.plantedDoy] : []}
        harvestWindow={item.harvestWindow}
        ctx={ctx}
      />
      {item.wontRipen && <WontRipenNote warm={item.plant?.gddBase === 10} />}
    </li>
  );
}

/**
 * Honest note shown in place of a harvest band when a crop can't reach maturity outdoors here.
 * Warm crops (base 10) want a cover; a cool long-season crop just runs out of season, so suggesting
 * a greenhouse would be the wrong remedy — it reads "won't finish in time" instead.
 */
function WontRipenNote({ warm }: { warm: boolean }) {
  return (
    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
      {warm ? "🏠 Modnes neppe ute her — krever drivhus eller tunnel" : "🍂 Rekker neppe å modnes ute her i år"}
    </p>
  );
}

/** A merged plant row in the grouped view; expands to its individual {@link DetailRow}s. */
function GroupRow({
  group,
  ctx,
  language,
  boxName,
  open,
  onToggle,
  striped,
}: {
  group: TimelineGroup;
  ctx: BarContext;
  language: PlantLanguage;
  boxName: (boxId: string | undefined) => string | undefined;
  open: boolean;
  onToggle: () => void;
  striped: boolean;
}) {
  const name = group.plant
    ? getPlantName(group.plant, language)
    : group.items[0].planting.customName || "Ukjent plante";
  const boxes = group.boxIds.map(boxName).filter(Boolean).join(", ");
  return (
    <li
      className="space-y-1 rounded-lg border px-2 py-1.5"
      style={{ backgroundColor: laneBg(striped), borderColor: "var(--lane-border)" }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-1 text-left"
      >
        <span aria-hidden="true" className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {open ? "▾" : "▸"}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          {group.plant?.emoji ?? "🌱"} {name}
          <span style={{ color: "var(--text-muted)" }}> ×{group.items.length}</span>
          {group.plant?.perennial && <span style={{ color: "var(--text-muted)" }}> · flerårig</span>}
          {boxes && <span style={{ color: "var(--text-muted)" }}> · {boxes}</span>}
        </span>
      </button>
      <TimelineBar plantedDoys={group.plantedDoys} harvestWindow={group.harvestWindow} ctx={ctx} />
      {group.wontRipen && <WontRipenNote warm={group.plant?.gddBase === 10} />}
      {open && (
        <ul className="space-y-2 pt-2">
          {group.items.map((item) => (
            <DetailRow
              key={item.planting.id}
              item={item}
              ctx={ctx}
              language={language}
              boxName={boxName}
              striped={striped}
              paintRow={false}
              indent
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Sesongoversikt (Increment D) — a horizontal timeline of the user's active plantings across the
 * growing season: when each was planted and its estimated harvest window, anchored to the location's
 * frost dates. Collapsible and off by default to keep the garden map uncluttered. Derives entirely
 * from existing data (plantings + plant rules + frost normals) — no new metadata.
 *
 * With many plantings the flat per-planting list gets long, so above {@link GROUP_THRESHOLD} rows a
 * "Detaljert / Gruppert" toggle appears and defaults to a grouped overview (one row per plant, each
 * expandable back into the detailed rows).
 */
export function SeasonTimeline() {
  const location = useResolvedLocation();
  const plantings = useGardenStore((state) => state.plantings);
  const boxes = useGardenStore((state) => state.boxes);
  const findPlant = usePlantLookup();
  const language = useUiStore((state) => state.plantLanguage);
  const [open, setOpen] = useState(false);
  // null = follow the auto-default (grouped when many); a bool means the user chose explicitly.
  const [groupedChoice, setGroupedChoice] = useState<boolean | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
      { base5: location.stationFrost.gddCurve5, base10: location.stationFrost.gddCurve10 },
      boxes,
    );
  }, [location, plantings, findPlant, year, boxes]);

  const groups = useMemo(() => (timeline ? groupTimelineItems(timeline.items) : []), [timeline]);

  if (!location || !timeline) {
    return null;
  }

  const { range, items, lastFrostDoy, firstFrostDoy } = timeline;
  const ticks = monthTicks(range.startDoy, range.endDoy, year);
  const todayDoy = dateToDoy(new Date());
  const todayInRange = todayDoy >= range.startDoy && todayDoy <= range.endDoy;
  const pct = (doy: number) => doyToPercent(doy, range.startDoy, range.endDoy);
  const boxName = (boxId: string | undefined) => boxes.find((box) => box.id === boxId)?.name;
  const ctx: BarContext = { ticks, pct, todayInRange, todayDoy };

  // Only offer grouping when it actually collapses something (many rows AND fewer groups than rows).
  const canGroup = items.length > GROUP_THRESHOLD && groups.length < items.length;
  const grouped = canGroup && (groupedChoice ?? true);

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

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
        <h2 className="text-lg font-semibold sm:text-xl">📅 Sesongoversikt</h2>
        <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Siste vårfrost ca. <strong>{formatDoy(lastFrostDoy, year)}</strong> · første høstfrost ca.{" "}
              <strong>{formatDoy(firstFrostDoy, year)}</strong>
            </p>
            {canGroup && (
              <div
                role="group"
                aria-label="Visning"
                className="flex shrink-0 overflow-hidden rounded-lg border text-xs"
                style={{ borderColor: "var(--border)" }}
              >
                {([
                  ["Detaljert", false],
                  ["Gruppert", true],
                ] as const).map(([label, value]) => {
                  const selected = grouped === value;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setGroupedChoice(value)}
                      aria-pressed={selected}
                      className="px-2.5 py-1 font-medium"
                      style={{
                        backgroundColor: selected ? "var(--green)" : "transparent",
                        color: selected ? "white" : "var(--text-muted)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Ingen aktive planter ennå. Når du planter noe, viser vi sesongen og forventet høst her.
            </p>
          ) : (
            <>
              {/* Month axis */}
              <div className="relative h-4">
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className="absolute text-[10px] uppercase"
                    style={{ left: `${pct(tick)}%`, color: "var(--text-muted)" }}
                  >
                    {MONTHS_NO[doyToDate(tick, year).getMonth()]}
                  </span>
                ))}
                {todayInRange && (
                  <span
                    className="absolute text-[10px] font-semibold"
                    style={{ left: `${pct(todayDoy)}%`, transform: "translateX(-50%)", color: "var(--green)" }}
                  >
                    i dag
                  </span>
                )}
              </div>

              {/* Rows */}
              <ul className="space-y-2">
                {grouped
                  ? groups.map((group, index) =>
                      group.items.length === 1 ? (
                        <DetailRow
                          key={group.key}
                          item={group.items[0]}
                          ctx={ctx}
                          language={language}
                          boxName={boxName}
                          striped={index % 2 === 1}
                        />
                      ) : (
                        <GroupRow
                          key={group.key}
                          group={group}
                          ctx={ctx}
                          language={language}
                          boxName={boxName}
                          open={expandedGroups.has(group.key)}
                          onToggle={() => toggleGroup(group.key)}
                          striped={index % 2 === 1}
                        />
                      ),
                    )
                  : items.map((item, index) => (
                      <DetailRow
                        key={item.planting.id}
                        item={item}
                        ctx={ctx}
                        language={language}
                        boxName={boxName}
                        striped={index % 2 === 1}
                      />
                    ))}
              </ul>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--green)" }} />
                  Plantet
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-2.5 w-4 rounded"
                    style={{ backgroundColor: "var(--green-light)", border: "1px solid var(--green)" }}
                  />
                  Forventet høst
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-0.5" style={{ backgroundColor: "var(--green)" }} />I dag
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
