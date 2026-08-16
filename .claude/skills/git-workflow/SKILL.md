---
name: git-workflow
description: Git branching rules, PR flow, release/build process, and branch safety for the Fitnation monorepo. Use when user asks about branching, creating a PR, doing a hotfix, cutting a release, running an EAS build, or resolving pnpm-lock.yaml conflicts.
---

# Git Workflow

## Branch overview

```
feat/* ──→ main
fix/*  ──→ main
```

- All feature and fix work branches off `main` and targets `main`
- There is no `dev` or `staging` branch — `main` is the single shared branch
- **Never commit directly to `main`** — always use a PR

## Branch naming

```
<type>/<scope>/<description>
```

Types: `feat`, `fix`, `chore`, `refactor`

Scopes: `mobile`, `web`, `shared`

Examples: `feat/mobile/rest-timer`, `fix/web/auth-redirect`, `chore/shared/update-deps`

## PR flow

1. Branch off `main`: `git checkout -b feat/mobile/my-feature main`
2. Commit your changes
3. Open PR → `main`
4. Merge with **Squash and merge**

There are no automated backport or staging sync workflows.

## Merge strategy

| PR type | Target | Strategy |
|---|---|---|
| Feature | `main` | **Squash and merge** |
| Fix / hotfix | `main` | **Squash and merge** |

## Mobile releases (EAS)

The mobile app (`apps/mobile`) is distributed via [Expo Application Services (EAS)](https://expo.dev).

### Build profiles

| Profile | Use case | Output |
|---|---|---|
| `development` | Local dev client build | Internal distribution |
| `preview` | Share a testable build internally | APK (Android) |
| `production` | App Store / Play Store submission | AAB (Android), IPA (iOS) |

### Running a build

```bash
cd apps/mobile

# Preview build (internal testing)
eas build --profile preview --platform android
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform all

# Submit to stores after a successful production build
eas submit --profile production --platform all
```

- Android production submits to the **internal track** on Google Play (`track: internal`)
- iOS submits to App Store Connect under `cstefan1991@gmail.com`, app ID `6766201705`
- `autoIncrement: true` is set for production — the build number bumps automatically

### Version bumping

App version is managed remotely (`appVersionSource: remote`). Bump it in EAS before triggering a production build when shipping a new release.

## Lockfile conflicts

Never manually resolve `pnpm-lock.yaml` conflicts. Always regenerate it:

```bash
git checkout --ours pnpm-lock.yaml   # keep your branch's version
pnpm install                          # regenerate
git add pnpm-lock.yaml
```

## Apps in this repo

| Scope | Path | Stack |
|---|---|---|
| `mobile` | `apps/mobile` | Expo / React Native, NativeWind, EAS |
| `web` | `apps/web` | Vite / React, Tailwind |
| `shared` | `packages/shared` | Shared utilities and types |

## Destructive git — confirm before running

These commands overwrite history or branch state. **Never run one as a shortcut to clear an obstacle.** State what you're about to do and get an explicit "yes" first.

| Command | Why it's dangerous | Safer default |
|---|---|---|
| `git push --force` | Clobbers whatever a teammate pushed since you fetched | Use `--force-with-lease` — aborts if the remote moved |
| `git reset --hard <ref>` | Discards all uncommitted changes and local commits | `git stash` first, or `git reset --keep` |
| `git branch -D <name>` | Deletes an unmerged branch with no recovery prompt | `git branch -d` (refuses if unmerged); confirm it's pushed/merged |
| `git checkout -- <path>` / `git restore <path>` | Silently destroys uncommitted edits | Confirm the file has no wanted changes first |
| `git clean -fd` | Deletes untracked files — may be WIP | `git clean -nd` (dry run) first, review the list |

Hard limits:

- **Never force-push `main`.** Force-push is only ever acceptable on your own short-lived `feat/*` or `fix/*` branch, and even then prefer `--force-with-lease`.
- If you hit unfamiliar local state (a stash, an untracked file, a branch you didn't create), **investigate before destroying it**.
- Resolve merge conflicts; don't `reset --hard` to make them disappear.

## Future: when dev/staging are introduced

When a `dev` branch is added, the flow shifts:

```
feat/* ──→ dev ──→ (release branch) ──→ main
fix/*  ──→ main (hotfix, backport to dev after)
```

**Why squash rules change:**
Squashing is safe as long as you never merge that history back elsewhere. Once `dev` → `main` merges happen, squashing on `dev` causes false conflicts on backports (`main` → `dev`) because git loses the shared commit ancestry.

**Merge strategy with dev/staging:**

| PR type | Target | Strategy |
|---|---|---|
| Feature / fix | `dev` | **Squash and merge** |
| Release branch | `main` | **Create a merge commit** |
| Hotfix | `main` | **Create a merge commit** |
| Backport (`main` → `dev`) | `dev` | **Create a merge commit** |
| Staging sync (`dev` → `staging`) | `staging` | **Create a merge commit** |

Never squash a backport or sync PR — squashing removes shared history with `main` and causes false conflicts on every subsequent merge.
