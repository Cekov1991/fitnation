# Stage 5 — Core Tab Screens

## Overview
Build all five bottom tab screens in web order: Dashboard, Plans, Progress, Catalog, and Profile. Each pulls real data from the shared API hooks. Progress includes the line chart for fitness metrics. The Catalog tab is a lightweight entry point — the full exercise detail screen lives in Stage 6.

## Design Parity
Before building each screen, read the corresponding web component and match the design exactly.

| Mobile Screen | Read This Web File |
|---|---|
| `DashboardScreen` | `apps/web/src/components/DashboardPage.tsx` + `apps/web/src/components/dashboard/` (all files) |
| `PlansScreen` | `apps/web/src/components/PlansPage.tsx` |
| `ProgressScreen` | `apps/web/src/components/ProgressPage.tsx` |
| `ExerciseCatalogScreen` | `apps/web/src/components/ExerciseCatalogPage.tsx` |
| `ProfileScreen` | `apps/web/src/components/ProfilePage.tsx` |

Match exactly: card layouts, gradient text headers, section spacing, stat display format, chart presentation, plan list item design, profile section groupings, empty states, and loading skeleton shapes. Every visual detail in the web version must appear in the mobile version.

---

## Prerequisites
- Stages 0–4 complete
- User can complete onboarding and land on Dashboard

## Screens Built This Stage
- `DashboardScreen` — today's workout, active plans, quick start
- `PlansScreen` — list custom plans and programs, CRUD actions
- `ProgressScreen` — strength score, balance, weekly progress, calendar
- `ExerciseCatalogScreen` (Catalog tab) — searchable exercise list, taps into ExerciseDetail
- `ProfileScreen` — user info, photo, fitness profile, regenerate plan

---

## Shared Components to Create First

### `apps/mobile/src/components/ui/Card.tsx`
```tsx
import { View, type ViewProps } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

export function Card({ children, style, ...props }: ViewProps) {
  const { colors } = useTheme()
  return (
    <View
      className="rounded-2xl p-5 mb-4"
      style={[{ backgroundColor: colors.bgSurface }, style]}
      {...props}
    >
      {children}
    </View>
  )
}
```

### `apps/mobile/src/components/ui/SectionHeader.tsx`
```tsx
import { View, Text, TouchableOpacity } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface SectionHeaderProps {
  title: string
  action?: { label: string; onPress: () => void }
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const { colors } = useTheme()
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text className="text-sm font-medium" style={{ color: colors.primary }}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
```

### `apps/mobile/src/components/ui/SkeletonBox.tsx`
```tsx
import { View, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated'
import { useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface SkeletonBoxProps {
  width?: number | string
  height?: number
  style?: ViewStyle
  className?: string
}

export function SkeletonBox({ width = '100%', height = 20, style, className }: SkeletonBoxProps) {
  const { colors } = useTheme()
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      className={`rounded-xl ${className || ''}`}
      style={[{ width, height, backgroundColor: colors.bgElevated }, animatedStyle, style]}
    />
  )
}
```

---

## Step 1 — Build Dashboard Screen

Replace `apps/mobile/src/screens/placeholders/DashboardScreen.tsx`:

Key data fetched:
- `usePlans()` — active plans
- `useWeeklyProgress()` — weekly stats
- Current user from `useAuth()`

