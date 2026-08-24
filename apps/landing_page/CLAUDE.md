# landing — agent notes

Fit Nation marketing site. TanStack Start + React 19 + Tailwind 4 + shadcn/ui.
Standalone: imports nothing from `packages/shared`, `apps/web` or `apps/mobile`.

## The one thing to know

**This build is fully static.** Every route is prerendered to HTML at build time
into `dist/client`, which is deployed to Vercel as a plain static directory.
There is no server, no serverless function, and no SSR at runtime.

Consequences, all of which bite silently:

- **No server functions.** `createServerFn`, route `loader`s that hit a database,
  reading request headers or cookies — none of it works. A loader may only use
  data available at build time.
- **Anything dynamic must be client-side**, in a `useEffect` or a
  `@tanstack/react-query` call that runs in the browser.
- **Content changes require a rebuild**, not just a redeploy.
- Unknown URLs get Vercel's default 404, not the app's `notFoundComponent`.
  The 404 route only renders on client-side navigation.
- **`new Date()` is evaluated at build time**, not on view. The footer copyright
  year is baked into the HTML and will not roll over until the next deploy.

If a genuine server need appears, that is an architecture change — see
"Restoring SSR" below. Do not bolt a server function onto the static build; it
will typecheck, build, and then be missing at runtime.

## Adding a page

1. Create the route file under `src/routes/`. The route tree
   (`src/routeTree.gen.ts`) is generated — never hand-edit it.
2. If the new page is reachable by an `<a href>` from an already-prerendered
   page, `crawlLinks` finds it automatically. If it is **not** linked — a
   standalone `/legal` or `/press` — add it to `pages` in `vite.config.ts`:
   ```ts
   pages: [{ path: "/" }, { path: "/privacy" }, { path: "/terms" }],
   ```
   (`/privacy` and `/terms` are listed even though the footer links to them, so
   the build does not depend on a link surviving a redesign.)
3. A route with path params (`$slug`) cannot be prerendered without listing each
   concrete path in `pages`. There is no fallback renderer to catch the rest.
4. Run the verification below. `failOnError: true` fails the build on a page that
   throws, but it cannot tell you about a page you forgot to list — that one just
   silently never gets a file.

## Verifying a change

Build and confirm the output is a complete static site. `pnpm build` alone is not
proof; it exits 0 with a broken page.

```bash
pnpm build
cd dist/client && python3 -m http.server 4455    # what Vercel effectively does
```

Then check that the page renders and every referenced URL resolves. Expect
`/` to be ~36KB of real HTML — if it is ~2KB you have an empty shell, meaning
prerender silently fell back.

**Gotcha:** prerendered HTML contains a NUL byte in the streamed hydration
payload, so `grep` treats `index.html` as binary and prints nothing — making a
present string look absent. Use `grep -a`, or Python:

```bash
python3 -c "print('Fit Nation' in open('dist/client/index.html',encoding='utf-8',errors='replace').read())"
```

Also run `pnpm typecheck` and `pnpm lint`. Lint has 6 pre-existing
`react-refresh` warnings from shadcn boilerplate; 0 errors is the bar.

## Content lives in one file

Copy, store links, and the feature list are in
`src/components/landing/data.ts`. Prefer editing that over the section
components in `src/components/landing/`.

## Images

Screenshots ship as **WebP derivatives, generated and committed** — not as the
masters. Masters live in `src/assets/originals/` and are imported by nothing, so
Vite never emits them.

```bash
pnpm images   # regenerate src/assets/*.webp from src/assets/originals/
```

Run it after adding or replacing a screenshot, and commit both the master and the
derivatives. The script throws if it finds a master it has no entry for, so a new
file cannot silently go unprocessed — wire it into `SHOTS` or `BADGES` in
`scripts/optimize-images.mjs`. It needs `cwebp` (`brew install webp`); it is a
maintenance step, not part of `pnpm build`, so CI never runs it.

Consumers get a `Shot` (`src`, `srcSet`, `width`, `height`) from
`src/components/landing/data.ts`, and `PhoneFrame` requires an explicit `sizes`
matching the slot's `max-w-*`. A `sizes` that overstates the slot makes every
device pull the 720w variant, which defeats the srcset.

**Do not drop `width`/`height` or `h-auto` from those `<img>`s.** The dimensions
reserve the box so a lazy tile is not zero-high, and `h-auto` is what stops the
height attribute being taken as a literal 1560px.

## Legal pages

`/privacy` and `/terms` render from **`packages/legal`**, which is the single
source of truth shared with `apps/web`. Do not edit the legal text here — there
is no copy of it in this app.

```bash
# edit packages/legal/content/*.md, then, from the repo root:
pnpm legal:build     # regenerate packages/legal/src/generated/*.ts and commit both
pnpm legal:check     # non-zero if the generated files are stale (CI guard)
```

The documents arrive as a block tree (`LegalDocument`), not HTML, and
`src/components/legal/legal-page.tsx` renders them with this app's own styling.
`apps/web` renders the same data with its own components and looks different on
purpose. See `packages/legal/README.md`.

Section anchor ids (`/privacy#your-rights`) come from the markdown and are
effectively a public API — external links may point at them.

## Crawlers, SEO and AI agents

The site is deliberately **open to all crawlers, AI included** — assistant
answers are a discovery channel for a consumer app, so being readable beats
being withheld. `public/robots.txt` allows everything, names the AI user-agents
explicitly so the intent is on the record, and carries a Cloudflare
`Content-Signal:` line granting `search`, `ai-input` and `ai-train`. If that
policy ever changes it is a one-line edit per agent in that file.

