import { useMemo } from "react";
import { rankBoxesForPlant, type BoxFitTier } from "../lib/boxRanking";
import { getPlantName } from "../lib/plants";
import { useUiStore } from "../store/useUiStore";
import type { Box, Planting, PlantInfo } from "../types";

const SOW_TIER_META: Record<BoxFitTier, { label: string; border: string; background: string }> = {
  good: { label: "Anbefalt", border: "var(--green)", background: "var(--green-light)" },
  ok: { label: "OK", border: "var(--border)", background: "var(--bg)" },
  avoid: { label: "Frarådes", border: "var(--red)", background: "var(--red-light)" },
};

/**
 * Modal that ranks every box by fit for a given plant (Increment B) and lets the user pick one.
 * Shared by the SowNowCard "+ Legg til" flow and the Forkultivering "Plant ut" action (Increment K) —
 * the seedling already knows its plant, so the picker ranks boxes for it.
 */
export function SowBoxPicker({
  boxes,
  plant,
  plantings,
  findPlant,
  onCancel,
  onPick,
  /** Override the heading verb. Defaults to "så" (sow); "Plant ut" passes "plante ut". */
  verb = "så",
  /** Optional soft caution shown above the box list (e.g. frost-tender plant-out before last frost). */
  caution,
}: {
  boxes: Box[];
  plant: PlantInfo | undefined;
  plantings: Planting[];
  findPlant: (key: string) => PlantInfo | undefined;
  onCancel: () => void;
  onPick: (boxId: string) => void;
  verb?: string;
  caution?: string | null;
}) {
  const plantLanguage = useUiStore((state) => state.plantLanguage);

  const groups = useMemo(() => {
    if (!plant) {
      return null;
    }
    const ranked = rankBoxesForPlant(plant, boxes, plantings, findPlant, new Date().getFullYear(), plantLanguage);
    return (["good", "ok", "avoid"] as BoxFitTier[])
      .map((tier) => ({ tier, fits: ranked.filter((fit) => fit.tier === tier) }))
      .filter((group) => group.fits.length > 0);
  }, [plant, boxes, plantings, findPlant, plantLanguage]);

  const plantName = plant ? getPlantName(plant, plantLanguage) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        role="document"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-2xl border shadow-lg sm:rounded-2xl"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <div className="flex items-center justify-between gap-2 border-b p-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold sm:text-lg">
            {plantName ? `Hvor vil du ${verb} ${plantName}?` : "Velg kasse"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Lukk"
            className="tap-target rounded-full px-3 text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>
        {caution && (
          <p
            className="mx-3 mt-3 rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: "var(--amber)", backgroundColor: "var(--amber-light, var(--bg))", color: "var(--amber)" }}
          >
            ⚠️ {caution}
          </p>
        )}
        {boxes.length === 0 ? (
          <p className="p-3 text-sm" style={{ color: "var(--text-muted)" }}>
            Ingen kasser ennå. Lag en kasse først.
          </p>
        ) : (
          <div className="space-y-3 overflow-y-auto p-3">
            {groups?.map((group) => {
              const meta = SOW_TIER_META[group.tier];
              return (
                <div key={group.tier} className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    {meta.label}
                  </p>
                  <ul className="space-y-1.5">
                    {group.fits.map((fit) => (
                      <li key={fit.box.id}>
                        <button
                          type="button"
                          onClick={() => onPick(fit.box.id)}
                          className="tap-target w-full rounded-lg border px-3 py-2 text-left"
                          style={{ borderColor: meta.border, backgroundColor: meta.background, color: "var(--text)" }}
                        >
                          <span className="block text-sm font-medium">{fit.box.name}</span>
                          {fit.reasons.length > 0 && (
                            <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                              {fit.reasons.join(" · ")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
