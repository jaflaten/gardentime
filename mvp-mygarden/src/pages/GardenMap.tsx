import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode, type TouchEvent } from "react";
import { Link } from "react-router-dom";
import { BoxMetaFields } from "../components/BoxMetaFields";
import { ConfirmModal } from "../components/ConfirmModal";
import { FloatingUndo } from "../components/FloatingUndo";
import { GardenGrid, MAP_BASE_COL_WIDTH, MAX_MAP_ZOOM, MIN_MAP_ZOOM } from "../components/GardenGrid";
import { LanguageToggle } from "../components/LanguageToggle";
import { LastSavedBadge } from "../components/LastSavedBadge";
import { QuickAddSheet } from "../components/QuickAddSheet";
import type { BedType, SunExposure } from "../lib/boxMeta";
import { isCustomPlantLike } from "../lib/customPlants";
import { saveBoxes, savePlantings } from "../lib/storage";
import bundledGardenBackup from "../resources/mvp-mygarden-v2.json";
import { useCustomPlantsStore } from "../store/useCustomPlantsStore";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore } from "../store/useUiStore";
import type { Box, Planting, PlantInfo } from "../types";

interface PinchState {
  startDistance: number;
  startZoom: number;
}

interface PendingImport {
  source: string;
  boxes: Box[];
  plantings: Planting[];
  customPlants: PlantInfo[];
}

interface BackupPayload {
  boxes: unknown[];
  plantings: unknown[];
  customPlants?: unknown[];
}

function clampZoom(value: number) {
  return Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, Number(value.toFixed(2))));
}

