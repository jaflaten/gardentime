import { useState } from "react";
import { type SunNeed } from "../lib/boxMeta";
import { CATEGORY_LABELS, CATEGORY_VALUES, type PlantCategory } from "../lib/categories";
import { FAMILY_INFO, type PlantFamily } from "../lib/families";
import { useUiStore } from "../store/useUiStore";
import type { HarvestRule, PlantInfo, SowRule } from "../types";

const FAMILY_VALUES = Object.keys(FAMILY_INFO) as PlantFamily[];

const MONTHS_NO = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

const SUN_NEED_LABELS: Record<SunNeed, string> = {
  full: "☀️ Full sol",
  partial: "⛅ Delvis sol",
  shade: "🌥 Skygge",
};
const SUN_NEED_VALUES: SunNeed[] = ["full", "partial", "shade"];

/** Split a stored "MM-DD" into editable {month,day} strings (no leading zeros). */
function mmddToParts(mmdd: string): { month: string; day: string } {
  const [m, d] = mmdd.split("-");
  return { month: String(Number(m)), day: String(Number(d)) };
}

/** Build a "MM-DD" from the month/day inputs, or null when either is out of range. */
function partsToMmdd(month: string, day: string): string | null {
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(d) || d < 1 || d > 31) {
    return null;
  }
  return `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

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

type HarvestKind = "none" | "fromSowing" | "beforeFirstFrost" | "seasonal";

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

interface HarvestState {
  kind: HarvestKind;
  fromSowingMin: string;
  fromSowingMax: string;
  beforeFirstFrost: string;
  seasonalFromMonth: string;
  seasonalFromDay: string;
  seasonalToMonth: string;
  seasonalToDay: string;
}

const EMPTY_HARVEST: HarvestState = {
  kind: "none",
  fromSowingMin: "",
  fromSowingMax: "",
  beforeFirstFrost: "",
  seasonalFromMonth: "",
  seasonalFromDay: "",
  seasonalToMonth: "",
  seasonalToDay: "",
};

function initialHarvest(rule?: HarvestRule): HarvestState {
  if (rule && "weeksFromSowing" in rule) {
    return { ...EMPTY_HARVEST, kind: "fromSowing", fromSowingMin: String(rule.weeksFromSowing[0]), fromSowingMax: String(rule.weeksFromSowing[1]) };
  }
  if (rule && "weeksBeforeFirstFrost" in rule) {
    return { ...EMPTY_HARVEST, kind: "beforeFirstFrost", beforeFirstFrost: String(rule.weeksBeforeFirstFrost) };
  }
  if (rule && "seasonal" in rule) {
    const from = mmddToParts(rule.seasonal[0]);
    const to = mmddToParts(rule.seasonal[1]);
    return {
      ...EMPTY_HARVEST,
      kind: "seasonal",
      seasonalFromMonth: from.month,
      seasonalFromDay: from.day,
      seasonalToMonth: to.month,
      seasonalToDay: to.day,
    };
  }
  return EMPTY_HARVEST;
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
    Boolean(
      (initial?.sowRules && initial.sowRules.length > 0) ||
        initial?.harvestRule ||
        initial?.perennial ||
        initial?.sunNeed ||
        initial?.minDepthCm != null,
    ),
  );
  const [indoor, setIndoor] = useState<SowSubState>(() => initialIndoor(initial?.sowRules));
  const [outdoor, setOutdoor] = useState<OutdoorSubState>(() => initialOutdoor(initial?.sowRules));
  const [transplant, setTransplant] = useState<SowSubState>(() => initialTransplant(initial?.sowRules));
  const [harvest, setHarvest] = useState(() => initialHarvest(initial?.harvestRule));
  const [harvestDuration, setHarvestDuration] = useState(
    initial?.harvestDurationWeeks != null ? String(initial.harvestDurationWeeks) : "",
  );
  const [perennial, setPerennial] = useState(Boolean(initial?.perennial));
  const [sunNeed, setSunNeed] = useState<SunNeed | "">(initial?.sunNeed ?? "");
  const [minDepthCm, setMinDepthCm] = useState(initial?.minDepthCm != null ? String(initial.minDepthCm) : "");

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
    let harvestDurationWeeks: number | undefined;
    if (harvest.kind === "fromSowing") {
      const range = toRange(harvest.fromSowingMin, harvest.fromSowingMax);
      if (range) {
        harvestRule = { weeksFromSowing: range };
        // Picking duration only applies to a from-sowing harvest window.
        const durationNum = harvestDuration.trim() === "" ? NaN : Number(harvestDuration);
        if (Number.isFinite(durationNum) && durationNum > 0) {
          harvestDurationWeeks = Math.round(durationNum);
        }
      }
    } else if (harvest.kind === "beforeFirstFrost") {
      const n = Number(harvest.beforeFirstFrost);
      if (Number.isFinite(n)) {
        harvestRule = { weeksBeforeFirstFrost: Math.round(n) };
      }
    } else if (harvest.kind === "seasonal") {
      const from = partsToMmdd(harvest.seasonalFromMonth, harvest.seasonalFromDay);
      const to = partsToMmdd(harvest.seasonalToMonth, harvest.seasonalToDay);
      if (from && to) {
        harvestRule = { seasonal: [from, to] };
      }
    }

    const minDepthNum = minDepthCm.trim() === "" ? NaN : Number(minDepthCm);
    const minDepthValue = Number.isFinite(minDepthNum) && minDepthNum > 0 ? Math.round(minDepthNum) : undefined;

    onSubmit({
      name_no: trimmed,
      name_pl: trimmed,
      name_en: trimmed,
      emoji: emoji.trim() || "🌱",
      category,
      family,
      ...(sowRules.length > 0 ? { sowRules } : {}),
      ...(harvestRule ? { harvestRule } : {}),
      ...(harvestDurationWeeks != null ? { harvestDurationWeeks } : {}),
      ...(perennial ? { perennial: true } : {}),
      ...(sunNeed ? { sunNeed } : {}),
      ...(minDepthValue != null ? { minDepthCm: minDepthValue } : {}),
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
                <div className="ml-6 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
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
                  <label className="space-y-1 text-xs">
                    <span className="block" style={{ color: "var(--text-muted)" }}>
                      Høsteperiode (uker, valgfritt) — hvor lenge den høstes (f.eks. tomat, bønner)
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="f.eks. 8"
                      value={harvestDuration}
                      onChange={(event) => setHarvestDuration(event.target.value)}
                      className="input-touch w-full rounded-lg border px-3 py-2 sm:max-w-[8rem]"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                    />
                  </label>
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
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={harvest.kind === "seasonal"}
                  onChange={() => setHarvest((prev) => ({ ...prev, kind: "seasonal" }))}
                />
                Fast høstesesong (samme datoer hvert år)
              </label>
              {harvest.kind === "seasonal" && (
                <div className="ml-6 space-y-2">
                  <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                    For flerårige planter (jordbær, rabarbra) som høstes i samme periode hvert år. Bruk gjerne datoene som
                    passer din hage.
                  </span>
                  <SeasonalDateRow
                    label="Fra"
                    month={harvest.seasonalFromMonth}
                    day={harvest.seasonalFromDay}
                    onMonthChange={(month) => setHarvest((prev) => ({ ...prev, seasonalFromMonth: month }))}
                    onDayChange={(day) => setHarvest((prev) => ({ ...prev, seasonalFromDay: day }))}
                  />
                  <SeasonalDateRow
                    label="Til"
                    month={harvest.seasonalToMonth}
                    day={harvest.seasonalToDay}
                    onMonthChange={(month) => setHarvest((prev) => ({ ...prev, seasonalToMonth: month }))}
                    onDayChange={(day) => setHarvest((prev) => ({ ...prev, seasonalToDay: day }))}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t pt-2" style={{ borderColor: "var(--border)" }}>
            <span className="block text-sm font-medium">Voksekrav (valgfritt)</span>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={perennial} onChange={(event) => setPerennial(event.target.checked)} />
              Flerårig — kommer igjen hvert år
            </label>
            {perennial && (
              <p className="ml-6 text-xs" style={{ color: "var(--text-muted)" }}>
                Flerårige planter teller ikke i vekstskifte, og høstes ofte i en fast sesong — sett «Fast høstesesong»
                over for å vise høstevinduet i Sesongoversikt.
              </p>
            )}
            <label className="space-y-1 text-sm">
              <span className="block">Lysbehov</span>
              <select
                value={sunNeed}
                onChange={(event) => setSunNeed(event.target.value as SunNeed | "")}
                className="input-touch w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              >
                <option value="">Ikke angitt</option>
                {SUN_NEED_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {SUN_NEED_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="block">Min. jorddybde (cm, valgfritt)</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="f.eks. 30 for rotgrønnsaker"
                value={minDepthCm}
                onChange={(event) => setMinDepthCm(event.target.value)}
                className="input-touch w-full rounded-lg border px-3 py-2 sm:max-w-[12rem]"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              />
            </label>
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

interface SeasonalDateRowProps {
  label: string;
  month: string;
  day: string;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
}

function SeasonalDateRow({ label, month, day, onMonthChange, onDayChange }: SeasonalDateRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <select
        value={month}
        onChange={(event) => onMonthChange(event.target.value)}
        className="input-touch flex-1 rounded-lg border px-2 py-2"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <option value="">Måned</option>
        {MONTHS_NO.map((name, index) => (
          <option key={name} value={String(index + 1)}>
            {name}
          </option>
        ))}
      </select>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={31}
        placeholder="dag"
        value={day}
        onChange={(event) => onDayChange(event.target.value)}
        className="input-touch w-20 rounded-lg border px-2 py-2"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      />
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
