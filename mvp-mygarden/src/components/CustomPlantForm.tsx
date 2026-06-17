import { useState } from "react";
import { CATEGORY_LABELS, CATEGORY_VALUES, type PlantCategory } from "../lib/categories";
import { FAMILY_INFO, type PlantFamily } from "../lib/families";
import { useUiStore } from "../store/useUiStore";
import type { HarvestRule, PlantInfo, SowRule } from "../types";

const FAMILY_VALUES = Object.keys(FAMILY_INFO) as PlantFamily[];

interface CustomPlantFormProps {
  initial?: Partial<Omit<PlantInfo, "key">>;
  onSubmit: (plant: Omit<PlantInfo, "key">) => void;
  onCancel: () => void;
  submitLabel?: string;
}

interface SowSubState {
  enabled: boolean;
  min: string;
  max: string;
}

interface OutdoorSubState extends SowSubState {
  minSoilTempC: string;
}

type HarvestKind = "none" | "fromSowing" | "beforeFirstFrost";

function findSowRule<T extends SowRule["type"]>(rules: SowRule[] | undefined, type: T): Extract<SowRule, { type: T }> | undefined {
  return rules?.find((rule): rule is Extract<SowRule, { type: T }> => rule.type === type);
}

function initialIndoor(initial?: SowRule[]): SowSubState {
  const rule = findSowRule(initial, "indoor");
  return rule
    ? { enabled: true, min: String(rule.weeksBeforeLastFrost[0]), max: String(rule.weeksBeforeLastFrost[1]) }
    : { enabled: false, min: "", max: "" };
}

function initialOutdoor(initial?: SowRule[]): OutdoorSubState {
  const rule = findSowRule(initial, "outdoor");
  return rule
    ? {
        enabled: true,
        min: String(rule.weeksAfterLastFrost[0]),
        max: String(rule.weeksAfterLastFrost[1]),
        minSoilTempC: rule.minSoilTempC != null ? String(rule.minSoilTempC) : "",
      }
    : { enabled: false, min: "", max: "", minSoilTempC: "" };
}

function initialTransplant(initial?: SowRule[]): SowSubState {
  const rule = findSowRule(initial, "transplant");
  return rule
    ? { enabled: true, min: String(rule.weeksAfterLastFrost[0]), max: String(rule.weeksAfterLastFrost[1]) }
    : { enabled: false, min: "", max: "" };
}

function initialHarvest(rule?: HarvestRule): {
  kind: HarvestKind;
  fromSowingMin: string;
  fromSowingMax: string;
  beforeFirstFrost: string;
} {
  if (rule && "weeksFromSowing" in rule) {
    return {
      kind: "fromSowing",
      fromSowingMin: String(rule.weeksFromSowing[0]),
      fromSowingMax: String(rule.weeksFromSowing[1]),
      beforeFirstFrost: "",
    };
  }
  if (rule && "weeksBeforeFirstFrost" in rule) {
    return {
      kind: "beforeFirstFrost",
      fromSowingMin: "",
      fromSowingMax: "",
      beforeFirstFrost: String(rule.weeksBeforeFirstFrost),
    };
  }
  return { kind: "none", fromSowingMin: "", fromSowingMax: "", beforeFirstFrost: "" };
}

