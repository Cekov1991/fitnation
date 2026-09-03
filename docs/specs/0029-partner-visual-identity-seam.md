# Architecture: The Partner visual identity seam

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03.
Scope: `apps/mobile`, `apps/web`, `packages/shared`
Absorbs: 0017 part 2, 0019 part 3

## Problem Statement

White-label Partner branding is the product's multi-tenant premise, and on both
platforms it reaches components through channels with no compile-time link.

### Mobile

`ThemeContext` is 34 lines: a `useColorScheme()` read, an `overrides` object, and
a merge-only `setColors`. `AuthContext` is the sole writer, via
`applyPartnerColors`, called from five places.

- **`overrides` is never cleared** — the logout leak filed as 0017.
- **The dependency is inverted.** `AuthContext` imports `useTheme`, so
  authentication depends on theming, and `App.tsx:89-90`'s provider nesting is
  load-bearing and unstated.
- **New object identity every render.** `colors` and the provider `value` are
  both fresh objects on every `ThemeProvider` render. **73 files** call
  `useTheme()`, so all of them re-render together — and memoised callbacks keyed
  on `colors` invalidate each time, which defeats at least one deliberate
  `memo()` (`ExerciseNavTabs.tsx:291`, the `renderItem` of a `FlatList`).
- **Alpha by string concatenation at ~120 sites**, in a dozen spellings
  (`}1A`, `}15`, `}18`, `}20`, `}22`, `}25`, `}26`, `}30`, `}33`, `}40`, `}4D`,
  `}50`, `}0D`, `}08`, `}B3`, `}D9`, `}E6`, `}99`, …). The convention is
  documented once in `constants/theme.ts:11-15` and there is no helper, so the
  same visual weight is `}20` in one file and `}26` in another.
- **68 `'#fff'` literals** where `colors.textButton` exists precisely for them.
  These are the sites that break for a Partner whose brand needs dark content on
  its primary.
- **8 `.tsx` files never call `useTheme`** and hardcode instead
  (`error-boundary.tsx`, `OfflineBanner.tsx`, `FormField.tsx`, `Placeholder.tsx`).
- **Palette-free colour decisions in the progress modals.**
  `BalanceModal.tsx:59-67` picks a colour by **string-matching muscle names**
  (`n.includes('chest')`, `n.includes('quad')`); `:19-56` returns 5 hardcoded
  rgba sets per level; `WeeklyProgressModal.tsx:75-84` and
  `ProgressScreen.tsx:338,347,388,394` hardcode more. None follow a Partner brand.

### Web

The same concept arrives as CSS custom properties written by an effect
(`useBranding.tsx:158-180`) and read by **1,211 inline `style` objects** via
`var(--color-primary)` and `color-mix(...)`. Nothing checks the connection —
which is why `--color-danger` is styled against at
`WorkoutPreviewPage.tsx:356,358` and **defined nowhere**.

- Two independent tenant resolvers merged by five ternaries: subdomain lookup
  (fetched outside React Query, in a raw `.then/.catch/.finally` with its own
  `cancelled` flag) and `user.partner.visual_identity`.
- The colours are **not** in `BrandingContext` — only `logo`, `partnerName`,
  `hasBranding`, `theme`, `partnerSlug`, `subdomainLoading` are. So adding a
  brand colour means editing `index.css` **and** `useBranding.tsx` **and** every
  consuming `style={{}}`.
- Theme tracked twice (`theme` and `effectiveTheme`), synced by an effect that
  also mutates the DOM, so `effectiveTheme` is always one render behind.
- **Four separate z-index authorities**, one of which is a CSS rule matching on
  *the presence of an inline style string*:
  `index.css:131-133` `.fixed.inset-0[style*="z-index"] { z-index: 10000 !important; }`
- **Three `console.log` debug statements ship in the render path**, under a
  `// TODO: Remove debug logs after verifying subdomain branding works`.
- The slug key mismatch filed as 0019.

## Evidence

- `apps/mobile/src/context/ThemeContext.tsx` (all 34 lines)
- `apps/mobile/src/context/AuthContext.tsx:8,49,68-78,138-157`
- `apps/mobile/src/constants/theme.ts:11-15,68` — `AppColors`, the alpha comment,
  two commented-out lines left in
- `apps/mobile/App.tsx:89-90`
- `apps/web/src/hooks/useBranding.tsx:31-216`
- `apps/web/src/utils/subdomain.ts:12-31`
- `apps/web/src/index.css:37,56,131-133`
- `packages/shared/src/auth.ts:41`

## Proposed change

One module owning the **resolved visual identity for a session**: which Partner,
which colours for the active theme, and the derivations that follow — alpha
variants, `textButton` contrast, and the semantic colours the progress modals
currently invent.

- One writer, one reset path, and identity derived *from* auth state rather than
  pushed *into* the theme — which removes mobile's provider-ordering requirement
  and gives 0017's reset for free.
- Memoise the resolved object so 73 consumers stop re-rendering in lockstep.
- Give alpha a function instead of a string-concat convention.
- Replace the 68 `'#fff'` literals with `colors.textButton`.
- On web, put the colours in the context so a component's dependency on a brand
  colour is visible to the compiler, and define every token it references.

Semantic colour (`success` / `warning` / `error`) should be explicitly separate
from the Partner accent — a Partner may not override "this set failed".

## Out of scope

- which fields a Partner may override (currently `primary` and `secondary` only,
  deliberately)
- unifying mobile's `AppColors` with web's CSS variables — the two platforms may
  keep different mechanisms; what matters is that each has one owner
- the z-index authorities and the debug logs — small, fix in passing

## Acceptance

- Log out of a Partner account into a plain one → default palette, no cold start
- Every colour a component renders comes from the resolved identity, or is a
  documented semantic colour
- No CSS custom property is referenced without being defined
- `useTheme()` consumers do not re-render when nothing about the identity changed
- One storage key for the Partner slug (0019)
- No `console.log` in a render path
