import { useEffect, type ReactNode } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Avbryt",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const confirmBg = destructive ? "var(--red)" : "var(--green)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="document"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-xl border p-4 shadow-lg"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold sm:text-xl">
          {title}
        </h2>
        <div className="text-sm" style={{ color: "var(--text)" }}>
          {body}
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: confirmBg, color: "white" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
