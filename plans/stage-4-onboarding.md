# Stage 4 — Onboarding

## Overview
Build the multi-step onboarding flow that new users go through after registering. Collects: fitness goal, age, gender, height, weight, experience level, training days per week, and workout duration. On completion, triggers AI plan generation and navigates to the Dashboard.

## Design Parity
Before building, read the web onboarding components and match the design exactly.

| Mobile Screen | Read These Web Files |
|---|---|
| `OnboardingScreen` | `apps/web/src/components/onboarding/` (entire folder) |

Match exactly: step layout, progress bar style, option card design (border, selected state highlight, icon placement), number/day selector, typography, button placement, transition animations between steps, and the generating/loading screen treatment.

---

## Prerequisites
- Stage 0–3 complete
- User can log in and land on placeholder Dashboard

## Reference
Web implementation: `apps/web/src/components/onboarding/`

## Steps in the Flow
1. **Welcome** — Intro screen, "Let's personalise your plan"
2. **Goal** — Select fitness goal (lose weight / build muscle / improve fitness / etc.)
3. **Experience** — Select experience level (beginner / intermediate / advanced)
4. **Gender** — Select gender
5. **Age** — Number input
6. **Body** — Height + weight inputs
7. **Schedule** — Training days per week (1–7 selector)
8. **Duration** — Workout duration preference (15 / 30 / 45 / 60 / 90 min)
9. **Generating** — Loading screen while plan generates
10. **Done** — Navigate to Dashboard

---

## Step 1 — Create Onboarding State

The onboarding collects data across multiple steps. Use a local reducer to hold state.

Create `apps/mobile/src/screens/Onboarding/onboardingReducer.ts`:
```ts
import type { UserProfileInput } from '@fit-nation/shared'

export type OnboardingState = Partial<UserProfileInput> & {
  currentStep: number
}

type OnboardingAction =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET'; payload: Partial<UserProfileInput> }

export const TOTAL_STEPS = 8

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'NEXT':
      return { ...state, currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS) }
    case 'BACK':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) }
    case 'SET':
      return { ...state, ...action.payload }
    default:
      return state
  }
}
```

---

## Step 2 — Create Progress Bar Component

Create `apps/mobile/src/components/onboarding/ProgressBar.tsx`:
```tsx
import { View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const { colors } = useTheme()
  const progress = current / total

  return (
    <View className="h-1 w-full rounded-full" style={{ backgroundColor: colors.bgElevated }}>
      <View
        className="h-1 rounded-full"
        style={{
          width: `${progress * 100}%`,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  )
}
```

---

## Step 3 — Create Option Selector Component

Used for goal, experience, gender selection.

Create `apps/mobile/src/components/onboarding/OptionCard.tsx`:
```tsx
import { TouchableOpacity, Text, View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface OptionCardProps {
  label: string
  description?: string
  selected: boolean
  onPress: () => void
  icon?: React.ReactNode
}

export function OptionCard({ label, description, selected, onPress, icon }: OptionCardProps) {
  const { colors } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-full p-4 rounded-2xl mb-3 flex-row items-center gap-4"
      style={{
        backgroundColor: selected ? `${colors.primary}20` : colors.bgSurface,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : 'transparent',
      }}
    >
      {icon && <View>{icon}</View>}
      <View className="flex-1">
        <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
          {label}
        </Text>
        {description && (
          <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
            {description}
          </Text>
        )}
      </View>
      {selected && (
        <View
          className="w-5 h-5 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white text-xs font-bold">✓</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
```

---

## Step 4 — Create Day Selector Component

Used for training days per week.

Create `apps/mobile/src/components/onboarding/DaySelector.tsx`:
```tsx
import { View, TouchableOpacity, Text } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface DaySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function DaySelector({ value, onChange, min = 1, max = 7 }: DaySelectorProps) {
  const { colors } = useTheme()
  const days = Array.from({ length: max - min + 1 }, (_, i) => i + min)

  return (
    <View className="flex-row gap-2 justify-center flex-wrap">
      {days.map(day => (
        <TouchableOpacity
          key={day}
          onPress={() => onChange(day)}
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{
            backgroundColor: value === day ? colors.primary : colors.bgSurface,
          }}
        >
          <Text
            className="text-base font-bold"
            style={{ color: value === day ? '#fff' : colors.textSecondary }}
          >
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
```