`public/llms.txt` is a factual plain-language summary for assistants. Keep it in
sync with `src/components/landing/data.ts` when features or claims change — it is
the version an assistant is most likely to quote, so a stale fact there is worse
than a stale one in the marketing copy. Note that `llms.txt` is a convention,
not a standard, and no major crawler has confirmed consuming it; it costs almost
nothing, but do not treat publishing it as having done SEO.

`sitemap.xml` is **generated** from `pages` + `crawlLinks`, so it stays correct
as routes are added — do not hand-write one into `public/`. It needs an absolute
host, set as `sitemap.host` in `vite.config.ts`.

`SITE_URL` in `src/components/landing/data.ts` is the canonical origin and feeds
`canonical` and `og:url`. Both **must** be absolute — they were relative (`/`)
originally, which makes crawlers and link unfurlers ignore them. Keep `SITE_URL`
and `sitemap.host` in sync; they are two places holding the same value.

### `scripts/postbuild.mjs`

Runs after `vite build` and works around two bugs in Start's sitemap generator:

1. It emits `xmlns="https://www.sitemaps.org/..."`. The sitemaps.org namespace is
   the literal string with an **http** scheme. XML namespaces are opaque, not
   fetched, so https is a different namespace and validators reject the file.
2. It writes `pages.json` into the output — route list, host and build timestamp,
   published for no reason.

The script throws if Start's output stops matching either expectation, so an
upstream fix surfaces as a failed build rather than silent double-handling.
Delete it once both are fixed upstream.

### Known gap

`twitter:card` is `summary_large_image` but there is **no `og:image`**, so shared
links render without a preview image. Fixing it properly needs a designed
1200×630 asset — the existing screenshots are portrait phone shots and would look
wrong. Put the file in `public/` and reference it as an absolute URL built from
`SITE_URL`, not a hashed `src/assets/` import, so the URL stays stable across
builds.

## Hard-won constraints — do not undo these

This app came from [Lovable](https://lovable.dev) and was absorbed into the
monorepo. Four things were changed to make it work; reverting any of them
reintroduces a real failure.

1. **Never make `src/server.ts` the server entry.** The original file was
   registered as the server entry while dynamically importing
   `@tanstack/react-start/server-entry` — itself. Rolldown broke the cycle by
   emitting the runtime helpers into a chunk that imported back from the main
   server chunk, so SSR died at module load with `__exportAll is not a function`
   and every request 500'd. Start picks `src/server.ts` up **by filename
   convention**, so merely removing the `server: { entry: "server" }` option does
   not help — the file must not exist. Verified on a pristine Lovable checkout,
   so it is upstream, not local drift.

2. **Images are real files in `src/assets/`, imported normally.** Lovable stored
   them as `*.asset.json` stubs whose `url` pointed at `/__l5e/assets-v1/…`, a
   path served only by Lovable's hosting via a `apply: "serve"` dev-only plugin.
   Nothing reached the build, so every image 404'd in production. If a
   `.asset.json` or a `/__l5e/` URL ever reappears, the image is broken.

3. **Do not reinstall `@lovable.dev/vite-tanstack-config`.** It is inlined into
   `vite.config.ts`. It bundled sandbox-only concerns (dev-server bridge, HMR
   gate, error telemetry, port pinning) and pinned Cloudflare as the fallback
   Nitro preset. The `resolve.dedupe` list and `css.transformer: "lightningcss"`
   are carried over from it deliberately — dropping dedupe gives two React copies
   and "No QueryClient set"; dropping lightningcss changes CSS output.

4. **pnpm, not bun.** `bun.lock` and `bunfig.toml` were deleted. This is a pnpm
   workspace package named `landing`; run `pnpm install` at the repo root
   (`front-end/`), never here. Vercel installs with a frozen lockfile, so an
   out-of-date `pnpm-lock.yaml` fails the deploy.

## Deploying

Vercel project, git repo root is `front-end/`:

| Setting          | Value               |
| ---------------- | ------------------- |
| Root Directory   | `apps/landing_page` |
| Framework Preset | Other               |
| Build Command    | `pnpm build`        |
| Output Directory | `dist/client`       |

No `vercel.json` here, and it must stay that way — the SPA-rewrite `vercel.json`
at `front-end/` is for `apps/web` and would rewrite every URL to `/index.html`,
returning 200 for pages that should 404. It does not apply, because Vercel reads
`vercel.json` from the Root Directory only. Do not copy it in.

## Restoring SSR, if it is ever needed

Non-trivial — budget real time, and know this trap up front: **TanStack Start's
prerenderer and the Nitro Vite plugin do not compose in these versions.**

- Start's prerenderer boots a preview server that loads the server bundle from
  `dist/server/server.js`. Nitro relocates the build output, so the import fails
  with `ERR_MODULE_NOT_FOUND` and every page errors.
- Nitro's own prerenderer (`nitro({ prerender: { routes: ["/"] } })`) fails the
  other way: it crawls through Nitro's router, but Start owns the whole fetch
  handler rather than registering routes, so every route returns 404.

So it is currently prerender **or** Nitro/SSR, not both. To go back to SSR: add
`nitro` to devDependencies, add the `nitro()` plugin gated on
`command === "build"`, drop the `prerender` block, and clear the Vercel Output
Directory — Nitro emits `.vercel/output` (Build Output API v3) and detects Vercel
from the `VERCEL` env var, so `VERCEL=1 pnpm build` reproduces the deploy locally.
Verify by importing `.vercel/output/functions/__server.func/index.mjs` and
calling `default.fetch(new Request("http://localhost/"))` — a green build does
not mean a working function, which is exactly how the `__exportAll` bug survived.
