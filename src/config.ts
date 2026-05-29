export type Env = {
	DISCORD_WEBHOOK_URL: string;
	NOTIFIED_MATCHES?: KVNamespace;
	BWF_LIVE_URL?: string;
	BWF_DAY_MATCHES_URL?: string;
	BWF_MATCH_DATE?: string;
	BWF_MATCH_ORDER?: string;
	BWF_MATCH_COURT?: string;
	BWF_COOKIE?: string;
	BWF_REFERER?: string;
	BWF_USER_AGENT?: string;
	TARGET_COUNTRY_CODES?: string;
	MAX_DISCORD_MESSAGES_PER_RUN?: string;
	NOTIFIED_TTL_SECONDS?: string;
};

export const BWF_LIVE_URL =
	"https://extranet-lv.bwfbadminton.com/api/match-center/vue-current-live";
export const BWF_DAY_MATCHES_URL =
	"https://extranet-lv.bwfbadminton.com/api/tournaments/day-matches";
const BWF_REFERER = "https://bwfbadminton.com/";
export const BWF_USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function bwfHeaders(env: Env): Headers {
	const headers = new Headers({
		accept: "application/json,text/plain,*/*",
		"accept-language": "ja,en-US;q=0.9,en;q=0.8",
		referer: BWF_REFERER,
		"user-agent": BWF_USER_AGENT,
	});

	if (env.BWF_COOKIE) {
		headers.set("cookie", env.BWF_COOKIE);
	}

	return headers;
}

