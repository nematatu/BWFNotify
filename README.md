# BWFNotify

[![CI](https://github.com/nmtt-sandbox/BWFNotify/actions/workflows/ci.yml/badge.svg)](https://github.com/nmtt-sandbox/BWFNotify/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

BWFNotify は、BWF の試合情報を定期取得し、指定した国・地域の選手を含む試合がライブになったときに Discord Webhook へ通知する Cloudflare Workers アプリです。

このリポジトリは **セルフホスト前提のOSS** です。作者が公開サーバーや通知サービスを提供するものではありません。fork して自分の Cloudflare アカウントにデプロイする、またはコードを改変して自分の環境で運用する用途を想定しています。

English README: [README.en.md](README.en.md)

## 特徴

- Cloudflare Workers Cron で定期実行
- Cloudflare KV で通知済み試合を記録し、重複通知を抑制
- Discord Webhook へ通知
- 対象国コードを `TARGET_COUNTRY_CODES` で指定可能
- BWF取得結果・抽出結果を確認するデバッグAPIつき
- Hono + TypeScript の小さな構成

## 重要な注意
え
BWFNotify は BWF の内部APIと思われるエンドポイントを利用しています。このエンドポイントが公開APIとして安定提供されていることは、このリポジトリ内の情報だけでは確認できません。URL変更、Cookie要求、Cloudflare等によるブロック、レスポンス形式変更で動かなくなる可能性があります。

Discord、Cloudflare、BWF 等の利用規約・レート制限・運用ルールは、利用者自身で確認してください。

## 必要なもの

- Cloudflare アカウント
- Discord Webhook URL
- Bun
- Wrangler は `devDependencies` のものを `bunx wrangler` または `bun run ...` 経由で使います
- Cloudflare KV namespace

## セットアップ

依存関係をインストールします。

```sh
bun install
```

Cloudflare KV namespace を作成します。

```sh
bunx wrangler kv namespace create NOTIFIED_MATCHES
bunx wrangler kv namespace create NOTIFIED_MATCHES --preview
```

出力された `id` と `preview_id` を [wrangler.toml](wrangler.toml) に設定してください。

```toml
[[kv_namespaces]]
binding = "NOTIFIED_MATCHES"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

Discord Webhook URL を Cloudflare Secret に登録します。

```sh
bunx wrangler secret put DISCORD_WEBHOOK_URL
```

BWF 側の取得に Cookie が必要な場合は、Cookie も Secret として登録します。

```sh
bunx wrangler secret put BWF_COOKIE
```

## ローカル開発

ローカルの `wrangler dev` は Cloudflare に登録した Secret を自動では読みません。ローカル用の値は `.dev.vars` に入れてください。

```sh
cp .dev.vars.example .dev.vars
```

`.dev.vars` に必要な値を設定します。

```dotenv
BWF_COOKIE=
DISCORD_WEBHOOK_URL=<your-discord-webhook-url>
```

起動します。

```sh
bun run dev
```

ブラウザまたは curl で確認します。

```sh
curl http://localhost:8787/
curl http://localhost:8787/debug/day-matches/summary
curl http://localhost:8787/run
```

BWF の元URLを curl で直接確認する場合は、ヘッダーや User-Agent の指定ミスを避けるため、同梱スクリプトを使えます。

```sh
./scripts/fetch-bwf.sh
```

## デプロイ

[wrangler.toml](wrangler.toml) の `name`、KV namespace ID、環境変数を自分の環境に合わせてからデプロイします。

```sh
bun run dry-run
bun run deploy
```

Cron は初期設定で1分ごとです。

```toml
[triggers]
crons = ["*/1 * * * *"]
```

運用頻度を変える場合は、Cloudflare Workers の Cron Triggers の仕様に合わせて変更してください。

## APIリファレンス

すべてのHTTP APIは、デプロイした自分の Worker 上で利用します。

| Method | Path | 説明 |
|---|---|---|
| `GET` | `/` | 簡易リンクページ |
| `GET` | `/run` | 通知チェックを手動実行します。ライブ中の対象試合だけをDiscord通知します。 |
| `GET` | `/debug/bwf` | BWFライブ情報のレスポンス本文をそのまま返します。 |
| `GET` | `/debug/bwf/summary` | BWFライブ情報の取得状況、JSON判定、概要を返します。 |
| `GET` | `/debug/day-matches` | 対象日の試合予定を取得してJSONで返します。 |
| `GET` | `/debug/day-matches/summary` | 対象試合の抽出結果だけを要約して返します。 |
| `GET` | `/debug/discord/match-test` | テスト用のDiscord通知を1件送ります。 |

### `/run` レスポンス例

```json
{
  "ok": true,
  "checked": 1,
  "notified": 1
}
```

エラー時:

```json
{
  "ok": false,
  "checked": 0,
  "notified": 0,
  "error": "NOTIFIED_MATCHES KV binding is not configured"
}
```

## 環境変数

| 変数 | 必須 | 説明 | デフォルト |
|---|---:|---|---|
| `DISCORD_WEBHOOK_URL` | はい | Discord Webhook URL。Secret 推奨。 | なし |
| `BWF_COOKIE` | 場合による | BWF側がブラウザCookieを要求する場合のCookie文字列。Secret 推奨。 | 空 |
| `BWF_LIVE_URL` | いいえ | BWFライブ情報JSONのURL。 | `https://extranet-lv.bwfbadminton.com/api/match-center/vue-current-live` |
| `BWF_DAY_MATCHES_URL` | いいえ | BWF日別試合予定JSONのURL。 | `https://extranet-lv.bwfbadminton.com/api/tournaments/day-matches` |
| `BWF_MATCH_DATE` | いいえ | 取得対象日。未指定ならJSTの今日。 | 空 |
| `BWF_MATCH_ORDER` | いいえ | `day-matches` の `order` パラメータ。 | `2` |
| `BWF_MATCH_COURT` | いいえ | `day-matches` の `court` パラメータ。 | `0` |
| `BWF_REFERER` | いいえ | BWF取得時のReferer。 | `https://bwfbadminton.com/` |
| `BWF_USER_AGENT` | いいえ | BWF取得時のUser-Agent。 | Chrome相当のUser-Agent |
| `TARGET_COUNTRY_CODES` | いいえ | 通知対象のBWF国コード。カンマ区切り。 | `JPN` |
| `MAX_DISCORD_MESSAGES_PER_RUN` | いいえ | 1回のCronで送る最大Discord通知数。 | `20` |
| `NOTIFIED_TTL_SECONDS` | いいえ | 通知済みKVの保持秒数。 | `2592000` |

## コントリビュート

fork、issue、pull request を歓迎します。詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

とくに歓迎する改善:

- BWFレスポンス形式変更への耐性向上
- Discord通知文面の改善
- 対象試合抽出ロジックの改善
- テスト追加
- ドキュメント改善
- Cloudflare Workers 運用ノウハウの追記

## セキュリティ

実際の Discord Webhook URL、BWF Cookie、Cloudflare credential、KV namespace ID をコミットしないでください。公開前に `git grep` や GitHub Secret Scanning などで確認することを推奨します。

公開前チェックリストは [docs/PUBLISHING.md](docs/PUBLISHING.md) にまとめています。

詳細は [SECURITY.md](SECURITY.md) を参照してください。

## ライセンス

[MIT](LICENSE)
