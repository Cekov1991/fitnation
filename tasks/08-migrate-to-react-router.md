# Task: Migrate to Ionic Router

## Priority: 🟡 Medium (Architectural)
## Estimated Time: 4-6 hours
## Type: Architecture / UX Improvement
## Status: ⏸️ PAUSED - Phases 1-2 Complete, Pending Decision on Task 12

---

## Current State

### ✅ Completed

**Phase 1: Setup Infrastructure**
- ✅ Installed `react-router-dom@5`
- ✅ Created `routes.tsx` with router setup
- ✅ Created `AuthGuard.tsx`
- ✅ Created `AppShell.tsx`
- ✅ Updated `index.tsx` entry point

**Phase 2: Migrate Simple Pages First**
- ✅ Migrated `ProfilePage` to `/profile` route
- ✅ Updated `LoginPage` with post-login redirect
- ✅ Updated `BottomNav` to use router navigation

### ⚠️ Known Issue: Z-Index Workaround

We encountered z-index stacking issues because we're mixing custom components (BottomNav, Framer Motion modals) with Ionic's navigation system. Current workaround uses inline `zIndex: 10000+` on modals and `zIndex: 9999` on BottomNav.

**This is fighting against Ionic's design.** See Task 12 for a proper solution.

---

## Decision Required

Before continuing with Phases 3-6, decide between:

### Option A: Continue with React Router Switch
- Keep custom BottomNav and modals
- Keep z-index workarounds
- No native page transitions
- Complete phases 3-6 below

### Option B: Migrate to Full Ionic Components (Task 12)
- Replace BottomNav with `IonTabs`/`IonTabBar`
- Replace modals with `IonModal`
- Get native page transitions via `IonRouterOutlet`
- Remove z-index workarounds

**Recommendation:** Complete Task 12 Phase 1 first (IonTabBar only) to test if Ionic components fit your design vision. Then decide whether to continue here or go full Ionic.

---

## Remaining Phases (If Continuing Without Full Ionic)

### Phase 3: Migrate Plans Flow
1. Migrate `PlansPage`
2. Migrate `CreatePlanPage` (handles both create and edit)
3. Test plan creation and editing flows

### Phase 4: Migrate Workout Flow
1. Migrate `AddWorkoutPage` / `EditWorkoutPage`
2. Migrate `ManageExercisesPage`
3. Migrate `ExercisePickerPage`
4. Migrate `ExerciseDetailPage`
5. Test full workout creation flow

### Phase 5: Migrate Dashboard and Session
1. Migrate `Dashboard`
2. Migrate `WorkoutSessionPage`
3. Test workout session start and completion

### Phase 6: Cleanup
1. Remove old navigation state from `App.tsx`
2. Remove unused `onNavigate` props from components
3. Remove old `Page` type
4. Final testing of all flows

---

## URL Structure

| Page | URL |
|------|-----|
| Dashboard | `/` |
| Plans | `/plans` |
| Create Plan | `/plans/create` |
| Edit Plan | `/plans/:planId/edit` |
| Create Workout | `/workouts/create?planId=X` |
| Edit Workout | `/workouts/:templateId/edit` |
| Manage Exercises | `/workouts/:templateId/exercises` |
| Exercise Picker | `/exercises/pick?mode=add` |
| Exercise Detail | `/exercises/:exerciseId` |
| Workout Session | `/session/:sessionId` |
| Profile | `/profile` |
| Login | `/login` |

---

## Navigation API Reference

### useIonRouter Hook

```tsx
import { useIonRouter } from '@ionic/react';

const router = useIonRouter();

// Push a new page (forward navigation)
router.push('/path', 'forward', 'push');

// Go back (with animation)
router.goBack();

// Replace current page (no back entry)
router.push('/path', 'none', 'replace');

// Check if can go back
if (router.canGoBack()) {
  router.goBack();
}
```

---

## Validation Steps

1. ✅ Browser back/forward buttons work correctly
2. ✅ Refreshing the page stays on the same route
3. ✅ Deep links work (e.g., `/profile` opens profile page)
4. ✅ Login redirect works (unauthenticated users go to /login)
5. ✅ After login, users are redirected to original destination
6. ⏸️ Native-feel page transitions (requires Task 12)
7. ⏸️ Swipe-to-go-back on iOS (requires Task 12)
8. ⏸️ View stacking (requires Task 12)
9. ✅ Bottom nav highlights correct page
10. ✅ All navigation flows still work

---

## Related Tasks

- **Task 10 (Refactor App.tsx)** - Depends on this task being complete
- **Task 12 (Migrate to Ionic Components)** - Alternative approach that solves z-index issues
