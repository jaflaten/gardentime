import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BoxMetaFields } from "../components/BoxMetaFields";
import { FamilyChip } from "../components/FamilyChip";
import { LanguageToggle } from "../components/LanguageToggle";
import { PlantPicker } from "../components/PlantPicker";
import { PlantingRow } from "../components/PlantingRow";
import {
  BED_TYPE_LABELS,
  SUN_EXPOSURE_LABELS,
  type BedType,
  type SunExposure,
} from "../lib/boxMeta";
import type { PlantFamily } from "../lib/families";
import { usePlantLookup } from "../lib/plants";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore } from "../store/useUiStore";
import type { Planting } from "../types";

function useViewMode(): boolean {
  return useMemo(() => new URLSearchParams(window.location.search).has("view"), []);
}

function byNewestFirst(a: Planting, b: Planting) {
  return b.plantedDate.localeCompare(a.plantedDate);
}

export function BoxDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const viewMode = useViewMode();
  const [showForm, setShowForm] = useState(false);
  const [plantKey, setPlantKey] = useState("");
  const [customName, setCustomName] = useState("");
  const [variety, setVariety] = useState("");
  const [plantedDate, setPlantedDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [showPickerError, setShowPickerError] = useState(false);
  const [editingBox, setEditingBox] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSun, setEditSun] = useState<SunExposure | "">("");
  const [editBedType, setEditBedType] = useState<BedType | "">("");
  const language = useUiStore((state) => state.plantLanguage);

  const { boxes, plantings, addPlanting, updateBox, markHarvested, deletePlanting } = useGardenStore();
  const findPlant = usePlantLookup();
  const box = boxes.find((entry) => entry.id === id);

  const boxPlantings = useMemo(() => plantings.filter((planting) => planting.boxId === id), [plantings, id]);
  const activePlantings = boxPlantings.filter((planting) => planting.status === "active").sort(byNewestFirst);
  const historyPlantings = boxPlantings.filter((planting) => planting.status !== "active").sort(byNewestFirst);

  const targetYear = new Date(plantedDate).getFullYear();
  const previousYear = targetYear - 1;
  const previousSeasonFamilies = useMemo<PlantFamily[]>(() => {
    const families = new Set<PlantFamily>();
    boxPlantings
      .filter((planting) => planting.year === previousYear)
      .forEach((planting) => {
        const plant = findPlant(planting.plantKey);
        if (plant) {
          families.add(plant.family);
        }
      });
    return Array.from(families);
  }, [boxPlantings, findPlant, previousYear]);

  const historyByYear = historyPlantings.reduce<Record<number, Planting[]>>((acc, planting) => {
    if (!acc[planting.year]) {
      acc[planting.year] = [];
    }
    acc[planting.year].push(planting);
    return acc;
  }, {});

  if (!box) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <button
          type="button"
          onClick={() => navigate({ pathname: "/", search: window.location.search }, { replace: true })}
          className="tap-target w-fit rounded-lg px-3 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
        >
          ← Tilbake
        </button>
        <section className="rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h1 className="text-lg font-semibold sm:text-xl">Kasse ikke funnet</h1>
          <p style={{ color: "var(--text-muted)" }}>Denne kassen finnes ikke lenger.</p>
        </section>
      </main>
    );
  }

  const openAddForm = () => {
    const mostRecentActive = activePlantings[0];
    setPlantKey(mostRecentActive?.plantKey ?? "");
    setCustomName(mostRecentActive && !mostRecentActive.plantKey ? (mostRecentActive.customName ?? "") : "");
    setVariety("");
    setPlantedDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setShowPickerError(false);
    setShowForm(true);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plantKey && !customName.trim()) {
      setShowPickerError(true);
      return;
    }
    addPlanting({
      boxId: box.id,
      plantKey,
      customName: customName.trim() || undefined,
      variety: variety.trim() || undefined,
      plantedDate,
      notes: notes.trim() || undefined,
      status: "active",
    });
    setShowForm(false);
    setPlantKey("");
    setCustomName("");
    setVariety("");
    setPlantedDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setShowPickerError(false);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
      <header className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="flex items-center justify-between gap-2">
          <Link to={{ pathname: "/", search: window.location.search }} className="inline-block text-sm font-medium" style={{ color: "var(--green)" }}>
            ← Tilbake
          </Link>
          <LanguageToggle />
        </div>
        {!editingBox ? (
          <>
            <h1 className="text-xl font-semibold sm:text-2xl">{box.name}</h1>
            {box.description && <p style={{ color: "var(--text-muted)" }}>{box.description}</p>}
            {(box.sunExposure || box.bedType) && (
              <div className="flex flex-wrap gap-1.5">
                {box.sunExposure && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text-muted)" }}
                  >
                    {SUN_EXPOSURE_LABELS[box.sunExposure].emoji}{" "}
                    {language === "pl" ? SUN_EXPOSURE_LABELS[box.sunExposure].name_pl : SUN_EXPOSURE_LABELS[box.sunExposure].name_no}
                  </span>
                )}
                {box.bedType && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text-muted)" }}
                  >
                    {BED_TYPE_LABELS[box.bedType].emoji}{" "}
                    {language === "pl" ? BED_TYPE_LABELS[box.bedType].name_pl : BED_TYPE_LABELS[box.bedType].name_no}
                  </span>
                )}
              </div>
            )}
            {!viewMode && (
              <button
                type="button"
                onClick={() => {
                  setEditName(box.name);
                  setEditDescription(box.description ?? "");
                  setEditSun(box.sunExposure ?? "");
                  setEditBedType(box.bedType ?? "");
                  setEditingBox(true);
                }}
                className="tap-target rounded-lg border px-3 py-2 text-sm font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "var(--surface)" }}
              >
                Rediger kasse
              </button>
            )}
          </>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!editName.trim()) {
                return;
              }
              updateBox(box.id, {
                name: editName.trim(),
                description: editDescription.trim() || undefined,
                sunExposure: editSun || undefined,
                bedType: editBedType || undefined,
              });
              setEditingBox(false);
            }}
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium">Navn</label>
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
                className="input-touch w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Beskrivelse (valgfritt)</label>
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={2}
                className="input-touch w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              />
            </div>
            <BoxMetaFields
              sunExposure={editSun}
              bedType={editBedType}
              onSunExposureChange={setEditSun}
              onBedTypeChange={setEditBedType}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--green)", color: "white" }}
              >
                Lagre
              </button>
              <button
                type="button"
                onClick={() => setEditingBox(false)}
                className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
              >
                Avbryt
              </button>
            </div>
          </form>
        )}
      </header>

      <section className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <h2 className="text-lg font-semibold sm:text-xl">Nå</h2>
        {activePlantings.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Ingen aktive planter.</p>
        ) : (
          <ul className="space-y-2">
            {activePlantings.map((planting) => (
              <PlantingRow
                key={planting.id}
                planting={planting}
                onHarvest={viewMode ? undefined : (plantingId) => markHarvested(plantingId)}
                onDelete={viewMode ? undefined : (plantingId) => deletePlanting(plantingId)}
              />
            ))}
          </ul>
        )}

        {viewMode ? null : !showForm ? (
          <button
            type="button"
            onClick={openAddForm}
            className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--green)", color: "white" }}
          >
            + Legg til plante
          </button>
        ) : (
          <form className="space-y-3 rounded-lg border p-3" onSubmit={onSubmit} style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
            <PlantPicker
              plantKey={plantKey}
              customName={customName}
              onPlantKeyChange={(key) => {
                setPlantKey(key);
                setShowPickerError(false);
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
            {previousSeasonFamilies.length > 0 && (
              <div className="space-y-1.5 rounded-lg border p-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
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
            <div className="space-y-2">
              <label className="block text-sm font-medium">Notater (valgfritt)</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="input-touch w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--green)", color: "white" }}
              >
                Lagre
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
              >
                Avbryt
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <h2 className="text-lg font-semibold sm:text-xl">Historikk</h2>
        {historyPlantings.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Ingen historikk ennå.</p>
        ) : (
          Object.keys(historyByYear)
            .map(Number)
            .sort((a, b) => b - a)
            .map((year) => (
              <div key={year} className="space-y-2">
                <h3 className="text-base font-semibold sm:text-lg">{year}</h3>
                <ul className="space-y-2">
                  {historyByYear[year].map((planting) => (
                    <PlantingRow
                      key={planting.id}
                      planting={planting}
                      onDelete={viewMode ? undefined : (plantingId) => deletePlanting(plantingId)}
                    />
                  ))}
                </ul>
              </div>
            ))
        )}
      </section>
    </main>
  );
}
