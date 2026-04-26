import { useState, useMemo } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { Search, X, Plus, ArrowUpDown, Dumbbell } from 'lucide-react-native'
import {
  useExercises,
  useMuscleGroups,
  useEquipmentTypes,
  useAddTemplateExercise,
  useRemoveTemplateExercise,
  useReorderTemplateExercises,
} from '@fit-nation/shared'
import type { WorkoutTemplateResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { ExerciseCard } from '../../components/exercises/ExerciseCard'
import { FilterChips } from '../../components/exercises/FilterChips'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { AppScreenProps } from '../../navigation/types'
import type { ExerciseResource } from '@fit-nation/shared'

type Props = AppScreenProps<'ExercisePicker'>

export function ExercisePickerScreen({ route, navigation }: Props) {
  const templateId = route.params?.templateId
  const swapPivotId = route.params?.swapPivotId
  const swapOrderIndex = route.params?.swapOrderIndex
  const pivotData = route.params?.pivotData
  const isSwap = swapPivotId != null

  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)

  const { data: exercises = [], isLoading, isError, refetch } = useExercises()
  const { data: muscleGroups = [] } = useMuscleGroups()
  const { data: equipmentTypes = [] } = useEquipmentTypes()
  const addTemplateExercise = useAddTemplateExercise()
  const removeTemplateExercise = useRemoveTemplateExercise()
  const reorderExercises = useReorderTemplateExercises()

  async function handleSwap(exercise: ExerciseResource) {
    if (!templateId || swapPivotId == null) return
    setActionId(exercise.id)
    try {
      await removeTemplateExercise.mutateAsync({ templateId, pivotId: swapPivotId })
      await addTemplateExercise.mutateAsync({
        templateId,
        data: {
          exercise_id: exercise.id,
          target_sets: pivotData?.target_sets ?? 3,
          min_target_reps: pivotData?.min_target_reps ?? 8,
          max_target_reps: pivotData?.max_target_reps ?? 12,
          target_weight: pivotData?.target_weight ?? 0,
        },
      })
      await queryClient.refetchQueries({ queryKey: ['templates', templateId] })
      const template = queryClient.getQueryData<WorkoutTemplateResource>(['templates', templateId])
      const newEntry = (template?.exercises as any[])?.find((ex: any) => ex.id === exercise.id)
      const newPivotId = newEntry?.pivot?.id
      if (newPivotId != null && template?.exercises) {
        const currentOrder = (template.exercises as any[]).map((ex: any) => ex.pivot.id)
        const idx = currentOrder.indexOf(newPivotId)
        if (idx !== -1 && idx !== swapOrderIndex) {
          const newOrder = [...currentOrder]
          newOrder.splice(idx, 1)
          newOrder.splice(swapOrderIndex!, 0, newPivotId)
          await reorderExercises.mutateAsync({ templateId, order: newOrder })
        }
      }
      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to swap exercise')
      setActionId(null)
    }
  }

  const filtered = useMemo(() => {
    return (exercises as ExerciseResource[]).filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
      const matchesMuscle =
        !selectedMuscle || ex.muscle_groups?.some(m => m.is_primary && m.id.toString() === selectedMuscle)
      const matchesEquipment =
        !selectedEquipment || ex.equipment_type?.code === selectedEquipment
      return matchesSearch && matchesMuscle && matchesEquipment
    })
  }, [exercises, search, selectedMuscle, selectedEquipment])

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

      {/* Search bar */}
      <View className="px-4 pb-3">
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
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Muscle Group Filter Chips */}
      {muscleGroups.length > 0 && (
        <FilterChips
          options={muscleGroups.map(mg => ({ value: mg.id.toString(), label: mg.name }))}
          selected={selectedMuscle}
          onSelect={setSelectedMuscle}
        />
      )}

      {/* Equipment Filter Chips */}
      {equipmentTypes.length > 0 && (
        <FilterChips
          options={equipmentTypes.map(eq => ({ value: eq.code, label: eq.name }))}
          selected={selectedEquipment}
          onSelect={setSelectedEquipment}
        />
      )}

      {/* Exercise List */}
      {isLoading ? (
        <View className="px-4 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBox key={i} height={72} className="mb-3" />
          ))}
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base mb-4" style={{ color: colors.textSecondary }}>
            Failed to load exercises
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ExerciseCard
              exercise={item}
              onPress={() => {
                if (!templateId) navigation.goBack()
              }}
              rightAction={
                templateId ? (
                  isSwap ? (
                    <TouchableOpacity
                      onPress={() => handleSwap(item)}
                      disabled={actionId === item.id}
                      className="ml-2 p-2 rounded-full"
                      style={{ backgroundColor: `${colors.secondary}20`, opacity: actionId === item.id ? 0.5 : 1 }}
                      activeOpacity={0.7}
                    >
                      {actionId === item.id
                        ? <ActivityIndicator size="small" color={colors.secondary} />
                        : <ArrowUpDown size={18} color={colors.secondary} />
                      }
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={async () => {
                        if (actionId === item.id) return
                        setActionId(item.id)
                        try {
                          await addTemplateExercise.mutateAsync({
                            templateId,
                            data: {
                              exercise_id: item.id,
                              target_sets: 3,
                              min_target_reps: 8,
                              max_target_reps: 12,
                            },
                          })
                          navigation.goBack()
                        } catch (e: any) {
                          Alert.alert('Error', e?.message || 'Failed to add exercise')
                          setActionId(null)
                        }
                      }}
                      className="ml-2 p-2 rounded-full"
                      style={{ backgroundColor: `${colors.primary}20`, opacity: actionId === item.id ? 0.5 : 1 }}
                      activeOpacity={0.7}
                    >
                      {actionId === item.id
                        ? <ActivityIndicator size="small" color={colors.primary} />
                        : <Plus size={18} color={colors.primary} />
                      }
                    </TouchableOpacity>
                  )
                ) : (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="ml-2 p-2 rounded-full"
                    style={{ backgroundColor: `${colors.primary}20` }}
                    activeOpacity={0.7}
                  >
                    <Plus size={18} color={colors.primary} />
                  </TouchableOpacity>
                )
              }
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Dumbbell size={40} color={colors.textMuted} />
              <Text className="text-base mt-4" style={{ color: colors.textSecondary }}>
                {search || selectedMuscle || selectedEquipment
                  ? 'No exercises found'
                  : 'No exercises available'}
              </Text>
              {(search || selectedMuscle || selectedEquipment) && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch('')
                    setSelectedMuscle(null)
                    setSelectedEquipment(null)
                  }}
                  className="mt-3"
                >
                  <Text className="text-sm" style={{ color: colors.primary }}>
                    Clear filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
