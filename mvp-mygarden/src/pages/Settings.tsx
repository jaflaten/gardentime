import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { LanguageToggle } from "../components/LanguageToggle";
import { EXTRA_LEFT_COLS, EXTRA_TOP_ROWS } from "../components/GardenGrid";
import { loadBoxes, loadPlantings, saveBoxes, savePlantings } from "../lib/storage";
import bundledGardenBackup from "../resources/mvp-mygarden-v2.json";
import { useGardenStore } from "../store/useGardenStore";
import {
  DEFAULT_GRID_SIZE,
  GRID_COLS_MAX,
  GRID_COLS_MIN,
  GRID_ROWS_MAX,
  GRID_ROWS_MIN,
  useUiStore,
} from "../store/useUiStore";
import type { Box, Planting } from "../types";

interface BackupPayload {
  version?: unknown;
  exportedAt?: unknown;
  boxes: unknown[];
  plantings: unknown[];
}

interface PendingImport {
  source: string;
  boxes: Box[];
  plantings: Planting[];
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
    typeof planting.boxId === "string" &&
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
    version: 1,
    exportedAt: new Date().toISOString(),
    boxes: loadBoxes(),
    plantings: loadPlantings(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `gardentime-backup-${new Date().toISOString().split("T")[0]}.json`;
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

  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [gridCols, setGridCols] = useState(gridSize.cols);
  const [gridRows, setGridRows] = useState(gridSize.rows);
  const [gridError, setGridError] = useState<string | null>(null);
  const [gridStatus, setGridStatus] = useState<string | null>(null);

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
          alert("Ugyldig backup-fil. Velg en eksportert MyGarden backup-fil.");
          return;
        }
        if (!parsed.boxes.every(isBoxLike) || !parsed.plantings.every(isPlantingLike)) {
          alert("Backup-filen mangler nødvendige felter.");
          return;
        }
        setPendingImport({ source: "MyGarden backup-fil", boxes: parsed.boxes, plantings: parsed.plantings });
      } catch {
        alert("Kunne ikke lese backup-filen. Kontroller at den er gyldig JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleBundledImport = () => {
    const parsed = bundledGardenBackup as BackupPayload;
    if (!Array.isArray(parsed.boxes) || !parsed.boxes.every(isBoxLike)) {
      alert("Innebygd standardoppsett mangler nødvendige felter.");
      return;
    }
    if (!Array.isArray(parsed.plantings) || !parsed.plantings.every(isPlantingLike)) {
      alert("Innebygd standardoppsett mangler nødvendige felter.");
      return;
    }
    setPendingImport({ source: "innebygd standardoppsett", boxes: parsed.boxes, plantings: parsed.plantings });
  };

  const confirmImport = () => {
    if (!pendingImport) {
      return;
    }
    saveBoxes(pendingImport.boxes);
    savePlantings(pendingImport.plantings);
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
        Importer <strong>{pendingImport.boxes.length}</strong> kasser og{" "}
        <strong>{pendingImport.plantings.length}</strong> plantinger fra {pendingImport.source}?
      </p>
      <p style={{ color: "var(--text-muted)" }}>Dette erstatter eksisterende kasser og plantinger.</p>
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
        <h2 className="text-lg font-semibold sm:text-xl">MyGarden backup</h2>
        <button
          type="button"
          onClick={exportData}
          className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--green)", color: "white" }}
        >
          Eksporter data
        </button>

        <div className="space-y-2">
          <p style={{ color: "var(--text-muted)" }}>Importer en tidligere eksportert MyGarden backup:</p>
          <input
            type="file"
            accept=".json"
            onChange={handleBackupImport}
            className="input-touch w-full rounded-lg border p-2 text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          />
        </div>

        <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
          <p style={{ color: "var(--text-muted)" }}>Importer standardoppsett fra appen:</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Sist oppdatert: {bundledBackupLastUpdated}
          </p>
          <button
            type="button"
            onClick={handleBundledImport}
            className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--green)", color: "white" }}
          >
            Importer standard MyGarden-oppsett
          </button>
        </div>
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
