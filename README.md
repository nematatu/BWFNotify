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

BWFNotify は BWF の内部APIと思われるエンドポイントを利用しています。公開APIとして安定提供されていることは確認できていません。URL変更、レスポンス形式変更などで動かなくなる可能性があります。

## Requirements

- Cloudflare アカウント
- Discord Webhook URL
- Bun
- Wrangler は依存関係としてインストールされます

`mise` を使う場合:

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

KV binding は Wrangler が `wrangler.toml` に追記します。

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

## Contributing

Issue / PR / fork 歓迎です。

## License

[MIT](LICENSE)
