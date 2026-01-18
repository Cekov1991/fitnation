# Task: Remove Redundant useTemplates() API Call

## Priority: 🟡 Medium
## Estimated Time: 15 minutes
## Type: Performance / Optimization

---

## Problem

In `src/components/PlansPage.tsx`, both `usePlans()` and `useTemplates()` are called:

```tsx
const {
  data: plans = [],
  isLoading: isPlansLoading
} = usePlans();
const {
  data: templates = []
} = useTemplates();
```

However, the `plans` data already includes `workout_templates` nested within each plan from the API! The separate `useTemplates()` call is redundant and causes an unnecessary network request.

---

## Solution

### Step 1: Remove the useTemplates import and call

**File:** `src/components/PlansPage.tsx`

**Before:**
```tsx
import { useDeletePlan, useDeleteTemplate, usePlans, useStartSession, useTemplates, useUpdatePlan } from '../hooks/useApi';

// ...

const {
  data: plans = [],
  isLoading: isPlansLoading
} = usePlans();
const {
  data: templates = []
} = useTemplates();
```

**After:**
```tsx
import { useDeletePlan, useDeleteTemplate, usePlans, useStartSession, useUpdatePlan } from '../hooks/useApi';

// ...

const {
  data: plans = [],
  isLoading: isPlansLoading
} = usePlans();
// Removed: const { data: templates = [] } = useTemplates();
```

### Step 2: Update usages of `templates`

Find all places where `templates` is used and replace with plan's nested `workout_templates`.

**Location 1: `activePlanWorkouts` useMemo (around line 70-81)**

**Before:**
```tsx
const activePlanWorkouts = useMemo(() => {
  if (!activePlan) return [];
  const planTemplates = activePlan.workout_templates ?? templates.filter(template => template.plan_id === activePlan.id);
  return planTemplates.map(template => ({
    // ...
  }));
}, [activePlan, templates]);
```

**After:**
```tsx
const activePlanWorkouts = useMemo(() => {
  if (!activePlan) return [];
  const planTemplates = activePlan.workout_templates ?? [];
  return planTemplates.map(template => ({
    templateId: template.id,
    name: template.name,
    description: template.description || '',
    daysOfWeek: template.day_of_week !== null ? [DAY_NAMES[template.day_of_week]] : [],
    completed: false,
    plan: activePlan.name
  }));
}, [activePlan]);
```

**Location 2: `allPlans` useMemo (around line 83-96)**

**Before:**
```tsx
const allPlans = useMemo(() => {
  return plans.map(plan => {
    const planTemplates = plan.workout_templates ?? templates.filter(template => template.plan_id === plan.id);
    const workouts = planTemplates.length;
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      workouts,
      isEmpty: workouts === 0,
      isActive: plan.is_active
    };
  });
}, [plans, templates]);
```

**After:**
```tsx
const allPlans = useMemo(() => {
  return plans.map(plan => {
    const planTemplates = plan.workout_templates ?? [];
    const workouts = planTemplates.length;
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      workouts,
      isEmpty: workouts === 0,
      isActive: plan.is_active
    };
  });
}, [plans]);
```

---

## API Verification

Ensure the `/plans` API endpoint returns `workout_templates` nested in each plan. Check `src/types/api.ts`:

```typescript
export interface PlanResource {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  workout_templates: WorkoutTemplateResource[] | null; // ✅ Already included
  created_at: string;
  updated_at: string;
}
```

---

## Validation Steps

1. Open the Network tab in browser DevTools
2. Navigate to the Plans page
3. Verify only ONE API call is made (`/plans`), not two (`/plans` + `/workout-templates`)
4. Verify all plans display correct workout counts
5. Verify active plan shows correct workout list
6. Test adding/removing workouts still works

---

## Note

If for some reason the API doesn't always return `workout_templates`, keep the fallback but without the extra API call:

```tsx
const planTemplates = plan.workout_templates ?? [];
```

This gracefully handles the case where `workout_templates` is null/undefined.
