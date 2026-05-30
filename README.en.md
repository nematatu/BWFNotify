# BWFNotify

[![CI](https://github.com/nmtt-sandbox/BWFNotify/actions/workflows/ci.yml/badge.svg)](https://github.com/nmtt-sandbox/BWFNotify/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

BWFNotify is a self-hosted Cloudflare Workers app that periodically fetches BWF match data and sends Discord Webhook notifications when matches involving selected country codes go live.

This repository is **self-hosted open source software**. The maintainer does not provide a public hosted notification service. Fork it, deploy it to your own Cloudflare account, or adapt the code for your own environment.

Japanese README: [README.md](README.md)

## Features

- Scheduled execution with Cloudflare Workers Cron
- Cloudflare KV deduplication for already-notified matches
- Discord Webhook notifications
- Configurable target country codes via `TARGET_COUNTRY_CODES`
- Debug endpoints for fetch and extraction checks
- Small Hono + TypeScript codebase

## Important Notice

BWFNotify uses endpoints that appear to be internal BWF APIs. This repository does not verify that those endpoints are stable public APIs. The worker may stop working if URLs change, cookies become required, requests are blocked, or response formats change.

You are responsible for checking the terms, rate limits, and operational rules of Discord, Cloudflare, BWF, and any other services you use.

## Requirements

- Cloudflare account
- Discord Webhook URL
- Bun
- Wrangler through the local `devDependencies` via `bunx wrangler` or `bun run ...`
- Cloudflare KV namespace

## Setup

Install dependencies:

```sh
bun install
```

Create Cloudflare KV namespaces:

```sh
bunx wrangler kv namespace create NOTIFIED_MATCHES
bunx wrangler kv namespace create NOTIFIED_MATCHES --preview
```

Set the printed `id` and `preview_id` in [wrangler.toml](wrangler.toml):

```toml
[[kv_namespaces]]
binding = "NOTIFIED_MATCHES"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

Register your Discord Webhook URL as a Cloudflare secret:

```sh
bunx wrangler secret put DISCORD_WEBHOOK_URL
```

If BWF requires a cookie for fetching data, register it as a secret too:

```sh
bunx wrangler secret put BWF_COOKIE
```

## Local Development

`wrangler dev` does not automatically read secrets registered in Cloudflare. Put local values in `.dev.vars`.

```sh
cp .dev.vars.example .dev.vars
```

Set the required values:

```dotenv
BWF_COOKIE=
DISCORD_WEBHOOK_URL=<your-discord-webhook-url>
```

Start the worker:

```sh
bun run dev
```

Check the endpoints:

```sh
curl http://localhost:8787/
curl http://localhost:8787/debug/day-matches/summary
curl http://localhost:8787/run
```

You can also use the bundled script to fetch the BWF source URL with matching headers:

```sh
./scripts/fetch-bwf.sh
```

## Deploy

Update [wrangler.toml](wrangler.toml) for your environment, including `name`, KV namespace IDs, and variables.

```sh
bun run dry-run
bun run deploy
```

The default Cron schedule runs every minute:

```toml
[triggers]
crons = ["*/1 * * * *"]
```

Adjust it according to Cloudflare Workers Cron Triggers if needed.

## API Reference

All HTTP endpoints run on your own deployed Worker.

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Simple link page. |
| `GET` | `/run` | Manually runs the notification check. Only live target matches are sent to Discord. |
| `GET` | `/debug/bwf` | Returns the raw BWF live response body. |
| `GET` | `/debug/bwf/summary` | Returns fetch status, JSON detection, and a compact summary of the BWF live response. |
| `GET` | `/debug/day-matches` | Fetches day matches for the target date and returns JSON. |
| `GET` | `/debug/day-matches/summary` | Returns a compact summary of extracted target matches. |
| `GET` | `/debug/discord/match-test` | Sends one test Discord notification. |

### `/run` Response Example

```json
{
  "ok": true,
  "checked": 1,
  "notified": 1
}
```

Error example:

```json
{
  "ok": false,
  "checked": 0,
  "notified": 0,
  "error": "NOTIFIED_MATCHES KV binding is not configured"
}
```

## Environment Variables

| Variable | Required | Description | Default |
|---|---:|---|---|
| `DISCORD_WEBHOOK_URL` | Yes | Discord Webhook URL. Use a secret. | None |
| `BWF_COOKIE` | Sometimes | Cookie string for BWF requests when required. Use a secret. | Empty |
| `BWF_LIVE_URL` | No | BWF live data JSON URL. | `https://extranet-lv.bwfbadminton.com/api/match-center/vue-current-live` |
| `BWF_DAY_MATCHES_URL` | No | BWF day matches JSON URL. | `https://extranet-lv.bwfbadminton.com/api/tournaments/day-matches` |
| `BWF_MATCH_DATE` | No | Target date. Defaults to today in JST when unset. | Empty |
| `BWF_MATCH_ORDER` | No | `order` parameter for `day-matches`. | `2` |
| `BWF_MATCH_COURT` | No | `court` parameter for `day-matches`. | `0` |
| `BWF_REFERER` | No | Referer for BWF requests. | `https://bwfbadminton.com/` |
| `BWF_USER_AGENT` | No | User-Agent for BWF requests. | Chrome-like User-Agent |
| `TARGET_COUNTRY_CODES` | No | Comma-separated BWF country codes to notify. | `JPN` |
| `MAX_DISCORD_MESSAGES_PER_RUN` | No | Maximum Discord messages sent per Cron run. | `20` |
| `NOTIFIED_TTL_SECONDS` | No | TTL for notification dedupe records in KV. | `2592000` |

## Contributing

Forks, issues, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

Good areas for contribution:

- More resilient handling of BWF response changes
- Better Discord notification formatting
- Improved target match extraction
- Tests
- Documentation
- Cloudflare Workers operations notes

## Security

Do not commit real Discord Webhook URLs, BWF cookies, Cloudflare credentials, or KV namespace IDs. Before publishing, consider checking the repository with `git grep`, GitHub Secret Scanning, or similar tools.

See [docs/PUBLISHING.md](docs/PUBLISHING.md) for a publishing checklist.

See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
