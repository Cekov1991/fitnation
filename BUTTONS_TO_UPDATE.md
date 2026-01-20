# Buttons That Make POST/PUT Requests - LoadingButton Implementation Guide

This document lists all buttons that trigger POST/PUT requests and need to be updated with the `LoadingButton` component.

## ✅ Already Updated
- **LoginPage.tsx** - Submit button (uses `isSubmitting` from react-hook-form)
- **ProfilePage.tsx** - Save Changes button (uses `isSubmitting` from react-hook-form)

---

## 📝 Form Submit Buttons (Use `isSubmitting` from react-hook-form)

### 1. **AddWorkoutPage.tsx** (Line 297-318)
- **Button**: Submit button for creating/editing workout
- **State**: `isSubmitting` from react-hook-form
- **Loading Text**: "Saving..."
- **Action**: Creates/updates workout template (POST/PUT)

```tsx
// Current: Regular button with isSubmitting check
// Update to: <LoadingButton isLoading={isSubmitting} loadingText="Saving...">
```

### 2. **CreatePlanPage.tsx** (Line 187-208)
- **Button**: Submit button for creating/editing plan
- **State**: `isSubmitting` from react-hook-form
- **Loading Text**: "Saving..."
- **Action**: Creates/updates plan (POST/PUT)

```tsx
// Current: Regular button with isSubmitting check
// Update to: <LoadingButton isLoading={isSubmitting} loadingText="Saving...">
```

### 3. **EditSetsRepsModal.tsx** (Line 194-215)
- **Button**: Save button in modal
- **State**: `isSubmitting` from react-hook-form
- **Loading Text**: "Saving..."
- **Action**: Updates exercise sets/reps (PUT)

```tsx
// Current: Regular button with isSubmitting check
// Update to: <LoadingButton isLoading={isSubmitting} loadingText="Saving...">
```

---

## 🔄 Mutation Buttons (Use `mutation.isPending`)

### 4. **PlansPage.tsx** - Multiple buttons
- **Line 131**: `handleToggleActive` - Toggle plan active status (PUT)
  - Uses: `updatePlan.mutate()`
  - State: `updatePlan.isPending`
  - Button: In PlanMenu component (via `onToggleActive` callback)

- **Line 142**: `handleDeletePlan` - Delete plan (DELETE)
  - Uses: `deletePlan.mutate()`
  - State: `deletePlan.isPending`
  - Button: In PlanMenu component (via `onDelete` callback)

- **Line 146**: `handleStartWorkout` - Start workout session (POST)
  - Uses: `startSession.mutate()`
  - State: `startSession.isPending`
  - Button: In WorkoutMenu component (via `onStartWorkout` callback)

- **Line 164**: `handleDeleteWorkout` - Delete workout template (DELETE)
  - Uses: `deleteTemplate.mutate()`
  - State: `deleteTemplate.isPending`
  - Button: In WorkoutMenu component (via `onDelete` callback)

**Note**: These mutations are triggered from menu components. You may want to:
- Pass `isPending` states to menu components
- Or handle loading states within PlansPage and disable menu buttons

### 5. **EditWorkoutPage.tsx** - Multiple buttons
- **Line 84**: `handleSaveSetsReps` - Update exercise sets/reps (PUT)
  - Uses: `updateExercise.mutateAsync()`
  - State: `updateExercise.isPending`
  - Button: Save button in EditSetsRepsModal (already covered above)

- **Line 103**: `handleRemoveExercise` - Remove exercise from template (DELETE)
  - Uses: `removeExercise.mutateAsync()`
  - State: `removeExercise.isPending`
  - Button: In ExerciseEditMenu component (via `onRemove` callback)

### 6. **WorkoutSessionPage.tsx** - Multiple buttons
- **Line 102**: `handleDidIt` - Log a set (POST)
  - Uses: `logSet.mutateAsync()`
  - State: `logSet.isPending`
  - Button: "Log Set" button in SetLogCard component (Line 84-92)

- **Line 134**: `handleSaveEdit` - Update a logged set (PUT)
  - Uses: `updateSet.mutateAsync()`
  - State: `updateSet.isPending`
  - Button: "Save" button in SetEditCard component (Line 96-107)

- **Line 165**: `handleFinish` - Complete workout session (POST)
  - Uses: `completeSession.mutateAsync()`
  - State: `completeSession.isPending`
  - Button: "FINISH WORKOUT" button (Line 461-470)

- **Line 178**: `handleAddSet` - Add set to exercise (PUT)
  - Uses: `updateSessionExercise.mutateAsync()`
  - State: `updateSessionExercise.isPending`
  - Button: In SetsList component (via `onAddSet` callback)

