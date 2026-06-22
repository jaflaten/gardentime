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

export interface ParsedBatch {
  /** True when the reply was a recognizable batch structure — even an empty one. False = junk, reprompt. */
  parsed: boolean;
  actions: unknown[];
}

/**
 * Extract a BATCH of actions from a model reply (the visit loop asks "what do you do today?" and the
 * gardener may answer with several moves or none). Tolerates `{actions:[...]}`, a bare array, or a single
 * object. Critically, distinguishes a VALID empty batch (`{"actions":[]}` — a legitimate "nothing to do
 * this week", per the system prompt) from genuinely unparseable junk, so the visit loop only reprompts on
 * the latter and a quiet week costs ONE call, not two (review S1).
 */
export function parseActionBatch(content: string): ParsedBatch {
  const trimmed = content.trim();
  const pick = (obj: unknown): ParsedBatch | null => {
    if (Array.isArray(obj)) return { parsed: true, actions: obj };
    if (obj && typeof obj === "object") {
      const actions = (obj as { actions?: unknown }).actions;
      if (Array.isArray(actions)) return { parsed: true, actions };
      // A bare single action object → one-element batch (only if it looks like an action).
      if ("action" in (obj as Record<string, unknown>)) return { parsed: true, actions: [obj] };
    }
    return null; // valid JSON but not an action structure → treat as unparseable (reprompt).
  };
  try {
    const r = pick(JSON.parse(trimmed));
    if (r) return r;
  } catch {
    /* fall through to prose-embedded extraction */
  }
  const match = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (match) {
    try {
      const r = pick(JSON.parse(match[0]));
      if (r) return r;
    } catch {
      /* ignore */
    }
  }
  return { parsed: false, actions: [] };
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
