# BWFNotify
BWFの任意の試合を通知するツール

Cloudflare Workers CronでBWFのライブ情報JSONを定期取得し、日本人選手を含む試合をDiscord Webhookへ通知します。

## 構成

- Cloudflare Workers Cron: 1分ごとに実行
- Hono: 手動実行・ヘルスチェック用HTTPルート
- Cloudflare KV: 通知済みの `matchId + eventType` を保存
- Discord Webhook: 通知先

## セットアップ

依存関係をインストールします。

```sh
npm install
```

KV namespaceを作成します。

```sh
npx wrangler kv namespace create NOTIFIED_MATCHES
npx wrangler kv namespace create NOTIFIED_MATCHES --preview
```

出力されたIDを `wrangler.toml` の `kv_namespaces` に設定してください。

Discord Webhook URLをSecretに登録します。

```sh
npx wrangler secret put DISCORD_WEBHOOK_URL
```

ローカルで確認します。

ローカルの `wrangler dev` はCloudflareに登録したSecretを自動では読みません。必要なSecretは `.dev.vars` に入れてください。

```sh
cp .dev.vars.example .dev.vars
```

`.dev.vars` の `BWF_COOKIE` と `DISCORD_WEBHOOK_URL` を実値に置き換えます。BWFレスポンス確認だけなら、まず `BWF_COOKIE` だけで十分です。

```sh
npm run dev
```

別ターミナルからBWF取得だけ確認します。

```sh
curl http://localhost:8787/debug/bwf
```

BWFの元URLをcurlで直接確認する場合は、ヘッダーやUser-Agentの改行で壊れないようにスクリプトを使います。

```sh
./scripts/fetch-bwf.sh
```

今日の試合予定を確認する場合:

```sh
curl http://localhost:8787/debug/day-matches
curl http://localhost:8787/debug/day-matches/summary
```

手動実行:

```sh
curl http://localhost:8787/run
```

デプロイ:

```sh
npm run deploy
```

dry-run:

```sh
npm run dry-run
```

## 環境変数

| 変数 | 説明 | デフォルト |
|---|---|---|
| `BWF_LIVE_URL` | BWFライブ情報JSONのURL | `https://extranet-lv.bwfbadminton.com/api/match-center/vue-current-live` |
| `BWF_DAY_MATCHES_URL` | BWF日別試合予定JSONのURL | `https://extranet-lv.bwfbadminton.com/api/tournaments/day-matches` |
| `BWF_MATCH_DATE` | 取得対象日。未指定ならJSTの今日 | 空 |
| `BWF_MATCH_ORDER` | `day-matches` の `order` パラメータ | `2` |
| `BWF_MATCH_COURT` | `day-matches` の `court` パラメータ | `0` |
| `BWF_COOKIE` | BWF側がブラウザCookieを要求する場合のCookie文字列。Secret推奨 | 空 |
| `BWF_REFERER` | BWF取得時のReferer | `https://bwfbadminton.com/` |
| `BWF_USER_AGENT` | BWF取得時のUser-Agent | Chrome相当のUser-Agent |
| `TARGET_COUNTRY_CODES` | 通知対象のBWF国コード。カンマ区切り | `JPN` |
| `MAX_DISCORD_MESSAGES_PER_RUN` | 1回のCronで送る最大Discord通知数 | `20` |
| `NOTIFIED_TTL_SECONDS` | 通知済みKVの保持秒数 | `2592000` |

## 注意

BWF側の内部APIは公開APIとして保証されているとは確認できていません。URL変更、Cloudflareブロック、レスポンス形式変更で動かなくなる可能性があります。

Discordのレート制限は固定値をコードに埋め込まず、`429` 応答時の `Retry-After` / `retry_after` に従って一度だけ再試行します。