- **Line 203**: `handleRemoveSet` - Delete set (DELETE)
  - Uses: `deleteSet.mutateAsync()` or `updateSessionExercise.mutateAsync()`
  - State: `deleteSet.isPending` or `updateSessionExercise.isPending`
  - Button: In SetOptionsMenu component (via `onRemoveSet` callback)

- **Line 255**: `handleSelectExercise` (add mode) - Add exercise to session (POST)
  - Uses: `addSessionExercise.mutateAsync()`
  - State: `addSessionExercise.isPending`
  - Button: In ExercisePickerPage (selection triggers this)

- **Line 272**: `handleSelectExercise` (swap mode) - Swap exercise (DELETE + POST)
  - Uses: `removeSessionExercise.mutateAsync()` + `addSessionExercise.mutateAsync()`
  - State: `removeSessionExercise.isPending || addSessionExercise.isPending`
  - Button: In ExercisePickerPage (selection triggers this)

- **Line 308**: `handleRemoveExercise` - Remove exercise from session (DELETE)
  - Uses: `removeSessionExercise.mutateAsync()`
  - State: `removeSessionExercise.isPending`
  - Button: In ExerciseOptionsMenu component (via `onRemoveExercise` callback)

### 7. **DashboardPage.tsx**
- **Line 83**: `handleSelectTemplate` - Start workout session (POST)
  - Uses: `startSession.mutateAsync()`
  - State: `startSession.isPending`
  - Button: Selection in WorkoutSelectionModal triggers this
  - **Note**: The "Start Workout" button (Line 162-174) just opens modal, doesn't directly call API

### 8. **routes.tsx** - Wrapper components (async handlers)
These are not direct buttons but async handlers that could show loading states:
- **Line 141**: `CreatePlanPageWrapper.handleSubmit` - Creates plan (POST)
- **Line 190**: `EditPlanPageWrapper.handleSubmit` - Updates plan (PUT)
- **Line 249**: `CreateWorkoutPageWrapper.handleSubmit` - Creates workout (POST)
- **Line 316**: `EditWorkoutPageWrapper.handleSubmit` - Updates workout (PUT)
- **Line 416**: `ExercisePickerPageWrapper.handleSelectExercise` - Adds exercise (POST)

**Note**: These handlers are called from form submissions, so the loading state is already handled by `isSubmitting` in the form components.

---

## 📋 Summary by Component

### High Priority (Direct User-Facing Buttons)
1. ✅ LoginPage.tsx - Submit button
2. ✅ ProfilePage.tsx - Save Changes button
3. ⚠️ AddWorkoutPage.tsx - Submit button
4. ⚠️ CreatePlanPage.tsx - Submit button
5. ⚠️ EditSetsRepsModal.tsx - Save button
6. ⚠️ WorkoutSessionPage.tsx - "Log Set" button (SetLogCard)
7. ⚠️ WorkoutSessionPage.tsx - "Save" button (SetEditCard)
8. ⚠️ WorkoutSessionPage.tsx - "FINISH WORKOUT" button

### Medium Priority (Menu/Action Buttons)
9. ⚠️ PlansPage.tsx - Menu actions (Toggle Active, Delete Plan, Start Workout, Delete Workout)
10. ⚠️ EditWorkoutPage.tsx - Remove Exercise action
11. ⚠️ WorkoutSessionPage.tsx - Add Set, Remove Set, Add Exercise, Remove Exercise, Swap Exercise

### Lower Priority (Indirect Actions)
12. ⚠️ DashboardPage.tsx - Workout selection (handled in modal)
13. ⚠️ routes.tsx - Form submission handlers (already use isSubmitting)

---

## 🎯 Implementation Pattern

### For Form Buttons:
```tsx
<LoadingButton
  type="submit"
  isLoading={isSubmitting}
  loadingText="Saving..."
  disabled={!isValid || isSubmitting}
  className="..."
>
  Save Changes
</LoadingButton>
```

### For Mutation Buttons:
```tsx
<LoadingButton
  onClick={handleAction}
  isLoading={mutation.isPending}
  loadingText="Processing..."
  disabled={mutation.isPending}
  className="..."
>
  Action Text
</LoadingButton>
```

### For Multiple Mutations:
```tsx
<LoadingButton
  onClick={handleAction}
  isLoading={mutation1.isPending || mutation2.isPending}
  loadingText="Processing..."
  disabled={mutation1.isPending || mutation2.isPending}
  className="..."
>
  Action Text
</LoadingButton>
```
