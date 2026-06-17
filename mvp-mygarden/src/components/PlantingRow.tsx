import { getPlantName, usePlantLookup } from "../lib/plants";
import { useUiStore } from "../store/useUiStore";
import type { Planting } from "../types";
import { FamilyChip } from "./FamilyChip";
import { StatusBadge } from "./StatusBadge";

interface PlantingRowProps {
  planting: Planting;
  onHarvest?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("nb-NO");
}

export function PlantingRow({ planting, onHarvest, onDelete }: PlantingRowProps) {
  const plantLanguage = useUiStore((state) => state.plantLanguage);
  const findPlant = usePlantLookup();
  const plant = findPlant(planting.plantKey);
  const displayName = planting.customName ?? (plant ? getPlantName(plant, plantLanguage) : planting.plantKey);
  const emoji = plant?.emoji ?? "🌱";

  return (
    <li className="space-y-2 rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="font-medium">{displayName}</span>
        {plant && <FamilyChip family={plant.family} />}
      </div>

      {planting.variety && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Sort: {planting.variety}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <span>Plantet: {formatDate(planting.plantedDate)}</span>
        <StatusBadge status={planting.status} />
        {planting.harvestDate && <span>Høstet: {formatDate(planting.harvestDate)}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {planting.status === "active" && onHarvest && (
          <button
            type="button"
            onClick={() => onHarvest(planting.id)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: "var(--amber-light)", color: "var(--amber)" }}
          >
            Høst
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(planting.id)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: "var(--red-light)", color: "var(--red)" }}
          >
            Slett
          </button>
        )}
      </div>
    </li>
  );
}
