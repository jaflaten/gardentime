import { getFamilyEmoji, getFamilyName, type PlantFamily } from "../lib/families";
import { useUiStore } from "../store/useUiStore";

interface FamilyChipProps {
  family: PlantFamily;
  size?: "sm" | "md";
}

export function FamilyChip({ family, size = "sm" }: FamilyChipProps) {
  const language = useUiStore((state) => state.plantLanguage);
  const paddingClass = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${paddingClass}`}
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text-muted)" }}
      title={getFamilyName(family, language)}
    >
      <span>{getFamilyEmoji(family)}</span>
      <span>{getFamilyName(family, language)}</span>
    </span>
  );
}
