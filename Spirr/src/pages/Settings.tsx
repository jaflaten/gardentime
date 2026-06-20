import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { CustomPlantForm } from "../components/CustomPlantForm";
import { LanguageToggle } from "../components/LanguageToggle";
import { EXTRA_LEFT_COLS, EXTRA_TOP_ROWS } from "../components/GardenGrid";
import { CATEGORY_LABELS } from "../lib/categories";
import { isCustomPlantLike, loadCustomPlants } from "../lib/customPlants";
import { FAMILY_INFO } from "../lib/families";
import { findPostnummer, formatDoy, isValidPostnummer, resolveLocation } from "../lib/location";
import { loadBoxes, loadPlantings, saveBoxes, savePlantings } from "../lib/storage";
import bundledGardenBackup from "../resources/spirr-v2.json";
import { useCustomPlantsStore } from "../store/useCustomPlantsStore";
import { useGardenStore } from "../store/useGardenStore";
import { useLocationStore } from "../store/useLocationStore";
import {
  DEFAULT_GRID_SIZE,
  GRID_COLS_MAX,
  GRID_COLS_MIN,
  GRID_ROWS_MAX,
  GRID_ROWS_MIN,
  useUiStore,
} from "../store/useUiStore";
import type { Box, Planting, PlantInfo } from "../types";

interface BackupPayload {
  version?: unknown;
  exportedAt?: unknown;
  boxes: unknown[];
  plantings: unknown[];
  customPlants?: unknown[];
}

interface PendingImport {
  source: string;
  boxes: Box[];
  plantings: Planting[];
  customPlants: PlantInfo[];
}

function formatBackupTimestamp(value: unknown) {
  if (typeof value !== "string") {
    return "Ukjent";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Ukjent";
  }
  return date.toLocaleString("nb-NO");
}

function isBoxLike(value: unknown): value is Box {
  if (!value || typeof value !== "object") {
    return false;
  }
  const box = value as Partial<Box>;
  return (
    typeof box.id === "string" &&
    typeof box.name === "string" &&
    typeof box.createdAt === "string" &&
    !!box.layout &&
    typeof box.layout.x === "number" &&
    typeof box.layout.y === "number" &&
    typeof box.layout.w === "number" &&
    typeof box.layout.h === "number"
  );
}

function isPlantingLike(value: unknown): value is Planting {
  if (!value || typeof value !== "object") {
    return false;
  }
  const planting = value as Partial<Planting>;
  return (
    typeof planting.id === "string" &&
    // boxId is optional — indoor seedlings (forkultivering) have none until planted out.
    (planting.boxId === undefined || typeof planting.boxId === "string") &&
    typeof planting.plantKey === "string" &&
    typeof planting.plantedDate === "string" &&
    typeof planting.year === "number" &&
    (planting.status === "active" ||
      planting.status === "harvested" ||
      planting.status === "removed" ||
      planting.status === "failed")
  );
}

