type DiscordMatch = {
  id: string;
  status: string;
  eventType: string;
  names: string[];
};

export async function notifyDiscord(webhookUrl: string, match: DiscordMatch): Promise<void> {
  await postDiscord(webhookUrl, discordPayload(match));
}

export function discordPayload(match: DiscordMatch) {
  const lines = [
    `BWF notification: ${match.names.join(" vs ") || `match ${match.id}`}`,
    `matchId: ${match.id}`,
    `status: ${match.status}`,
    `event: ${match.eventType}`
  ];

  return { content: lines.join("\n").slice(0, 1900), allowed_mentions: { parse: [] } };
}

async function postDiscord(webhookUrl: string, payload: unknown): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.status === 429) {
    const retryAfter = await retryAfterSeconds(response);
    if (retryAfter > 30) {
      throw new Error(`Discord rate limited; retry_after=${retryAfter}s`);
    }

    await sleep(Math.max(1, retryAfter) * 1000);
    return postDiscord(webhookUrl, payload);
  }

  if (!response.ok) {
    throw new Error(`Discord request failed: ${response.status} ${response.statusText}; body=${await response.text()}`);
  }
}

async function retryAfterSeconds(response: Response): Promise<number> {
  const header = Number(response.headers.get("retry-after"));
  if (Number.isFinite(header)) {
    return header;
  }

  try {
    const body = (await response.json()) as { retry_after?: unknown };
    return typeof body.retry_after === "number" ? body.retry_after : 5;
  } catch {
    return 5;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
