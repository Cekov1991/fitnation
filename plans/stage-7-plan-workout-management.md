# Stage 7 — Plan & Workout Management

## Overview
Build all screens for creating and managing plans, workout templates, exercises within templates, and browsing partner programs and routines. These are the "library" screens of the app — less complex than the session screen but with significant CRUD interactions.

## Prerequisites
- Stages 0–6 complete
- Exercise picker modal working (from Stage 6)

## Reference Files
- `apps/web/src/components/PlansPage.tsx`
- `apps/web/src/components/CreatePlanPage.tsx`
- `apps/web/src/components/EditPlanPage.tsx`
- `apps/web/src/components/CreateWorkoutPage.tsx`
- `apps/web/src/components/EditWorkoutPage.tsx`
- `apps/web/src/components/ManageExercisesPage.tsx`
- `apps/web/src/components/ProgramLibraryPage.tsx`
- `apps/web/src/components/ProgramDetailPage.tsx`
- `apps/web/src/components/BrowsableRoutineDetailPage.tsx`

## Screens Built This Stage
1. `CreatePlanScreen` — create new custom routine
2. `EditPlanScreen` — edit plan name/description
3. `CreateWorkoutScreen` — create workout template
4. `EditWorkoutScreen` — edit workout name/description
5. `ManageExercisesScreen` — reorder exercises in a workout
6. `ProgramLibraryScreen` — browse programs available to clone
7. `ProgramDetailScreen` — view a cloned program with workouts
8. `RoutineDetailScreen` — browse a partner routine
9. `RoutineWorkoutDetailScreen` — view a workout within a routine

---

## Shared Components to Create

### `apps/mobile/src/components/ui/FormField.tsx`
```tsx
import { View, Text } from 'react-native'
import { Input } from './Input'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  multiline?: boolean
  error?: string
}

export function FormField<T extends FieldValues>({
  control, name, label, placeholder, multiline, error
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <Input
          label={label}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          error={error}
        />
      )}
    />
  )
}
```

### `apps/mobile/src/components/ui/ActionSheet.tsx`
```tsx
// Bottom sheet with a list of actions
// Used for long-press menus on plans, exercises, etc.
// Use @gorhom/bottom-sheet or react-native's built-in Alert for simple cases
// Simple implementation: Modal with a View sliding up from bottom

import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface Action {
  label: string
  onPress: () => void
  destructive?: boolean
}

interface ActionSheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  actions: Action[]
}

export function ActionSheet({ visible, onClose, title, actions }: ActionSheetProps) {
  const { colors } = useTheme()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose}>
        <View className="rounded-t-3xl p-6" style={{ backgroundColor: colors.bgSurface }}>
          {title && (
            <Text className="text-sm font-medium text-center mb-4" style={{ color: colors.textSecondary }}>
              {title}
            </Text>
          )}
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => { action.onPress(); onClose() }}
              className="py-4 border-b"
              style={{ borderColor: colors.bgElevated }}
            >
              <Text
                className="text-base text-center font-medium"
                style={{ color: action.destructive ? colors.error : colors.textPrimary }}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={onClose} className="py-4 mt-1">
            <Text className="text-base text-center font-semibold" style={{ color: colors.textSecondary }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  )
}
```

---

## Step 1 — Build Create Plan Screen

```tsx
// apps/mobile/src/screens/CreatePlanScreen.tsx
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { planSchema, type PlanInput, useCreatePlan } from '@fit-nation/shared'
import { useTheme } from '../context/ThemeContext'
import { FormField } from '../components/ui/FormField'
import { Button } from '../components/ui/Button'
import { ArrowLeft } from 'lucide-react-native'
import type { AppScreenProps } from '../navigation/types'

export function CreatePlanScreen({ navigation }: AppScreenProps<'CreatePlan'>) {
  const { colors } = useTheme()
  const createPlan = useCreatePlan()

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<PlanInput>({
    resolver: zodResolver(planSchema),
  })

  async function onSubmit(data: PlanInput) {
    const plan = await createPlan.mutateAsync(data)
    // Navigate to the new plan's workout creation
    navigation.replace('CreateWorkout') // or navigate to plan detail
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <View className="flex-row items-center gap-4 px-6 py-4">
        <TouchableOpacity onPress={() => navigation.goBack()}
          className="p-2 rounded-full" style={{ backgroundColor: colors.bgSurface }}>
          <ArrowLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>New Plan</Text>
      </View>

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        <FormField control={control} name="name" label="Plan Name"
          placeholder="e.g. Push Pull Legs" error={errors.name?.message} />
        <FormField control={control} name="description" label="Description (optional)"
          placeholder="What's this plan about?" multiline error={errors.description?.message} />

        <Button
          label="Create Plan"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          className="mt-4"
        />
      </ScrollView>
    </SafeAreaView>
  )
}
```

