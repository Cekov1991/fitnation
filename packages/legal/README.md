# @fit-nation/legal

Single source of truth for the Fit Nation legal documents, shared by `apps/web`
and `apps/landing_page`.

```
content/privacy-policy.md      <- edit these
content/terms-of-service.md
src/generated/*.ts             <- generated, committed, do not edit
```

## Editing the legal text

1. Edit the markdown in `content/`.
2. Regenerate and commit both the markdown and the generated output:

   ```bash
   pnpm legal:build          # from the repo root
   ```

3. `pnpm legal:check` exits non-zero if the generated files are stale. Wire it
   into CI so an edit to the markdown cannot ship without the regenerated output.

Nothing consumes the markdown at runtime. The apps import the generated TS
modules, so neither ships a markdown parser and both prerender fine.

## Why generated TS and not HTML

Each document is emitted as a **block tree**, not an HTML string. That means:

- no `dangerouslySetInnerHTML` in either app;
- no shared prose stylesheet, and no dependency on a typography plugin — which
  matters because the two apps are on different Tailwind majors (web is 3,
  landing is 4);
- each app renders the blocks with its own components, so the two pages can look
  completely different while the words stay byte-identical.

`src/types.ts` defines the shape. `scripts/build.mjs` is the parser, and its
header comment is the spec for the markdown subset it accepts — front matter,
`##`/`###`, paragraphs, `- ` lists, and inline `**bold**`, `` `code` ``,
`[text](target)`. It throws on anything outside that subset rather than guessing,
because silently mis-rendering a legal document is worse than a failed build.

## Anchors

Section ids come from the `{#anchor-id}` suffix on each `##` heading and are used
as link targets (`/privacy#your-rights`). Treat them as a public API: changing one
breaks any external link pointing at it. Section numbers are derived from
position, so reordering sections renumbers them automatically.

## Adding a document

Drop a new `.md` in `content/`, run the build, and export it from `src/index.ts`.
The generated const is the camel-cased filename — `cookie-policy.md` becomes
`cookiePolicy`.
