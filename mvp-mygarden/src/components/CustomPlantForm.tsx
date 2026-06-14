import { useState } from "react";
import { CATEGORY_LABELS, CATEGORY_VALUES, type PlantCategory } from "../lib/categories";
import { FAMILY_INFO, type PlantFamily } from "../lib/families";
import { useUiStore } from "../store/useUiStore";
import type { PlantInfo } from "../types";

const FAMILY_VALUES = Object.keys(FAMILY_INFO) as PlantFamily[];

interface CustomPlantFormProps {
  initial?: Partial<Omit<PlantInfo, "key">>;
  onSubmit: (plant: Omit<PlantInfo, "key">) => void;
  onCancel: () => void;
  submitLabel?: string;
}

// Renders as a <div> rather than a <form> so it can be embedded inside other
// forms (e.g. the PlantPicker inside BoxDetail's add-planting form) without
// the submit event bubbling to the outer form.
export function CustomPlantForm({ initial, onSubmit, onCancel, submitLabel = "Lagre" }: CustomPlantFormProps) {
  const language = useUiStore((state) => state.plantLanguage);
  const [name, setName] = useState(initial?.name_no ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🌱");
  const [category, setCategory] = useState<PlantCategory>(initial?.category ?? "vegetable");
  const [family, setFamily] = useState<PlantFamily>(initial?.family ?? "other");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    onSubmit({
      name_no: trimmed,
      name_pl: trimmed,
      name_en: trimmed,
      emoji: emoji.trim() || "🌱",
      category,
      family,
    });
  };

  return (
    <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
      <div className="grid grid-cols-[5rem_1fr] gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Emoji</span>
          <input
            value={emoji}
            onChange={(event) => setEmoji(event.target.value)}
            maxLength={4}
            className="input-touch w-full rounded-lg border px-3 py-2 text-center text-lg"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Navn</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="F.eks. Ringblomst"
            className="input-touch w-full rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="block font-medium">Kategori</span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as PlantCategory)}
          className="input-touch w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          {CATEGORY_VALUES.map((value) => {
            const info = CATEGORY_LABELS[value];
            return (
              <option key={value} value={value}>
                {info.emoji} {language === "pl" ? info.name_pl : info.name_no}
              </option>
            );
          })}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="block font-medium">Familie</span>
        <select
          value={family}
          onChange={(event) => setFamily(event.target.value as PlantFamily)}
          className="input-touch w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          {FAMILY_VALUES.map((value) => {
            const info = FAMILY_INFO[value];
            return (
              <option key={value} value={value}>
                {info.emoji} {language === "pl" ? info.name_pl : info.name_no}
              </option>
            );
          })}
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="tap-target rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: "var(--green)", color: "white" }}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}