---

## Step 5 — Build the Onboarding Screen

Replace `apps/mobile/src/screens/placeholders/OnboardingScreen.tsx`:

```tsx
import { useReducer, useState } from 'react'
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native'
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated'
import { useMutation } from '@tanstack/react-query'
import { api } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { ProgressBar } from '../../components/onboarding/ProgressBar'
import { OptionCard } from '../../components/onboarding/OptionCard'
import { DaySelector } from '../../components/onboarding/DaySelector'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { onboardingReducer, TOTAL_STEPS } from './onboardingReducer'
import type { AppScreenProps } from '../../navigation/types'

const FITNESS_GOALS = [
  { value: 'lose_weight', label: 'Lose Weight', description: 'Burn fat and get lean' },
  { value: 'build_muscle', label: 'Build Muscle', description: 'Gain size and strength' },
  { value: 'improve_fitness', label: 'Improve Fitness', description: 'Boost endurance and health' },
  { value: 'maintain', label: 'Maintain', description: 'Keep current fitness level' },
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Less than 1 year of training' },
  { value: 'intermediate', label: 'Intermediate', description: '1–3 years of training' },
  { value: 'advanced', label: 'Advanced', description: '3+ years of training' },
]

const DURATIONS = [15, 30, 45, 60, 90]

export function OnboardingScreen({ navigation }: AppScreenProps<'Onboarding'>) {
  const { colors } = useTheme()
  const [state, dispatch] = useReducer(onboardingReducer, { currentStep: 0 })
  const [isGenerating, setIsGenerating] = useState(false)

  const submitMutation = useMutation({
    mutationFn: async () => {
      await api.updateProfile(state)
      setIsGenerating(true)
      await api.generatePlan()
    },
    onSuccess: () => {
      navigation.replace('Tabs')
    },
  })

  function next() { dispatch({ type: 'NEXT' }) }
  function back() { dispatch({ type: 'BACK' }) }
  function set(payload: any) { dispatch({ type: 'SET', payload }) }

  if (isGenerating) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
        <Text className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
          Building your plan...
        </Text>
        <Text style={{ color: colors.textSecondary }}>This takes a few seconds</Text>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-4">
        {state.currentStep > 0 && (
          <TouchableOpacity onPress={back}>
            <Text style={{ color: colors.textSecondary }}>← Back</Text>
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <ProgressBar current={state.currentStep + 1} total={TOTAL_STEPS} />
        </View>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} key={state.currentStep}>

          {/* Step 0 — Goal */}
          {state.currentStep === 0 && (
            <View className="mt-8">
              <Text className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                What's your goal?
              </Text>
              <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
                We'll personalise your plan around this
              </Text>
              {FITNESS_GOALS.map(goal => (
                <OptionCard
                  key={goal.value}
                  label={goal.label}
                  description={goal.description}
                  selected={state.fitness_goal === goal.value}
                  onPress={() => { set({ fitness_goal: goal.value }); next() }}
                />
              ))}
            </View>
          )}

          {/* Step 1 — Experience */}
          {state.currentStep === 1 && (
            <View className="mt-8">
              <Text className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Your experience level?
              </Text>
              <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
                We'll set the right difficulty
              </Text>
              {EXPERIENCE_LEVELS.map(level => (
                <OptionCard
                  key={level.value}
                  label={level.label}
                  description={level.description}
                  selected={state.experience_level === level.value}
                  onPress={() => { set({ experience_level: level.value }); next() }}
                />
              ))}
            </View>
          )}

          {/* Step 2 — Gender */}
          {state.currentStep === 2 && (
            <View className="mt-8">
              <Text className="text-3xl font-bold mb-8" style={{ color: colors.textPrimary }}>
                How do you identify?
              </Text>
              {['male', 'female', 'other'].map(g => (
                <OptionCard
                  key={g}
                  label={g.charAt(0).toUpperCase() + g.slice(1)}
                  selected={state.gender === g}
                  onPress={() => { set({ gender: g }); next() }}
                />
              ))}
            </View>
          )}

          {/* Step 3 — Age */}
          {state.currentStep === 3 && (
            <View className="mt-8">
              <Text className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                How old are you?
              </Text>
              <Input
                label="Age"
                keyboardType="numeric"
                value={state.age?.toString() || ''}
                onChangeText={v => set({ age: parseInt(v) || undefined })}
                placeholder="e.g. 28"
                className="mt-4"
              />
              <Button label="Continue" onPress={next} disabled={!state.age} className="mt-4" />
            </View>
          )}

          {/* Step 4 — Body */}
          {state.currentStep === 4 && (
            <View className="mt-8">
              <Text className="text-3xl font-bold mb-8" style={{ color: colors.textPrimary }}>
                Your body stats
              </Text>
              <Input
                label="Height (cm)"
                keyboardType="numeric"
                value={state.height?.toString() || ''}
                onChangeText={v => set({ height: parseInt(v) || undefined })}
                placeholder="e.g. 178"
              />
              <Input
                label="Weight (kg)"
                keyboardType="numeric"
                value={state.weight?.toString() || ''}
                onChangeText={v => set({ weight: parseInt(v) || undefined })}
                placeholder="e.g. 75"
              />
              <Button label="Continue" onPress={next} disabled={!state.height || !state.weight} />
            </View>
          )}

          {/* Step 5 — Training Days */}
          {state.currentStep === 5 && (
            <View className="mt-8">
              <Text className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Days per week?
              </Text>
              <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
                How many days can you train?
              </Text>
              <DaySelector
                value={state.training_days_per_week || 3}
                onChange={v => set({ training_days_per_week: v })}
              />
              <Button label="Continue" onPress={next} className="mt-8"
                disabled={!state.training_days_per_week} />
            </View>
          )}

          {/* Step 6 — Duration */}
          {state.currentStep === 6 && (
            <View className="mt-8">
              <Text className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Workout duration?
              </Text>
              <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
                How long per session?
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {DURATIONS.map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => set({ workout_duration: d })}
                    className="px-6 py-4 rounded-2xl"
                    style={{
                      backgroundColor: state.workout_duration === d ? colors.primary : colors.bgSurface,
                    }}
                  >
                    <Text
                      className="text-base font-semibold"
                      style={{ color: state.workout_duration === d ? '#fff' : colors.textSecondary }}
                    >
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Button
                label="Build My Plan"
                onPress={() => submitMutation.mutate()}
                loading={submitMutation.isPending}
                className="mt-8"
                disabled={!state.workout_duration}
              />
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
```

