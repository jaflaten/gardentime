import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { GardenGrid } from "../components/GardenGrid";
import { LanguageToggle } from "../components/LanguageToggle";
import { useGardenStore } from "../store/useGardenStore";

export function GardenMap() {
  const [editMode, setEditMode] = useState(false);
  const [zoom, setZoom] = useState(0.9);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const addBox = useGardenStore((state) => state.addBox);

  const onCreateBox = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    addBox(name.trim(), description.trim() || undefined);
    setName("");
    setDescription("");
    setShowCreateForm(false);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-3 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <h1 className="text-2xl font-semibold">🌱 Hagen vår</h1>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <div className="flex items-center gap-1 rounded-lg border px-2 py-1 text-sm" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.65, Number((prev - 0.05).toFixed(2))))}
              className="rounded px-2 py-1"
              style={{ backgroundColor: "var(--gray-light)" }}
              aria-label="Zoom ut"
            >
              −
            </button>
            <span className="min-w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(1, Number((prev + 0.05).toFixed(2))))}
              className="rounded px-2 py-1"
              style={{ backgroundColor: "var(--gray-light)" }}
              aria-label="Zoom inn"
            >
              +
            </button>
          </div>
          <Link
            to="/settings"
            className="rounded-lg border px-3 py-2 text-sm font-medium"
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
            className="rounded-lg px-3 py-2 text-sm font-medium"
            style={{
              backgroundColor: editMode ? "var(--green-light)" : "var(--gray-light)",
              color: editMode ? "var(--green)" : "var(--text)",
            }}
          >
            {editMode ? "Ferdig" : "Rediger"}
          </button>
        </div>
      </header>

      <section className={`rounded-xl border p-3 ${editMode ? "edit-mode" : ""}`} style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <GardenGrid editMode={editMode} zoom={zoom} />
      </section>

      {editMode && (
        <section className="space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full rounded-lg px-4 py-2 text-sm font-medium"
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
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Beskrivelse (valgfritt)</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: "var(--green)", color: "white" }}
                >
                  Lagre
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium"
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
