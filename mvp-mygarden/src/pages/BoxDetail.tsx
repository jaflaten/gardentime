import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BoxMetaFields } from "../components/BoxMetaFields";
import { CompanionHints } from "../components/CompanionHints";
import { FamilyChip } from "../components/FamilyChip";
import { LanguageToggle } from "../components/LanguageToggle";
import { PlantPicker } from "../components/PlantPicker";
import { PlantingRow } from "../components/PlantingRow";
import { RotationWarning } from "../components/RotationWarning";
import {
  BED_TYPE_LABELS,
  SUN_EXPOSURE_LABELS,
  type BedType,
  type SunExposure,
} from "../lib/boxMeta";
import type { PlantFamily } from "../lib/families";
import { boxContextNotes, rankPlantsForBox, type BoxFitTier } from "../lib/boxRanking";
import { getPlantName, useMergedPlantList, usePlantLookup } from "../lib/plants";
import { isSowableNow } from "../lib/sowWindow";
import { useResolvedLocation } from "../lib/useResolvedLocation";
import { boxRotationHistory, familyConflictYears, plantingFamilyResolver } from "../lib/rotation";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore } from "../store/useUiStore";
import type { Planting } from "../types";

function useViewMode(): boolean {
  return useMemo(() => new URLSearchParams(window.location.search).has("view"), []);
}

function byNewestFirst(a: Planting, b: Planting) {
  return b.plantedDate.localeCompare(a.plantedDate);
}

