import { getFamilyName, type PlantFamily } from "../lib/families";
import { formatYearList } from "../lib/rotation";
import { useUiStore } from "../store/useUiStore";

interface RotationWarningProps {
  family: PlantFamily;
  years: number[];
  /** The year being planted into — used to tell a same-season repeat from a prior-year conflict. */
  currentYear: number;
  /** When provided, renders a dismiss button. The parent owns the dismissed state so it can reset on plant change. */
  onDismiss?: () => void;
}

/**
 * Soft, non-blocking rotation warning surfaced at the moment of decision: the user has
 * picked a plant whose family was grown in this box within the rotation window. Information,
 * never validation — the user can always save anyway. Returns null when there's no conflict,
 * so callers can render it unconditionally.
 *
 * Two severities:
 *  - **same-season** (the only conflict is this same year, e.g. harvested carrot → replant
 *    carrot): a gentle amber nudge. The bed was just cleared; replanting the same family is
 *    not ideal but it's the user's call.
 *  - **prior-year** (the family grew here in a previous season): the real crop-rotation case.
 *    Styled stronger (red) because skipping rotation across years is what actually builds up
 *    soil-borne disease and depletes nutrients.
 */
export function RotationWarning({ family, years, currentYear, onDismiss }: RotationWarningProps) {
  const language = useUiStore((state) => state.plantLanguage);
  if (years.length === 0) {
    return null;
  }
  const familyName = getFamilyName(family, language);
  const hasPriorYear = years.some((year) => year < currentYear);

  const palette = hasPriorYear
    ? { border: "var(--red)", background: "var(--red-light)" }
    : { border: "var(--amber)", background: "var(--amber-light)" };

  return (
    <div
      className="flex items-start gap-2 rounded-lg border p-2.5 text-sm"
      style={{ borderColor: palette.border, backgroundColor: palette.background, color: "var(--text)" }}
    >
      <span aria-hidden="true">⚠</span>
      <p className="flex-1">
        {hasPriorYear ? (
          <>
            <strong>Vekstskifte anbefales.</strong> Du hadde <strong>{familyName}</strong> her i {formatYearList(years)}{" "}
            — plant en annen familie i år for å unngå sykdom og utarmet jord.
          </>
        ) : (
          <>
            Du dyrket allerede <strong>{familyName}</strong> her tidligere i år. Vurder en annen familie nå for å unngå
            sykdom og utarmet jord.
          </>
        )}
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Skjul advarsel"
          className="tap-target -my-1 -mr-1 shrink-0 rounded-full px-2 text-lg leading-none"
          style={{ color: "var(--text-muted)" }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
