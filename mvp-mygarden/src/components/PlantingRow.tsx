import { useState } from "react";
import { daysSince, parseQuantity, plantedAgeLabel } from "../lib/planting";
import { getPlantName, usePlantLookup } from "../lib/plants";
import { useUiStore } from "../store/useUiStore";
import type { Planting } from "../types";
import { FamilyChip } from "./FamilyChip";
import { StatusBadge } from "./StatusBadge";

interface PlantingRowProps {
  planting: Planting;
  onHarvest?: (id: string, harvestYield?: string) => void;
  onUpdate?: (id: string, patch: Partial<Planting>) => void;
  onDelete?: (id: string) => void;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("nb-NO");
}

export function PlantingRow({ planting, onHarvest, onUpdate, onDelete }: PlantingRowProps) {
  const plantLanguage = useUiStore((state) => state.plantLanguage);
  const findPlant = usePlantLookup();
  const [harvesting, setHarvesting] = useState(false);
  const [yieldInput, setYieldInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [editVariety, setEditVariety] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editPlantedDate, setEditPlantedDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editYield, setEditYield] = useState("");
  const plant = findPlant(planting.plantKey);
  const displayName = planting.customName ?? (plant ? getPlantName(plant, plantLanguage) : planting.plantKey);
  const emoji = plant?.emoji ?? "🌱";
  const isHarvested = planting.status === "harvested";
  // "Planted N days ago" — only meaningful while the plant is still growing.
  const ageLabel = planting.status === "active" ? plantedAgeLabel(planting.plantedDate) : "";
  // For a harvested row, how many days it grew from planting to harvest.
  const growDays =
    isHarvested && planting.harvestDate
      ? daysSince(planting.plantedDate, new Date(`${planting.harvestDate}T00:00:00`))
      : null;

  const startEditing = () => {
    setEditVariety(planting.variety ?? "");
    setEditQuantity(planting.quantity != null ? String(planting.quantity) : "");
    setEditPlantedDate(planting.plantedDate);
    setEditNotes(planting.notes ?? "");
    setEditYield(planting.harvestYield ?? "");
    setEditing(true);
  };

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

      {planting.quantity != null && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Antall: {planting.quantity} {planting.quantity === 1 ? "plante" : "planter"}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <span>
          Plantet: {formatDate(planting.plantedDate)}
          {ageLabel && <span> · {ageLabel}</span>}
        </span>
        <StatusBadge status={planting.status} />
        {planting.harvestDate && (
          <span>
            Høstet: {formatDate(planting.harvestDate)}
            {growDays != null && growDays >= 0 && (
              <span> · {growDays} {growDays === 1 ? "dag" : "dager"} i vekst</span>
            )}
          </span>
        )}
        {planting.harvestYield && <span>Avling: {planting.harvestYield}</span>}
      </div>

      {planting.notes && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {planting.notes}
        </p>
      )}

      {editing && onUpdate && (
        <form
          className="space-y-2 rounded-lg border p-3"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
          onSubmit={(event) => {
            event.preventDefault();
            onUpdate(planting.id, {
              variety: editVariety.trim() || undefined,
              quantity: parseQuantity(editQuantity),
              plantedDate: editPlantedDate,
              notes: editNotes.trim() || undefined,
              ...(isHarvested ? { harvestYield: editYield.trim() || undefined } : {}),
            });
            setEditing(false);
          }}
        >
          <label className="block text-sm font-medium">
            Sort (valgfritt)
            <input
              type="text"
              value={editVariety}
              onChange={(event) => setEditVariety(event.target.value)}
              placeholder="f.eks. Sungold"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
            />
          </label>
          <label className="block text-sm font-medium">
            Antall planter (valgfritt)
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={editQuantity}
              onChange={(event) => setEditQuantity(event.target.value)}
              placeholder="f.eks. 6"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm sm:max-w-[10rem]"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
            />
          </label>
          <label className="block text-sm font-medium">
            Plantet dato
            <input
              type="date"
              value={editPlantedDate}
              onChange={(event) => setEditPlantedDate(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
            />
          </label>
          {isHarvested && (
            <label className="block text-sm font-medium">
              Avling (valgfritt)
              <input
                type="text"
                value={editYield}
                onChange={(event) => setEditYield(event.target.value)}
                placeholder="f.eks. 5 kg, 3 bøtter"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
              />
            </label>
          )}
          <label className="block text-sm font-medium">
            Notater (valgfritt)
            <textarea
              value={editNotes}
              onChange={(event) => setEditNotes(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ backgroundColor: "var(--green)", color: "white" }}
            >
              Lagre
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
            >
              Avbryt
            </button>
          </div>
        </form>
      )}

      {harvesting && onHarvest && (
        <form
          className="space-y-2 rounded-lg border p-3"
          style={{ borderColor: "var(--amber)", backgroundColor: "var(--amber-light)" }}
          onSubmit={(event) => {
            event.preventDefault();
            onHarvest(planting.id, yieldInput);
            setHarvesting(false);
          }}
        >
          <label className="block text-sm font-medium">
            Avling (valgfritt)
            <input
              type="text"
              autoFocus
              value={yieldInput}
              onChange={(event) => setYieldInput(event.target.value)}
              placeholder="f.eks. 5 kg, 3 bøtter"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ backgroundColor: "var(--amber)", color: "white" }}
            >
              Bekreft høst
            </button>
            <button
              type="button"
              onClick={() => {
                setHarvesting(false);
                setYieldInput("");
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
            >
              Avbryt
            </button>
          </div>
        </form>
      )}

      {!editing && !harvesting && (
        <div className="flex flex-wrap gap-2">
          {planting.status === "active" && onHarvest && (
            <button
              type="button"
              onClick={() => setHarvesting(true)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ backgroundColor: "var(--amber-light)", color: "var(--amber)" }}
            >
              Høst
            </button>
          )}
          {onUpdate && (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
            >
              Rediger
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
      )}
    </li>
  );
}
