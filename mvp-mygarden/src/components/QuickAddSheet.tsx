import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { PlantFamily } from "../lib/families";
import { getPlantName, usePlantLookup } from "../lib/plants";
import { boxRotationHistory, familyConflictYears, plantingFamilyResolver } from "../lib/rotation";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore } from "../store/useUiStore";
import type { Box, Planting } from "../types";
import { CompanionHints } from "./CompanionHints";
import { FamilyChip } from "./FamilyChip";
import { PlantPicker } from "./PlantPicker";
import { RotationWarning } from "./RotationWarning";

interface QuickAddSheetProps {
  box: Box | null;
  onClose: () => void;
  initialPlantKey?: string;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("nb-NO");
}

export function QuickAddSheet({ box, onClose, initialPlantKey }: QuickAddSheetProps) {
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

  // key={box.id+initialPlantKey} resets selection + form state when switching boxes or preset plant without a useEffect.
  return <QuickAddForm key={`${box.id}-${initialPlantKey ?? ""}`} box={box} onClose={onClose} initialPlantKey={initialPlantKey} />;
}

interface QuickAddFormProps {
  box: Box;
  onClose: () => void;
  initialPlantKey?: string;
}

// "new" = add a fresh planting; a string id = edit that active planting; null = unresolved (2+ active, awaiting pick).
type Target = string | "new" | null;

