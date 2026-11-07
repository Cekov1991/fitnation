# fit-nation front-end

pnpm monorepo for the Fit Nation front ends. Talks to the Laravel backend (`fitnation-backend` repo).

## Workspace layout

```
apps/
  mobile/        # Expo / React Native app — has its own CLAUDE.md with UI standards; read it before touching a mobile screen
  web/           # customer web app
  landing_page/  # marketing site
packages/        # shared workspace packages (@fit-nation/shared, @fit-nation/legal, …)
```

## Key commands

```bash
pnpm dev:mobile      # Expo dev server (also: dev:web, dev:landing)
pnpm test            # vitest run (whole workspace)
pnpm typecheck       # tsc across all packages
pnpm typecheck:ci    # ratcheted typecheck used in CI
```

## Docs

- `docs/adr/` — front-end architecture decisions
- `docs/specs/` — frozen archive of historical spec files; new specs are GitHub issues

## Agent skills

### Issue tracker

GitHub Issues on `Cekov1991/fitnation`; cross-repo specs live in the backend repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical labels, unrenamed (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` (created lazily) + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
