import { useMemo, useState } from "react";
import { formatDoy } from "../lib/location";
import { getPlantName, usePlantLookup } from "../lib/plants";
import {
  buildSeasonTimeline,
  dateToDoy,
  doyToDate,
  doyToPercent,
  monthTicks,
} from "../lib/seasonTimeline";
import { useResolvedLocation } from "../lib/useResolvedLocation";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore } from "../store/useUiStore";

const MONTHS_NO = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

/**
 * Sesongoversikt (Increment D) — a horizontal timeline of the user's active plantings across the
 * growing season: when each was planted and its estimated harvest window, anchored to the location's
 * frost dates. Collapsible and off by default to keep the garden map uncluttered. Derives entirely
 * from existing data (plantings + plant rules + frost normals) — no new metadata.
 */
export function SeasonTimeline() {
  const location = useResolvedLocation();
  const plantings = useGardenStore((state) => state.plantings);
  const boxes = useGardenStore((state) => state.boxes);
  const findPlant = usePlantLookup();
  const language = useUiStore((state) => state.plantLanguage);
  const [open, setOpen] = useState(false);

  const year = new Date().getFullYear();
  const timeline = useMemo(() => {
    if (!location) {
      return null;
    }
    return buildSeasonTimeline(plantings, findPlant, location.lastFrostDoy, location.firstFrostDoy, year);
  }, [location, plantings, findPlant, year]);

  if (!location || !timeline) {
    return null;
  }

  const { range, items, lastFrostDoy, firstFrostDoy } = timeline;
  const ticks = monthTicks(range.startDoy, range.endDoy, year);
  const todayDoy = dateToDoy(new Date());
  const todayInRange = todayDoy >= range.startDoy && todayDoy <= range.endDoy;
  const pct = (doy: number) => doyToPercent(doy, range.startDoy, range.endDoy);
  const boxName = (boxId: string) => boxes.find((box) => box.id === boxId)?.name;

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
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Siste vårfrost ca. <strong>{formatDoy(lastFrostDoy, year)}</strong> · første høstfrost ca.{" "}
            <strong>{formatDoy(firstFrostDoy, year)}</strong>
          </p>

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
                {items.map((item) => {
                  const name = item.plant
                    ? getPlantName(item.plant, language)
                    : item.planting.customName || "Ukjent plante";
                  const box = boxName(item.planting.boxId);
                  return (
                    <li key={item.planting.id} className="space-y-1">
                      <p className="truncate text-xs font-medium">
                        {item.plant?.emoji ?? "🌱"} {name}
                        {item.planting.variety && (
                          <span style={{ color: "var(--text-muted)" }}> · {item.planting.variety}</span>
                        )}
                        {box && <span style={{ color: "var(--text-muted)" }}> · {box}</span>}
                        {item.plant?.perennial && (
                          <span style={{ color: "var(--text-muted)" }}> · flerårig</span>
                        )}
                      </p>
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
                        {item.harvestWindow && item.harvestWindow[1] > item.harvestWindow[0] && (
                          <span
                            className="absolute top-1 bottom-1 rounded"
                            title="Forventet høstevindu"
                            style={{
                              left: `${pct(item.harvestWindow[0])}%`,
                              width: `${pct(item.harvestWindow[1]) - pct(item.harvestWindow[0])}%`,
                              backgroundColor: "var(--green-light)",
                              border: "1px solid var(--green)",
                            }}
                          />
                        )}
                        {/* planted marker — omitted for plantings sown in a previous season (perennials) */}
                        {item.plantedDoy !== null && (
                          <span
                            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                            title="Plantet"
                            style={{ left: `${pct(item.plantedDoy)}%`, backgroundColor: "var(--green)" }}
                          />
                        )}
                        {/* today line */}
                        {todayInRange && (
                          <span
                            className="absolute top-0 bottom-0 w-0.5"
                            style={{ left: `${pct(todayDoy)}%`, backgroundColor: "var(--green)" }}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
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
