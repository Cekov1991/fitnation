# Spec: Unit System remediation on the front-end

Status: ready-for-agent
Origin: two-axis code review of `feat/web/unit-system-toggle` against merge-base `49ce81d`
Vocabulary: see `back-end/CONTEXT.md`. Conversion rules: see `back-end/docs/adr/0001-convert-units-at-the-http-boundary.md`.

## Problem Statement

A user who prefers imperial can now set that preference and see weights and
heights in pounds and inches. But the front-end was never given a spec of its
own — the back-end plan explicitly scoped itself to the back-end — so each
screen worked out for itself what the user's Unit System implies. The result is
a set of defects the user can actually hit:

- A user editing their profile in imperial is told their weight is invalid when
  it is not, and is allowed to submit weights the server will reject. The
  profile editor checks the number the user typed against limits expressed in
  Canonical Units, so the check is wrong by a factor of 2.2 for weight and 2.54
  for height. The onboarding flow does not have this bug, which makes it worse:
  the same user passes onboarding and then fails on the profile screen with no
  explanation.
- A user entering a metric Body Weight cannot type a decimal. The input's step
  is fixed at whole numbers even though metric measurements are stored and
  returned unrounded, so half-kilogram precision is silently unavailable.
- A user who changes their Unit System on the web profile and hits a network
  error sees nothing at all. The failure is logged to the console and the
  toggle appears to have worked.
- One screen still labels a Training Weight "kg" regardless of preference.

Underneath all of these is one structural cause. Eighteen components each
independently reach into the profile, pull out the Unit System, and re-derive
what follows from it. The label, the input step, the validation bounds and the
option list are each decided in several places, and those places have already
drifted apart. Every new Measured Field added to a screen will re-create the
same class of bug, because there is nowhere for the answer to live.

The back-end solved its version of this by declaring each Measured Field's
Measurement Kind once, so the read path and the write path cannot disagree. The
front-end has no equivalent.

## Solution

Give the front-end a single owner for the Unit System concept, in the shared
package, and make every screen a consumer of it rather than an interpreter of
it.

One module holds everything that follows from a user's Unit System: the unit
types, the display labels, the validation bounds per Measurement Kind, the
input step per Measurement Kind, the selector options, and the helpers that
turn typed text into a number. A companion hook resolves the current user's
Unit System once, so a component asks for the unit it needs and never walks the
profile to work it out.

With that in place the individual defects become small, because each is a
matter of reading the right value from one table rather than patching one
screen. The profile editor gets unit-aware bounds because it shares the
onboarding flow's table. The inputs get correct steps because the step is a
property of the Measurement Kind, not of the markup. The labels stay correct
because there is one way to obtain a label.

The front-end continues to convert nothing. This spec adds no conversion math
and removes the one piece of rounding math that had crept in, keeping the
front-end aligned with ADR-0001.

## User Stories

1. As an imperial user editing my profile, I want my Body Weight validated against pound limits, so that a weight I can legitimately have is not rejected.
2. As an imperial user editing my profile, I want a Body Weight the server will reject to be caught before I submit, so that I get a useful message instead of a failed request.
3. As an imperial user editing my profile, I want my Height validated against inch limits, so that a plausible height is not rejected as out of range.
4. As a user who completed onboarding, I want the profile editor to accept everything onboarding accepted, so that my own saved values do not become invalid when I go back to edit them.
5. As a metric user, I want to enter a Body Weight with decimal precision, so that I can record half a kilogram of change.
6. As a metric user, I want my Height entered in whole centimetres, so that the input matches how Height is actually stored.
7. As an imperial user, I want my Body Weight input to step in half-pounds, so that the input matches the precision the server will keep.
8. As an imperial user, I want my Training Weight inputs to behave sensibly for loads I can actually put on a bar, so that the input does not imply precision that will be discarded.
9. As any user, I want the value I save to come back the same on the next read, and stay the same if I save it again unchanged, so that my measurements do not drift a little further every time I open the screen.
10. As an imperial user, I want to understand that my entered Training Weight may be shown back rounded to the nearest 5 lbs, so that the change is not mistaken for data loss.
11. As a user changing my Unit System on the web, I want to be told when the change fails, so that I do not believe a preference was saved when it was not.
12. As a user changing my Unit System on any platform, I want the same feedback on success and failure, so that the two apps do not behave differently for the same action.
13. As a user changing my Unit System while I have unsaved profile edits, I want to know those edits will be discarded, so that I am not surprised to lose them.
14. As any user, I want every screen showing a weight to label it in my Unit System, so that I never have to guess whether a number is kilograms or pounds.
15. As any user, I want every screen showing a height to label it in my Unit System, for the same reason.
16. As a user picking a Unit System, I want the choice presented identically in onboarding and in the profile, so that it reads as one setting rather than two.
17. As a user on a locale whose keyboard produces a comma decimal separator, I want a typed decimal to be understood, so that my weight is not silently truncated to the whole number.
18. As a user typing a decimal weight, I want the decimal point to survive while I am still typing, so that the field does not fight me mid-entry.
19. As a developer adding a screen that shows a Measured Field, I want one way to obtain the correct unit, so that I cannot accidentally hardcode the wrong one.
20. As a developer adding a Measured Field, I want its bounds and input step to follow from its Measurement Kind, so that I do not have to rediscover the rules per screen.
21. As a developer, I want a missed unit at a call site to be a compile error rather than a wrong label at runtime, so that the mistake is caught before review.
22. As a developer reading the front-end, I want exactly one definition of each schema and type, so that I do not read a stale copy and reason from it.
23. As a developer swapping an exercise on a template, I want the operation to preserve the row's existing data, so that a Target Weight is not lost or re-round-tripped through the unit boundary for no reason.
24. As a developer, I want the front-end to hold no rounding or conversion math for measurements, so that the boundary described in ADR-0001 stays true.

