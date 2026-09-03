# Bug: The Partner slug is stored under two different keys

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03.
Scope: `apps/web`, `packages/shared`

## Problem Statement

`packages/shared` exports the canonical storage key:

```ts
export const PARTNER_SLUG_KEY = 'partnerSlug'   // packages/shared/src/auth.ts:41
```

`apps/web` never imports it and hardcodes a **different** literal,
`'partner-slug'`, in 16 places. So the shared constant describes a key nothing
on web reads or writes.

Six of those 16 are copies of the same six-line persistence block — "localStorage
slug tracks `user.partner.slug`" — repeated in `login`, `loginWithSocial`,
`register`, `initAuthCheck`, `refetchUser`, and the `visibilitychange` handler,
each with its own `if/else` and `removeItem`.

The value is also written and never read back within `apps/web` — its only
consumer is `updatePWAManifest(partnerSlug)`, which takes it as an argument
rather than reading storage.

## The trap

**Do not simply swap the literal for the constant.** Existing users have
`'partner-slug'` in `localStorage`; renaming the key drops their Partner context
on next load, which on a white-label subdomain means losing the branding until
they re-authenticate.

Read both keys, write only the new one, and delete the old one once read.

## Evidence

- `packages/shared/src/auth.ts:41` — the exported constant
- `apps/web/src/hooks/useAuth.tsx:51-56, 71-76, 86-91, 116-121, 160-165` — the
  five copies of the persistence block
- `apps/web/src/hooks/useAuth.tsx:128-148` — the sixth, in `visibilitychange`
- `apps/web/src/hooks/useBranding.tsx:118-120` — `partnerSlug` resolution, with a
  third fallback to `detectedSlug`
- `apps/mobile` — uses `PARTNER_SLUG_KEY` correctly; web is the outlier

## Proposed change

1. Import `PARTNER_SLUG_KEY` in `apps/web` and use it everywhere.
2. On read, fall back to `'partner-slug'` and migrate: write the value under the
   new key, remove the old. One migration read is enough — put it where the app
   already reads the slug on boot.
3. Collapse the six persistence copies into one function. The invariant is
   "storage tracks `user.partner.slug`, or is absent" — one place should own it.

## Out of scope

- whether web needs to persist the slug at all, given nothing reads it back
  (worth establishing — if the answer is no, delete rather than migrate)
- the subdomain-vs-user branding merge in `useBranding` (see 0029)

## Acceptance

- One storage key for the Partner slug across mobile, web and shared
- A user with the old key keeps their Partner context through the upgrade
- One function owns the persistence invariant
