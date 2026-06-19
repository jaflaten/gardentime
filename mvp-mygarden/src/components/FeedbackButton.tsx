import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { useGardenStore } from "../store/useGardenStore";

type Status = "idle" | "sending" | "sent" | "error";

// Floating "send feedback" affordance, mounted globally so testers can report from any page.
// Submits to the /api/feedback Vercel function, which forwards to Slack (webhook stays server-side).
export function FeedbackButton() {
  const location = useLocation();
  const boxCount = useGardenStore((state) => state.boxes.length);
  const plantingCount = useGardenStore((state) => state.plantings.length);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Lock scroll + wire Escape while the sheet is open (mirrors ConfirmModal's behaviour).
  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    // Reset transient state a beat after closing so the sheet doesn't flicker on the way out.
    setStatus("idle");
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === "sending" || message.trim().length === 0) {
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          name,
          page: location.pathname,
          boxes: boxCount,
          plantings: plantingCount,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Sending feilet");
      }
      setStatus("sent");
      setMessage("");
      setName("");
      window.setTimeout(() => setOpen(false), 1500);
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Sending feilet");
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-target fixed bottom-4 right-4 z-40 rounded-full border px-4 py-2 text-sm font-medium shadow-lg"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
      >
        💬 Tilbakemelding
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={close}
    >
      <form
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-3 rounded-xl border p-4 shadow-lg"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <h2 id="feedback-title" className="text-lg font-semibold sm:text-xl">
          💬 Send tilbakemelding
        </h2>

        {status === "sent" ? (
          <p className="text-sm" style={{ color: "var(--green)" }}>
            Takk! Tilbakemeldingen er sendt. 🌱
          </p>
        ) : (
          <>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Fant du en feil eller har et forslag? Skriv det her — det går rett til utvikleren.
            </p>
            <textarea
              autoFocus
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Hva vil du si?"
              className="w-full rounded-lg border p-2 text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)" }}
            />
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Navn eller kontakt (valgfritt)"
              className="input-touch w-full rounded-lg border p-2 text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)" }}
            />
            {error && (
              <p className="text-sm" style={{ color: "var(--red)" }}>
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={close}
                className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={status === "sending" || message.trim().length === 0}
                className="tap-target rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--green)", color: "white" }}
              >
                {status === "sending" ? "Sender…" : "Send"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