function toRange(min: string, max: string): [number, number] | null {
  const lo = Number(min);
  const hi = Number(max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return null;
  }
  return [Math.round(lo), Math.round(hi)];
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
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean((initial?.sowRules && initial.sowRules.length > 0) || initial?.harvestRule),
  );
  const [indoor, setIndoor] = useState<SowSubState>(() => initialIndoor(initial?.sowRules));
  const [outdoor, setOutdoor] = useState<OutdoorSubState>(() => initialOutdoor(initial?.sowRules));
  const [transplant, setTransplant] = useState<SowSubState>(() => initialTransplant(initial?.sowRules));
  const [harvest, setHarvest] = useState(() => initialHarvest(initial?.harvestRule));

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const sowRules: SowRule[] = [];
    if (indoor.enabled) {
      const range = toRange(indoor.min, indoor.max);
      if (range) {
        sowRules.push({ type: "indoor", weeksBeforeLastFrost: range });
      }
    }
    if (outdoor.enabled) {
      const range = toRange(outdoor.min, outdoor.max);
      if (range) {
        const minSoilTempCNum = outdoor.minSoilTempC.trim() === "" ? undefined : Number(outdoor.minSoilTempC);
        sowRules.push({
          type: "outdoor",
          weeksAfterLastFrost: range,
          ...(Number.isFinite(minSoilTempCNum) ? { minSoilTempC: minSoilTempCNum as number } : {}),
        });
      }
    }
    if (transplant.enabled) {
      const range = toRange(transplant.min, transplant.max);
      if (range) {
        sowRules.push({ type: "transplant", weeksAfterLastFrost: range });
      }
    }

    let harvestRule: HarvestRule | undefined;
    if (harvest.kind === "fromSowing") {
      const range = toRange(harvest.fromSowingMin, harvest.fromSowingMax);
      if (range) {
        harvestRule = { weeksFromSowing: range };
      }
    } else if (harvest.kind === "beforeFirstFrost") {
      const n = Number(harvest.beforeFirstFrost);
      if (Number.isFinite(n)) {
        harvestRule = { weeksBeforeFirstFrost: Math.round(n) };
      }
    }

    onSubmit({
      name_no: trimmed,
      name_pl: trimmed,
      name_en: trimmed,
      emoji: emoji.trim() || "🌱",
      category,
      family,
      ...(sowRules.length > 0 ? { sowRules } : {}),
      ...(harvestRule ? { harvestRule } : {}),
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

      <button
        type="button"
        onClick={() => setShowAdvanced((prev) => !prev)}
        className="text-sm font-medium underline"
        style={{ color: "var(--green)" }}
      >
        {showAdvanced ? "Skjul avansert: så- og høstetider" : "Vis avansert: så- og høstetider"}
      </button>

      {showAdvanced && (
        <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Definer perioden plant kan såes/plantes ut i forhold til siste vårfrost. Brukes til
            <em> &quot;Hva passer å så nå?&quot;</em>-kortet.
          </p>

          <SowRuleEditor
            label="Så inne (forkultivering)"
            helper="Uker FØR siste vårfrost"
            enabled={indoor.enabled}
            onEnabledChange={(enabled) => setIndoor((prev) => ({ ...prev, enabled }))}
            min={indoor.min}
            max={indoor.max}
            onMinChange={(min) => setIndoor((prev) => ({ ...prev, min }))}
            onMaxChange={(max) => setIndoor((prev) => ({ ...prev, max }))}
          />

          <SowRuleEditor
            label="Så ute (direktesåing)"
            helper="Uker ETTER siste vårfrost"
            enabled={outdoor.enabled}
            onEnabledChange={(enabled) => setOutdoor((prev) => ({ ...prev, enabled }))}
            min={outdoor.min}
            max={outdoor.max}
            onMinChange={(min) => setOutdoor((prev) => ({ ...prev, min }))}
            onMaxChange={(max) => setOutdoor((prev) => ({ ...prev, max }))}
            extra={
              <label className="space-y-1 text-xs">
                <span className="block">Min. jordtemperatur (°C, valgfritt)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={outdoor.minSoilTempC}
                  onChange={(event) => setOutdoor((prev) => ({ ...prev, minSoilTempC: event.target.value }))}
                  className="input-touch w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                />
              </label>
            }
          />

          <SowRuleEditor
            label="Plant ut (forkultiverte planter)"
            helper="Uker ETTER siste vårfrost"
            enabled={transplant.enabled}
            onEnabledChange={(enabled) => setTransplant((prev) => ({ ...prev, enabled }))}
            min={transplant.min}
            max={transplant.max}
            onMinChange={(min) => setTransplant((prev) => ({ ...prev, min }))}
            onMaxChange={(max) => setTransplant((prev) => ({ ...prev, max }))}
          />

          <div className="space-y-2 border-t pt-2" style={{ borderColor: "var(--border)" }}>
            <span className="block text-sm font-medium">Høstetidspunkt</span>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={harvest.kind === "none"}
                  onChange={() => setHarvest((prev) => ({ ...prev, kind: "none" }))}
                />
                Ikke angitt
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={harvest.kind === "fromSowing"}
                  onChange={() => setHarvest((prev) => ({ ...prev, kind: "fromSowing" }))}
                />
                Antall uker fra såing
              </label>
              {harvest.kind === "fromSowing" && (
                <div className="ml-6 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Min"
                    value={harvest.fromSowingMin}
                    onChange={(event) => setHarvest((prev) => ({ ...prev, fromSowingMin: event.target.value }))}
                    className="input-touch w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Max"
                    value={harvest.fromSowingMax}
                    onChange={(event) => setHarvest((prev) => ({ ...prev, fromSowingMax: event.target.value }))}
                    className="input-touch w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                  />
                </div>
              )}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={harvest.kind === "beforeFirstFrost"}
                  onChange={() => setHarvest((prev) => ({ ...prev, kind: "beforeFirstFrost" }))}
                />
                Uker før første høstfrost
              </label>
              {harvest.kind === "beforeFirstFrost" && (
                <div className="ml-6">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="f.eks. 4"
                    value={harvest.beforeFirstFrost}
                    onChange={(event) => setHarvest((prev) => ({ ...prev, beforeFirstFrost: event.target.value }))}
                    className="input-touch w-full rounded-lg border px-3 py-2 sm:max-w-[8rem]"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

interface SowRuleEditorProps {
  label: string;
  helper: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  extra?: React.ReactNode;
}

function SowRuleEditor({ label, helper, enabled, onEnabledChange, min, max, onMinChange, onMaxChange, extra }: SowRuleEditorProps) {
  return (
    <div className="space-y-2 border-t pt-2 first:border-t-0 first:pt-0" style={{ borderColor: "var(--border)" }}>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
        {label}
      </label>
      {enabled && (
        <div className="ml-6 space-y-2">
          <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
            {helper}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={min}
              onChange={(event) => onMinChange(event.target.value)}
              className="input-touch w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={max}
              onChange={(event) => onMaxChange(event.target.value)}
              className="input-touch w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            />
          </div>
          {extra}
        </div>
      )}
    </div>
  );
}
