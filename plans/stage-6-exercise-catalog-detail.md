# Stage 6 — Exercise Catalog & Detail

## Overview
Build the exercise browsing experience: a searchable, filterable catalog of all exercises, a detailed exercise screen with video playback and performance history chart, and the exercise picker modal used when adding exercises to workouts.

## Prerequisites
- Stages 0–5 complete

## Reference
- `apps/web/src/components/ExerciseCatalogPage.tsx`
- `apps/web/src/components/ExerciseDetailPage.tsx`
- `apps/web/src/components/ExerciseImage.tsx`

## Screens Built This Stage
- `ExerciseCatalogScreen` — searchable list with muscle group + equipment filters
- `ExerciseDetailScreen` — video, muscle groups, instructions, performance chart
- `ExercisePickerScreen` — modal version of catalog for selecting exercises

---

## Step 1 — Create Exercise Card Component

Create `apps/mobile/src/components/exercises/ExerciseCard.tsx`:
```tsx
import { TouchableOpacity, View, Text } from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '../../context/ThemeContext'
import type { ExerciseResource } from '@fit-nation/shared'

interface ExerciseCardProps {
  exercise: ExerciseResource
  onPress: () => void
  rightAction?: React.ReactNode
}

export function ExerciseCard({ exercise, onPress, rightAction }: ExerciseCardProps) {
  const { colors } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center p-4 rounded-2xl mb-3"
      style={{ backgroundColor: colors.bgSurface }}
    >
      {/* Thumbnail */}
      <Image
        source={{ uri: exercise.image }}
        style={{ width: 56, height: 56, borderRadius: 12 }}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      />

      {/* Info */}
      <View className="flex-1 ml-3">
        <Text className="font-semibold text-base" style={{ color: colors.textPrimary }}>
          {exercise.name}
        </Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
          {exercise.equipment_type?.name} · {exercise.muscle_groups?.find(m => m.is_primary)?.name}
        </Text>
      </View>

      {rightAction}
    </TouchableOpacity>
  )
}
```

---

## Step 2 — Create Filter Chips Component

Create `apps/mobile/src/components/exercises/FilterChips.tsx`:
```tsx
import { ScrollView, TouchableOpacity, Text } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface FilterChipsProps {
  options: { value: string; label: string }[]
  selected: string | null
  onSelect: (value: string | null) => void
}

export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  const { colors } = useTheme()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
      className="mb-4"
    >
      {/* "All" chip */}
      <TouchableOpacity
        onPress={() => onSelect(null)}
        className="px-4 py-2 rounded-full"
        style={{ backgroundColor: !selected ? colors.primary : colors.bgSurface }}
      >
        <Text
          className="text-sm font-medium"
          style={{ color: !selected ? '#fff' : colors.textSecondary }}
        >
          All
        </Text>
      </TouchableOpacity>

      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onSelect(selected === opt.value ? null : opt.value)}
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: selected === opt.value ? colors.primary : colors.bgSurface }}
        >
          <Text
            className="text-sm font-medium"
            style={{ color: selected === opt.value ? '#fff' : colors.textSecondary }}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}
```

---

## Step 3 — Build Exercise Catalog Screen