function touchDistance(event: TouchEvent<HTMLElement>) {
  const [touchA, touchB] = [event.touches[0], event.touches[1]];
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function useViewMode(): boolean {
  return useMemo(() => new URLSearchParams(window.location.search).has("view"), []);
}

function gridFootprint(boxes: Box[]): { cols: number; rows: number } {
  if (boxes.length === 0) {
    return { cols: 0, rows: 0 };
  }
  // Mirrors the math in GardenGrid.tsx — see EXTRA_LEFT_COLS/EXTRA_TOP_ROWS.
  const EXTRA_LEFT = 4;
  const EXTRA_TOP = 14;
  let maxX = 0;
  let maxY = 0;
  boxes.forEach((box) => {
    const right = box.layout.x + box.layout.w + EXTRA_LEFT;
    const bottom = Math.max(-EXTRA_TOP, box.layout.y) + EXTRA_TOP + box.layout.h;
    if (right > maxX) {
      maxX = right;
    }
    if (bottom > maxY) {
      maxY = bottom;
    }
  });
  return { cols: maxX, rows: maxY };
}

export function GardenMap() {
  const viewMode = useViewMode();
  const [editMode, setEditMode] = useState(false);
  const [zoom, setZoom] = useState(0.9);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sunExposure, setSunExposure] = useState<SunExposure | "">("");
  const [bedType, setBedType] = useState<BedType | "">("");
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [quickAddBoxId, setQuickAddBoxId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinchStateRef = useRef<PinchState | null>(null);

  const boxes = useGardenStore((state) => state.boxes);
  const addBox = useGardenStore((state) => state.addBox);
  const reloadFromStorage = useGardenStore((state) => state.reloadFromStorage);
  const replaceCustomPlants = useCustomPlantsStore((state) => state.replaceAll);
  const gridSize = useUiStore((state) => state.gridSize);
  const ensureGridFits = useUiStore((state) => state.ensureGridFits);

  const showOnboarding = !viewMode && boxes.length === 0 && !onboardingDismissed;

  const onCreateBox = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    addBox(name.trim(), {
      description: description.trim() || undefined,
      sunExposure: sunExposure || undefined,
      bedType: bedType || undefined,
    });
    setName("");
    setDescription("");
    setSunExposure("");
    setBedType("");
    setShowCreateForm(false);
  };

  const zoomOut = () => setZoom((prev) => clampZoom(prev - 0.05));
  const zoomIn = () => setZoom((prev) => clampZoom(prev + 0.05));
  const zoomReset = () => setZoom(0.9);
  const zoomFit = () => {
    const availableWidth = Math.max(260, window.innerWidth - 32);
    const fitZoom = availableWidth / (gridSize.cols * MAP_BASE_COL_WIDTH);
    setZoom(clampZoom(fitZoom));
  };

  const onMapTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 2) {
      return;
    }
    pinchStateRef.current = {
      startDistance: touchDistance(event),
      startZoom: zoom,
    };
  };

  const onMapTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 2 || !pinchStateRef.current) {
      return;
    }
    event.preventDefault();
    const currentDistance = touchDistance(event);
    const scale = currentDistance / pinchStateRef.current.startDistance;
    setZoom(clampZoom(pinchStateRef.current.startZoom * scale));
  };

  const onMapTouchEnd = () => {
    if (pinchStateRef.current) {
      pinchStateRef.current = null;
    }
  };

  const startEmpty = () => {
    setOnboardingDismissed(true);
    setEditMode(true);
    setShowCreateForm(true);
  };

  const startBundled = () => {
    const parsed = bundledGardenBackup as BackupPayload;
    if (!Array.isArray(parsed.boxes) || !Array.isArray(parsed.plantings)) {
      return;
    }
    setPendingImport({
      source: "innebygd standardoppsett",
      boxes: parsed.boxes as Box[],
      plantings: parsed.plantings as Planting[],
      customPlants: [],
    });
  };

  const onBackupFile = (event: ChangeEvent<HTMLInputElement>) => {
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
          alert("Ugyldig backup-fil.");
          return;
        }
        const importedCustomPlants = Array.isArray(parsed.customPlants)
          ? (parsed.customPlants.filter(isCustomPlantLike) as PlantInfo[])
          : [];
        setPendingImport({
          source: "MyGarden backup-fil",
          boxes: parsed.boxes as Box[],
          plantings: parsed.plantings as Planting[],
          customPlants: importedCustomPlants,
        });
      } catch {
        alert("Kunne ikke lese filen.");
      }
    };
    reader.readAsText(file);
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
    setOnboardingDismissed(true);
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

  if (showOnboarding) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <header className="rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-semibold sm:text-2xl">🌱 Velkommen til MyGarden</h1>
            <LanguageToggle />
          </div>
        </header>

        <section className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <p>Velg hvordan du vil starte:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={startEmpty}
              className="tap-target rounded-lg border p-4 text-left text-sm font-medium"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
            >
              <span className="block text-base font-semibold">Tom hage</span>
              <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                Start fra bunnen og legg til kasser selv.
              </span>
            </button>
            <button
              type="button"
              onClick={startBundled}
              className="tap-target rounded-lg border p-4 text-left text-sm font-medium"
              style={{ borderColor: "var(--green)", backgroundColor: "var(--green-light)", color: "var(--text)" }}
            >
              <span className="block text-base font-semibold">Standardoppsett</span>
              <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                Importer det innebygde eksempeloppsettet.
              </span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="tap-target rounded-lg border p-4 text-left text-sm font-medium"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
            >
              <span className="block text-base font-semibold">Importer JSON-fil</span>
              <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                Last opp en MyGarden backup-fil.
              </span>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={onBackupFile} />
          <div className="pt-1 text-sm">
            <Link to="/settings" style={{ color: "var(--green)" }}>
              ⚙ Innstillinger
            </Link>
          </div>
        </section>

        <ConfirmModal
          open={pendingImport !== null}
          title="Bekreft import"
          body={importBody}
          confirmLabel="Erstatt og importer"
          onConfirm={confirmImport}
          onCancel={() => setPendingImport(null)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
      <header
        className="sticky top-0 z-20 flex flex-col gap-2 rounded-xl border p-3 backdrop-blur-sm sm:p-4"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold sm:text-2xl">
            🌱 Hagen vår{viewMode && <span className="ml-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>(visning)</span>}
          </h1>
          <LastSavedBadge />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageToggle />
          {!viewMode && (
            <>
              <Link
                to="/settings"
                className="tap-target rounded-lg border px-3 py-2 text-sm font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                ⚙ Innstillinger
              </Link>
              <button
                type="button"
                onClick={() => {
                  setEditMode((prev) => !prev);
                  setShowCreateForm(false);
                }}
                className="tap-target rounded-lg px-3 py-2 text-sm font-medium"
                style={{
                  backgroundColor: editMode ? "var(--green-light)" : "var(--gray-light)",
                  color: editMode ? "var(--green)" : "var(--text)",
                }}
              >
                {editMode ? "Ferdig" : "Rediger"}
              </button>
            </>
          )}
        </div>
      </header>

      <section className="rounded-xl border p-2 sm:p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="tap-target rounded-lg px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
          >
            − Zoom ut
          </button>
          <button
            type="button"
            onClick={zoomReset}
            className="tap-target rounded-lg px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
          >
            100%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="tap-target rounded-lg px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
          >
            + Zoom inn
          </button>
          <button
            type="button"
            onClick={zoomFit}
            className="tap-target rounded-lg px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--green-light)", color: "var(--green)" }}
          >
            Tilpass
          </button>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {Math.round(zoom * 100)}%
          </span>
          <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
            Rutenett: {gridSize.cols} × {gridSize.rows}
          </span>
        </div>
        <p className="mb-2 text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
          Tips: Klyp med to fingre for å zoome. Trykk på + på en kasse for hurtig-legg til.
        </p>
        <div
          className={editMode ? "edit-mode" : ""}
          onTouchStart={onMapTouchStart}
          onTouchMove={onMapTouchMove}
          onTouchEnd={onMapTouchEnd}
          onTouchCancel={onMapTouchEnd}
        >
          <GardenGrid
            editMode={editMode}
            zoom={zoom}
            onLongPressBox={editMode || viewMode ? undefined : (boxId) => setQuickAddBoxId(boxId)}
          />
        </div>
      </section>

      <FloatingUndo editMode={editMode && !viewMode} />

      <QuickAddSheet box={boxes.find((box) => box.id === quickAddBoxId) ?? null} onClose={() => setQuickAddBoxId(null)} />

      {editMode && !viewMode && (
        <section className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="tap-target w-full rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--green)", color: "white" }}
            >
              + Ny kasse
            </button>
          ) : (
            <form className="space-y-3" onSubmit={onCreateBox}>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Navn</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="input-touch w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Beskrivelse (valgfritt)</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={2}
                  className="input-touch w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                />
              </div>
              <BoxMetaFields
                sunExposure={sunExposure}
                bedType={bedType}
                onSunExposureChange={setSunExposure}
                onBedTypeChange={setBedType}
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
                  onClick={() => setShowCreateForm(false)}
                  className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
                >
                  Avbryt
                </button>
              </div>
            </form>
          )}
        </section>
      )}

    </main>
  );
}
