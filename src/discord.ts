type DiscordMatch = {
  id: string;
  status: string;
  eventType: string;
  names: string[];
  match: {
    tournamentName?: string;
    team1?: Team;
    team2?: Team;
  };
};

type Team = {
  countryCode?: string;
  players?: Array<{ nameDisplay?: string; countryCode?: string }>;
};

export async function notifyDiscord(webhookUrl: string, match: DiscordMatch): Promise<void> {
  await postDiscord(webhookUrl, discordPayload(match));
}

export function discordPayload(match: DiscordMatch) {
  const lines = [`[${match.match.tournamentName || "BWF"}]`, formatCard(match.match.team1, match.match.team2)];

  return { content: lines.join("\n").slice(0, 1900), allowed_mentions: { parse: [] } };
}

function formatCard(team1?: Team, team2?: Team): string {
  const left = formatTeam(team1);
  const right = formatTeam(team2);
  return `${left} vs ${right}`;
}

function formatTeam(team?: Team): string {
  const names = (team?.players || []).map((player) => player.nameDisplay).filter(Boolean).join(" / ");
  const code = team?.countryCode || team?.players?.find((player) => player.countryCode)?.countryCode;
  return `${names || "TBD"} ${flagEmoji(code)}`.trim();
}

function flagEmoji(countryCode?: string): string {
  if (!countryCode) {
    return "";
  }

  const code = COUNTRY_TO_ISO2[countryCode.toUpperCase()] || countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) {
    return "";
  }

  return [...code].map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397)).join("");
}

const COUNTRY_TO_ISO2: Record<string, string> = {
  CHN: "CN",
  DEN: "DK",
  ENG: "GB",
  INA: "ID",
  JPN: "JP",
  KOR: "KR",
  MAS: "MY",
  SUI: "CH",
  THA: "TH",
  TPE: "TW",
  USA: "US"
};

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
