# Cloudflare deploy

The site runs on Cloudflare Workers through `@opennextjs/cloudflare`.

- Build: `pnpm add @opennextjs/cloudflare@1.20.17 wrangler@4.164.0 && pnpm exec opennextjs-cloudflare build`
- Deploy: `pnpm exec wrangler deploy`
- Build variables: `SKIP_ENV_VALIDATION=true`, `NEXTAUTH_URL`
- Runtime secrets are set in the Cloudflare dashboard (Worker settings), never in this repo.
