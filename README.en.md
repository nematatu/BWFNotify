# BWFNotify

[![CI](https://github.com/nmtt-sandbox/BWFNotify/actions/workflows/ci.yml/badge.svg)](https://github.com/nmtt-sandbox/BWFNotify/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A Cloudflare Workers app that fetches BWF match data and sends Discord Webhook notifications for selected country codes.

This is self-hosted software. The maintainer does not provide a public notification server. Fork it and deploy it to your own Cloudflare account.

日本語: [README.md](README.md)

## Features

- Cloudflare Workers Cron
- Cloudflare KV notification dedupe
- Discord Webhook notifications
- Target countries via `TARGET_COUNTRY_CODES`
- Debug HTTP APIs

## Notice

BWFNotify uses endpoints that appear to be internal BWF APIs. This repository does not confirm that they are stable public APIs. URL, cookie, or response changes may break the app.

## Setup

```sh
bun install
bunx wrangler kv namespace create NOTIFIED_MATCHES
bunx wrangler kv namespace create NOTIFIED_MATCHES --preview
bunx wrangler secret put DISCORD_WEBHOOK_URL
```

If BWF requires a cookie:

```sh
bunx wrangler secret put BWF_COOKIE
```

Replace KV IDs in `wrangler.toml`.

```toml
[[kv_namespaces]]
binding = "NOTIFIED_MATCHES"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

## Local

```sh
cp .dev.vars.example .dev.vars
bun run dev
```

`.dev.vars`:

```dotenv
BWF_COOKIE=
DISCORD_WEBHOOK_URL=<your-discord-webhook-url>
```

## Deploy

```sh
bun run dry-run
bun run deploy
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Link page |
| `GET` | `/run` | Run notification check |
| `GET` | `/debug/bwf` | BWF live raw |
| `GET` | `/debug/bwf/summary` | BWF live summary |
| `GET` | `/debug/day-matches` | Day matches raw |
| `GET` | `/debug/day-matches/summary` | Day matches summary |
| `GET` | `/debug/discord/match-test` | Discord notification test |

## Environment

See `[vars]` in `wrangler.toml`.

Secrets:

- `DISCORD_WEBHOOK_URL`
- `BWF_COOKIE` optional

## Contributing

Issues, PRs, and forks are welcome.

## License

[MIT](LICENSE)
