# Contributing

Issues and pull requests are welcome.

## Before you start

- This project is intended to be self-hosted. Please do not expect the maintainer to provide a public hosted instance.
- BWF endpoints used by this project are not confirmed to be stable public APIs. Changes on the BWF side may break this worker.
- Do not commit real Discord webhook URLs, BWF cookies, Cloudflare account IDs, or KV namespace IDs.

## Development

```sh
bun install
cp .dev.vars.example .dev.vars
bun run dev
```

Run checks before opening a pull request:

```sh
bun run build
bun run check
```

Use `bun run check:fix` to apply Biome fixes locally.

## Pull requests

Please include:

- What changed
- Why it changed
- How you verified it
- Any remaining limitations

Small, focused pull requests are easier to review.
