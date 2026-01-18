# Fit Nation React - Improvement Tasks

This folder contains detailed task documents for improving the codebase. Each file can be fed to an AI agent to implement the changes.

## Task Overview

| # | Task | Priority | Time | Type | Status |
|---|------|----------|------|------|--------|
| 01 | [Fix Duplicate Style Attributes](./01-fix-duplicate-style-attributes.md) | 🔴 High | 10 min | Bug Fix | |
| 02 | [Extract Background Gradients Component](./02-extract-background-gradients-component.md) | 🔴 High | 30 min | DRY | ✅ Done |
| 03 | [Fix WeeklyCalendar Date Recreation](./03-fix-weekly-calendar-date-recreation.md) | 🔴 High | 5 min | Performance | |
| 04 | [Remove Redundant Templates API Call](./04-remove-redundant-templates-api-call.md) | 🟡 Medium | 15 min | Performance | |
| 05 | [Extract Constants to Shared File](./05-extract-constants-file.md) | 🟡 Medium | 20 min | DRY | ✅ Done |
| 06 | [Add TypeScript Types to Hooks](./06-add-typescript-types-to-hooks.md) | 🟡 Medium | 1 hr | Type Safety | |
| 07 | [Replace Inline Hover Handlers](./07-replace-inline-hover-handlers.md) | 🟡 Medium | 2-3 hrs | Performance | |
| 08 | [Migrate to Ionic Router](./08-migrate-to-react-router.md) | 🟡 Medium | 4-6 hrs | Architecture | ⏸️ Paused (Phases 1-2 done) |
| 09 | [Split WorkoutSessionPage](./09-split-workout-session-page.md) | 🟢 Later | 2-3 hrs | Maintainability | |
| 10 | [Refactor App.tsx](./10-refactor-app-tsx.md) | 🟢 Later | 4-6 hrs | Architecture | ⏸️ Blocked (on 08/12) |
| 11 | [Add React Hook Form](./11-add-react-hook-form.md) | 🟢 Later | 3-4 hrs | DX | |
| 12 | [Migrate to Ionic Components](./12-migrate-to-ionic-components.md) | 🟡 Medium | 2-4 hrs | Architecture | 🆕 New |

## Recommended Order

### Phase 1: Quick Wins (1-2 hours total)
1. **01** - Fix the bug first
2. **03** - 5-minute performance fix
3. **04** - Remove redundant API call
4. **02** - ✅ Extract shared component (done)

### Phase 2: Code Quality (3-4 hours total)
5. **05** - ✅ Extract constants (done)
6. **06** - Add proper types
7. **07** - Replace inline hover handlers (can be incremental)

### Phase 3: Architecture - DECISION REQUIRED

**Current State:** Task 08 (Ionic Router) is partially complete (Phases 1-2). However, we hit z-index issues because custom components (BottomNav, modals) conflict with Ionic's stacking contexts.

**Choose ONE path:**

**Path A: Full Ionic Migration (Recommended for native feel)**
- **12** - Migrate to Ionic Components (incremental, start with IonTabBar)
- Then continue **08** (remaining phases)
- Then **10** - Refactor App.tsx

**Path B: Custom Components with Router Workarounds**
- Continue **08** with z-index workarounds
- **10** - Refactor App.tsx (without full Ionic benefits)
- **09** - Split WorkoutSessionPage
- **11** - Add react-hook-form

### Why This Decision Matters

| Feature | Path A (Full Ionic) | Path B (Custom + Workarounds) |
|---------|---------------------|-------------------------------|
| Native page transitions | ✅ Yes | ❌ No |
| Swipe-to-go-back (iOS) | ✅ Yes | ❌ No |
| View stacking | ✅ Yes | ❌ No |
| Custom styling | ✅ Via CSS variables | ✅ Full control |
| z-index issues | ✅ None | ⚠️ Workarounds needed |
| Capacitor-ready | ✅ Full compatibility | ⚠️ Partial |

## How to Use These Documents

### For AI Agents

Each document contains:
- **Problem description** - What's wrong and why
- **Solution** - Step-by-step implementation guide
- **Code examples** - Before/after comparisons
- **Validation steps** - How to verify the fix works

Feed the entire markdown file to an AI agent with a prompt like:

```
Please implement the changes described in this task document for the Fit Nation React codebase:

[paste task content]
```

### For Human Developers

1. Read the problem description to understand the issue
2. Follow the step-by-step solution
3. Use the code examples as reference
4. Run the validation steps to confirm success

## Dependencies Between Tasks

```
01 ─┐
02 ─┤
03 ─┼─> Can be done in parallel
04 ─┤
05 ─┘

06 ─> Standalone

07 ─> Standalone (but benefits from 02)

        ┌─> 12 (Ionic Components) ─┐
08 ─────┤                          ├─> 10 ─> Depends on 08 or 12
        └─> Continue 08 alone ─────┘

09 ─> Can be done independently

11 ─> Standalone (but best after 10)
```

## Files Most Affected

| File | Tasks |
|------|-------|
| `src/App.tsx` | 05, 08, 10, 12 |
| `src/routes.tsx` | 08, 12 |
| `src/components/BottomNav.tsx` | 08, 12 |
| `src/components/WorkoutSessionPage.tsx` | 02, 07, 09 |
| `src/components/PlansPage.tsx` | 02, 04, 05, 07 |
| `src/components/ProfilePage.tsx` | 02, 07, 11 |
| `src/components/AddWorkoutPage.tsx` | 01, 02, 05, 07, 11 |
| `src/components/WeeklyCalendar.tsx` | 03, 05, 07 |
| `src/hooks/useApi.ts` | 04, 06 |
| `src/index.css` | 07, 08, 12 |

## Success Metrics

After completing all tasks:

- [ ] No TypeScript `any` types in hooks
- [ ] No duplicate code patterns (DRY)
- [ ] No duplicate style attributes (bug fixes)
- [x] Browser back/forward buttons work (partial - basic routing done)
- [ ] Network tab shows minimal API calls
- [ ] React DevTools shows minimal re-renders
- [ ] All pages are lazy-loaded
- [ ] Largest component is <300 lines
- [ ] Native page transitions (if Path A chosen)
- [ ] No z-index workarounds (if Path A chosen)