## Implementation Decisions

### One module owns the Unit System

A new module in the shared package becomes the single source for everything
derived from a user's Unit System. It exports:

- The Unit System type, plus named types for a weight unit and a height unit.
  These replace the anonymous literal unions currently re-declared inline in
  component prop interfaces.
- The existing label functions, unchanged in behaviour.
- A bounds table keyed by Measurement Kind and Unit System, yielding a minimum,
  a maximum, and the unit name for the message.
- An input step, derived from the Measurement Kind and the Unit System.
- The selector options for choosing a Unit System, so the choice is rendered
  from one list.
- The helpers that normalise typed decimal text and parse it to a number or
  null.

A companion hook resolves the current user's Unit System from the profile and
returns the unit a component needs. Components call the hook; they do not read
the Unit System off the profile and re-derive from it. This replaces the
repeated profile-walking currently present at eighteen call sites, and removes
the need for each of those components to fetch the profile for this purpose.

The hook lives beside the existing shared hooks, consistent with how the shared
package already exposes profile data.

### Validation bounds are unit-aware and shared

The bounds table currently private to the onboarding schema becomes the
exported table, and the profile schema adopts it. Both schemas then check the
value the user typed against limits expressed in the same unit the user typed
it in.

The onboarding table's limits are deliberately narrower than the server's, and
that is kept. The server validates *after* converting to Canonical Units, so
its limits are wide; the client's are human-plausible. The binding rule is that
each client bound, once converted, must fall strictly inside the server's
corresponding bound, so the client never accepts a value the server will
reject. This holds for the current table in both systems and must be re-checked
if either side's numbers change.

The imperial bounds are the metric bounds converted, so the two systems admit
the same set of real measurements. They are stored as a table rather than
computed, because computing them would be conversion math on the client.

### Input step follows the Measurement Kind

Step is a property of the Measurement Kind and the Unit System, not of an
individual input:

- Metric passes through unrounded on the server, so metric inputs must permit
  decimals rather than whole numbers.
- Imperial Body Weight is shown to the nearest half pound, so its step matches.
- Imperial Training Weight is shown to the nearest five pounds. The input is
  not forced to that step, because the server does the rounding and forcing it
  client-side would be the front-end asserting a rounding rule. The step only
  needs to avoid implying precision that will be discarded.
- Height is whole units in both systems.

The current hardcoded half-pound step on a profile input is replaced by a
lookup, so the value is stated once and attributed to the Measurement Kind that
owns it.

### The front-end holds no rounding math

The client-side quantisation currently applied to a Training Weight before it
is placed back into an editable input is removed. It is idempotent today, so it
does not break the fixed-point property, but it is front-end rounding of a
Measured Field and ADR-0001 states the front-end holds no such math. Display
formatting that does not feed back into a writable value is unaffected.

### Text parsing moves to the shared package

The decimal-text normalisation helpers move out of the mobile app into the
shared unit module. They are pure and platform-independent, and the web app
cannot reach them where they currently sit.

Web inputs are not required to adopt them. Web uses native numeric inputs,
which already normalise the locale decimal separator, so wrapping them would be
redundant. The move is for ownership and reuse, not to fix a live web defect.
Any future web input that is not a native numeric input should use the shared
helpers.

### Unit toggle feedback is consistent across platforms

