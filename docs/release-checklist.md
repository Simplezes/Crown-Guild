# Release checklist

Run this before shipping any feature.

## Automated

```
pnpm check            typecheck, lint, rules, unit tests, dependency audit
pnpm knip             unused files, exports and dependencies
pnpm build            production build
pnpm test:e2e         every page at 375, 768 and 1280: no console errors, no overflow, no serious accessibility issues
pnpm test:visual      pixel comparison against tests/visual-baseline
```

Run the end to end suites against a production build:

```
pnpm build
pnpm exec next start -p 3100
BASE_URL=http://localhost:3100 pnpm test:e2e
BASE_URL=http://localhost:3100 pnpm test:visual
```

Refresh the visual baseline only for an intended visual change: `BASE_URL=... pnpm exec playwright test visual --update-snapshots`. The baseline uses live data, so refresh it before comparing.

## Manual

UI

- Check the change at 375, 768 and 1280. Nothing scrolls sideways, tap targets are at least 40px, text never clips.
- Keyboard: every control is reachable, focus is visible, Escape closes dialogs.
- Loading: the route's skeleton matches the finished layout. Rebuild it when the layout changes.
- Empty, error and long-content states are handled.

Performance

- `ANALYZE=true pnpm build` and check that no page gained a large client bundle.
- No client component imports server code.
- Images have dimensions.

Security

- New inputs have zod schemas. New routes use `withUser` and a rate limit key.
- No secrets in client code, logs or responses.
- `pnpm audit` is clean.

Visuals

- Colors come from the theme tokens. New styles go in the feature's `styles` folder.
- Dark theme contrast stays readable.