const FIT_TIER_META: Record<BoxFitTier, { label: string; border: string; background: string }> = {
  good: { label: "Anbefalt", border: "var(--green)", background: "var(--green-light)" },
  ok: { label: "OK", border: "var(--border)", background: "var(--bg)" },
  avoid: { label: "Frarådes", border: "var(--red)", background: "var(--red-light)" },
};

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
  const [rotationDismissed, setRotationDismissed] = useState(false);
  const [editingBox, setEditingBox] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSun, setEditSun] = useState<SunExposure | "">("");
  const [editBedType, setEditBedType] = useState<BedType | "">("");
  const [editDepth, setEditDepth] = useState<number | "">("");
  const language = useUiStore((state) => state.plantLanguage);

  const { boxes, plantings, addPlanting, updateBox, markHarvested, deletePlanting } = useGardenStore();
  const findPlant = usePlantLookup();
  const allPlants = useMergedPlantList();
  const location = useResolvedLocation();
  const [showFitPanel, setShowFitPanel] = useState(false);
  const [showAvoid, setShowAvoid] = useState(false);
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

  const selectedFamily = plantKey ? findPlant(plantKey)?.family : undefined;
  const neighbourKeys = useMemo(
    () => activePlantings.map((planting) => planting.plantKey).filter(Boolean),
    [activePlantings],
  );
  const rotationConflictYears = useMemo(() => {
    if (!selectedFamily) {
      return [];
    }
    const history = boxRotationHistory(plantings, id ?? "", plantingFamilyResolver(findPlant), targetYear);
    return familyConflictYears(history, selectedFamily);
  }, [findPlant, id, plantings, selectedFamily, targetYear]);

  const contextNotes = useMemo(
    () => (box ? boxContextNotes(box, allPlants, plantings, findPlant, new Date().getFullYear(), language) : []),
    [box, allPlants, plantings, findPlant, language],
  );

  // Active "Hva passer her nå?" panel: plants sowable today (when a location is set), ranked for THIS box.
  // Off-season (or no location) it falls back to ranking all plants, so the button is always available.
  const { fitGroups, seasonScoped } = useMemo(() => {
    if (!box) {
      return { fitGroups: [], seasonScoped: false };
    }
    const sowable = location ? allPlants.filter((plant) => isSowableNow(plant, location.lastFrostDoy)) : [];
    const scoped = sowable.length > 0;
    const candidates = scoped ? sowable : allPlants;
    const ranked = rankPlantsForBox(box, candidates, plantings, findPlant, new Date().getFullYear(), language);
    const groups = (["good", "ok", "avoid"] as BoxFitTier[])
      .map((tier) => ({ tier, fits: ranked.filter((fit) => fit.tier === tier) }))
      .filter((group) => group.fits.length > 0);
    return { fitGroups: groups, seasonScoped: scoped };
  }, [box, allPlants, location, plantings, findPlant, language]);

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

  // Open the add-plant form pre-filled with a specific plant (from the "Hva passer her nå?" panel).
  const openAddFormWith = (plantKeyToAdd: string) => {
    setPlantKey(plantKeyToAdd);
    setCustomName("");
    setVariety("");
    setPlantedDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setShowPickerError(false);
    setShowFitPanel(false);
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
            {(box.sunExposure || box.bedType || box.depthCm) && (
              <div className="flex flex-wrap gap-1.5">
                {box.depthCm != null && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text-muted)" }}
                  >
                    📏 {box.depthCm} cm
                  </span>
                )}
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
                  setEditDepth(box.depthCm ?? "");
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
                depthCm: editDepth === "" ? undefined : editDepth,
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
              depthCm={editDepth}
              onSunExposureChange={setEditSun}
              onBedTypeChange={setEditBedType}
              onDepthCmChange={setEditDepth}
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

      {contextNotes.length > 0 && (
        <section
          className="space-y-1 rounded-xl border p-3 text-sm sm:p-4"
          style={{ borderColor: "var(--amber)", backgroundColor: "var(--amber-light)", color: "var(--text)" }}
        >
          {contextNotes.map((note) => (
            <p key={note} className="flex items-start gap-2">
              <span aria-hidden="true">💡</span>
              <span>{note}</span>
            </p>
          ))}
        </section>
      )}

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
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openAddForm}
                className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--green)", color: "white" }}
              >
                + Legg til plante
              </button>
              {fitGroups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFitPanel((open) => !open)}
                  aria-expanded={showFitPanel}
                  className="tap-target rounded-lg border px-4 py-2 text-sm font-medium"
                  style={{ borderColor: "var(--green)", color: "var(--green)", backgroundColor: "var(--surface)" }}
                >
                  🔍 Hva passer her nå?
                </button>
              )}
            </div>
            {showFitPanel && (
              <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
                {!location ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Uten postnummer viser vi alle planter rangert etter kassen. Legg inn plassering for å filtrere på sesong.
                  </p>
                ) : !seasonScoped ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Ingen planter er i så-vinduet akkurat nå — viser alle, rangert for kassen.
                  </p>
                ) : null}
                {fitGroups.map((group) => {
                  const meta = FIT_TIER_META[group.tier];
                  // Frarådes is often the longest group (every too-deep/wrong-sun plant), so collapse it.
                  const collapsible = group.tier === "avoid";
                  const open = !collapsible || showAvoid;
                  return (
                    <div key={group.tier} className="space-y-1.5">
                      {collapsible ? (
                        <button
                          type="button"
                          onClick={() => setShowAvoid((value) => !value)}
                          aria-expanded={showAvoid}
                          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <span>
                            {meta.label} ({group.fits.length})
                          </span>
                          <span aria-hidden="true">{showAvoid ? "▲" : "▼"}</span>
                        </button>
                      ) : (
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                          {meta.label}
                        </p>
                      )}
                      {open && (
                      <ul className="space-y-1.5">
                        {group.fits.map((fit) => (
                          <li key={fit.plant.key}>
                            <button
                              type="button"
                              onClick={() => openAddFormWith(fit.plant.key)}
                              className="tap-target w-full rounded-lg border px-3 py-2 text-left"
                              style={{ borderColor: meta.border, backgroundColor: meta.background, color: "var(--text)" }}
                            >
                              <span className="block text-sm font-medium">
                                {fit.plant.emoji} {getPlantName(fit.plant, language)}
                              </span>
                              {fit.reasons.length > 0 && (
                                <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                                  {fit.reasons.join(" · ")}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <form className="space-y-3 rounded-lg border p-3" onSubmit={onSubmit} style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
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
