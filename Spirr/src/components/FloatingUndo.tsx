import { useEffect } from "react";
import { useGardenStore } from "../store/useGardenStore";

const UNDO_TIMEOUT_MS = 10_000;

interface FloatingUndoProps {
  editMode: boolean;
}

export function FloatingUndo({ editMode }: FloatingUndoProps) {
  const previousBoxes = useGardenStore((state) => state.previousBoxes);
  const undoLastLayout = useGardenStore((state) => state.undoLastLayout);
  const clearUndo = useGardenStore((state) => state.clearUndo);
  const visible = editMode && previousBoxes !== null;

  // Each time previousBoxes is set (new reference), restart the 10s auto-dismiss.
  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = window.setTimeout(clearUndo, UNDO_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [visible, previousBoxes, clearUndo]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-full border px-3 py-2 shadow-lg"
        style={{ borderColor: "var(--amber)", backgroundColor: "var(--surface)" }}
      >
        <button
          type="button"
          onClick={undoLastLayout}
          className="tap-target rounded-full px-4 py-1 text-sm font-medium"
          style={{ backgroundColor: "var(--amber-light)", color: "var(--amber)" }}
        >
          ↶ Angre siste flytting
        </button>
        <button
          type="button"
          onClick={clearUndo}
          aria-label="Lukk angre"
          className="tap-target rounded-full px-3 py-1 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