Replace `apps/mobile/src/screens/placeholders/ExerciseCatalogScreen.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { View, TextInput, FlatList, SafeAreaView, Text } from 'react-native'
import { Search } from 'lucide-react-native'
import { useExercises, useMuscleGroups, useEquipmentTypes } from '@fit-nation/shared'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../context/ThemeContext'
import { ExerciseCard } from '../../components/exercises/ExerciseCard'
import { FilterChips } from '../../components/exercises/FilterChips'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation/types'

type Nav = NativeStackNavigationProp<AppStackParamList>

export function ExerciseCatalogScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<Nav>()
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)

  const { data: exercises = [], isLoading } = useExercises()
  const { data: muscleGroups = [] } = useMuscleGroups()
  const { data: equipmentTypes = [] } = useEquipmentTypes()

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
      const matchesMuscle = !selectedMuscle ||
        ex.muscle_groups?.some(m => m.code === selectedMuscle)
      const matchesEquipment = !selectedEquipment ||
        ex.equipment_type?.code === selectedEquipment
      return matchesSearch && matchesMuscle && matchesEquipment
    })
  }, [exercises, search, selectedMuscle, selectedEquipment])

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View className="px-6 pt-4 pb-3">
        <Text className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
          Exercises
        </Text>

        {/* Search bar */}
        <View
          className="flex-row items-center px-4 py-3 rounded-xl gap-3"
          style={{ backgroundColor: colors.bgSurface }}
        >
          <Search size={18} color={colors.textMuted} />
          <TextInput
            className="flex-1 text-base"
            style={{ color: colors.textPrimary }}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Muscle Group Filters */}
      <FilterChips
        options={muscleGroups.map(m => ({ value: m.code, label: m.name }))}
        selected={selectedMuscle}
        onSelect={setSelectedMuscle}
      />

      {/* Equipment Filters */}
      <FilterChips
        options={equipmentTypes.map(e => ({ value: e.code, label: e.name }))}
        selected={selectedEquipment}
        onSelect={setSelectedEquipment}
      />

      {/* Exercise List */}
      {isLoading ? (
        <View className="px-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBox key={i} height={72} className="mb-3" />
          ))}
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

---

## Step 4 — Build Exercise Detail Screen

This is the most complex screen in this stage. Mirrors `ExerciseDetailPage.tsx` closely.

Replace `apps/mobile/src/screens/placeholders/ExerciseDetailScreen.tsx`:

```tsx
import { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, Dimensions
} from 'react-native'
import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import { LineChart } from 'react-native-gifted-charts'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react-native'
import { useExercises, useExerciseHistory } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../../components/ui/Card'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { AppScreenProps } from '../../navigation/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export function ExerciseDetailScreen({ route, navigation }: AppScreenProps<'ExerciseDetail'>) {
  const { exerciseName } = route.params
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState<'guidance' | 'performance'>('guidance')

  const { data: exercises = [] } = useExercises()
  const exercise = useMemo(
    () => exercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase()),
    [exercises, exerciseName]
  )

  const allowWeightLogging = exercise?.equipment_type?.code !== 'BODYWEIGHT'

  const { data: historyData, isLoading: isLoadingHistory } = useExerciseHistory(
    exercise?.id || 0,
    undefined,
    { enabled: activeTab === 'performance' && !!exercise?.id }
  )

  // Video player
  const player = useVideoPlayer(exercise?.video || null, p => {
    if (exercise?.video) {
      p.loop = true
      p.muted = true
      p.play()
    }
  })

  const primaryMuscles = useMemo(
    () => exercise?.muscle_groups?.filter(m => m.is_primary).map(m => m.name) ?? [],
    [exercise]
  )

  const secondaryMuscles = useMemo(
    () => exercise?.muscle_groups?.filter(m => !m.is_primary).map(m => m.name) ?? [],
    [exercise]
  )

  const chartData = useMemo(() => {
    if (!historyData?.performance_data) return []
    return historyData.performance_data.map(point => ({
      value: allowWeightLogging ? point.volume : point.best_set_reps,
      label: point.date.slice(5), // MM-DD
    }))
  }, [historyData, allowWeightLogging])

  const progressPercentage = useMemo(() => {
    if (!historyData?.performance_data?.length) return 0
    const data = historyData.performance_data
    const first = allowWeightLogging ? data[0].volume : data[0].best_set_reps
    const last = allowWeightLogging
      ? data[data.length - 1].volume
      : data[data.length - 1].best_set_reps
    if (first === 0) return 0
    return ((last - first) / first) * 100
  }, [historyData, allowWeightLogging])

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View className="flex-row items-center gap-4 px-6 py-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.bgSurface }}
          >
            <ArrowLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text
            className="flex-1 text-xl font-bold"
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
          >
            {exercise?.name || exerciseName}
          </Text>
        </View>

        {/* Video / Image */}
        <View style={{ width: SCREEN_WIDTH, aspectRatio: 16 / 9, backgroundColor: colors.bgElevated }}>
          {exercise?.video ? (
            <VideoView
              player={player}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              nativeControls={false}
            />
          ) : exercise?.image ? (
            <Image
              source={{ uri: exercise.image }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text style={{ color: colors.textMuted }}>No media available</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View className="px-6 mt-4 mb-4">
          <View className="flex-row p-1 rounded-full" style={{ backgroundColor: colors.bgSurface }}>
            {(['guidance', 'performance'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="flex-1 py-3 rounded-full items-center"
                style={{ backgroundColor: activeTab === tab ? colors.bgElevated : 'transparent' }}
              >
                <Text
                  className="text-sm font-medium capitalize"
                  style={{ color: activeTab === tab ? colors.textPrimary : colors.textSecondary }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Guidance Tab */}
        {activeTab === 'guidance' && (
          <View className="px-6">
            {/* Muscles */}
            <Card>
              <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
                Muscles Worked
              </Text>
              <View className="mb-3">
                <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                  PRIMARY
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {primaryMuscles.map(m => (
                    <View key={m} className="px-3 py-1.5 rounded-full border"
                      style={{ borderColor: colors.primary }}>
                      <Text className="text-xs font-semibold uppercase" style={{ color: colors.textPrimary }}>
                        {m}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              {secondaryMuscles.length > 0 && (
                <View>
                  <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                    SECONDARY
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {secondaryMuscles.map(m => (
                      <View key={m} className="px-3 py-1.5 rounded-full border"
                        style={{ borderColor: colors.bgElevated }}>
                        <Text className="text-xs font-semibold uppercase" style={{ color: colors.textSecondary }}>
                          {m}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {exercise?.muscle_group_image && (
                <Image
                  source={{ uri: exercise.muscle_group_image }}
                  style={{ width: '100%', height: 200, marginTop: 16, borderRadius: 12 }}
                  contentFit="contain"
                />
              )}
            </Card>

            {/* Instructions */}
            <Card>
              <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
                Instructions
              </Text>
              <Text className="text-sm leading-6" style={{ color: colors.textSecondary }}>
                {exercise?.description || 'No instructions available yet.'}
              </Text>
            </Card>
          </View>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <View className="px-6">
            <Card>
              <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
                Performance History
              </Text>

              {isLoadingHistory ? (
                <SkeletonBox height={160} />
              ) : !historyData?.performance_data?.length ? (
                <Text className="text-center py-8" style={{ color: colors.textSecondary }}>
                  No history yet
                </Text>
              ) : (
                <>
                  {/* Stats */}
                  <View className="flex-row gap-3 mb-6">
                    {[
                      {
                        label: 'Current',
                        value: allowWeightLogging
                          ? historyData.performance_data.at(-1)?.volume
                          : historyData.stats.current_best_set_reps,
                      },
                      {
                        label: 'Best',
                        value: allowWeightLogging
                          ? Math.max(...historyData.performance_data.map(p => p.volume))
                          : historyData.stats.best_set_reps,
                      },
                      {
                        label: 'Progress',
                        value: `${progressPercentage >= 0 ? '+' : ''}${progressPercentage.toFixed(0)}%`,
                      },
                    ].map(stat => (
                      <View
                        key={stat.label}
                        className="flex-1 rounded-xl p-3 items-center"
                        style={{ backgroundColor: colors.bgElevated }}
                      >
                        <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                          {stat.label}
                        </Text>
                        <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                          {stat.value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Chart */}
                  {chartData.length > 1 && (
                    <LineChart
                      data={chartData}
                      width={SCREEN_WIDTH - 96}
                      height={160}
                      color={colors.primary}
                      thickness={2}
                      dataPointsColor={colors.primary}
                      startFillColor={`${colors.primary}40`}
                      endFillColor="transparent"
                      areaChart
                      hideRules
                      xAxisColor={colors.bgElevated}
                      yAxisColor={colors.bgElevated}
                      yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                      xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                      curved
                    />
                  )}

                  {/* Recent Sessions */}
                  <Text className="text-sm font-semibold mt-4 mb-2" style={{ color: colors.textSecondary }}>
                    Recent Sessions
                  </Text>
                  {[...historyData.performance_data].reverse().slice(0, 3).map(session => (
                    <View
                      key={`${session.session_id}-${session.date}`}
                      className="flex-row justify-between items-center p-3 rounded-xl mb-2"
                      style={{ backgroundColor: colors.bgElevated }}
                    >
                      <View>
                        <Text className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {session.date}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          {allowWeightLogging
                            ? `${session.volume}kg volume · ${session.sets} sets`
                            : `${session.best_set_reps} reps · ${session.sets} sets`
                          }
                        </Text>
                      </View>
                      <Text className="font-bold" style={{ color: colors.primary }}>
                        {allowWeightLogging ? session.volume : session.reps}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
```

---

## Step 5 — Build Exercise Picker Screen

This is used as a modal when adding exercises to a workout template or workout preview.

Replace `apps/mobile/src/screens/placeholders/ExercisePickerScreen.tsx`:

```tsx
// Same as ExerciseCatalogScreen but:
// 1. Has a close button (X) in header instead of back arrow
// 2. Tapping an exercise calls onSelect callback instead of navigating
// 3. Pass the callback via navigation params or use a global state/event emitter

// Pattern: use navigation params with a callback
// apps/mobile/src/navigation/types.ts — update ExercisePicker route:
// ExercisePicker: { onSelect: (exercise: ExerciseResource) => void }

// In picker screen:
const { onSelect } = route.params
// On exercise tap:
onSelect(exercise)
navigation.goBack()
```

Key difference from catalog:
- Header: "Add Exercise" title + X close button
- Each exercise card has a `+` button on the right
- No navigation to detail on tap — directly selects

---

## Step 6 — Verify

```bash
pnpm dev:mobile
```

- [ ] Exercise catalog loads and displays exercises
- [ ] Search filters list in real time
- [ ] Muscle group filter chips work
- [ ] Equipment filter chips work
- [ ] Tapping exercise navigates to detail screen
- [ ] Detail screen shows video (autoplay, muted) or image
- [ ] Guidance tab shows muscle groups and instructions
- [ ] Performance tab shows chart and recent sessions (if history exists)
- [ ] Tab switching works
- [ ] Exercise picker modal opens and selects correctly

---

## Step 7 — Commit

```bash
git add -A
git commit -m "feat(mobile): exercise catalog, detail screen with video/chart, exercise picker modal"
```

---

## Verification Checklist
- [ ] Catalog: search + two filter chip rows working
- [ ] Catalog: FlatList performs well with many items
- [ ] Detail: video autoplays muted with expo-video
- [ ] Detail: image fallback works when no video
- [ ] Detail: primary/secondary muscle tags render
- [ ] Detail: performance chart renders with gifted-charts
- [ ] Detail: stats (Current/Best/Progress) calculated correctly
- [ ] Picker: modal presentation, X to close, + to select
- [ ] No TypeScript errors
