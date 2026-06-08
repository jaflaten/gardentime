import { useMemo, useState } from "react";
import { getPlantName, plantList } from "../lib/plants";
import { useUiStore } from "../store/useUiStore";

interface PlantPickerProps {
  plantKey: string;
  customName: string;
  onPlantKeyChange: (plantKey: string) => void;
  onCustomNameChange: (customName: string) => void;
}

export function PlantPicker({ plantKey, customName, onPlantKeyChange, onCustomNameChange }: PlantPickerProps) {
  const [query, setQuery] = useState("");
  const plantLanguage = useUiStore((state) => state.plantLanguage);

  const filtered = useMemo(
    () =>
      plantList
        .filter(
          (plant) =>
            plant.name_pl.toLowerCase().includes(query.toLowerCase()) ||
            plant.name_no.toLowerCase().includes(query.toLowerCase()) ||
            plant.name_en.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 8),
    [query],
  );

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

      <div className="max-h-52 overflow-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
        {filtered.map((plant) => {
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
                {plant.name_en}
              </span>
            </button>
          );
        })}
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
    </div>
  );
}
