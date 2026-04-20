# Stage 8 — Workout Session

## Overview
Build the workout session flow — the most complex and most important part of the app. This includes AI workout generation, the preview screen, the live session tracking screen, exercise detail during a session, and the session history view. The live session screen requires gesture handling, real-time set logging, and the double progression algorithm.

## Prerequisites
- Stages 0–7 complete
- Exercise picker working (Stage 6)
- Plans and workouts manageable (Stage 7)

## Reference Files
- `apps/web/src/components/GenerateWorkoutPage.tsx`
- `apps/web/src/components/WorkoutPreviewPage.tsx`
- `apps/web/src/components/workout-session/` (entire folder)
- `apps/web/src/components/SessionDetailPage.tsx`

## Screens Built This Stage
1. `GenerateWorkoutScreen` — filter options to generate an AI workout
2. `WorkoutPreviewScreen` — review generated workout, swap exercises, confirm
3. `WorkoutSessionScreen` — live session: swipe between exercises, log sets
4. `WorkoutSessionExerciseDetailScreen` — exercise detail modal during session
5. `SessionDetailScreen` — completed session history view

---

## Step 1 — Build Generate Workout Screen

The entry point to starting a workout. User selects filters then generates a draft session.

```tsx
// apps/mobile/src/screens/GenerateWorkoutScreen.tsx

// Filter state:
// - target_regions: multi-select (upper push, upper pull, lower, arms, core)
// - equipment_types: multi-select (barbell, dumbbell, cable, machine, bodyweight)
// - duration: slider or preset buttons (15 / 30 / 45 / 60 / 90 min)

// On generate: useGenerateWorkout mutation
// → navigates to WorkoutPreview with sessionId

import { useGenerateWorkout } from '@fit-nation/shared'

const generateMutation = useGenerateWorkout({
  onSuccess: (session) => {
    navigation.navigate('WorkoutPreview', { sessionId: session.id.toString() })
  }
})

// UI: 
// 1. Region selector (multi-select pill buttons)
// 2. Equipment selector (multi-select pill buttons)  
// 3. Duration selector (pill buttons: 15/30/45/60/90)
// 4. "Generate Workout" button (shows spinner while generating)
// 5. Close (X) button — goes back
```

---

## Step 2 — Build Workout Preview Screen

Shows the generated draft workout. User can review, swap individual exercises, and confirm.

```tsx
// apps/mobile/src/screens/WorkoutPreviewScreen.tsx

// Data: useWorkoutSession(sessionId)
// Shows list of exercises with:
// - Exercise name, sets × rep range, rest time
// - Swap button → opens ExercisePicker
// - Remove exercise

// Actions:
// - "Regenerate" → useRegenerateWorkout → refreshes same screen
// - "Start Workout" → useConfirmWorkout → navigates to WorkoutSession
// - Swap exercise → ExercisePicker modal → useSwapExercise mutation

import { useWorkoutSession, useConfirmWorkout, useRegenerateWorkout } from '@fit-nation/shared'

// Confirm button:
const confirmMutation = useConfirmWorkout({
  onSuccess: () => {
    navigation.replace('WorkoutSession', { sessionId })
  }
})
```

---

## Step 3 — Build Live Workout Session Screen

**This is the most complex screen in the entire app.** Build it carefully.

### Session Screen Architecture

The session screen shows one exercise at a time. User swipes horizontally to go between exercises. For each exercise, they log sets (weight + reps).

```
┌─────────────────────────────────┐
│  Exercise 2 of 5    [Timer]     │
├─────────────────────────────────┤
│                                 │
│         Bench Press             │
│      (swipe for next)           │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Previous: 80kg × 8 reps │    │
│  └─────────────────────────┘    │
│                                 │
│  Set 1: [80 kg] × [8 reps] ✓   │
│  Set 2: [80 kg] × [8 reps] ✓   │
│  Set 3: [  ?  ] × [  ?  ]      │
│                                 │
│       [Log Set]                 │
│                                 │
└─────────────────────────────────┘
```

### Data Flow

