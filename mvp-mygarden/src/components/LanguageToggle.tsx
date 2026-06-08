import { useUiStore } from "../store/useUiStore";

export function LanguageToggle() {
  const plantLanguage = useUiStore((state) => state.plantLanguage);
  const togglePlantLanguage = useUiStore((state) => state.togglePlantLanguage);

  return (
    <button
      type="button"
      onClick={togglePlantLanguage}
      className="rounded-lg border px-3 py-2 text-sm font-medium"
      style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "var(--surface)" }}
      title="Bytt språk for plantenavn"
    >
      {plantLanguage === "no" ? "NO → PL" : "PL → NO"}
    </button>
  );
}
