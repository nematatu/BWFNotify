import { Hono } from "hono";
import {
	BWF_DAY_MATCHES_URL,
	BWF_LIVE_URL,
	bwfHeaders,
	type Env,
} from "./config";
import { notifyDiscord } from "./discord";
import {
	arrayOf,
	csv,
	type JsonObject,
	looksJson,
	message,
	object,
	positiveInt,
	preview,
	todayJst,
} from "./utils";

type EventType = "scheduled" | "live" | "completed" | "unknown";

type Player = {
	nameDisplay?: string;
	countryCode?: string;
};

type Team = {
	countryCode?: string;
	players?: Player[];
};

type BwfMatch = {
	id?: string | number;
	code?: string;
	tournamentName?: string;
	scoreStatus?: number;
	scoreStatusValue?: string;
	winner?: number;
	team1?: Team;
	team2?: Team;
	matchStatus?: string;
	matchStatusValue?: string;
	matchTime?: string;
	matchTimeUtc?: string;
	duration?: number | null;
	time?: string;
	eventName?: string;
	roundName?: string;
	courtName?: string;
	matchTypeValue?: string;
	score?: Array<{ set?: number; home?: number; away?: number }>;
};

type MatchCandidate = {
	id: string;
	status: string;
	eventType: EventType;
	names: string[];
	match: BwfMatch;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/debug/bwf", async (c) =>
	rawResponse(await bwfText(c.env, c.env.BWF_LIVE_URL || BWF_LIVE_URL)),
);
app.get("/debug/bwf/summary", async (c) =>
	c.json(await debugFetch(c.env, c.env.BWF_LIVE_URL || BWF_LIVE_URL)),
);
app.get("/debug/day-matches", async (c) => c.json(await fetchSchedule(c.env)));
app.get("/debug/day-matches/summary", async (c) => {
	const schedule = await fetchSchedule(c.env);
	const targets = extractTargets(schedule.results, c.env);
	return c.json({
		date: schedule.date,
		tournaments: schedule.tournaments,
		totalMatches: schedule.results.length,
		targetMatches: targets.length,
		targets: targets.map(({ id, status, eventType, names }) => ({
			id,
			status,
			eventType,
			names,
		})),
	});
});

app.get("/run", async (c) => {
	const result = await run(c.env);
	return c.json(result, result.ok ? 200 : 500);
});

app.get("/", (c) =>
	c.html(
		`
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BWFNotify worker</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 40px; line-height: 1.5; }
      h1 { margin-bottom: 24px; }
      nav { display: grid; gap: 12px; max-width: 360px; }
      a { display: block; padding: 10px 14px; border: 1px solid #ccc; border-radius: 6px; color: #111; text-decoration: none; }
      a:hover { background: #f4f4f4; }
    </style>
  </head>
  <body>
    <h1>BWFNotify worker</h1>
    <nav>
      <a href="/debug/bwf">BWF live raw</a>
      <a href="/debug/bwf/summary">BWF live summary</a>
      <a href="/debug/day-matches">Day matches raw</a>
      <a href="/debug/day-matches/summary">Day matches summary</a>
      <a href="/run">Run notification check</a>
    </nav>
  </body>
</html>`,
	),
);

export default {
	fetch: app.fetch,
	scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(run(env));
	},
};

async function run(
	env: Env,
): Promise<{ ok: boolean; checked: number; notified: number; error?: string }> {
	try {
		if (!env.NOTIFIED_MATCHES)
			throw new Error("NOTIFIED_MATCHES KV binding is not configured");

		const targets = extractTargets((await fetchSchedule(env)).results, env);
		const liveTargets = targets.filter((match) => match.eventType === "live");
		const limit = positiveInt(env.MAX_DISCORD_MESSAGES_PER_RUN, 20);
		const ttl = positiveInt(env.NOTIFIED_TTL_SECONDS, 60 * 60 * 24 * 30);
		let notified = 0;

		for (const match of liveTargets.slice(0, limit)) {
			const key = `notified:${match.id}:${match.eventType}`;
			if (await env.NOTIFIED_MATCHES.get(key)) continue;

			await notifyDiscord(env.DISCORD_WEBHOOK_URL, match);
			await env.NOTIFIED_MATCHES.put(
				key,
				JSON.stringify({ notifiedAt: new Date().toISOString() }),
				{
					expirationTtl: ttl,
				},
			);
			notified++;
		}

		return { ok: true, checked: liveTargets.length, notified };
	} catch (error) {
		console.error(error);
		return { ok: false, checked: 0, notified: 0, error: message(error) };
	}
}

async function fetchSchedule(env: Env) {
	const date = env.BWF_MATCH_DATE || todayJst();
	const tournaments = tournamentsFrom(
		await bwfJson(env, env.BWF_LIVE_URL || BWF_LIVE_URL),
	);
	const results: BwfMatch[] = [];
	const summaries: Array<{ code: string; name?: string; matches: number }> = [];

	for (const tournament of tournaments) {
		const matches = arrayOf<BwfMatch>(
			await bwfJson(env, dayMatchesUrl(env, tournament.code, date)),
		);
		results.push(...matches);
		summaries.push({ ...tournament, matches: matches.length });
	}

	return { date, tournaments: summaries, results };
}

