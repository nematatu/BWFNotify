# BWFNotify

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

BWF の試合情報を取得し、対象国の選手を含む試合を Discord Webhook に通知する Cloudflare Workers アプリです。

作者が通知サーバーを提供するものではありません。fork して自分の Cloudflare アカウントにデプロイして使ってください。

English: [README.en.md](README.en.md)

## Features

- Cloudflare Workers Cron で定期実行
- Cloudflare KV で通知済み試合を記録
- Discord Webhook に通知
- `TARGET_COUNTRY_CODES` で対象国を指定
- デバッグ用HTTP APIつき

## Notice

BWFNotify は BWF の内部APIと思われるエンドポイントを利用しています。公開APIとして安定提供されていることは確認できていません。URL変更、Cookie要求、レスポンス形式変更などで動かなくなる可能性があります。

## Setup

```sh
bun install
bunx wrangler kv namespace create NOTIFIED_MATCHES
bunx wrangler kv namespace create NOTIFIED_MATCHES --preview
bunx wrangler secret put DISCORD_WEBHOOK_URL
```

BWF取得にCookieが必要な場合:

```sh
bunx wrangler secret put BWF_COOKIE
```

`wrangler.toml` の KV ID を自分の namespace ID に置き換えます。

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
| `GET` | `/` | リンク一覧 |
| `GET` | `/run` | 通知チェックを手動実行 |
| `GET` | `/debug/bwf` | BWF live raw |
| `GET` | `/debug/bwf/summary` | BWF live summary |
| `GET` | `/debug/day-matches` | Day matches raw |
| `GET` | `/debug/day-matches/summary` | Day matches summary |
| `GET` | `/debug/discord/match-test` | Discord通知テスト |

## Environment

主な設定は `wrangler.toml` の `[vars]` を見てください。

Secret:

- `DISCORD_WEBHOOK_URL`
- `BWF_COOKIE` optional

## Contributing

Issue / PR / fork 歓迎です。

## License

[MIT](LICENSE)
