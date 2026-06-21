// Minimal Ollama /api/chat client. JSON-mode by default so the gardener emits a parseable action.

export interface OllamaConfig {
  model: string;
  temperature?: number;
  seed?: number;
  host?: string;
  /** Per-request timeout (ms). Local 32B can be slow on first token. */
  timeoutMs?: number;
  numCtx?: number;
  /** Cap generated tokens. Prevents JSON-mode runaway (unbounded default fills the context window). */
  numPredict?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  evalCount: number;
  totalMs: number;
}

const DEFAULT_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";

export async function ollamaChat(messages: ChatMessage[], cfg: OllamaConfig): Promise<ChatResult> {
  const host = cfg.host ?? DEFAULT_HOST;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 180_000);
  try {
    const res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: cfg.model,
        stream: false,
        format: "json",
        messages,
        options: {
          temperature: cfg.temperature ?? 0.4,
          seed: cfg.seed ?? 1,
          num_ctx: cfg.numCtx ?? 8192,
          num_predict: cfg.numPredict ?? 512,
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as {
      message?: { content?: string };
      eval_count?: number;
      total_duration?: number;
    };
    return {
      content: json.message?.content ?? "",
      evalCount: json.eval_count ?? 0,
      totalMs: Math.round((json.total_duration ?? 0) / 1e6),
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Best-effort extraction of an action object from a model reply (JSON mode usually returns clean JSON). */
export function parseActionReply(content: string): unknown {
  const trimmed = content.trim();
  try {
    const obj = JSON.parse(trimmed);
    // Tolerate {actions:[...]} or a bare array — take the first action.
    if (Array.isArray(obj)) {
      return obj[0];
    }
    if (obj && typeof obj === "object" && Array.isArray((obj as { actions?: unknown[] }).actions)) {
      return (obj as { actions: unknown[] }).actions[0];
    }
    return obj;
  } catch {
    // Fall back to the first {...} block if the model wrapped it in prose.
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Whether an Ollama host is reachable. */
export async function ollamaUp(host = DEFAULT_HOST): Promise<boolean> {
  try {
    const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
