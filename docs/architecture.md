# Architecture

Crown Guild is a Next.js 16 App Router site (React 19, TypeScript strict, Tailwind 4) backed by Turso (libsql), with Discord sign-in through Auth.js v5 and Upstash rate limiting.

## Layers

```
src/app        routing only: page, layout, loading, route files that compose features
src/features   one folder per domain, everything it owns lives inside
src/shared     ui, hooks, providers and helpers used by two or more features
src/server     everything that must never reach the browser
src/config     constants and pure game rules
src/data       static data
src/styles     tokens, base styles, animations and the single CSS entry point
```

Dependency direction is one way: `app` → `features` → `shared` / `server` / `config`.

- `shared` never imports `features` or `app`.
- `features` never import `app` and never reach into another feature's folders. They import a feature through its `index.ts` (client safe) or `server.ts` (server only). `skeleton` is also a public entry.
- `server` is marked `server-only` and is imported by server components and route handlers only. Client components may import types from it, never values.

ESLint enforces these rules (`no-restricted-imports`).

## A feature folder

```
features/<name>/
  components/   React components
  hooks/        client hooks
  lib/          pure logic, easy to unit test
  styles/       the CSS this feature owns
  skeleton/     loading skeletons built from the real layout
  index.ts      client safe public API
  server.ts     server only public API (when needed)
```

## Server

```
server/db          libsql client, column guards, row helpers
server/auth        Auth.js configuration
server/schemas     zod schemas for every request body and query
server/services    all SQL and business rules, one file per concern
server/http.ts     withUser, parseJson, parseQuery, fromResult
server/ratelimit   Upstash limiters by key
```

A route handler is a few lines: authenticate and rate limit with `withUser`, validate with a schema, call a service, return `fromResult`. No SQL lives in `src/app`.

The database schema is shared with the Discord bot and migrated lazily, so queries are typed raw SQL and the column guards in `server/db/columns.ts` add missing columns on first use.

## Styling

`src/styles/index.css` is the only CSS entry. It imports Tailwind, the theme tokens, base styles, animations, shared styles, then each feature's styles in a fixed order that preserves the cascade. Feature styles live next to the feature.

## Images for sharing

Open Graph images are explicit routes (`/og`, `/profile/[id]/og`, `/monster/[name]/og`). The cards are components in `features/og/cards`, rendered by `ImageResponse`.