---

## Step 2 — Build Edit Plan Screen

Same structure as Create, but:
- Pre-populates fields from existing plan (fetched via `usePlan(planId)`)
- Submit calls `useUpdatePlan` mutation
- Has a "Delete Plan" danger button at the bottom

---

## Step 3 — Build Create Workout Screen

```tsx
// Collects: name, description
// On create → navigates to ManageExercises for the new workout

async function onSubmit(data: WorkoutInput) {
  const workout = await createWorkout.mutateAsync({ planId, ...data })
  navigation.replace('ManageExercises', { templateId: workout.id })
}
```

---

## Step 4 — Build Manage Exercises Screen

This screen shows all exercises in a workout template and allows reordering.

Key features:
- Draggable list of exercises
- Each exercise card shows: name, sets × reps, weight targets
- Add exercise button → opens ExercisePicker modal
- Remove exercise with swipe or long press
- Reorder with drag handle

```tsx
// Use react-native-draggable-flatlist for drag-to-reorder:
// pnpm add react-native-draggable-flatlist

import DraggableFlatList from 'react-native-draggable-flatlist'

// Exercise row with drag handle
function ExerciseRow({ item, drag, isActive }) {
  return (
    <TouchableOpacity onLongPress={drag} disabled={isActive}>
      {/* Exercise info */}
      {/* Sets × Reps targets */}
      {/* Remove button */}
    </TouchableOpacity>
  )
}
```

Install:
```bash
cd apps/mobile && pnpm add react-native-draggable-flatlist
```

---

## Step 5 — Build Edit Workout Screen

Same as Create Workout but pre-populated. Also includes a "Manage Exercises" button to navigate to the exercises screen.

---

## Step 6 — Build Program Library Screen

Browse partner-designed programs available to clone.

```tsx
// Data: useLibraryPrograms()
// Grid or list of program cards showing:
// - Program name
// - Duration (weeks)
// - Workouts per week
// - Description
// - "Clone" button → useCloneProgram mutation → navigate to ProgramDetail

import { useLibraryPrograms, useCloneProgram } from '@fit-nation/shared'

// Program card with Clone button
// On clone success → navigate to ProgramDetail with new programId
```

---

## Step 7 — Build Program Detail Screen

Shows a user's cloned program with all its workouts and progress tracking.

```tsx
// Data: useProgram(programId)
// Shows:
// - Program name and description
// - Progress indicator (workouts completed / total)
// - List of workouts in the program
// - Each workout: name, exercise count, last completed date
// - Tap workout → start session or view detail
// - Toggle active/inactive button
```

---

## Step 8 — Build Routine Detail Screen

Partner-provided browsable routines. Similar to program detail but:
- Not cloned — browsed directly
- Can start any workout as a session without committing to the program

---

## Step 9 — Build Routine Workout Detail Screen

Shows a single workout within a routine with its exercises. Has a "Start Workout" button to begin a session.

---

## Step 10 — Connect Plans Screen (from Stage 5)

Now that all plan/workout screens exist, wire up the Plans tab screen:

```tsx
// PlansScreen additions:
// - FAB (+) button → navigation.navigate('CreatePlan')
// - Long press on plan → ActionSheet with: Edit, Delete, Set Active, Deactivate
// - "Browse Programs" section → navigation.navigate('ProgramLibrary')
// - Swipe to delete (custom plans only)
// - Plan rows show workout count

// Tab between "My Plans" and "Programs"
```

---

## Step 11 — Install Additional Dependencies

```bash
cd apps/mobile
pnpm add react-native-draggable-flatlist
```

---

## Step 12 — Verify All Screens

```bash
pnpm dev:mobile
```

- [ ] Create Plan → form saves → navigates forward
- [ ] Edit Plan → pre-populated, saves changes
- [ ] Create Workout → form saves → goes to ManageExercises
- [ ] ManageExercises → exercises listed, drag reorder works, add/remove works
- [ ] Program Library → programs listed, clone works
- [ ] Program Detail → workouts listed with progress
- [ ] Plans screen → FAB, action sheets, all navigation working
- [ ] No TypeScript errors

---

## Step 13 — Commit

```bash
git add -A
git commit -m "feat(mobile): plan and workout management — create/edit plans, workouts, exercises, program library"
```

---

## Verification Checklist
- [ ] Full CRUD flow for custom plans works
- [ ] Full CRUD flow for workout templates works
- [ ] Exercise reordering saves correctly
- [ ] ExercisePicker integrates with ManageExercises
- [ ] Program cloning works end to end
- [ ] ActionSheet shows correct options per plan type (custom vs program)
- [ ] Delete confirmation alerts shown before destructive actions
- [ ] All mutations invalidate relevant query cache
- [ ] No TypeScript errors
