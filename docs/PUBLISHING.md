# Publishing Checklist

Use this checklist before making the repository public.

## Required

- [ ] Replace `wrangler.toml` KV placeholders with your own values only in private deployments, or keep placeholders in the public repository.
- [ ] Rotate or delete any Cloudflare KV namespaces whose IDs were committed before this repository became public.
- [ ] Check Git history for secrets or environment-specific IDs before publishing.
- [ ] Keep `.dev.vars` untracked.
- [ ] Register `DISCORD_WEBHOOK_URL` with `bunx wrangler secret put`.
- [ ] Register `BWF_COOKIE` with `bunx wrangler secret put` if BWF requires it.
- [ ] Run `bun run build`.
- [ ] Run `bun run check`.

## Suggested History Checks

```sh
git grep -n "discord.com/api/webhooks"
git grep -n "BWF_COOKIE"
git log --all -S"discord.com/api/webhooks" -- .
git log --all -S"<known-sensitive-value>" -- .
```

If a real secret or sensitive identifier exists in history, rotate it first. If the repository has not been published yet, consider creating a fresh public repository from the cleaned working tree instead of publishing the existing Git history.

## Operational Notes

- The deployed Worker URL is public unless you put it behind additional access controls.
- BWF endpoints may change without notice.
- Discord may rate limit notifications. The worker retries once when Discord returns `429` with a short retry interval.