function QuickAddForm({ box, onClose, initialPlantKey }: QuickAddFormProps) {
  const plantings = useGardenStore((state) => state.plantings);
  const plantLanguage = useUiStore((state) => state.plantLanguage);
  const findPlant = usePlantLookup();

  const activePlantings = useMemo(
    () =>
      plantings
        .filter((planting) => planting.boxId === box.id && planting.status === "active")
        .sort((a, b) => b.plantedDate.localeCompare(a.plantedDate)),
    [box.id, plantings],
  );

  // The "+" affordance means "add", so default to adding a new planting. Editing the existing
  // one stays one tap away via the "Rediger eksisterende" toggle (1 active) or the picker list (2+).
  // initialPlantKey (from the D2 card) is always add-new — the user explicitly chose a plant.
  const [target, setTarget] = useState<Target>(() => {
    if (initialPlantKey || activePlantings.length <= 1) {
      return "new";
    }
    return null;
  });

  const editing = target !== null && target !== "new" ? (activePlantings.find((p) => p.id === target) ?? null) : null;
  const showSelector = !initialPlantKey && activePlantings.length >= 2;
  const showToggle = !initialPlantKey && activePlantings.length === 1;

  const labelFor = (planting: Planting) => {
    const plant = planting.plantKey ? findPlant(planting.plantKey) : undefined;
    return planting.customName ?? (plant ? getPlantName(plant, plantLanguage) : planting.plantKey || "Ukjent plante");
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
            {editing ? `Rediger planting i ${box.name}` : `Hurtig-legg til i ${box.name}`}
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

        {showSelector && (
          <div className="space-y-1.5 border-b p-3" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Denne kassen har flere planter. Velg én å redigere, eller legg til ny:
            </p>
            {activePlantings.map((planting) => {
              const selected = target === planting.id;
              return (
                <button
                  key={planting.id}
                  type="button"
                  onClick={() => setTarget(planting.id)}
                  className="tap-target w-full rounded-lg border px-3 py-2 text-left text-sm"
                  style={{
                    borderColor: selected ? "var(--green)" : "var(--border)",
                    backgroundColor: selected ? "var(--green-light, var(--bg))" : "var(--surface)",
                  }}
                >
                  <span className="font-medium">{labelFor(planting)}</span>
                  {planting.variety && <span style={{ color: "var(--text-muted)" }}> · {planting.variety}</span>}
                  <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                    Plantet {formatDate(planting.plantedDate)}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setTarget("new")}
              className="tap-target w-full rounded-lg border px-3 py-2 text-left text-sm font-medium"
              style={{
                borderColor: target === "new" ? "var(--green)" : "var(--border)",
                backgroundColor: target === "new" ? "var(--green-light, var(--bg))" : "var(--surface)",
              }}
            >
              + Legg til ny planting
            </button>
          </div>
        )}

        {target === null ? (
          <p className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
            Velg en planting over for å fortsette.
          </p>
        ) : (
          <PlantingEditor
            key={target}
            box={box}
            planting={editing}
            initialPlantKey={target === "new" ? initialPlantKey : undefined}
            onClose={onClose}
            toggle={
              showToggle
                ? editing
                  ? { label: "Legg til en til", onClick: () => setTarget("new") }
                  : { label: "‹ Rediger eksisterende i stedet", onClick: () => setTarget(activePlantings[0].id) }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

interface PlantingEditorProps {
  box: Box;
  planting: Planting | null;
  initialPlantKey?: string;
  onClose: () => void;
  toggle?: { label: string; onClick: () => void };
}

function PlantingEditor({ box, planting, initialPlantKey, onClose, toggle }: PlantingEditorProps) {
  const plantings = useGardenStore((state) => state.plantings);
  const addPlanting = useGardenStore((state) => state.addPlanting);
  const updatePlanting = useGardenStore((state) => state.updatePlanting);
  const findPlant = usePlantLookup();

  const isEdit = planting !== null;

  const [plantKey, setPlantKey] = useState(() => planting?.plantKey ?? initialPlantKey ?? "");
  const [customName, setCustomName] = useState(() => planting?.customName ?? "");
  const [variety, setVariety] = useState(() => planting?.variety ?? "");
  const [plantedDate, setPlantedDate] = useState(() => planting?.plantedDate ?? new Date().toISOString().split("T")[0]);
  const [showPickerError, setShowPickerError] = useState(false);
  const [rotationDismissed, setRotationDismissed] = useState(false);

  const targetYear = useMemo(() => new Date(plantedDate).getFullYear(), [plantedDate]);
  const previousYear = targetYear - 1;
  const rotationConflictYears = useMemo(() => {
    const family = plantKey ? findPlant(plantKey)?.family : undefined;
    if (!family) {
      return [];
    }
    const history = boxRotationHistory(plantings, box.id, plantingFamilyResolver(findPlant), targetYear);
    return familyConflictYears(history, family);
  }, [box.id, findPlant, plantKey, plantings, targetYear]);
  const selectedFamily = plantKey ? findPlant(plantKey)?.family : undefined;
  // Other active plantings in this box — the companions the picked plant would sit beside.
  const neighbourKeys = useMemo(
    () =>
      plantings
        .filter((p) => p.boxId === box.id && p.status === "active" && p.id !== planting?.id)
        .map((p) => p.plantKey)
        .filter(Boolean),
    [plantings, box.id, planting?.id],
  );
  const previousSeasonFamilies = useMemo<PlantFamily[]>(() => {
    const families = new Set<PlantFamily>();
    plantings
      .filter((p) => p.boxId === box.id && p.year === previousYear)
      .forEach((p) => {
        const plant = findPlant(p.plantKey);
        if (plant) {
          families.add(plant.family);
        }
      });
    return Array.from(families);
  }, [box.id, findPlant, plantings, previousYear]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plantKey && !customName.trim()) {
      setShowPickerError(true);
      return;
    }
    const fields = {
      plantKey,
      customName: customName.trim() || undefined,
      variety: variety.trim() || undefined,
      plantedDate,
    };
    if (isEdit && planting) {
      // Preserve identity + revive nothing: edit targets the existing active row in place.
      updatePlanting(planting.id, fields);
    } else {
      addPlanting({ boxId: box.id, ...fields, status: "active" });
    }
    onClose();
  };

  return (
    <form className="space-y-3 overflow-y-auto p-3" onSubmit={onSubmit}>
      <PlantPicker
        plantKey={plantKey}
        customName={customName}
        onPlantKeyChange={(key) => {
          setPlantKey(key);
          setShowPickerError(false);
          setRotationDismissed(false);
        }}
        onCustomNameChange={(name) => {
          setCustomName(name);
          if (name.trim()) {
            setShowPickerError(false);
          }
        }}
      />

      {showPickerError && (
        <p className="text-sm" style={{ color: "var(--red)" }}>
          Velg en plante eller skriv et eget plantenavn først.
        </p>
      )}

      {selectedFamily && !rotationDismissed && (
        <RotationWarning
          family={selectedFamily}
          years={rotationConflictYears}
          currentYear={targetYear}
          onDismiss={() => setRotationDismissed(true)}
        />
      )}

      <CompanionHints plantKey={plantKey} neighbourKeys={neighbourKeys} />

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
        <label className="block text-sm font-medium">Sort (valgfritt)</label>
        <input
          type="text"
          value={variety}
          onChange={(event) => setVariety(event.target.value)}
          placeholder="f.eks. Sungold"
          className="input-touch w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        />
      </div>

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

      <div className="flex flex-wrap gap-2 pt-1">
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
        {toggle && (
          <button
            type="button"
            onClick={toggle.onClick}
            className="tap-target ml-auto rounded-lg px-3 py-2 text-sm font-medium"
            style={{ color: "var(--green)" }}
          >
            {toggle.label}
          </button>
        )}
      </div>
    </form>
  );
}
