# Task: Migrate to Ionic Router

## Priority: 🟡 Medium (Architectural)
## Estimated Time: 4-6 hours
## Type: Architecture / UX Improvement
## Status: ✅ COMPLETE - All Phases Done

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

**Phase 3: Migrate Plans Flow**
- ✅ Migrated `PlansPage` to `/plans` route
- ✅ Migrated `CreatePlanPage` to `/plans/create` and `/plans/:id/edit` routes

**Phase 4: Migrate Workout Flow**
- ✅ Migrated `AddWorkoutPage` to `/workouts/create` route
- ✅ Migrated `EditWorkoutPage` to `/workouts/:id/edit` route
- ✅ Migrated `EditWorkoutPage` (manage exercises) to `/workouts/:id/exercises` route
- ✅ Migrated `ExercisePickerPage` to `/exercises/pick` route
- ✅ Migrated `ExerciseDetailPage` to `/exercises/:name` route

**Phase 5: Migrate Dashboard and Session**
- ✅ Migrated `Dashboard` to `/` and `/dashboard` routes
- ✅ Migrated `WorkoutSessionPage` to `/session/:id` route
- ✅ Migrated `ExerciseDetailPage` (from session) to `/session/:id/exercise/:name` route

**Phase 6: Cleanup**
- ✅ Deleted `App.tsx` (no longer needed - all routes in `routes.tsx`)

### ⚠️ Known Issue: Z-Index Workaround

We encountered z-index stacking issues because we're mixing custom components (BottomNav, Framer Motion modals) with Ionic's navigation system. Current workaround uses inline `zIndex: 10000+` on modals and `zIndex: 9999` on BottomNav.

**This is fighting against Ionic's design.** See Task 12 for a proper solution.

---

## Decision Made

**Chosen:** Continue with React Router Switch (custom components)

**Rationale:** Full Ionic migration (Task 12) was evaluated but caused too many styling conflicts with the custom design. The z-index workarounds are acceptable.

**Approach:**
- Keep custom BottomNav with Framer Motion
- Keep custom modals with z-index management
- Use React Router's `Switch` instead of `IonRouterOutlet`
- Accept no native page transitions (use Framer Motion for animations)

---

## Migration Complete! 🎉

All pages have been successfully migrated to React Router. The application now uses URL-based navigation with proper route definitions in `routes.tsx`.

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
