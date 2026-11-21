# Cloudflare deploy

The site runs on Cloudflare Workers through OpenNext (@opennextjs/cloudflare).

Build: pnpm add @opennextjs/cloudflare@1.20.17 wrangler@4.164.0 && pnpm exec opennextjs-cloudflare build

Deploy: pnpm exec wrangler deploy --keep-vars

Production branch: main.

Requires the Workers Paid plan. The free plan's 10 ms CPU limit is too low for Next.js rendering (Error 1102).

Runtime secrets are set in the Cloudflare dashboard (Worker settings), never in this repo.

src/proxy.ts was removed because OpenNext's Node middleware crashes on Cloudflare.
