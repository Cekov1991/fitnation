# Stage 1 — Shared Package

## Overview
Populate `packages/shared` with all code that both the web and mobile apps will use: API service (with `initApi` injection pattern), TypeScript types, Zod schemas, utility functions, React Query hooks, and the auth logic (with injectable storage). Update the web app to import from `@fit-nation/shared` instead of local paths. Verify the web app still builds and works identically.

## Prerequisites
- Stage 0 complete
- Web app running via `pnpm dev:web`

## Files Created in `packages/shared/src/`
```
packages/shared/src/
├── config.ts             ← runtime config (baseUrl, etc.)
├── api.ts                ← all API calls
├── auth.ts               ← auth logic with injectable storage
├── types/
│   └── api.ts            ← all TypeScript interfaces (copied verbatim)
├── schemas/
│   ├── login.ts
│   ├── register.ts
│   ├── profile.ts
│   ├── workout.ts
│   ├── plan.ts
│   └── ...               ← all existing schemas
├── hooks/
│   └── useApi.ts         ← all React Query hooks
└── utils/
    ├── workoutHelpers.ts
    ├── repRange.ts
    ├── calendarWeek.ts
    └── ...               ← platform-agnostic utils only
```

---

## Step 1 — Create `config.ts` (initApi Pattern)

Create `packages/shared/src/config.ts`:
```ts
interface SharedConfig {
  baseUrl: string
}

let _config: SharedConfig = {
  baseUrl: 'http://localhost:8000/api',
}

export function initApi(config: SharedConfig) {
  _config = config
}

export function getConfig(): SharedConfig {
  return _config
}
```

---

## Step 2 — Adapt `api.ts`

Copy `apps/web/src/services/api.ts` to `packages/shared/src/api.ts`.

Replace the top of the file:
```ts
// BEFORE (Vite-specific)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// AFTER (platform-agnostic)
import { getConfig } from './config'
const getBaseUrl = () => getConfig().baseUrl
```

Replace every usage of `API_BASE_URL` with `getBaseUrl()` throughout the file.

Remove any `import.meta.env` references.

---

## Step 3 — Create Auth Storage Interface

Create `packages/shared/src/auth.ts`:
```ts
export interface AuthStorage {
  getItem(key: string): Promise<string | null> | string | null
  setItem(key: string, value: string): Promise<void> | void
  removeItem(key: string): Promise<void> | void
}

interface AuthConfig {
  storage: AuthStorage
}

let _authStorage: AuthStorage | null = null

export function initAuth(config: AuthConfig) {
  _authStorage = config.storage
}

export function getAuthStorage(): AuthStorage {
  if (!_authStorage) {
    throw new Error('initAuth() must be called before using auth storage')
  }
  return _authStorage
}

export const AUTH_TOKEN_KEY = 'authToken'
export const PARTNER_SLUG_KEY = 'partnerSlug'
```

---

## Step 4 — Copy Types

Copy `apps/web/src/types/api.ts` to `packages/shared/src/types/api.ts` verbatim.

No changes needed — it has zero platform-specific imports.

---

## Step 5 — Copy Schemas

Copy all files from `apps/web/src/schemas/` to `packages/shared/src/schemas/`.

Check each file for any Vite/web-specific imports and remove them. Zod schemas are platform-agnostic and should copy cleanly.

---

## Step 6 — Copy Platform-Agnostic Utils

Copy the following from `apps/web/src/utils/` to `packages/shared/src/utils/`:
- `workoutHelpers.ts`
- `repRange.ts`
- `calendarWeek.ts`
- `subdomain.ts`

Do NOT copy:
- `animations.ts` (Framer Motion — web only)
- `pwa.ts` (PWA/service worker — web only)

Check each copied file for web-specific imports and remove them.

---

## Step 7 — Move `useApi.ts` Hooks

Copy `apps/web/src/hooks/useApi.ts` to `packages/shared/src/hooks/useApi.ts`.

Update the import at the top:
```ts
// BEFORE
import { api } from '../services/api'
import type { ... } from '../types/api'

// AFTER
import { api } from '../api'
import type { ... } from '../types/api'
```

TanStack Query works identically in React Native — no changes needed to hook logic.

---

## Step 8 — Update `packages/shared/src/index.ts`

```ts
// Config
export { initApi, getConfig } from './config'
export { initAuth, getAuthStorage, AUTH_TOKEN_KEY, PARTNER_SLUG_KEY } from './auth'
export type { AuthStorage } from './auth'

// API
export { api } from './api'

// Types
export type * from './types/api'

// Schemas
export * from './schemas/login'
export * from './schemas/register'
export * from './schemas/profile'
export * from './schemas/workout'
export * from './schemas/plan'
// ... add all schemas

// Hooks
export * from './hooks/useApi'

// Utils
export * from './utils/workoutHelpers'
export * from './utils/repRange'
export * from './utils/calendarWeek'
```

---

## Step 9 — Update Web App to Use Shared Package

### `apps/web/src/main.tsx` (or `index.tsx`)

Add initialisation at the top:
```ts
import { initApi, initAuth } from '@fit-nation/shared'

initApi({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api' })

// Web localStorage adapter
initAuth({
  storage: {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  }
})
```

### Update imports across web app

Find and replace all imports in `apps/web/src/`:

| Old import | New import |
|---|---|
| `from '../services/api'` | `from '@fit-nation/shared'` |
| `from '../types/api'` | `from '@fit-nation/shared'` |
| `from '../schemas/login'` | `from '@fit-nation/shared'` |
| `from '../hooks/useApi'` | `from '@fit-nation/shared'` |
| `from '../utils/workoutHelpers'` | `from '@fit-nation/shared'` |
| `from '../utils/repRange'` | `from '@fit-nation/shared'` |
| `from '../utils/calendarWeek'` | `from '@fit-nation/shared'` |

Use VS Code `Cmd+Shift+H` (Find & Replace across files) for this.

### Update `useAuth.tsx`

The web `useAuth.tsx` uses `localStorage` directly. Replace storage calls:
```ts
// BEFORE
localStorage.setItem('authToken', token)
localStorage.getItem('authToken')
localStorage.removeItem('authToken')

// AFTER
import { getAuthStorage, AUTH_TOKEN_KEY } from '@fit-nation/shared'
const storage = getAuthStorage()
await storage.setItem(AUTH_TOKEN_KEY, token)
await storage.getItem(AUTH_TOKEN_KEY)
await storage.removeItem(AUTH_TOKEN_KEY)
```

Note: `getItem` may now return a Promise. Make auth functions async if not already.

---

## Step 10 — Verify Web App

```bash
pnpm dev:web
```

- [ ] App loads without TypeScript errors
- [ ] Login works
- [ ] Dashboard loads data
- [ ] No console errors about missing modules

---

## Step 11 — Run Web Build

```bash
pnpm build:web
```

- [ ] Build completes with no errors
- [ ] No broken imports

---

## Step 12 — Commit

```bash
git add -A
git commit -m "feat: extract shared package with API, types, schemas, hooks, and utils"
```

---

## Verification Checklist
- [ ] `packages/shared/src/api.ts` has no `import.meta.env` references
- [ ] `packages/shared/src/types/api.ts` matches original verbatim
- [ ] All schemas copied and importable from `@fit-nation/shared`
- [ ] `useApi.ts` hooks importable from `@fit-nation/shared`
- [ ] Web app builds and runs without errors
- [ ] `initApi()` and `initAuth()` called in web `main.tsx`
- [ ] No direct `../services/api` imports remaining in web src