```tsx
import { ScrollView, View, Text, TouchableOpacity, SafeAreaView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { usePlans } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation/types'

type Nav = NativeStackNavigationProp<AppStackParamList>

export function DashboardScreen() {
  const { colors } = useTheme()
  const { user } = useAuth()
  const navigation = useNavigation<Nav>()
  const { data: plans, isLoading } = usePlans()

  const activePlan = plans?.find(p => p.is_active)

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Greeting */}
        <View className="pt-6 pb-4">
          <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            Hey, {user?.name?.split(' ')[0]} 👋
          </Text>
          <Text className="text-base mt-1" style={{ color: colors.textSecondary }}>
            Ready to train?
          </Text>
        </View>

        {/* Active Plan Card */}
        <SectionHeader title="Active Plan" />
        {isLoading ? (
          <SkeletonBox height={100} className="mb-4" />
        ) : activePlan ? (
          <Card>
            <Text className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
              {activePlan.name}
            </Text>
            <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {activePlan.workouts_count} workouts
            </Text>
            <TouchableOpacity
              className="py-3 rounded-xl items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => navigation.navigate('GenerateWorkout')}
            >
              <Text className="text-white font-semibold">Start Workout</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <Card>
            <Text style={{ color: colors.textSecondary }}>No active plan yet.</Text>
            <TouchableOpacity
              className="mt-3 py-3 rounded-xl items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => navigation.navigate('CreatePlan')}
            >
              <Text className="text-white font-semibold">Create a Plan</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* All Plans */}
        <SectionHeader
          title="My Plans"
          action={{ label: 'See All', onPress: () => {} }}
        />
        {isLoading ? (
          <>
            <SkeletonBox height={72} className="mb-3" />
            <SkeletonBox height={72} className="mb-3" />
          </>
        ) : (
          plans?.slice(0, 3).map(plan => (
            <Card key={plan.id}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-semibold" style={{ color: colors.textPrimary }}>
                    {plan.name}
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                    {plan.type === 'program' ? 'Program' : 'Custom Routine'}
                  </Text>
                </View>
                {plan.is_active && (
                  <View className="px-2 py-1 rounded-full" style={{ backgroundColor: `${colors.primary}20` }}>
                    <Text className="text-xs font-medium" style={{ color: colors.primary }}>Active</Text>
                  </View>
                )}
              </View>
            </Card>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  )
}
```

---

## Step 2 — Build Progress Screen

Key data:
- `useFitnessMetrics()` — strength score, balance, weekly progress
- `useWorkoutCalendar(week)` — calendar data

```tsx
import { ScrollView, View, Text, SafeAreaView, TouchableOpacity } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { useFitnessMetrics } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../../components/ui/Card'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { SkeletonBox } from '../../components/ui/SkeletonBox'

export function ProgressScreen() {
  const { colors } = useTheme()
  const { data: metrics, isLoading } = useFitnessMetrics()

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="pt-6 pb-4">
          <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Progress</Text>
        </View>

        {/* Strength Score */}
        <SectionHeader title="Strength Score" />
        {isLoading ? <SkeletonBox height={100} className="mb-4" /> : (
          <Card>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-4xl font-bold" style={{ color: colors.primary }}>
                  {metrics?.strength_score?.score ?? '—'}
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Current strength score
                </Text>
              </View>
              {metrics?.strength_score?.recent_gain !== undefined && (
                <View className="items-end">
                  <Text className="text-lg font-bold" style={{ color: colors.success }}>
                    +{metrics.strength_score.recent_gain}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>last 30 days</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Weekly Progress */}
        <SectionHeader title="This Week" />
        {isLoading ? <SkeletonBox height={120} className="mb-4" /> : (
          <Card>
            <View className="flex-row justify-around">
              {[
                { label: 'Workouts', value: metrics?.weekly_progress?.workout_count ?? 0 },
                { label: 'Volume', value: `${metrics?.weekly_progress?.total_volume ?? 0}kg` },
                { label: 'Time', value: `${metrics?.weekly_progress?.total_time ?? 0}m` },
              ].map(stat => (
                <View key={stat.label} className="items-center">
                  <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    {stat.value}
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Strength Balance */}
        <SectionHeader title="Muscle Balance" />
        {isLoading ? <SkeletonBox height={150} className="mb-4" /> : (
          <Card>
            {metrics?.strength_balance?.map(group => (
              <View key={group.name} className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>{group.name}</Text>
                  <Text className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {group.percentage}%
                  </Text>
                </View>
                <View className="h-2 rounded-full" style={{ backgroundColor: colors.bgElevated }}>
                  <View
                    className="h-2 rounded-full"
                    style={{ width: `${group.percentage}%`, backgroundColor: colors.primary }}
                  />
                </View>
              </View>
            ))}
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}
```

---

## Step 3 — Build Plans Screen

Key data:
- `usePlans()` — custom plans and programs

```tsx
// Key structure — build full screen
// List of plans with:
// - Plan name, type badge (Routine / Program)
// - Active indicator
// - Swipe to delete (custom plans only) or long press menu
// - FAB button to create new plan
// - Navigate to ProgramLibrary for browsing programs
```

