# BWFNotify

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

BWFNotify は、BWF の試合情報を定期取得し、指定した国の選手が出ているライブ試合を Discord に通知する Cloudflare Workers アプリです。

作者が通知サーバーを提供するものではありません。自分の Cloudflare アカウントにデプロイして使います。

English: [README.en.md](README.en.md)

## 何ができるか

- Cloudflare Workers Cron で定期実行する
- BWF の当日試合情報を取得する
- `TARGET_COUNTRY_CODES` に一致する国の選手を含む試合を探す
- ライブ中の対象試合を Discord Webhook に通知する
- Cloudflare KV に通知済み試合を保存し、同じ試合の重複通知を避ける

デフォルトでは `JPN` の選手を含むライブ試合を通知します。

## 構成

```text
Cloudflare Workers Cron
  -> BWF match endpoints
  -> target match filter
  -> Cloudflare KV dedupe
  -> Discord Webhook
```

## 必要なもの

- Cloudflare アカウント
- Discord Webhook URL
- Bun

`mise` を使う場合:

```sh
mise install
```

## 使い方

### 1. 初回準備

依存関係を入れます。

```sh
bun install
```

Cloudflare にログインします。

```sh
bunx wrangler login
```

通知済み試合を保存するKVを作ります。`--update-config` により `wrangler.toml` へ binding が追記されます。

```sh
bunx wrangler kv namespace create NOTIFIED_MATCHES --binding NOTIFIED_MATCHES --update-config
```

Discord Webhook URL をCloudflare Secretに登録します。

```sh
bunx wrangler secret put DISCORD_WEBHOOK_URL
```

### 2. ローカルで確認

ローカル用Secretファイルを作ります。

```sh
cp .dev.vars.example .dev.vars
```

`.dev.vars` に Discord Webhook URL を入れます。

```dotenv
DISCORD_WEBHOOK_URL=<your-discord-webhook-url>
```

Workerを起動します。

```sh
bun run dev
```

別ターミナルで確認します。

```sh
curl http://localhost:8787/debug/day-matches/summary
curl http://localhost:8787/run
```

### 3. デプロイ

デプロイ前に設定を検証します。

```sh
bun run dry-run
```

問題なければデプロイします。

```sh
bun run deploy
```

デプロイ後は `wrangler.toml` の Cron 設定により、デフォルトでは1分ごとに通知チェックを実行します。

## 設定

通常設定は `wrangler.toml` の `[vars]` で変更します。

| 変数 | 説明 | 例 |
|---|---|---|
| `TARGET_COUNTRY_CODES` | 通知対象のBWF国コード。カンマ区切り。 | `JPN` / `JPN,KOR` |
| `MAX_DISCORD_MESSAGES_PER_RUN` | 1回の実行で送る最大通知数。 | `20` |
| `NOTIFIED_TTL_SECONDS` | 通知済み記録をKVに残す秒数。 | `2592000` |
| `BWF_MATCH_DATE` | 対象日。未設定ならJSTの今日。 | `2026-05-31` |
| `BWF_MATCH_ORDER` | BWF day-matches API の `order`。 | `2` |
| `BWF_MATCH_COURT` | BWF day-matches API の `court`。 | `0` |

Secret は Cloudflare Secret またはローカルの `.dev.vars` に設定します。

| Secret | 説明 |
|---|---|
| `DISCORD_WEBHOOK_URL` | 通知先のDiscord Webhook URL |

## API

| Path | 説明 |
|---|---|
| `/` | デバッグリンク一覧 |
| `/run` | 通知チェックを手動実行 |
| `/debug/bwf` | BWF live raw |
| `/debug/bwf/summary` | BWF live summary |
| `/debug/day-matches` | Day matches raw |
| `/debug/day-matches/summary` | 抽出結果の要約 |
| `/debug/discord/match-test` | Discord通知テスト |

`/run` の例:

```json
{
  "ok": true,
  "checked": 1,
  "notified": 1
}
```

## 注意

BWFNotify は BWF の内部APIと思われるエンドポイントを利用しています。公開APIとして安定提供されていることは確認できていません。URLやレスポンス形式の変更で動かなくなる可能性があります。

`/debug/discord/match-test` は実際にDiscordへ通知します。

## Contributing

Issue / PR / fork 歓迎です。

## License

[MIT](LICENSE)