---

## Step 6 — Hook Onboarding into Navigation

In `RootNavigator.tsx`, after user logs in for the first time (no profile yet), navigate to Onboarding:

```tsx
// In AppNavigator or RootNavigator, check if user needs onboarding
const { user } = useAuth()
const needsOnboarding = user && !user.profile?.fitness_goal

// Set initialRouteName based on this
```

---

## Step 7 — Verify

```bash
pnpm dev:mobile
```

- [ ] Register → lands on Onboarding step 0
- [ ] Each step advances correctly
- [ ] Back navigation works between steps
- [ ] Progress bar fills as you advance
- [ ] Generating screen shows while API call runs
- [ ] Completes and lands on Dashboard placeholder

---

## Step 8 — Commit

```bash
git add -A
git commit -m "feat(mobile): onboarding flow — multi-step profile collection with plan generation"
```

---

## Verification Checklist
- [ ] All 7 data steps render correctly
- [ ] Animations between steps work (FadeInRight/FadeOutLeft)
- [ ] Progress bar reflects current step
- [ ] Back button skips back to previous step
- [ ] `api.updateProfile()` called with correct payload
- [ ] `api.generatePlan()` called after profile save
- [ ] Loading/generating screen shown during API calls
- [ ] Navigates to Dashboard on completion
- [ ] No TypeScript errors
