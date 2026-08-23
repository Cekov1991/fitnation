import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

// Plain TanStack Start config. This app was scaffolded by Lovable, which shipped
// a `@lovable.dev/vite-tanstack-config` wrapper; it has been inlined here so the
// build has no Lovable-hosted dependency. Plugin order below matches what the
// wrapper produced.
//
// The build is fully static: every route is prerendered to HTML at build time
// and `dist/client` is deployed as a plain static site. There is no server at
// runtime. Read CLAUDE.md in this directory before changing that.
export default defineConfig({
  css: { transformer: "lightningcss" },

  resolve: {
    alias: { "@": srcDir },
    // React and TanStack Query must be single instances — two copies of either
    // break hooks and throw "No QueryClient set" at runtime.
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },

  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Render each page to HTML at build time into `dist/client`. The content
      // here is constant — no server functions, no per-request data — so there
      // is nothing for a server to compute per request.
      //
      // `crawlLinks` follows <a href> out of the pages listed below, so a new
      // route linked from the landing page is picked up with no config change.
      // A route NOT reachable by a link has to be added to `pages` by hand.
      // `failOnError` turns a page that throws into a failed build rather than a
      // silently missing file.
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
      },
      pages: [{ path: "/" }, { path: "/privacy" }, { path: "/terms" }],
      // Generated from `pages` + whatever `crawlLinks` discovers, so it stays
      // correct as routes are added. `host` is required — sitemap URLs must be
      // absolute.
      sitemap: { enabled: true, host: "https://joinfitnation.com" },
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    viteReact(),
  ],
});
