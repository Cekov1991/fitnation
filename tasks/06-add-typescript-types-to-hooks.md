# Task: Add Proper TypeScript Types to API Hooks

## Priority: 🟡 Medium
## Estimated Time: 1 hour
## Type: Type Safety

---

## Problem

Multiple mutation functions in `src/hooks/useApi.ts` use the `any` type, reducing type safety:

```typescript
mutationFn: ({
  planId,
  data
}: {
  planId: number;
  data: any;  // ❌ No type safety
}) => plansApi.updatePlan(planId, data),
```

---

## Solution

### Step 1: Create Input Types

Add the following to `src/types/api.ts`:

```typescript
// ============================================
// INPUT/REQUEST TYPES
// ============================================

// Plan mutations
export interface CreatePlanInput {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// Template mutations
export interface CreateTemplateInput {
  plan_id: number;
  name: string;
  description?: string;
  day_of_week?: DayOfWeek;
}

export interface UpdateTemplateInput {
  plan_id?: number;
  name?: string;
  description?: string;
  day_of_week?: DayOfWeek | null;
}

// Template exercise mutations
export interface AddTemplateExerciseInput {
  exercise_id: number;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  rest_seconds?: number;
}

export interface UpdateTemplateExerciseInput {
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  rest_seconds?: number;
}

// Session mutations
export interface LogSetInput {
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
  rest_seconds?: number;
}

export interface UpdateSetInput {
  weight?: number;
  reps?: number;
}

// Session exercise mutations
export interface AddSessionExerciseInput {
  exercise_id: number;
  order?: number;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  rest_seconds?: number;
}

export interface UpdateSessionExerciseInput {
  order?: number;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  rest_seconds?: number;
}

// Profile mutations
export interface UpdateProfileInput {
  name?: string;
  email?: string;
  profile_photo?: File;
  fitness_goal?: FitnessGoal;
  age?: number;
  gender?: Gender;
  height?: number;
  weight?: number;
  training_experience?: TrainingExperience;
  training_days_per_week?: number;
  workout_duration_minutes?: number;
}
```

### Step 2: Update useApi.ts Hooks

**File:** `src/hooks/useApi.ts`

Add imports at the top:

```typescript
import type {
  CreatePlanInput,
  UpdatePlanInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  AddTemplateExerciseInput,
  UpdateTemplateExerciseInput,
  LogSetInput,
  UpdateSetInput,
  AddSessionExerciseInput,
  UpdateSessionExerciseInput,
  UpdateProfileInput,
} from '../types/api';
```

#### Update Plan Hooks

**Before:**
```typescript
export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      data
    }: {
      planId: number;
      data: any;
    }) => plansApi.updatePlan(planId, data),
```

**After:**
```typescript
export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      data
    }: {
      planId: number;
      data: UpdatePlanInput;
    }) => plansApi.updatePlan(planId, data),
```

#### Update Template Hooks

```typescript
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      data
    }: {
      templateId: number;
      data: UpdateTemplateInput; // Was: any
    }) => templatesApi.updateTemplate(templateId, data),
```

```typescript
export function useAddTemplateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      data
    }: {
      templateId: number;
      data: AddTemplateExerciseInput; // Was: any
    }) => templatesApi.addExercise(templateId, data),
```

```typescript
export function useUpdateTemplateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      pivotId,
      data
    }: {
      templateId: number;
      pivotId: number;
      data: UpdateTemplateExerciseInput; // Was: any
    }) => templatesApi.updateExercise(templateId, pivotId, data),
```

#### Update Session Hooks

```typescript
export function useLogSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      data
    }: {
      sessionId: number;
      data: LogSetInput; // Was: any
    }) => sessionsApi.logSet(sessionId, data),
```

```typescript
export function useUpdateSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      setLogId,
      data
    }: {
      sessionId: number;
      setLogId: number;
      data: UpdateSetInput; // Was: any
    }) => sessionsApi.updateSet(sessionId, setLogId, data),
```

```typescript
export function useAddSessionExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      data
    }: {
      sessionId: number;
      data: AddSessionExerciseInput; // Was: any
    }) => sessionsApi.addExercise(sessionId, data),
```

```typescript
export function useUpdateSessionExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      exerciseId,
      data
    }: {
      sessionId: number;
      exerciseId: number;
      data: UpdateSessionExerciseInput; // Was: any
    }) => sessionsApi.updateSessionExercise(sessionId, exerciseId, data),
```

### Step 3: Update API Service Types

**File:** `src/services/api.ts`

Update function signatures to use the same types:

```typescript
import type {
  CreatePlanInput,
  UpdatePlanInput,
  // ... other imports
} from '../types/api';

export const plansApi = {
  // ...
  createPlan: async (data: CreatePlanInput) => {
    return fetchWithAuth('/plans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updatePlan: async (planId: number, data: UpdatePlanInput) => {
    return fetchWithAuth(`/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  // ... etc
};
```

---

## Validation Steps

1. Run TypeScript check - should have no errors:
   ```bash
   npx tsc --noEmit
   ```

2. Try passing wrong types to mutations in consuming components - should get TypeScript errors

3. Verify IDE autocompletion works when calling mutations:
   ```typescript
   updatePlan.mutateAsync({
     planId: 1,
     data: {
       name: 'test', // Should autocomplete
       // ... IDE should show available options
     }
   });
   ```

4. Test all CRUD operations still work:
   - Create/update/delete plans
   - Create/update/delete templates
   - Add/update/remove exercises from templates
   - Log/update/delete sets in sessions

---

## Benefits

- Catch type errors at compile time
- Better IDE autocompletion
- Self-documenting code
- Easier refactoring
