# Feature: Seven free days after onboarding, then the paywall (backend, mobile, stores)

Status: in progress — implemented on `dev` in both repos 2026-10-05, uncommitted, waiting for Kiril's review
Origin: Kiril, 2026-10-05 — "user downloads the app, registers, finishes onboarding and
gets 7 days without leaving a card; when the 7 days expire we show the paywall."
Scope: `fitnation-backend` (`dev`), `apps/mobile`, the two store consoles. The web app
needs nothing: it reads the same entitlements.

## Problem Statement

Today a new user meets the paywall the moment onboarding ends. The only free period on
offer is the stores' 7-day introductory offer, which starts with a subscription: card on
file, store sheet, auto-renew. Kiril wants the first week free with no card and no store
interaction, and the paywall only once that week is over.

## What already exists

- `users.grace_period_ends_at`: a future value grants `app_access`
  (`User::entitlements()`), the gate middleware lets the user through, `GET /api/user`
  exposes it under `subscription.grace_period_ends_at`. Built for the 30-day launch grace
  of existing users (`subscriptions:grant-launch-grace`, which only touches users whose
  value is NULL).
- The app already routes to the paywall when access lapses: a gated 403
  `subscription_required` invalidates the user and RevenueCat queries (`AuthContext`),
  every foreground refreshes the user, and `EntitlementWatcher` resets the stack from the
  fresh entitlements. Verified on Android in go-live step 15.
- Onboarding's hand-over consults the fresh user (`leaveOnboarding` → `refreshUser()` →
  `gateRoute`), so a user who gains access during onboarding lands on Tabs, not the paywall.

So the feature is a start date for the existing grace, plus the words around it.

## Change

### Backend — the trial starts when onboarding completes

- `config/subscriptions.php` gains `'signup_trial_days' => env('SUBSCRIPTIONS_SIGNUP_TRIAL_DAYS', 7)`.
  `0` disables the trial without a deploy of code.
- `User::startSignupTrial(): void` sets `grace_period_ends_at = now()->addDays(days)` **only
  when the column is NULL** and the configured days are > 0. One-shot per account: a second
  onboarding, a re-login or a launch grace already granted never moves the date.
- Called from `WelcomePlanGenerationService::generateWelcomePlan`, right where
  `onboarding_completed_at` is first set. That is the one place every registration path
  (email, Google, Apple, partner-invite web form) converges, and it is the moment the app
  becomes usable. Starting at registration instead would spend trial days on email
  verification and would need three call sites. The API response of `/onboarding/complete`
  is unchanged; the app's next `GET /api/user` carries `app_access`.
- Sponsored members and users who already hold a subscription get the date too; it is
  inert for them (entitlements are a union) and keeps the rule simple.
- `subscriptions:grant-launch-grace` is unchanged: at launch it still targets exactly the
  users who have never been granted anything, which after this change means the users
  from before it. Existing users get the 30 days, not 7 (decision below).
- The API stays as it is. The app derives the trial state from the fields it already
  receives: no `status`, not sponsored, `grace_period_ends_at` in the future.

Tests (`tests/Feature`): completing onboarding with enforcement on sets a grace 7 days out
and `GET /api/user` then lists `app_access`; completing it again leaves the date alone; a
user with an earlier grace keeps it; `signup_trial_days = 0` sets nothing; the launch grace
command still skips a user whose trial was set this way.

### Mobile — the words

- `subscriptionCopy` (Profile card, Account row, Subscription page) gains the trial state:
  title **Free trial**, summary `Ends Oct 12 · 7 days left` (`formatDate(…, 'long')`,
  `1 day left` on the last day, `Ends today` under 24 h). Not manageable: there is no store
  plan. Once the date has passed with no subscription the existing "No active plan /
  Subscribe to unlock…" copy applies. Order of precedence stays: sponsored → store plan
  status → trial → none.
- `PaywallScreen`: when `subscription.grace_period_ends_at` is in the past and there is no
  store plan, the hero reads **Your free trial has ended** / "Subscribe to keep your plans,
  workouts and progress." Otherwise the current store-driven copy. The CTA keeps following
  the store offer (`selectedHasTrial`), so it reads "Subscribe Now" once the store offers
  are off (below) and still says "Start 7-Day Free Trial" on dev while they are on.
- No navigation change. Day 7 while the app is open is handled by the existing 403 →
  invalidate → reroute path and the foreground refresh; the device check in the test plan
  confirms it rather than assumes it.

Tests: `subscriptionCopy` cases for the trial (future date, last day, past date with and
without a plan, sponsored with a date); a paywall copy test for the ended-trial hero.

### Stores — no second trial

Both stores currently carry a 7-day free introductory offer. Left on, a user would get the 7
free days and then a 7-day store trial on subscribing: 14 days, and the paywall copy would
promise a trial again. Before the production release (go-live step 20):
- Play Console: deactivate offer `free-trial-7d` on both base plans.
- App Store Connect: remove the introductory offer on both subscriptions (allowed before
  approval; after approval the offer would need an end date instead).
Nothing in the code refers to the offers. On dev they stay on until then; they do not
affect the trial logic, only the paywall's headline.

## Decisions

| Question | Decision |
|---|---|
| Trial per account or per device? | **Per account** (Kiril, 2026-10-05). A deleted account or a "Hide My Email" address can start over; accepted. Device-bound would cost about a day and is left for later if abuse shows up. |
| Existing users at launch? | **30-day launch grace as planned**, not the 7-day trial (Kiril, 2026-10-05). |
| Start at registration or at onboarding completion? | **Onboarding completion** — one call site, and the days are not spent on email verification. |
| Keep the store introductory offers? | **No** — off before step 20, otherwise 14 free days. |

## Test plan on dev

1. Android (Redmi, preview build with this change): sign in with a seeded account that has
   never onboarded and has no grace (`trainer2@fitnation.gym` after a reset), complete
   onboarding → Tabs, no paywall; Profile card "Free trial · Ends … · 7 days left";
   `GET /api/user` → `grace_period_ends_at` 7 days out, `entitlements: ["app_access"]`.
2. Shorten the trial on Laravel Cloud → Commands:
   `php artisan tinker --execute='App\Models\User::where("email","trainer2@fitnation.gym")->update(["grace_period_ends_at"=>now()]);'`
   then foreground the app → paywall with "Your free trial has ended"; a gated call while
   the app stays open also lands on the paywall (403 path).
3. iOS: Stefan repeats 1 and 2 on his build; subscribing from the ended-trial paywall goes
   through the sandbox as in the go-live tracker.
4. Reset the seeded accounts afterwards (`grace_period_ends_at` back to NULL) so the
   go-live checks keep gating.

## Out of scope

- A "your trial ends tomorrow" push (the notification services already know
  `onboarding_completed_at`; a follow-up spec if wanted).
- Device-bound trials.
- Web copy: `SubscribePage` only tells the user to subscribe in the app, which stays true.
