import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT — pnpm monorepo dedupe
// `@fit-nation/shared` is symlinked into apps/web/node_modules but its own
// node_modules resolves peer deps against the mobile app (React 19). Without
// this dedupe the web build ends up with two copies of React and react-query,
// causing "No QueryClient set" in production.
//
// Add any library here whose module/instance identity matters across both
// the web app and `packages/shared`. That means anything that uses
// React.createContext under the hood, or maintains a module-level singleton.
// Examples: react, react-dom, react/jsx-runtime, @tanstack/react-query,
// zustand, jotai, @tanstack/react-router, redux, react-hook-form, etc.
// Pure utility libs (zod, date-fns, lodash) do NOT need to be deduped.
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@tanstack/react-query',
    ],
  },
})