function exportData() {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    boxes: loadBoxes(),
    plantings: loadPlantings(),
    customPlants: loadCustomPlants(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `spirr-backup-${new Date().toISOString().split("T")[0]}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function gridFootprint(boxes: Box[]): { cols: number; rows: number } {
  if (boxes.length === 0) {
    return { cols: 0, rows: 0 };
  }
  let maxX = 0;
  let maxY = 0;
  boxes.forEach((box) => {
    const right = box.layout.x + box.layout.w + EXTRA_LEFT_COLS;
    const bottom = Math.max(-EXTRA_TOP_ROWS, box.layout.y) + EXTRA_TOP_ROWS + box.layout.h;
    if (right > maxX) {
      maxX = right;
    }
    if (bottom > maxY) {
      maxY = bottom;
    }
  });
  return { cols: maxX, rows: maxY };
}

export function Settings() {
  const navigate = useNavigate();
  const reloadFromStorage = useGardenStore((state) => state.reloadFromStorage);
  const resetGardenAction = useGardenStore((state) => state.resetGarden);
  const gridSize = useUiStore((state) => state.gridSize);
  const setGridSize = useUiStore((state) => state.setGridSize);
  const ensureGridFits = useUiStore((state) => state.ensureGridFits);

  const customPlants = useCustomPlantsStore((state) => state.plants);
  const addCustomPlant = useCustomPlantsStore((state) => state.addPlant);
  const updateCustomPlant = useCustomPlantsStore((state) => state.updatePlant);
  const deleteCustomPlant = useCustomPlantsStore((state) => state.deletePlant);
  const replaceCustomPlants = useCustomPlantsStore((state) => state.replaceAll);
  const language = useUiStore((state) => state.plantLanguage);

  const locationPostnummer = useLocationStore((state) => state.postnummer);
  const locationElevationM = useLocationStore((state) => state.elevationM);
  const locationFrostJustering = useLocationStore((state) => state.frostJusteringDays);
  const setLocationPostnummer = useLocationStore((state) => state.setPostnummer);
  const setLocationElevation = useLocationStore((state) => state.setElevation);
  const setLocationFrostJustering = useLocationStore((state) => state.setFrostJustering);
  const clearLocation = useLocationStore((state) => state.clearLocation);

  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [gridCols, setGridCols] = useState(gridSize.cols);
  const [gridRows, setGridRows] = useState(gridSize.rows);
  const [gridError, setGridError] = useState<string | null>(null);
  const [gridStatus, setGridStatus] = useState<string | null>(null);
  const [showNewCustomPlant, setShowNewCustomPlant] = useState(false);
  const [editingCustomPlantKey, setEditingCustomPlantKey] = useState<string | null>(null);

  const [postnummerInput, setPostnummerInput] = useState(locationPostnummer ?? "");
  const [elevationInput, setElevationInput] = useState<string>(
    locationElevationM != null ? String(locationElevationM) : "",
  );
  const [frostJusteringInput, setFrostJusteringInput] = useState<string>(String(locationFrostJustering ?? 0));
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const resolvedLocation = useMemo(() => {
    if (!locationPostnummer) {
      return null;
    }
    return resolveLocation({
      postnummer: locationPostnummer,
      userElevationM: locationElevationM ?? undefined,
      frostJusteringDays: locationFrostJustering,
    });
  }, [locationPostnummer, locationElevationM, locationFrostJustering]);

  const previewedPostnummer = useMemo(() => {
    const trimmed = postnummerInput.trim();
    return isValidPostnummer(trimmed) ? findPostnummer(trimmed) ?? null : null;
  }, [postnummerInput]);

  const handleSaveLocation = () => {
    const trimmed = postnummerInput.trim();
    setLocationStatus(null);
    if (!trimmed) {
      // Allow clearing — empty postnummer wipes location.
      clearLocation();
      setElevationInput("");
      setFrostJusteringInput("0");
      setLocationError(null);
      setLocationStatus("Plassering nullstilt.");
      return;
    }
    if (!isValidPostnummer(trimmed)) {
      setLocationError("Postnummer må være 4 sifre.");
      return;
    }
    if (!findPostnummer(trimmed)) {
      setLocationError(`Fant ikke postnummer ${trimmed}. Sjekk skrivemåten.`);
      return;
    }
    setLocationError(null);
    setLocationPostnummer(trimmed);
    const parsedElevation = elevationInput.trim() === "" ? null : Number(elevationInput);
    if (parsedElevation !== null) {
      setLocationElevation(parsedElevation);
      setElevationInput(String(Math.max(0, Math.round(parsedElevation))));
    }
    const parsedJustering = frostJusteringInput.trim() === "" ? 0 : Number(frostJusteringInput);
    setLocationFrostJustering(parsedJustering);
    setFrostJusteringInput(String(Math.max(-60, Math.min(60, Math.round(parsedJustering)))));
    setLocationStatus("Plassering lagret.");
  };

  const handleUsePostnummerElevation = () => {
    if (previewedPostnummer) {
      setElevationInput(String(previewedPostnummer.centroidElevationM));
    }
  };

  const bundledBackupLastUpdated = useMemo(
    () => formatBackupTimestamp((bundledGardenBackup as BackupPayload).exportedAt),
    [],
  );

  const handleBackupImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(loadEvent.target?.result as string) as BackupPayload;
        if (!Array.isArray(parsed.boxes) || !Array.isArray(parsed.plantings)) {
          alert("Ugyldig backup-fil. Velg en eksportert Spirr backup-fil.");
          return;
        }
        if (!parsed.boxes.every(isBoxLike) || !parsed.plantings.every(isPlantingLike)) {
          alert("Backup-filen mangler nødvendige felter.");
          return;
        }
        const importedCustomPlants = Array.isArray(parsed.customPlants)
          ? (parsed.customPlants.filter(isCustomPlantLike) as PlantInfo[])
          : [];
        setPendingImport({
          source: "Spirr backup-fil",
          boxes: parsed.boxes,
          plantings: parsed.plantings,
          customPlants: importedCustomPlants,
        });
      } catch {
        alert("Kunne ikke lese backup-filen. Kontroller at den er gyldig JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleBundledImport = () => {
    const parsed = bundledGardenBackup as BackupPayload;
    if (!Array.isArray(parsed.boxes) || !parsed.boxes.every(isBoxLike)) {
      alert("Gartnerens eget oppsett mangler nødvendige felter.");
      return;
    }
    if (!Array.isArray(parsed.plantings) || !parsed.plantings.every(isPlantingLike)) {
      alert("Gartnerens eget oppsett mangler nødvendige felter.");
      return;
    }
    setPendingImport({
      source: "gartnerens eget oppsett",
      boxes: parsed.boxes,
      plantings: parsed.plantings,
      customPlants: [],
    });
  };

  const confirmImport = () => {
    if (!pendingImport) {
      return;
    }
    saveBoxes(pendingImport.boxes);
    savePlantings(pendingImport.plantings);
    replaceCustomPlants(pendingImport.customPlants);
    const footprint = gridFootprint(pendingImport.boxes);
    ensureGridFits(footprint.cols, footprint.rows);
    reloadFromStorage();
    setPendingImport(null);
    navigate("/", { replace: true });
  };

  const confirmReset = () => {
    resetGardenAction();
    setResetOpen(false);
    navigate("/", { replace: true });
  };

  const handleSaveGridSize = () => {
    setGridError(null);
    setGridStatus(null);
    if (Number.isNaN(gridCols) || Number.isNaN(gridRows)) {
      setGridError("Skriv inn gyldige tall.");
      return;
    }
    if (gridCols < GRID_COLS_MIN || gridCols > GRID_COLS_MAX) {
      setGridError(`Kolonner må være mellom ${GRID_COLS_MIN} og ${GRID_COLS_MAX}.`);
      return;
    }
    if (gridRows < GRID_ROWS_MIN || gridRows > GRID_ROWS_MAX) {
      setGridError(`Rader må være mellom ${GRID_ROWS_MIN} og ${GRID_ROWS_MAX}.`);
      return;
    }
    const footprint = gridFootprint(loadBoxes());
    if (gridCols < footprint.cols) {
      setGridError(`Kan ikke krympe under ${footprint.cols} kolonner — det finnes kasser der.`);
      return;
    }
    if (gridRows < footprint.rows) {
      setGridError(`Kan ikke krympe under ${footprint.rows} rader — det finnes kasser der.`);
      return;
    }
    setGridSize({ cols: gridCols, rows: gridRows });
    setGridStatus(`Rutenett satt til ${gridCols} × ${gridRows}.`);
  };

  const handleResetGridSize = () => {
    setGridError(null);
    setGridStatus(null);
    setGridCols(DEFAULT_GRID_SIZE.cols);
    setGridRows(DEFAULT_GRID_SIZE.rows);
    setGridSize(DEFAULT_GRID_SIZE);
    setGridStatus("Rutenett tilbakestilt til standard.");
  };

  const importBody: ReactNode = pendingImport ? (
    <div className="space-y-2">
      <p>
        Importer <strong>{pendingImport.boxes.length}</strong> kasser,{" "}
        <strong>{pendingImport.plantings.length}</strong> plantinger og{" "}
        <strong>{pendingImport.customPlants.length}</strong> egne planter fra {pendingImport.source}?
      </p>
      <p style={{ color: "var(--text-muted)" }}>Dette erstatter eksisterende data.</p>
    </div>
  ) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
      <header className="rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="text-sm font-medium" style={{ color: "var(--green)" }}>
            ← Tilbake
          </Link>
          <LanguageToggle />
        </div>
        <h1 className="mt-2 text-xl font-semibold sm:text-2xl">Innstillinger</h1>
      </header>

      <section className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <h2 className="text-lg font-semibold sm:text-xl">📍 Hagens plassering</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Brukes til å beregne lokale frost-datoer. Alt er valgfritt — uten plassering bruker vi grove landsestimat.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="block font-medium">Postnummer</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={postnummerInput}
              onChange={(event) => {
                setPostnummerInput(event.target.value.replace(/\D/g, ""));
                setLocationError(null);
                setLocationStatus(null);
              }}
              placeholder="f.eks. 6857"
              className="input-touch w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            />
            {previewedPostnummer && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {previewedPostnummer.kommune}, {previewedPostnummer.fylke}
              </p>
            )}
          </label>

          <label className="space-y-1 text-sm">
            <span className="block font-medium">Høyde over havet (m)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={elevationInput}
              onChange={(event) => {
                setElevationInput(event.target.value);
                setLocationStatus(null);
              }}
              placeholder={previewedPostnummer ? String(previewedPostnummer.centroidElevationM) : "f.eks. 150"}
              className="input-touch w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            />
            {previewedPostnummer && (
              <button
                type="button"
                onClick={handleUsePostnummerElevation}
                className="text-xs underline"
                style={{ color: "var(--green)" }}
              >
                Bruk postnummer-default ({previewedPostnummer.centroidElevationM} m)
              </button>
            )}
          </label>
        </div>

        <label className="space-y-1 text-sm">
          <span className="block font-medium">Frost-justering (±dager)</span>
          <input
            type="number"
            inputMode="numeric"
            min={-60}
            max={60}
            value={frostJusteringInput}
            onChange={(event) => {
              setFrostJusteringInput(event.target.value);
              setLocationStatus(null);
            }}
            className="input-touch w-full rounded-lg border px-3 py-2 sm:max-w-xs"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          />
          <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
            Positiv = senere vårfrost / tidligere høstfrost (frostlomme). Negativ = mildere mikroklima.
          </span>
        </label>

        {locationError && (
          <p className="text-sm font-medium" style={{ color: "var(--red)" }}>
            {locationError}
          </p>
        )}
        {locationStatus && (
          <p className="text-sm font-medium" style={{ color: "var(--green)" }}>
            {locationStatus}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveLocation}
            className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--green)", color: "white" }}
          >
            Lagre plassering
          </button>
          {locationPostnummer && (
            <button
              type="button"
              onClick={() => {
                clearLocation();
                setPostnummerInput("");
                setElevationInput("");
                setFrostJusteringInput("0");
                setLocationError(null);
                setLocationStatus("Plassering nullstilt.");
              }}
              className="tap-target rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "var(--surface)" }}
            >
              Nullstill plassering
            </button>
          )}
        </div>

        {resolvedLocation && (
          <div
            className="space-y-1 rounded-lg border p-2.5 text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
          >
            <p>
              Vi bruker <strong>{resolvedLocation.station.name}</strong>, {resolvedLocation.station.elevationM} moh.
            </p>
            <p>
              Anslått siste vårfrost: <strong>{formatDoy(resolvedLocation.lastFrostDoy)}</strong>. Første høstfrost:{" "}
              <strong>{formatDoy(resolvedLocation.firstFrostDoy)}</strong>.
            </p>
            {Math.abs(resolvedLocation.elevationShiftDays) >= 1 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Justert {resolvedLocation.elevationShiftDays > 0 ? "+" : ""}
                {Math.round(resolvedLocation.elevationShiftDays)} dager for høyde-forskjell ({resolvedLocation.userElevationM} m vs. stasjonens{" "}
                {resolvedLocation.station.elevationM} m).
              </p>
            )}
          </div>
        )}

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Klimadata fra Meteorologisk institutt, lisensiert under CC BY 3.0 NO.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <h2 className="text-lg font-semibold sm:text-xl">Rutenettstørrelse</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Tilpass størrelsen på hagekartet. Kasser flyttes ikke når du endrer størrelsen.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <label className="space-y-1 text-sm">
            <span className="block font-medium">Kolonner ({GRID_COLS_MIN}–{GRID_COLS_MAX})</span>
            <input
              type="number"
              inputMode="numeric"
              min={GRID_COLS_MIN}
              max={GRID_COLS_MAX}
              value={gridCols}
              onChange={(event) => setGridCols(Number(event.target.value))}
              className="input-touch w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="block font-medium">Rader ({GRID_ROWS_MIN}–{GRID_ROWS_MAX})</span>
            <input
              type="number"
              inputMode="numeric"
              min={GRID_ROWS_MIN}
              max={GRID_ROWS_MAX}
              value={gridRows}
              onChange={(event) => setGridRows(Number(event.target.value))}
              className="input-touch w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            />
          </label>
        </div>
        {gridError && (
          <p className="text-sm font-medium" style={{ color: "var(--red)" }}>
            {gridError}
          </p>
        )}
        {gridStatus && (
          <p className="text-sm font-medium" style={{ color: "var(--green)" }}>
            {gridStatus}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveGridSize}
            className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--green)", color: "white" }}
          >
            Lagre rutenett
          </button>
          <button
            type="button"
            onClick={handleResetGridSize}
            className="tap-target rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "var(--surface)" }}
          >
            Tilbakestill til standard
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Nåværende rutenett: {gridSize.cols} × {gridSize.rows}.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <h2 className="text-lg font-semibold sm:text-xl">Spirr backup</h2>
        <button
          type="button"
          onClick={exportData}
          className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--green)", color: "white" }}
        >
          Eksporter data
        </button>

        <div className="space-y-2">
          <p style={{ color: "var(--text-muted)" }}>Importer en tidligere eksportert Spirr backup:</p>
          <input
            type="file"
            accept=".json"
            onChange={handleBackupImport}
            className="input-touch w-full rounded-lg border p-2 text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          />
        </div>

        <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
          <p style={{ color: "var(--text-muted)" }}>Importer gartnerens eget oppsett:</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Sist oppdatert: {bundledBackupLastUpdated}
          </p>
          <button
            type="button"
            onClick={handleBundledImport}
            className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--green)", color: "white" }}
          >
            Importer gartnerens eget oppsett
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <h2 className="text-lg font-semibold sm:text-xl">Egne planter</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Planter du har lagt til selv. Vises sammen med de innebygde i plantevelgeren.
        </p>
        {customPlants.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Ingen egne planter ennå.
          </p>
        ) : (
          <ul className="space-y-2">
            {customPlants.map((plant) => {
              const familyInfo = FAMILY_INFO[plant.family];
              const familyLabel = language === "pl" ? familyInfo.name_pl : familyInfo.name_no;
              const categoryInfo = CATEGORY_LABELS[plant.category];
              const categoryLabel = language === "pl" ? categoryInfo.name_pl : categoryInfo.name_no;
              const isEditing = editingCustomPlantKey === plant.key;
              return (
                <li
                  key={plant.key}
                  className="space-y-2 rounded-lg border p-3"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
                >
                  {isEditing ? (
                    <CustomPlantForm
                      initial={plant}
                      onSubmit={(input) => {
                        updateCustomPlant(plant.key, input);
                        setEditingCustomPlantKey(null);
                      }}
                      onCancel={() => setEditingCustomPlantKey(null)}
                    />
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {plant.emoji} {plant.name_no}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCustomPlantKey(plant.key)}
                            className="rounded-lg border px-3 py-1.5 text-sm font-medium"
                            style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "var(--surface)" }}
                          >
                            Rediger
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Slett "${plant.name_no}" fra plantelisten?`)) {
                                deleteCustomPlant(plant.key);
                              }
                            }}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium"
                            style={{ backgroundColor: "var(--red-light)", color: "var(--red)" }}
                          >
                            Slett
                          </button>
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {categoryInfo.emoji} {categoryLabel} · {familyInfo.emoji} {familyLabel}
                      </p>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {showNewCustomPlant ? (
          <CustomPlantForm
            onSubmit={(input) => {
              addCustomPlant(input);
              setShowNewCustomPlant(false);
            }}
            onCancel={() => setShowNewCustomPlant(false)}
            submitLabel="Legg til plante"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNewCustomPlant(true)}
            className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--green)", color: "white" }}
          >
            + Ny egen plante
          </button>
        )}
      </section>

      <section className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--red)", backgroundColor: "var(--red-light)" }}>
        <h2 className="text-lg font-semibold sm:text-xl" style={{ color: "var(--red)" }}>
          Nullstill hage
        </h2>
        <p className="text-sm" style={{ color: "var(--text)" }}>
          Sletter alle kasser og plantinger. Språkvalg og rutenettstørrelse beholdes. Kan ikke angres.
        </p>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--red)", color: "white" }}
        >
          Nullstill hage
        </button>
      </section>

      <ConfirmModal
        open={pendingImport !== null}
        title="Bekreft import"
        body={importBody}
        confirmLabel="Erstatt og importer"
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmModal
        open={resetOpen}
        title="Nullstill hage?"
        destructive
        body={
          <div className="space-y-2">
            <p>Alle kasser og plantinger blir slettet.</p>
            <p style={{ color: "var(--text-muted)" }}>Du kommer tilbake til startsiden etterpå.</p>
          </div>
        }
        confirmLabel="Ja, nullstill"
        onConfirm={confirmReset}
        onCancel={() => setResetOpen(false)}
      />
    </main>
  );
}
