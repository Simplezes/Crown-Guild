# Crown Guild

A registry for Monster Hunter Wilds crown hunters: log crowns, track targets, find hosts and compare hunters. Sign in with Discord.

Next.js 16, React 19, TypeScript, Tailwind 4, Turso (libsql), Auth.js v5, Upstash.

## Getting started

Requires Node 22.12 or newer (24 LTS recommended) and pnpm.

```
pnpm install
cp .env.example .env.local
pnpm dev
```

Fill `.env.local` with your Discord OAuth app, Turso database and Upstash credentials. Environment variables are validated at startup.

## Scripts

| Script                      | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `pnpm dev`                  | development server                                   |
| `pnpm build` / `pnpm start` | production build and server                          |
| `pnpm check`                | typecheck, lint, rules, unit tests, dependency audit |
| `pnpm knip`                 | unused code and dependencies                         |
| `pnpm test`                 | unit tests                                           |
| `pnpm test:e2e`             | page audits at three viewports                       |
| `pnpm test:visual`          | visual regression                                    |
| `pnpm analyze`              | bundle analysis                                      |

## Documentation

- [Architecture](docs/architecture.md)
- [Conventions](docs/conventions.md)
- [Release checklist](docs/release-checklist.md)

## License

See [LICENSE](LICENSE).
