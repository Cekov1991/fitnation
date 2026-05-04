import { useState, useMemo } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Search, X, Plus } from 'lucide-react-native'
import {
  useExercises,
  useMuscleGroups,
  useAddSessionExercise,
  useSwapSessionExercise,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { FilterChips } from '../../components/exercises/FilterChips'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { AppScreenProps } from '../../navigation/types'
import type { ExerciseResource } from '@fit-nation/shared'

type Props = AppScreenProps<'WorkoutPreviewExercisePicker'>

export function WorkoutPreviewExercisePickerScreen({ route, navigation }: Props) {
  const { sessionId, swapExerciseId, swapMuscleGroupId } = route.params
  const numericSessionId = Number(sessionId)
  const { colors } = useTheme()
  const isSwap = !!swapExerciseId

  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(swapMuscleGroupId ?? null)
  const [addingId, setAddingId] = useState<number | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const { data: exercises = [], isLoading } = useExercises(debouncedSearch || undefined)
  const { data: muscleGroups = [] } = useMuscleGroups()
  const addExercise = useAddSessionExercise()
  const swapExercise = useSwapSessionExercise()

  const availableMuscleIds = useMemo(() => {
    const ids = new Set<string>()
    ;(exercises as ExerciseResource[]).forEach(ex =>
      ex.muscle_groups?.forEach(m => { if (m.is_primary) ids.add(m.id.toString()) })
    )
    return ids
  }, [exercises])

  const filtered = useMemo(() => {
    return (exercises as ExerciseResource[]).filter(ex => {
      const matchesMuscle =
        !selectedMuscle || ex.muscle_groups?.some(m => m.is_primary && m.id.toString() === selectedMuscle)
      return matchesMuscle
    })
  }, [exercises, selectedMuscle])

  const handleSelectExercise = async (exercise: ExerciseResource) => {
    if (addingId) return
    setAddingId(exercise.id)
    try {
      if (isSwap && swapExerciseId) {
        await swapExercise.mutateAsync({
          sessionId: numericSessionId,
          exerciseId: swapExerciseId,
          data: { exercise_id: exercise.id },
        })
      } else {
        await addExercise.mutateAsync({
          sessionId: numericSessionId,
          data: { exercise_id: exercise.id },
        })
      }
      navigation.goBack()
    } catch {
      setAddingId(null)
    }
  }


  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View className="flex-row items-center gap-4 px-4 pt-4 pb-3">
        <Text className="flex-1 text-xl font-bold" style={{ color: colors.textPrimary }}>
          {isSwap ? 'Swap Exercise' : 'Add Exercise'}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 rounded-full"
          style={{ backgroundColor: colors.bgSurface }}
          activeOpacity={0.7}
        >
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="px-4 pb-3">
        <View
          className="flex-row items-center gap-3 px-4 rounded-xl"
          style={{ backgroundColor: colors.bgSurface }}
        >
          <Search size={18} color={colors.textMuted} />
          <TextInput
            className="flex-1 py-3 text-base"
            style={{ color: colors.textPrimary }}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Muscle Group Filter */}
      {availableMuscleIds.size > 0 && (
        <FilterChips
          options={(muscleGroups as any[])
            .filter((m: any) => availableMuscleIds.has(m.id.toString()))
            .map((m: any) => ({ value: m.id.toString(), label: m.name }))}
          selected={selectedMuscle}
          onSelect={id => setSelectedMuscle(prev => (prev === id ? null : id))}
        />
      )}

      {isLoading ? (
        <View className="px-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBox key={i} height={70} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const isAdding = addingId === item.id
            return (
              <TouchableOpacity
                onPress={() => handleSelectExercise(item)}
                disabled={!!addingId}
                className="flex-row items-center gap-3 p-3 rounded-xl mb-2"
                style={{
                  backgroundColor: colors.bgSurface,
                  opacity: addingId && addingId !== item.id ? 0.5 : 1,
                }}
                activeOpacity={0.75}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: 52, height: 52, borderRadius: 10 }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: colors.bgElevated }}
                  />
                )}
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-bold" style={{ color: colors.textPrimary }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.muscle_groups && item.muscle_groups.length > 0 && (
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                      {item.muscle_groups
                        .filter((m: any) => m.is_primary)
                        .map((m: any) => m.name)
                        .join(', ') || item.muscle_groups[0]?.name}
                    </Text>
                  )}
                </View>
                {isAdding ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <Plus size={18} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            )
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text style={{ color: colors.textSecondary }}>No exercises found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
