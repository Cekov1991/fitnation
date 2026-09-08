---
status: accepted
---

# The landing page keeps its own stack

`apps/landing_page` is on React 19.2, zod 3, Tailwind 4, Vite 8 and a newer
`lucide-react`; `apps/web` and `apps/mobile` are on React 19.1, zod 4, Tailwind
3 and Vite 5. That split is deliberate and stays.

The landing page shares no code with the apps except `@fit-nation/legal`, a
package of generated, dependency-free TypeScript. It was scaffolded on a
different generation of tooling, is prerendered to static HTML with no runtime,
and is deployed on its own. Converging it would mean either dragging the apps
forward on a marketing site's schedule or holding the site back on the apps',
for no shared code.

What must stay aligned, because it is shared: the `@fit-nation/legal` API, and
the workspace's Node and pnpm versions. Nothing else.

A consequence worth knowing: the workspace installs two copies of `zod` (3.x for
the landing page, 4.x for the apps). That is fine — nothing passes a schema
across that boundary — but `@hookform/resolvers`' `zodResolver` currently types
against zod 3, so the apps' zod 4 schemas produce `TS2769` errors under a clean
install. That is a version compatibility fix in the apps, not a reason to
converge the stacks.

## Considered Options

- **Converge everything on one stack.** Rejected: three independent upgrades
  (React minor, Tailwind major, Vite major) across two apps, to unify with a
  site that shares one small package.
- **Leave it ambiguous.** Rejected: `.cursorrules` rule 11 and this document
  are read by agents, and an unstated split reads as drift to be "fixed".