```tsx
// Data: useWorkoutSession(sessionId) — full session with all exercises and set logs
// Mutations:
// - useLogSet — log a completed set
// - useCompleteSession — finish the workout
// - useUpdateSetLog — edit a logged set

import {
  useWorkoutSession,
  useLogSet,
  useCompleteSession,
} from '@fit-nation/shared'
```

### Horizontal Swipe Between Exercises

Use a `FlatList` with horizontal pagination or `react-native-pager-view`:

```bash
cd apps/mobile && pnpm add react-native-pager-view
```

```tsx
import PagerView from 'react-native-pager-view'

// Each page = one exercise
<PagerView
  style={{ flex: 1 }}
  initialPage={currentExerciseIndex}
  onPageSelected={(e) => setCurrentExerciseIndex(e.nativeEvent.position)}
>
  {exercises.map((exercise, index) => (
    <ExercisePage key={exercise.id} exercise={exercise} sessionId={sessionId} />
  ))}
</PagerView>
```

### Exercise Page Component

Create `apps/mobile/src/screens/WorkoutSession/ExercisePage.tsx`:

```tsx
interface ExercisePageProps {
  exercise: WorkoutSessionExerciseResource
  sessionId: string
}

export function ExercisePage({ exercise, sessionId }: ExercisePageProps) {
  const { colors } = useTheme()
  const logSet = useLogSet()

  // Progression status display
  const progressionStatus = exercise.progression_status
  // 'no_history' | 'below_min' | 'working' | 'ready'

  // Current set logs for this exercise
  const setLogs = exercise.set_logs || []
  const completedSets = setLogs.filter(s => s.completed).length
  const targetSets = exercise.pivot.sets

  // Previous session data (for reference)
  const previousSets = exercise.previous_set_logs || []

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgBase }}>
      {/* Exercise Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
          {exercise.name}
        </Text>
        <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          {targetSets} sets · {exercise.pivot.min_target_reps}–{exercise.pivot.max_target_reps} reps
          {exercise.pivot.rest_seconds && ` · ${exercise.pivot.rest_seconds}s rest`}
        </Text>
      </View>

      {/* Progression Cue */}
      <ProgressionCue status={progressionStatus} exercise={exercise} colors={colors} />

      {/* Previous Performance (if available) */}
      {previousSets.length > 0 && (
        <View className="mx-6 mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.bgSurface }}>
          <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
            LAST SESSION
          </Text>
          {previousSets.map((prev, i) => (
            <Text key={i} className="text-sm" style={{ color: colors.textSecondary }}>
              Set {i + 1}: {prev.weight}kg × {prev.reps} reps
            </Text>
          ))}
        </View>
      )}

      {/* Set Logging */}
      <View className="px-6">
        {Array.from({ length: targetSets }).map((_, setIndex) => {
          const existingLog = setLogs[setIndex]
          return (
            <SetRow
              key={setIndex}
              setNumber={setIndex + 1}
              log={existingLog}
              exercise={exercise}
              onLog={(weight, reps) => logSet.mutate({
                sessionId,
                exerciseId: exercise.id,
                setNumber: setIndex + 1,
                weight,
                reps,
              })}
            />
          )
        })}
      </View>

      {/* Rest Timer (shows after logging a set) */}
      {/* RestTimer component — countdown from exercise.pivot.rest_seconds */}
    </ScrollView>
  )
}
```

### Set Row Component

Create `apps/mobile/src/screens/WorkoutSession/SetRow.tsx`:

