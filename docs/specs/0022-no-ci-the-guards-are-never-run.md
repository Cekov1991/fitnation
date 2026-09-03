# Architecture: No CI — the guards that exist are never run

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03.
Scope: repo root, `packages/legal`, `packages/shared`

## Problem Statement

There is no CI. No `.github/` directory, no workflow files, no husky
(`.git/hooks/` contains only the 14 stock `*.sample` files), and no `hooks` block
in `.claude/settings.json`. `pnpm test` and `pnpm typecheck` run only when
someone remembers.

That frame produces four concrete failures.

### 1. The legal drift guard is documented as CI and wired into nothing

`pnpm legal:check` regenerates both documents and compares byte-for-byte,
exiting 1 on drift. It works. It is described as a CI guard in **three** places —
`packages/legal/README.md:21-22`, `apps/landing_page/CLAUDE.md:135`, and the
landing `README.md:64` — and no automation calls it.

A markdown edit committed without `pnpm legal:build` typechecks, builds and
deploys the **old** legal text to both web and landing, silently.

### 2. `packages/shared` and `packages/legal` are not typechecked directly

Root `typecheck` runs:

```
pnpm --filter web exec tsc --noEmit && pnpm --filter mobile exec tsc --noEmit && pnpm --filter landing typecheck
```

`packages/shared` is only checked transitively, at whatever strictness the
consuming app happens to use — and those differ substantially:

| Workspace | Strictness beyond `strict` |
|---|---|
| `apps/mobile` | none |
| `apps/web` | `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` |
| `apps/landing_page` | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature` |

`packages/legal` has no `tsconfig.json` at all. `apps/mobile/tsconfig.json` has
no path alias for `@fit-nation/shared` — it resolves through the pnpm symlink,
so mobile and web disagree about how shared is even located.

### 3. `apps/web` has no test script and no tests

`apps/web/package.json` has `dev`/`build`/`lint`/`preview` and no `test`, and no
`vitest`/`jsdom`/`happy-dom`/`@testing-library/*` in `devDependencies`. Zero test
files.

### 4. `.tsx` logic is unreachable by any test

`vitest.config.ts` sets `include: ['packages/**/*.test.ts', 'apps/**/*.test.ts']`
with `environment: 'node'`, and there is no renderer anywhere in the repo. So
`.tsx` logic is not merely hard to test — it cannot be collected.

This is why `apps/mobile/src/components/workout-session/workout-session-failures-surfaced.test.ts`
`readFileSync`s three components and brace-counts their `catch` bodies, stating
outright that *"none of this is reachable from the current node-environment test
setup"*. Someone wanted to assert behaviour and could only reach it as text.

## Proposed change

**Do this first, and do not bundle the renderer decision into it.**

1. A workflow on push and PR running `pnpm install --frozen-lockfile`, then
   `pnpm typecheck`, `pnpm test`, `pnpm legal:check`.
2. Add `packages/shared` to `typecheck` with its own explicit invocation, and
   give `packages/legal` a `tsconfig.json`. Decide one strictness level for
   shared code and set it there rather than inheriting three.
3. Add a `test` script to `apps/web` so the workflow has somewhere to grow into.

**Defer the renderer.** 0023-0028 are all pure logic moving into
`packages/shared`, testable under `environment: 'node'` with no renderer at all.
The `vitest.config.ts` comment deliberately leaves the choice to *"whoever first
tests a component or a hook"* — leave it deferred, and do not add
`*.test.tsx` to the include glob before adding a DOM environment, or the glob
will collect tests that fail for unrelated reasons.

## Out of scope

- choosing a renderer and DOM environment (its own ticket, blocking 0029 and 0030)
- lint in CI — `apps/landing_page` currently has 6 pre-existing warnings owned
  entirely by dead files; land 0020 first, then add lint

## Acceptance

- A push with stale generated legal files fails CI
- A push with a type error in `packages/shared` fails CI regardless of which app
  would have caught it
- `pnpm typecheck` covers all five workspaces
- One documented strictness level for `packages/shared`