function extractTargets(matches: BwfMatch[], env: Env): MatchCandidate[] {
	const countries = csv(env.TARGET_COUNTRY_CODES || "JPN").map((v) =>
		v.toUpperCase(),
	);
	const seen = new Set<string>();
	const targets: MatchCandidate[] = [];

	for (const match of matches) {
		const id = match.id == null ? "" : String(match.id);
		if (!id || !isTarget(match, countries)) continue;

		const status = match.matchStatusValue || match.matchStatus || "unknown";
		const target = {
			id,
			status,
			eventType: eventType(match),
			names: matchNames(match),
			match,
		};
		const key = `${target.id}:${target.eventType}`;
		if (!seen.has(key)) {
			seen.add(key);
			targets.push(target);
		}
	}

	return targets.sort((a, b) => a.id.localeCompare(b.id));
}

function isTarget(match: BwfMatch, countries: string[]) {
	const codes = [match.team1, match.team2].flatMap((team) => [
		team?.countryCode,
		...(team?.players || []).map((player) => player.countryCode),
	]);
	return codes.some((code) => code && countries.includes(code.toUpperCase()));
}

function matchNames(match: BwfMatch) {
	return [match.team1, match.team2]
		.map((team) =>
			(team?.players || [])
				.map((player) => player.nameDisplay)
				.filter(Boolean)
				.join(" / "),
		)
		.filter(Boolean) as string[];
}

function eventType(match: BwfMatch): EventType {
	switch (match.matchStatus) {
		case "P":
			return "live";
		case "F":
			return "completed";
		case "N":
		case "S":
			return "scheduled";
		default:
			return "unknown";
	}
}

function tournamentsFrom(payload: unknown) {
	return arrayOf<JsonObject>(object(payload).results)
		.map((item) => ({
			code: typeof item.code === "string" ? item.code : "",
			name: typeof item.name === "string" ? item.name : undefined,
		}))
		.filter((item) => /^[0-9A-F-]{36}$/i.test(item.code));
}

async function bwfJson(env: Env, url: string) {
	const result = await bwfText(env, url);
	if (!result.response.ok)
		throw new Error(`BWF request failed: ${describe(result)}`);
	if (!isJson(result))
		throw new Error(`BWF response was not JSON: ${describe(result)}`);
	return JSON.parse(result.bodyText) as unknown;
}

async function bwfText(env: Env, url: string) {
	const response = await fetch(url, { headers: bwfHeaders(env) });
	const bodyText = await response.text();
	return {
		response,
		contentType: response.headers.get("content-type") || "",
		bodyText,
	};
}

function dayMatchesUrl(env: Env, tournamentCode: string, date: string) {
	const url = new URL(env.BWF_DAY_MATCHES_URL || BWF_DAY_MATCHES_URL);
	url.searchParams.set("tournamentCode", tournamentCode);
	url.searchParams.set("date", date);
	url.searchParams.set("order", env.BWF_MATCH_ORDER || "2");
	url.searchParams.set("court", env.BWF_MATCH_COURT || "0");
	return url.toString();
}

async function debugFetch(env: Env, url: string) {
	try {
		const result = await bwfText(env, url);
		const json = isJson(result);
		return {
			ok: result.response.ok && json,
			status: result.response.status,
			statusText: result.response.statusText,
			contentType: result.contentType,
			bytes: new TextEncoder().encode(result.bodyText).byteLength,
			json,
			summary: json ? summarize(JSON.parse(result.bodyText)) : undefined,
			preview: preview(result.bodyText),
		};
	} catch (error) {
		return { ok: false, error: message(error) };
	}
}

function rawResponse(result: Awaited<ReturnType<typeof bwfText>>) {
	return new Response(result.bodyText, {
		status: result.response.status,
		statusText: result.response.statusText,
		headers: {
			"content-type": result.contentType || "text/plain; charset=utf-8",
			"cache-control": "no-store",
		},
	});
}

function summarize(value: unknown): unknown {
	if (Array.isArray(value))
		return { type: "array", length: value.length, first: summarize(value[0]) };
	const item = object(value);
	if (!item) return value;
	const keys = Object.keys(item);
	return Object.fromEntries([
		["type", "object"],
		["keys", keys.slice(0, 20)],
		...keys
			.slice(0, 8)
			.map((key) => [
				key,
				Array.isArray(item[key])
					? { type: "array", length: item[key].length }
					: item[key],
			]),
	]);
}

function describe(result: Awaited<ReturnType<typeof bwfText>>) {
	return `${result.response.status} ${result.response.statusText}; content-type=${result.contentType}; body=${preview(result.bodyText)}`;
}

function isJson(result: Awaited<ReturnType<typeof bwfText>>) {
	return result.contentType.includes("json") || looksJson(result.bodyText);
}
