// Vercel serverless function — relays in-app feedback to a Slack Incoming Webhook.
//
// The webhook URL lives in the SLACK_WEBHOOK_URL env var (set in the Vercel project
// settings), so it never ships in the client bundle and can't be scraped + spammed.
// The browser POSTs JSON here; we format a Slack message and forward it.

interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

interface FeedbackPayload {
  message?: unknown;
  name?: unknown;
  page?: unknown;
  boxes?: unknown;
  plantings?: unknown;
  userAgent?: unknown;
}

const asText = (value: unknown, fallback = "—"): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return fallback;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    res.status(500).json({ error: "SLACK_WEBHOOK_URL is not configured" });
    return;
  }

  const payload = (req.body ?? {}) as FeedbackPayload;
  const message = asText(payload.message, "");
  if (!message) {
    res.status(400).json({ error: "Tilbakemelding kan ikke være tom" });
    return;
  }

  // Slack caps text payloads; keep the free-text message bounded so a paste-bomb
  // can't blow past the webhook limit.
  const trimmed = message.slice(0, 3000);
  const name = asText(payload.name);
  const context = [
    `*Fra:* ${name}`,
    `*Side:* ${asText(payload.page)}`,
    `*Hage:* ${asText(payload.boxes)} kasser / ${asText(payload.plantings)} plantinger`,
    `*Nettleser:* ${asText(payload.userAgent).slice(0, 300)}`,
  ].join("\n");

  const slackBody = {
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `🌱 *Ny tilbakemelding fra Spirr*\n>${trimmed.replace(/\n/g, "\n>")}` },
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: context }],
      },
    ],
  };

  try {
    const slackRes = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackBody),
    });
    if (!slackRes.ok) {
      res.status(502).json({ error: "Slack avviste meldingen" });
      return;
    }
    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ error: "Kunne ikke nå Slack" });
  }
}
