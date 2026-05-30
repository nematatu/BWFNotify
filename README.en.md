# BWFNotify

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

BWFNotify is a Cloudflare Workers app that periodically fetches BWF match data and sends Discord notifications for live matches involving selected countries.

The maintainer does not provide a hosted notification server. Deploy it to your own Cloudflare account.

日本語: [README.md](README.md)

## What It Does

- Runs on Cloudflare Workers Cron
- Fetches BWF day match data
- Finds matches involving countries in `TARGET_COUNTRY_CODES`
- Sends live target matches to Discord Webhook
- Stores notified matches in Cloudflare KV to avoid duplicates

By default, it notifies live matches involving `JPN`.

## Architecture

```text
Cloudflare Workers Cron
  -> BWF match endpoints
  -> target match filter
  -> Cloudflare KV dedupe
  -> Discord Webhook
```

## Requirements

- Cloudflare account
- Discord Webhook URL
- Bun

This repository includes `mise.toml`. With `mise`:

```sh
mise install
```

## Usage

### 1. Initial Setup

Install dependencies.

```sh
bun install
```

Log in to Cloudflare.

```sh
bunx wrangler login
```

Create KV namespaces for notification dedupe. `--update-config` adds the binding to `wrangler.toml`.

```sh
bunx wrangler kv namespace create NOTIFIED_MATCHES --binding NOTIFIED_MATCHES --update-config
bunx wrangler kv namespace create NOTIFIED_MATCHES --preview --binding NOTIFIED_MATCHES --update-config
```

Register your Discord Webhook URL as a Cloudflare Secret.

```sh
bunx wrangler secret put DISCORD_WEBHOOK_URL
```

### 2. Check Locally

Create a local secrets file.

```sh
cp .dev.vars.example .dev.vars
```

Set your Discord Webhook URL in `.dev.vars`.

```dotenv
DISCORD_WEBHOOK_URL=<your-discord-webhook-url>
```

Start the Worker.

```sh
bun run dev
```

Check from another terminal.

```sh
curl http://localhost:8787/debug/day-matches/summary
curl http://localhost:8787/run
```

### 3. Deploy

Validate deployment settings first.

```sh
bun run dry-run
```

Deploy.

```sh
bun run deploy
```

After deployment, the Cron trigger in `wrangler.toml` runs every minute by default.

## Configuration

Edit `[vars]` in `wrangler.toml`.

| Variable | Description | Example |
|---|---|---|
| `TARGET_COUNTRY_CODES` | Comma-separated BWF country codes. | `JPN` / `JPN,KOR` |
| `MAX_DISCORD_MESSAGES_PER_RUN` | Max Discord messages per run. | `20` |
| `NOTIFIED_TTL_SECONDS` | KV TTL for dedupe records. | `2592000` |
| `BWF_MATCH_DATE` | Target date. Defaults to today in JST. | `2026-05-31` |
| `BWF_MATCH_ORDER` | `order` for BWF day-matches API. | `2` |
| `BWF_MATCH_COURT` | `court` for BWF day-matches API. | `0` |

Secrets are configured with Cloudflare Secret or local `.dev.vars`.

| Secret | Description |
|---|---|
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL |

## API

| Path | Description |
|---|---|
| `/` | Debug link page |
| `/run` | Run notification check |
| `/debug/bwf` | BWF live raw |
| `/debug/bwf/summary` | BWF live summary |
| `/debug/day-matches` | Day matches raw |
| `/debug/day-matches/summary` | Target extraction summary |
| `/debug/discord/match-test` | Discord notification test |

`/run` example:

```json
{
  "ok": true,
  "checked": 1,
  "notified": 1
}
```

## Notes

BWFNotify uses endpoints that appear to be internal BWF APIs. This repository does not confirm that they are stable public APIs. URL or response changes may break the app.

`/debug/discord/match-test` sends a real Discord message.

## Contributing

Issues, PRs, and forks are welcome.

## License

[MIT](LICENSE)
