import { useGardenStore } from "../store/useGardenStore";

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LastSavedBadge() {
  const lastSavedAt = useGardenStore((state) => state.lastSavedAt);
  if (!lastSavedAt) {
    return null;
  }
  return (
    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
      Sist lagret: {formatTimestamp(lastSavedAt)}
    </span>
  );
}