Changing the Unit System is a write that can fail, and it must report failure
to the user on both platforms. The web app currently logs to the console only.
The web app has no general toast mechanism, so this requires either introducing
one or surfacing the error through the mechanism already used on the screen —
that choice is left to implementation, but silent failure is not acceptable.

Both platforms already PATCH the Unit System alone and let the response re-seed
the form, which is what keeps a changed Unit System from ever being sent
alongside a value still expressed in the old unit. That behaviour is correct
and is preserved. Its side effect — unsaved edits are discarded — is currently
documented on one platform only and should be documented on both, and made
visible to the user rather than silent.

### The duplicate front-end module tree is deleted

The web app contains a parallel copy of the shared schemas, API types, API
service and API hooks. Nothing imports any of it. One of these files was
hand-edited during this feature to stay in sync with its shared twin, which
confirms the maintenance cost is already being paid for code that never runs.
The copies are deleted rather than kept in sync.

This also disposes of two latent defects inside them: a whole-number refinement
on Body Weight that would reject a legitimate imperial value, and API types
asserting Canonical Units with no Unit System field.

### Exercise swap uses the endpoint built for it

The template-exercise swap currently performs a remove, an add, and an update
in sequence in order to restore data the add endpoint discards. A dedicated
swap endpoint already exists which mutates only the exercise reference and
preserves the row. Using it removes three round-trips, removes the failure
modes between them, and removes a Target Weight round-trip through the unit
boundary that has no reason to happen during a swap.

### Adjacent debt addressed

- A component declaring a Target Weight as a string and parsing it, contrary to
  the shared type, is brought in line with the shared type.
- An unreferenced component containing a hardcoded unit label is deleted rather
  than corrected. It is exported from a barrel but imported nowhere.
- The workspace resolves two different React type packages, because the web app
  and the mobile app pin different major versions and the shared package pins
  none. This produces several hundred spurious type errors in the web app and
  makes the type checker unusable as a signal. The shared package declares a
  React types version and the apps align on it. This is unrelated to the Unit
  System but blocks verification of everything else in this spec.

## Testing Decisions

A test runner was originally excluded from this spec and has since been added:
Vitest at the workspace root, `pnpm test`. Coverage is deliberately limited to
pure logic — the unit tables, the two form schemas, the decimal-text helpers,
and the fixed-point property. None of it needs a DOM, so no environment is
configured; that decision belongs to whoever first tests a component or a hook.

Every test here was checked by reintroducing the defect it describes and
confirming it fails. A test that has never been seen to fail is not evidence.
That exercise found a real gap — the round-trip tests initially covered only the
web input path — which is why they now run over both.

What is still not covered:

- Anything that renders. No component or hook is tested, so the seam is proven
  correct but not proven to be *used* correctly on any given screen.
- The real HTTP round trip. The server's rounding is modelled in the test from
  the documented rules; nothing here talks to the back-end, so a change on that
  side breaks the model silently rather than turning a test red.
- Unit types are exported and required rather than optional at call sites, so a
  missed unit is a compile error rather than a wrong label at runtime. That is a
  type-checker guarantee, not a test one, and it only became readable once the
  React major divergence was resolved. `pnpm typecheck` runs both apps.

A good test here asserts external behaviour — that a given input in a given Unit
System is accepted or rejected — and not the shape of the table behind it. The
existing files are the prior art to follow.

## Out of Scope

- Any change to the back-end. Its behaviour is the contract this spec conforms
  to, and it is treated as fixed.
- Runtime validation of API responses. The front-end validates none, anywhere,
  which is a real gap but a much larger and separate concern.
- Adding a general toast mechanism to the web app as a feature in its own
  right. Only the unit-toggle failure path must be addressed here.
- The uncommitted theme colour changes and the stray empty configuration file
  currently in the working tree. Unrelated to this work.
- Converting any measurement on the client, under any circumstance.

## Further Notes

The front-end had no spec document before this one. That absence is the root
cause of most of what the review found: the back-end plan explicitly declared
the front-end out of its scope, so the feature was implemented by inference
from the API contract, screen by screen. This document is intended to be the
missing counterpart, and the shared glossary in the back-end remains the
authority on vocabulary — the front-end should not invent parallel terms for
Measurement Kind, Canonical Units, or the three weight concepts.

The review found the fixed-point property currently holds everywhere it was
traced, and no client-side conversion exists anywhere. Those are the two things
most expensive to get wrong, and they are right. The work in this spec is
mostly about making them hard to break rather than about repairing them.

One finding is worth carrying forward as a principle rather than a task: the
defects clustered wherever two places decided the same fact independently, and
they did not appear where a single shared function already owned the answer.
The label helpers were the one existing seam, and no defect was found on that
path.
