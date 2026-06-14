import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { PlantFamily } from "../lib/families";
import { findPlant } from "../lib/plants";
import { useGardenStore } from "../store/useGardenStore";
import type { Box } from "../types";
import { FamilyChip } from "./FamilyChip";
import { PlantPicker } from "./PlantPicker";

interface QuickAddSheetProps {
  box: Box | null;
  onClose: () => void;
}

export function QuickAddSheet({ box, onClose }: QuickAddSheetProps) {
  useEffect(() => {
    if (!box) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [box, onClose]);

  if (!box) {
    return null;
  }

  // key={box.id} resets form state when switching boxes without a useEffect.
  return <QuickAddForm key={box.id} box={box} onClose={onClose} />;
}

interface QuickAddFormProps {
  box: Box;
  onClose: () => void;
}

function QuickAddForm({ box, onClose }: QuickAddFormProps) {
  const plantings = useGardenStore((state) => state.plantings);
  const addPlanting = useGardenStore((state) => state.addPlanting);

  const [plantKey, setPlantKey] = useState("");
  const [customName, setCustomName] = useState("");
  const [plantedDate, setPlantedDate] = useState(() => new Date().toISOString().split("T")[0]);

  const previousYear = useMemo(() => new Date(plantedDate).getFullYear() - 1, [plantedDate]);
  const previousSeasonFamilies = useMemo<PlantFamily[]>(() => {
    const families = new Set<PlantFamily>();
    plantings
      .filter((planting) => planting.boxId === box.id && planting.year === previousYear)
      .forEach((planting) => {
        const plant = findPlant(planting.plantKey);
        if (plant) {
          families.add(plant.family);
        }
      });
    return Array.from(families);
  }, [box.id, plantings, previousYear]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plantKey && !customName.trim()) {
      return;
    }
    addPlanting({
      boxId: box.id,
      plantKey,
      customName: customName.trim() || undefined,
      plantedDate,
      status: "active",
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="document"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl border shadow-lg sm:rounded-2xl"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <div className="flex items-center justify-between gap-2 border-b p-3" style={{ borderColor: "var(--border)" }}>
          <h2 id="quick-add-title" className="text-base font-semibold sm:text-lg">
            Hurtig-legg til i {box.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Lukk"
            className="tap-target rounded-full px-3 text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        <form className="space-y-3 overflow-y-auto p-3" onSubmit={onSubmit}>
          <PlantPicker
            plantKey={plantKey}
            customName={customName}
            onPlantKeyChange={setPlantKey}
            onCustomNameChange={setCustomName}
          />

          {previousSeasonFamilies.length > 0 && (
            <div className="space-y-1.5 rounded-lg border p-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Forrige sesong ({previousYear}) i denne kassen:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {previousSeasonFamilies.map((family) => (
                  <FamilyChip key={family} family={family} />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium">Plantet dato</label>
            <input
              type="date"
              value={plantedDate}
              onChange={(event) => setPlantedDate(event.target.value)}
              className="input-touch w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--green)", color: "white" }}
            >
              Lagre
            </button>
            <button
              type="button"
              onClick={onClose}
              className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
