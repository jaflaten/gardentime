interface StatusBadgeProps {
  status: "active" | "harvested" | "removed" | "failed";
}

const STATUS_CONFIG = {
  active: {
    label: "Aktiv",
    bg: "var(--green-light)",
    text: "var(--green)",
  },
  harvested: {
    label: "Høstet",
    bg: "var(--amber-light)",
    text: "var(--amber)",
  },
  removed: {
    label: "Fjernet",
    bg: "var(--gray-light)",
    text: "var(--text-muted)",
  },
  failed: {
    label: "Mislyktes",
    bg: "var(--red-light)",
    text: "var(--red)",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