```tsx
import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import { Check } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface SetRowProps {
  setNumber: number
  log?: SetLogResource
  exercise: WorkoutSessionExerciseResource
  onLog: (weight: number | null, reps: number) => void
}

export function SetRow({ setNumber, log, exercise, onLog }: SetRowProps) {
  const { colors } = useTheme()
  const isBodyweight = exercise.equipment_type?.code === 'BODYWEIGHT'

  // Pre-fill from previous session or current best
  const [weight, setWeight] = useState(
    log?.weight?.toString() || exercise.suggested_weight?.toString() || ''
  )
  const [reps, setReps] = useState(
    log?.reps?.toString() || exercise.pivot.min_target_reps?.toString() || ''
  )

  const isCompleted = !!log?.completed

  return (
    <View
      className="flex-row items-center gap-3 mb-3 p-3 rounded-xl"
      style={{
        backgroundColor: isCompleted ? `${colors.primary}15` : colors.bgSurface,
        borderWidth: 1,
        borderColor: isCompleted ? `${colors.primary}40` : 'transparent',
      }}
    >
      {/* Set number */}
      <Text className="text-sm font-bold w-8" style={{ color: colors.textSecondary }}>
        {setNumber}
      </Text>

      {/* Weight input (hidden for bodyweight) */}
      {!isBodyweight && (
        <View className="flex-1">
          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>kg</Text>
          <TextInput
            className="text-base font-semibold text-center py-2 rounded-lg"
            style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary }}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            editable={!isCompleted}
          />
        </View>
      )}

      {/* Reps input */}
      <View className="flex-1">
        <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>reps</Text>
        <TextInput
          className="text-base font-semibold text-center py-2 rounded-lg"
          style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary }}
          value={reps}
          onChangeText={setReps}
          keyboardType="number-pad"
          editable={!isCompleted}
        />
      </View>

      {/* Log / Done button */}
      <TouchableOpacity
        onPress={() => onLog(
          isBodyweight ? null : parseFloat(weight),
          parseInt(reps)
        )}
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: isCompleted ? colors.primary : colors.bgElevated }}
        disabled={isCompleted}
      >
        <Check size={18} color={isCompleted ? '#fff' : colors.textMuted} />
      </TouchableOpacity>
    </View>
  )
}
```

### Progression Cue Component

Create `apps/mobile/src/screens/WorkoutSession/ProgressionCue.tsx`:

```tsx
// Shows a contextual message based on progression status
// Mirrors the web app's progression cue cards

interface ProgressionCueProps {
  status: 'no_history' | 'below_min' | 'working' | 'ready'
  exercise: WorkoutSessionExerciseResource
  colors: AppColors
}

export function ProgressionCue({ status, exercise, colors }: ProgressionCueProps) {
  const messages = {
    no_history: {
      title: 'First time!',
      body: `Start with a comfortable weight. Aim for ${exercise.pivot.min_target_reps}–${exercise.pivot.max_target_reps} reps.`,
      color: colors.primary,
    },
    below_min: {
      title: 'Keep pushing',
      body: `Focus on hitting ${exercise.pivot.min_target_reps} reps on all sets before increasing weight.`,
      color: colors.warning,
    },
    working: {
      title: 'Good progress',
      body: `Hit ${exercise.pivot.max_target_reps} reps on all sets to unlock a weight increase.`,
      color: colors.primary,
    },
    ready: {
      title: 'Ready to progress! 🎉',
      body: `Increase weight by ${exercise.weight_increment || 2.5}kg today.`,
      color: colors.success,
    },
  }

  const cue = messages[status]
  if (!cue) return null

  return (
    <View className="mx-6 mb-4 p-4 rounded-xl" style={{ backgroundColor: `${cue.color}15` }}>
      <Text className="font-semibold mb-1" style={{ color: cue.color }}>{cue.title}</Text>
      <Text className="text-sm" style={{ color: colors.textSecondary }}>{cue.body}</Text>
    </View>
  )
}
```

### Session Header

```tsx
// Fixed header at top of session screen (outside PagerView)
// Shows:
// - "Exercise X of Y"
// - Elapsed workout timer (stopwatch)
// - Finish button → confirmation → useCompleteSession

// Elapsed timer: use setInterval, store start time in useRef
```

### Finish Session Flow

```tsx
const completeMutation = useCompleteSession({
  onSuccess: (completedSession) => {
    // Show completion screen or navigate to session detail
    navigation.replace('SessionDetail', { sessionId: completedSession.id.toString() })
  }
})

// Confirmation before finishing:
Alert.alert(
  'Finish Workout?',
  'Are you sure you want to end this session?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Finish', onPress: () => completeMutation.mutate({ sessionId }) }
  ]
)
```

---

## Step 4 — Build Workout Session Exercise Detail Screen

