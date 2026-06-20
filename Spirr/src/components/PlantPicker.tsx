import { useMemo, useState } from "react";
import { getPlantName, useMergedPlantList, usePlantLookup } from "../lib/plants";
import { useCustomPlantsStore } from "../store/useCustomPlantsStore";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore } from "../store/useUiStore";
import type { PlantInfo } from "../types";
import { CustomPlantForm } from "./CustomPlantForm";

interface PlantPickerProps {
  plantKey: string;
  customName: string;
  onPlantKeyChange: (plantKey: string) => void;
  onCustomNameChange: (customName: string) => void;
}

const RECENT_LIMIT = 5;

export function PlantPicker({ plantKey, customName, onPlantKeyChange, onCustomNameChange }: PlantPickerProps) {
  const [query, setQuery] = useState("");
  const [showNewPlantForm, setShowNewPlantForm] = useState(false);
  const plantLanguage = useUiStore((state) => state.plantLanguage);
  const plantings = useGardenStore((state) => state.plantings);
  const mergedPlants = useMergedPlantList();
  const findPlant = usePlantLookup();
  const addCustomPlant = useCustomPlantsStore((state) => state.addPlant);

  const recentPlants = useMemo<PlantInfo[]>(() => {
    const seen = new Set<string>();
    const ordered: PlantInfo[] = [];
    [...plantings]
      .sort((a, b) => b.plantedDate.localeCompare(a.plantedDate))
      .forEach((planting) => {
        if (!planting.plantKey || seen.has(planting.plantKey)) {
          return;
        }
        const plant = findPlant(planting.plantKey);
        if (!plant) {
          return;
        }
        seen.add(planting.plantKey);
        ordered.push(plant);
      });
    return ordered.slice(0, RECENT_LIMIT);
  }, [findPlant, plantings]);

  const filtered = useMemo(() => {
    const lowered = query.toLowerCase();
    return mergedPlants
      .filter(
        (plant) =>
          plant.name_pl.toLowerCase().includes(lowered) ||
          plant.name_no.toLowerCase().includes(lowered) ||
          plant.name_en.toLowerCase().includes(lowered),
      )
      .slice(0, 8);
  }, [query, mergedPlants]);

  const renderPlantButton = (plant: PlantInfo) => {
    const selected = plantKey === plant.key;
    return (
      <button
        key={plant.key}
        type="button"
        onClick={() => {
          onPlantKeyChange(plant.key);
          onCustomNameChange("");
          setQuery("");
        }}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
        style={{
          backgroundColor: selected ? "var(--green-light)" : "var(--surface)",
          color: "var(--text)",
        }}
      >
        <span>
          {plant.emoji} {getPlantName(plant, plantLanguage)}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {plant.name_en !== plant.name_no ? plant.name_en : ""}
        </span>
      </button>
    );
  };

  const showRecent = query.trim().length === 0 && recentPlants.length > 0;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Velg plante</label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Søk etter plante..."
          className="input-touch w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        />
      </div>

      {showRecent && (
        <div className="rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <p
            className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
          >
            Nylig brukt
          </p>
          {recentPlants.map(renderPlantButton)}
        </div>
      )}

      <div className="max-h-52 overflow-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
        {filtered.map(renderPlantButton)}
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Ingen treff.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Eller skriv eget plantenavn</label>
        <input
          value={customName}
          onChange={(event) => {
            onCustomNameChange(event.target.value);
            if (event.target.value.trim()) {
              onPlantKeyChange("");
            }
          }}
          placeholder="F.eks. Ringblomst"
          className="input-touch w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        />
      </div>

      {!showNewPlantForm ? (
        <button
          type="button"
          onClick={() => setShowNewPlantForm(true)}
          className="tap-target w-full rounded-lg border px-3 py-2 text-sm font-medium"
          style={{ borderColor: "var(--green)", color: "var(--green)", backgroundColor: "var(--surface)" }}
        >
          + Lagre som ny plante
        </button>
      ) : (
        <CustomPlantForm
          initial={{ name_no: customName.trim() || query.trim() || undefined }}
          submitLabel="Legg til i plantelisten"
          onSubmit={(input) => {
            const created = addCustomPlant(input);
            onPlantKeyChange(created.key);
            onCustomNameChange("");
            setQuery("");
            setShowNewPlantForm(false);
          }}
          onCancel={() => setShowNewPlantForm(false)}
        />
      )}
    </div>
  );
}
