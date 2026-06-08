import { Link } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";
import { importLegacyExport } from "../lib/importLegacy";
import { loadBoxes, loadPlantings, saveBoxes, savePlantings } from "../lib/storage";

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
      const parsed = JSON.parse(event.target?.result as string);
      if (!Array.isArray(parsed.boxes) || !Array.isArray(parsed.plantings)) {
        alert("Ugyldig backup-fil. Velg en eksportert MyGarden backup-fil.");
        return;
      }
      if (confirm(`Importere ${parsed.boxes.length} kasser og ${parsed.plantings.length} plantinger?`)) {
        saveBoxes(parsed.boxes);
        savePlantings(parsed.plantings);
        window.location.href = "/";
      }
    } catch {
      alert("Kunne ikke lese backup-filen. Kontroller at den er gyldig JSON.");
    }
  };
  reader.readAsText(file);
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
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-4">
      <header className="rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="text-sm font-medium" style={{ color: "var(--green)" }}>
            ← Tilbake
          </Link>
          <LanguageToggle />
        </div>
        <h1 className="mt-2 text-2xl font-semibold">Innstillinger</h1>
      </header>

      <section className="space-y-2 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <h2 className="text-xl font-semibold">Importer fra DinoGarden</h2>
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
          className="w-full rounded-lg border p-2 text-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        />
      </section>

      <section className="space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <h2 className="text-xl font-semibold">MyGarden backup</h2>
        <button
          type="button"
          onClick={exportData}
          className="rounded-lg px-4 py-2 text-sm font-medium"
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
            className="w-full rounded-lg border p-2 text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          />
        </div>
      </section>
    </main>
  );
}
