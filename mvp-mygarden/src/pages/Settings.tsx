import { Link } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";
import { importLegacyExport } from "../lib/importLegacy";
import { loadBoxes, loadPlantings, saveBoxes, savePlantings } from "../lib/storage";
import bundledGardenBackup from "../resources/mvp-mygarden-v1.json";
import type { Box, Planting } from "../types";

interface BackupPayload {
  version?: unknown;
  exportedAt?: unknown;
  boxes: unknown[];
  plantings: unknown[];
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

function applyBackupImport(parsed: BackupPayload) {
  if (!Array.isArray(parsed.boxes) || !Array.isArray(parsed.plantings)) {
    alert("Ugyldig backup-fil. Velg en eksportert MyGarden backup-fil.");
    return;
  }
  if (!parsed.boxes.every(isBoxLike) || !parsed.plantings.every(isPlantingLike)) {
    alert("Backup-filen mangler nødvendige felter.");
    return;
  }
  if (confirm(`Importere ${parsed.boxes.length} kasser og ${parsed.plantings.length} plantinger?`)) {
    saveBoxes(parsed.boxes);
    savePlantings(parsed.plantings);
    window.location.href = "/";
  }
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

function importData(file: File) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target?.result as string) as BackupPayload;
      applyBackupImport(parsed);
    } catch {
      alert("Kunne ikke lese backup-filen. Kontroller at den er gyldig JSON.");
    }
  };
  reader.readAsText(file);
}

function importBundledBackup() {
  applyBackupImport(bundledGardenBackup as BackupPayload);
}

function handleLegacyImport(file: File) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const boxes = importLegacyExport(event.target?.result as string);
      const existingPlantings = loadPlantings().length;
      const warning =
        existingPlantings > 0
          ? `Importer ${boxes.length} kasser fra DinoGarden? Dette erstatter eksisterende kasser og sletter ${existingPlantings} plantinger.`
          : `Importer ${boxes.length} kasser fra DinoGarden? Dette erstatter eksisterende kasser.`;

      if (confirm(warning)) {
        saveBoxes(boxes);
        savePlantings([]);
        window.location.href = "/";
      }
    } catch {
      alert("Kunne ikke lese filen. Er det en gyldig DinoGarden-eksport?");
    }
  };
  reader.readAsText(file);
}

export function Settings() {
  const bundledBackupLastUpdated = formatBackupTimestamp((bundledGardenBackup as BackupPayload).exportedAt);

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

      <section className="space-y-2 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <h2 className="text-lg font-semibold sm:text-xl">Importer fra DinoGarden</h2>
        <p style={{ color: "var(--text-muted)" }}>Last opp en DinoGarden JSON-eksport for å importere kasser med oppsett.</p>
        <input
          type="file"
          accept=".json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleLegacyImport(file);
            }
          }}
          className="input-touch w-full rounded-lg border p-2 text-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        />
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
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                importData(file);
              }
              event.currentTarget.value = "";
            }}
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
            onClick={() => {
              importBundledBackup();
            }}
            className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--green)", color: "white" }}
          >
            Importer standard MyGarden-oppsett
          </button>
        </div>
      </section>
    </main>
  );
}
