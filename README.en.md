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

BWFNotify uses endpoints that appear to be internal BWF APIs. This repository does not confirm that they are stable public APIs. URL or response changes may break the app.

## Requirements

- Cloudflare account
- Discord Webhook URL
- Bun
- Wrangler is installed as a project dependency

With `mise`:

```sh
mise install
```

## Setup

```sh
bun install
bunx wrangler kv namespace create NOTIFIED_MATCHES --binding NOTIFIED_MATCHES --update-config
bunx wrangler kv namespace create NOTIFIED_MATCHES --preview --binding NOTIFIED_MATCHES --update-config
bunx wrangler secret put DISCORD_WEBHOOK_URL
```

Wrangler updates `wrangler.toml` with the KV binding.

## Local

```sh
cp .dev.vars.example .dev.vars
bun run dev
```

`.dev.vars`:

```dotenv
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

## Contributing

Issues, PRs, and forks are welcome.

## License

[MIT](LICENSE)
