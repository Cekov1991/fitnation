# Stage 0 — Monorepo Setup

## Overview
Restructure the existing React web app into a pnpm monorepo. The web app moves into `apps/web/`, a new Expo mobile app is scaffolded in `apps/mobile/`, and a shared package is created at `packages/shared/`. All mobile dependencies are installed and both apps verified to start.

## Prerequisites
- pnpm installed globally (`npm install -g pnpm`)
- Vercel Root Directory updated to `apps/web` in Vercel dashboard (Settings → General → Root Directory)
- Expo Go installed on your iPhone

## Final Directory Structure
```
fit-nation/
├── apps/
│   ├── web/                  ← existing React app (moved here)
│   └── mobile/               ← new Expo app
├── packages/
│   └── shared/               ← shared code (scaffold only at this stage)
├── package.json              ← workspace root
├── pnpm-workspace.yaml
└── .gitignore
```

---

## Step 1 — Update Vercel (Do Before Touching Files)

In Vercel dashboard:
- Project → Settings → General → Root Directory → set to `apps/web`
- Save (do not redeploy yet)

---

## Step 2 — Create Directory Structure

```bash
mkdir -p apps/web packages/shared/src
```

---

## Step 3 — Move Web App Files (Preserving Git History)

```bash
git mv src apps/web/
git mv public apps/web/
git mv index.html apps/web/
git mv vite.config.ts apps/web/
git mv tsconfig.json apps/web/
git mv tsconfig.node.json apps/web/
git mv tailwind.config.js apps/web/
git mv postcss.config.js apps/web/
git mv .eslintrc.cjs apps/web/
git mv vercel.json apps/web/
git mv .env apps/web/
git mv package.json apps/web/
```

---

## Step 4 — Remove Old Lockfile

```bash
rm package-lock.json
```

---

## Step 5 — Create Root `package.json`

Create `/package.json`:
```json
{
  "name": "fit-nation",
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:mobile": "pnpm --filter mobile start",
    "build:web": "pnpm --filter web build"
  }
}
```

---

## Step 6 — Create `pnpm-workspace.yaml`

Create `/pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## Step 7 — Update Web App `package.json`

In `apps/web/package.json`, change the name field:
```json
{
  "name": "web",
  ...
}
```

---

## Step 8 — Create `packages/shared` Scaffold

Create `packages/shared/package.json`:
```json
{
  "name": "@fit-nation/shared",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

Create `packages/shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

Create `packages/shared/src/index.ts`:
```ts
// Shared package — exports populated in Stage 1
export {};
```

---

## Step 9 — Install Dependencies

```bash
pnpm install
```

---

## Step 10 — Scaffold Expo App

```bash
cd apps && npx create-expo-app mobile --template blank-typescript
cd ..
```

---

## Step 11 — Install Mobile Dependencies

```bash
cd apps/mobile

# Navigation
pnpm add @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
pnpm add react-native-screens react-native-safe-area-context

# Gestures & Animation
pnpm add react-native-gesture-handler react-native-reanimated

# Styling
pnpm add nativewind
pnpm add -D tailwindcss

# Data fetching & forms (same as web)
pnpm add @tanstack/react-query
pnpm add react-hook-form @hookform/resolvers zod

# Auth storage
pnpm add expo-secure-store

# Media
pnpm add expo-video
pnpm add expo-image

# Charts
pnpm add react-native-gifted-charts
pnpm add react-native-linear-gradient  # peer dep for gifted-charts

# Icons
pnpm add lucide-react-native
pnpm add react-native-svg              # peer dep for lucide

# Shared package
pnpm add @fit-nation/shared@workspace:*

cd ../..
```

---

## Step 12 — Configure NativeWind

Create `apps/mobile/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create `apps/mobile/global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Update `apps/mobile/babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

Update `apps/mobile/metro.config.js` (create if missing):
```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

---

## Step 13 — Configure Shared Package in Web App

In `apps/web/tsconfig.json`, add paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@fit-nation/shared": ["../../packages/shared/src/index.ts"],
      "@fit-nation/shared/*": ["../../packages/shared/src/*"]
    }
  }
}
```

---

## Step 14 — Verify Web Still Works

```bash
pnpm dev:web
```

Open browser — web app should load exactly as before.

---

## Step 15 — Verify Mobile Starts

```bash
pnpm dev:mobile
```

Scan QR code with Expo Go on iPhone — blank app should load.

---

## Step 16 — Commit

```bash
git add -A
git commit -m "chore: restructure into pnpm monorepo with Expo mobile app"
```

---

## Verification Checklist
- [ ] `pnpm dev:web` loads the web app without errors
- [ ] `pnpm dev:mobile` shows QR code and opens in Expo Go
- [ ] Vercel deployment succeeds (push to main and check)
- [ ] `packages/shared/` exists with package.json and empty index.ts
- [ ] `apps/mobile/` has all dependencies installed
