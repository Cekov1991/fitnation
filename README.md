# Fit Nation

A pnpm monorepo: the Fit Nation apps and the code they share.

| Workspace | What it is |
|---|---|
| `apps/mobile` | The iOS/Android app (Expo, React Native) |
| `apps/web` | The web app and PWA (Vite, React) |
| `apps/landing_page` | The marketing site, prerendered to static HTML (TanStack Start) |
| `packages/shared` | API client, React Query hooks, types, unit system — used by mobile and web |
| `packages/legal` | Privacy policy and terms, generated from markdown for web and landing |

The back-end lives in its own repository.

## Working on it

```
pnpm install
pnpm dev:web            # or dev:mobile, dev:landing
pnpm test               # vitest, every workspace
pnpm typecheck          # tsc in every workspace; see typecheck-baseline.json
pnpm legal:check        # generated legal documents match their markdown
```

Node 24 and pnpm 9 (`packageManager` in package.json). CI runs the three checks
above on every pull request — typecheck as a ratchet against the baseline, so
it fails only on new errors.

## Where to read next

- `docs/specs/` — one file per problem: what is wrong, the evidence, and what
  would resolve it. Start with `docs/specs/README.md`.
- Each app has a `CLAUDE.md` with the conventions that matter in that workspace.
- Deployment: `apps/web/vercel.json` is the web app's SPA rewrite; the landing
  page deliberately has none (see `apps/landing_page/README.md`).
