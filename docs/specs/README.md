# Specs

One file per problem. A spec states the problem, the evidence, and what would
resolve it — not a schedule. `Status` is the only field that changes over time.

Specs from the 2026-09-03 depth review are titled `# Bug:` or
`# Architecture:` — a Bug is behaviour that is already wrong, an Architecture
spec is a shape that keeps producing them. Earlier specs predate the
convention and keep `# Spec:`.

- `ready-for-agent` — the problem and the fix are both settled; someone can pick
  it up
- `needs-decision` — the fix depends on a call nobody has made yet; the spec says
  what the options are
- `blocked` — waiting on another spec, named in the file
- `done` — landed on `main` (2026-09-08 unless noted)

## Open

| # | Spec | Status | Scope |
|---|---|---|---|
| 0001 | Unit System remediation on the front-end | done | web, mobile, shared |
| 0002 | Surface mutation failures in the workout session UI | done | mobile |
| 0003 | Optimistic set logging | done | shared |
| 0004 | Pause and resume a workout instead of destroying it | needs-decision | mobile, back-end |
| 0005 | Set logs above `target_sets` are invisible | done (folded into 0023) | mobile |
| 0006 | Set removal splits a client-owned invariant across two requests | ready-for-agent | mobile, shared |
| 0007 | The default-target auto-patch never clears or retries | ready-for-agent | mobile |
| 0008 | A blank set log silently substitutes defaults | ready-for-agent | mobile |
| 0009 | Finish flow — warn on incomplete sets, and use the notes field | ready-for-agent | mobile |
| 0010 | RPE and to-failure capture | needs-decision | back-end, shared, mobile |
| 0011 | Web parity for the workout session simplification | blocked | web |
| 0012 | Push notifications, phase one | done | mobile, shared |

## From the monorepo depth review, 2026-09-03

Bugs first — each is independent and small. Then the architecture work, which has
a dependency order.

| # | Type | Spec | Status | Scope |
|---|---|---|---|---|
| 0013 | Bug | Every set edit invalidates the whole exercise catalog | done | shared |
| 0014 | Bug | The live session still runs the five-step exercise swap | done | web |
| 0015 | Bug | The bodyweight rule has four owners and they disagree about TRX | done (folded into 0023) | mobile, web, shared |
| 0016 | Bug | The `isAuthenticated` query gate is a no-op on mobile | done | shared, mobile, web |
| 0017 | Bug | Partner branding survives logout | done | mobile |
| 0018 | Bug | Two query keys are invalidated and never registered | done | shared |
| 0019 | Bug | The Partner slug is stored under two different keys | done | web, shared |
| 0020 | Architecture | Delete the dead tree | done | web, landing, root |
| 0021 | Bug | The two legal renderers produce different documents | done | legal, web, landing, mobile |
| 0022 | Architecture | No CI — the guards that exist are never run | done | root |
| 0023 | Architecture | A Workout Session read model in `packages/shared` | done | shared, mobile, web |
| 0024 | Architecture | One owner for optimistic Session cache patching | done | shared |
| 0025 | Architecture | A typed HTTP seam | done | shared, web, mobile |
| 0026 | Architecture | Named orchestrations for the multi-write invariants | done | shared, mobile, web |
| 0027 | Architecture | Display formatting belongs to the Unit System module | done | shared, mobile, web |
| 0028 | Architecture | A query key registry | done | shared, web |
| 0029 | Architecture | The Partner visual identity seam | done | mobile, web, shared |
| 0030 | Architecture | Split the web session hook's 52-member interface | done | web |
| 0031 | Architecture | Findings from the depth review not yet specced | done (#4, #6, #10 left open by decision) | various |
| 0032 | Architecture | A toast mechanism for `apps/web` | done | web |
| 0034 | Architecture | Replace the drag-to-reorder list on mobile | done | mobile |
| 0035 | Feature | One place to customise the personalised plan (mobile) | done | mobile |
| 0036 | Feature | Exercise filters as two dropdowns (mobile) | in progress | mobile |

### Suggested order

**First**, because they make everything else observable and honest:
0022 (CI) → 0020 (deletions).

**Then the standalone bugs**, in payoff order:
0014 → 0018 → 0017 → 0013 → 0019.

**Then the refactors**, in dependency order:
0027 → 0028 → 0024 → 0023 → 0026 → 0029 → 0030.

`0027` first because it is pure functions with a test already waiting for them —
the lowest-risk way to establish the move-and-test habit the rest depend on.

**Decisions to settle before they block work:**
`0005` (floor or cap) blocks 0023. `0015` (TRX) folds into 0023.
`0016` and `0021` are independent but each needs a call before code.

`0031` is a holding file for ~11 findings that did not warrant their own spec.
Read it before starting 0014 or 0026 — entry 1 (no toast mechanism on web) blocks
the error-surfacing half of both.

## Related

- `plans/` — stage-by-stage implementation plans (historical)
- `back-end/CONTEXT.md` — domain vocabulary
- `back-end/docs/adr/` — back-end architecture decisions
