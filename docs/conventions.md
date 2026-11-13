# Conventions

## Code

- TypeScript strict with `noUncheckedIndexedAccess`. No `any`.
- No comments in any file. Say it with names and small files.
- Files stay around 150 lines and never pass 250 (CSS 300). OG card templates are the one exception (480) because Satori needs inline styles. `pnpm check:rules` fails on violations.
- Named exports. One component per file unless the pieces are tiny and private to it.
- Inline type imports: `import { x, type Y } from "..."`.
- Validate every external input with zod at the boundary. Services receive typed, already validated data.
- Log server errors with `logServerError`, which redacts secrets. Never `console.log` user data.

## Naming

- Components `PascalCase.tsx`, hooks `useThing.ts`, pure modules `kebab-case.ts`.
- Feature CSS classes keep their existing short names. New classes use a feature prefix.

## Dependencies

- Exact versions, no `^`.
- `minimumReleaseAge` is 3 days in `pnpm-workspace.yaml`.
- Before adding a package check its publish date, maintainers, deprecation status and install scripts, then run `pnpm audit`.
- `pnpm audit` must report zero high or critical vulnerabilities before a release.
- Transitive advisories are fixed with `overrides` in `pnpm-workspace.yaml`.

## Git

Commits are made by the maintainer only. Group commits by the piece of work, not by the number of files.
