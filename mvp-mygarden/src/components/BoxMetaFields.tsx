import {
  BED_TYPE_LABELS,
  BED_TYPE_VALUES,
  SUN_EXPOSURE_LABELS,
  SUN_EXPOSURE_VALUES,
  type BedType,
  type SunExposure,
} from "../lib/boxMeta";
import { useUiStore } from "../store/useUiStore";

interface BoxMetaFieldsProps {
  sunExposure: SunExposure | "";
  bedType: BedType | "";
  depthCm: number | "";
  onSunExposureChange: (value: SunExposure | "") => void;
  onBedTypeChange: (value: BedType | "") => void;
  onDepthCmChange: (value: number | "") => void;
}

export function BoxMetaFields({
  sunExposure,
  bedType,
  depthCm,
  onSunExposureChange,
  onBedTypeChange,
  onDepthCmChange,
}: BoxMetaFieldsProps) {
  const language = useUiStore((state) => state.plantLanguage);
  const unsetLabel = language === "pl" ? "— nie wybrano —" : "— ikke valgt —";

  return (
    <div className="space-y-3">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="block font-medium">Sol</span>
        <select
          value={sunExposure}
          onChange={(event) => onSunExposureChange(event.target.value as SunExposure | "")}
          className="input-touch w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <option value="">{unsetLabel}</option>
          {SUN_EXPOSURE_VALUES.map((value) => {
            const info = SUN_EXPOSURE_LABELS[value];
            return (
              <option key={value} value={value}>
                {info.emoji} {language === "pl" ? info.name_pl : info.name_no}
              </option>
            );
          })}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="block font-medium">Type seng</span>
        <select
          value={bedType}
          onChange={(event) => onBedTypeChange(event.target.value as BedType | "")}
          className="input-touch w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <option value="">{unsetLabel}</option>
          {BED_TYPE_VALUES.map((value) => {
            const info = BED_TYPE_LABELS[value];
            return (
              <option key={value} value={value}>
                {info.emoji} {language === "pl" ? info.name_pl : info.name_no}
              </option>
            );
          })}
        </select>
      </label>
    </div>
      <label className="space-y-1 text-sm">
        <span className="block font-medium">Dybde (cm)</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={200}
          value={depthCm}
          onChange={(event) => {
            const raw = event.target.value;
            onDepthCmChange(raw === "" ? "" : Math.max(0, Math.min(200, Math.round(Number(raw)))));
          }}
          placeholder="f.eks. 40"
          className="input-touch w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        />
        <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
          Anslag i cm. En pallekarm er typisk ~20 cm — to i stabel ≈ 40 cm. La stå tom for planter i bakken.
        </span>
      </label>
    </div>
  );
}
