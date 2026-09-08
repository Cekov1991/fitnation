# Bug: The two legal renderers produce different documents

Status: needs-decision
Origin: monorepo depth review, 2026-09-03.
Scope: `packages/legal`, `apps/web`, `apps/landing_page`, `apps/mobile`

## Problem Statement

`packages/legal` is the single source of truth for the privacy policy and terms
— and it is a genuinely deep module: a 37-line type behind a 176-line
zero-dependency markdown parser that throws at 11 distinct sites rather than
guessing, with byte-for-byte regeneration checking.

But it exposes only *documents and types*. Everything else a rendered legal page
needs, each consumer supplies itself: the canonical URL, the page title, the meta
description, the "see also" link to the sibling document, and the contact and
copyright footer.

The consequence is live. `apps/web` appends a footer the source does not contain:

```tsx
<a href="mailto:support@fitnation.mk">support@fitnation.mk</a>
<p className="mt-2">© {new Date().getFullYear()} Stefan Cekov. All rights reserved.</p>
```

`apps/landing_page`'s renderer has **neither**. So the two renderings of "the
same" document carry different contact and copyright text — while that same
email address also lives *inside* the source markdown.

## Second problem: three hosts, none cross-referenced

- `apps/mobile` deep-links `https://fitnation.mk/terms` and `/privacy`
- `apps/landing_page` declares `https://joinfitnation.com` canonical
- the document text itself gives `support@fitnation.mk`

Nothing in `packages/legal` exposes a document's canonical URL, so every consumer
hardcodes its own opinion.

## Third problem: the tree-walk is duplicated

`apps/landing_page/src/components/legal/legal-page.tsx` and
`apps/web/src/components/legal/LegalDocumentPage.tsx` are structurally
near-identical — same recursive `Spans`/`Blocks` pair, same sticky header and TOC
aside, same `href.startsWith('/')` internal-link test, same `scroll-mt-24`.
Roughly 330 lines of duplicated *traversal* for a 37-line type, differing only in
class strings.

`packages/legal/README.md:27-36` records this duplication as deliberate, and for
the styling that is defensible — the two apps share no design tokens. It is the
traversal, not the styling, that is duplicated.

## Why this needs a decision

Two questions, and the fix differs:

1. **Where does legal-adjacent metadata live?** Contact address, copyright
   holder, canonical URL and effective date are all legally relevant and all
   currently outside the source of truth. The straightforward answer is that they
   belong *in* `packages/legal` — in the markdown front matter, or in a small
   document-metadata export — and no consumer should hardcode them.
2. **Which host is canonical?** `fitnation.mk` and `joinfitnation.com` cannot
   both be. This is a product/marketing call, not an engineering one, and mobile
   currently points at the one the landing page does not claim.

## Evidence

- `apps/web/src/components/legal/LegalDocumentPage.tsx:176-180` — the appended
  footer
- `apps/landing_page/src/components/legal/legal-page.tsx` — no footer
- `apps/web/src/components/legal/LegalDocumentPage.tsx:66-73` — the hand-passed
  `alsoSee` prop, filled in at `PrivacyPolicyPage.tsx:10` and
  `TermsOfServicePage.tsx:10`, so each document must be told what the other is
  called
- `apps/mobile/src/screens/placeholders/LoginScreen.tsx:181,188` and
  `RegisterScreen.tsx:160,167` — the `fitnation.mk` deep links
- `packages/legal/content/privacy-policy.md:209` — `support@fitnation.mk` inside
  the source
- `packages/legal/src/types.ts` — the 37-line interface
- `packages/legal/README.md:27-36` — the recorded rationale for two renderers

## Proposed change

Once the decisions are made:

- Extend the front matter with the metadata each consumer currently invents, and
  expose it on `LegalDocument`. The sibling link becomes derivable rather than
  hand-passed.
- Have both renderers read contact and copyright from the document instead of
  hardcoding them.
- Point mobile at the canonical host. Consider whether mobile should render the
  documents in-app instead — it is the only client that cannot show them offline,
  and it already depends on `@fit-nation/shared` but not `@fit-nation/legal`.

## Out of scope

- unifying the two renderers' markup (deliberate — see `packages/legal/README.md`)
- the parser's accepted markdown subset

## Acceptance

- Both rendered documents show identical contact and copyright text
- No legal-relevant copy exists outside `packages/legal/content/`
- One canonical host, and mobile links to it
- A document's sibling link is derived, not passed in by hand