Key interactions:
- Tap plan → navigate to detail (or expand inline)
- Long press → action sheet (Edit, Delete, Set Active, Deactivate)
- FAB → `navigation.navigate('CreatePlan')`
- "Browse Programs" button → `navigation.navigate('ProgramLibrary')`

Use `useDeletePlan`, `useToggleProgramActive` from shared hooks.

---

## Step 4 — Build Catalog Tab Screen

This is a lightweight version of the exercise catalog — searchable list, filter by muscle group, taps navigate to `ExerciseDetail` (built fully in Stage 6). The full filter chips and performance chart are Stage 6's job.

```tsx
import { useState, useMemo } from 'react'
import { View, TextInput, FlatList, SafeAreaView, Text } from 'react-native'
import { Search } from 'lucide-react-native'
import { useExercises } from '@fit-nation/shared'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../context/ThemeContext'
import { ExerciseCard } from '../../components/exercises/ExerciseCard'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation/types'

type Nav = NativeStackNavigationProp<AppStackParamList>

export function ExerciseCatalogScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<Nav>()
  const [search, setSearch] = useState('')
  const { data: exercises = [], isLoading } = useExercises()

  const filtered = useMemo(() =>
    exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase())),
    [exercises, search]
  )

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <View className="px-6 pt-6 pb-3">
        <Text className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
          Exercises
        </Text>
        <View className="flex-row items-center px-4 py-3 rounded-xl gap-3"
          style={{ backgroundColor: colors.bgSurface }}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            className="flex-1 text-base"
            style={{ color: colors.textPrimary }}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="px-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonBox key={i} height={72} className="mb-3" />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <ExerciseCard
              exercise={item}
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseName: item.name })}
            />
          )}
          ListEmptyComponent={
            <Text className="text-center mt-8" style={{ color: colors.textSecondary }}>
              No exercises found
            </Text>
          }
        />
      )}
    </SafeAreaView>
  )
}
```

Note: `ExerciseCard` component is created in Stage 6. For this stage, use a simple `TouchableOpacity` row as a placeholder — Stage 6 will replace it with the proper card.

---

## Step 5 — Build Profile Screen

Key data:
- `useCurrentUser()` or `useAuth()` user state
- `useUserProfile()` — fitness profile details

```tsx
// Key structure — build full screen
// Sections:
// 1. User avatar + name + email (with edit photo button)
// 2. Fitness Profile card (goal, experience, training days, duration)
// 3. Edit Profile button → form sheet
// 4. Regenerate Plan button → confirm dialog → api.generatePlan()
// 5. Logout button
```

Key interactions:
- "Edit Profile" → bottom sheet or navigate to edit form
- "Regenerate Plan" → confirmation alert → `api.regeneratePlan()` → show loading
- "Logout" → confirmation alert → `auth.logout()`

---

## Step 6 — Verify All Tab Screens

```bash
pnpm dev:mobile
```

- [ ] Tab bar shows 5 tabs in order: Dashboard → Plans → Progress → Exercises → Profile
- [ ] Dashboard shows active plan (or empty state)
- [ ] Dashboard "Start Workout" navigates to GenerateWorkout placeholder
- [ ] Plans lists all user plans
- [ ] Progress shows strength score and weekly stats
- [ ] Catalog tab shows searchable exercise list
- [ ] Tapping exercise in Catalog navigates to ExerciseDetail placeholder
- [ ] Profile shows user name, email, fitness profile
- [ ] Logout works and returns to Login screen
- [ ] Skeleton loaders show while data fetches
- [ ] All screens scroll without content being cut off by tab bar

---

## Step 6 — Commit

```bash
git add -A
git commit -m "feat(mobile): core tab screens — dashboard, plans, progress, catalog, profile"
```

---

## Verification Checklist
- [ ] All 5 tab screens load real data
- [ ] Loading skeletons display while fetching
- [ ] Empty states handled (no active plan, no plans, etc.)
- [ ] Navigation from tab screens to detail screens works (even if detail is placeholder)
- [ ] Logout clears state and returns to auth flow
- [ ] Charts render on Progress screen
- [ ] No TypeScript errors
- [ ] Safe area respected on all screens (no content behind notch/home bar)