Modal screen shown when user taps an exercise name during a session. Shows the same ExerciseDetailPage content (guidance + performance tabs) but in modal context.

```tsx
// Same as ExerciseDetailScreen from Stage 6
// Presented as a modal (presentation: 'modal' in navigator)
// Has a "Done" button to dismiss

export function WorkoutSessionExerciseDetailScreen({ route, navigation }: AppScreenProps<'WorkoutSessionExerciseDetail'>) {
  return (
    <>
      {/* Close button row */}
      <View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text>Done</Text>
        </TouchableOpacity>
      </View>
      {/* Re-use ExerciseDetailScreen content without the back button */}
      <ExerciseDetailContent exerciseName={route.params.exerciseName} />
    </>
  )
}
```

---

## Step 5 — Build Session Detail Screen

Shows a completed workout session's summary.

```tsx
// Data: useSessionDetail(sessionId)
// Shows:
// - Date, duration, total volume
// - List of exercises with all logged sets
// - Personal records achieved in this session
// - "Well done!" completion message
```

---

## Step 6 — Rest Timer Component

After logging a set, show a countdown rest timer.

Create `apps/mobile/src/screens/WorkoutSession/RestTimer.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useTheme } from '../../context/ThemeContext'

interface RestTimerProps {
  seconds: number
  onComplete: () => void
  onSkip: () => void
}

export function RestTimer({ seconds, onComplete, onSkip }: RestTimerProps) {
  const { colors } = useTheme()
  const [remaining, setRemaining] = useState(seconds)
  const progress = useSharedValue(1)

  useEffect(() => {
    progress.value = withTiming(0, { duration: seconds * 1000 })
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(interval)
          onComplete()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }))

  return (
    <View className="mx-6 p-4 rounded-2xl" style={{ backgroundColor: colors.bgSurface }}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
          Rest — {remaining}s
        </Text>
        <TouchableOpacity onPress={onSkip}>
          <Text style={{ color: colors.primary }}>Skip</Text>
        </TouchableOpacity>
      </View>
      <View className="h-1 rounded-full" style={{ backgroundColor: colors.bgElevated }}>
        <Animated.View
          className="h-1 rounded-full"
          style={[{ backgroundColor: colors.primary }, barStyle]}
        />
      </View>
    </View>
  )
}
```

---

## Step 7 — Install Additional Dependencies

```bash
cd apps/mobile
pnpm add react-native-pager-view
```

---

## Step 8 — Verify Session Flow End to End

```bash
pnpm dev:mobile
```

- [ ] GenerateWorkout screen shows filter options
- [ ] Generate button calls API and navigates to preview
- [ ] Preview screen shows all exercises
- [ ] Regenerate replaces exercise list
- [ ] Swap exercise opens picker and updates list
- [ ] Start Workout navigates to session screen
- [ ] Session shows exercise count in header
- [ ] Swipe left/right navigates between exercises
- [ ] Set rows pre-fill with suggested weight/reps
- [ ] Logging a set marks it as complete (visual feedback)
- [ ] Progression cue shows correct message per status
- [ ] Rest timer counts down and auto-dismisses
- [ ] Finish workout shows confirmation dialog
- [ ] Completing session navigates to SessionDetail
- [ ] SessionDetail shows all logged sets and stats
- [ ] Exercise detail modal opens and closes correctly

---

## Step 9 — Commit

```bash
git add -A
git commit -m "feat(mobile): workout session flow — generate, preview, live session, set logging, completion"
```

---

## Verification Checklist
- [ ] Full workout flow: generate → preview → session → complete → detail
- [ ] Double progression algorithm cues display correctly for all 4 states
- [ ] Bodyweight exercises hide weight input
- [ ] Set logging persists on API and updates UI immediately
- [ ] Horizontal pager swipe between exercises works smoothly
- [ ] Session timer counts up correctly
- [ ] Rest timer counts down and dismisses automatically
- [ ] Finish workout requires confirmation
- [ ] Session detail shows accurate stats
- [ ] No TypeScript errors
- [ ] Screen stays awake during session (use expo-keep-awake)
