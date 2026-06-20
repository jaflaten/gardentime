import { defaultSowMethod, otherMethod, type SowMethod } from "../lib/sowMethod";
import type { PlantInfo } from "../types";

interface SowMethodFieldProps {
  /** The currently picked plant; null/undefined or a non-GDD plant hides the field entirely. */
  plant: PlantInfo | undefined;
  /** Explicit deviation from the crop default, or undefined = "use the default" (nothing stored). */
  value: SowMethod | undefined;
  onChange: (value: SowMethod | undefined) => void;
  /** Whether a postnummer is set — the harvest shift is GDD-only, so without it we say so. */
  hasLocation: boolean;
}

/**
 * Increment L — the sow-method note + flip checkbox shown in the add forms. States the crop's default
 * assumption ("antar forkultivert" / "antar sådd direkte") so it's never silent, and lets the user
 * flip to the other method for *this* planting. Only shown for GDD-modelled plants, because the
 * harvest shift is GDD-only in v1 — for a custom plant the choice would move no date, so we omit it.
 */
export function SowMethodField({ plant, value, onChange, hasLocation }: SowMethodFieldProps) {
  if (!plant?.gddToMaturity) {
    return null;
  }
  const def = defaultSowMethod(plant);
  const resolved = value ?? def;
  const flipped = resolved !== def;

  const assumption =
    def === "transplant"
      ? "🌱 Antar forkultivert og klar til utplanting"
      : "🌰 Antar sådd direkte ute på denne datoen";
  const flipLabel =
    def === "transplant"
      ? "Jeg sådde frøene direkte ute på denne datoen"
      : "Jeg forkultiverte og planter ut en ferdig plante nå";

  return (
    <div
      className="space-y-1.5 rounded-lg border p-2.5"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
    >
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {assumption}
      </p>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={flipped}
          onChange={(event) => onChange(event.target.checked ? otherMethod(def) : undefined)}
          className="mt-0.5"
        />
        <span>{flipLabel}</span>
      </label>
      {!hasLocation && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Legg inn postnummer for å se hvordan dette påvirker høstetid.
        </p>
      )}
    </div>
  );
}
