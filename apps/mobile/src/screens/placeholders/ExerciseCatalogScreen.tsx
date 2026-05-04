import { useState, useMemo } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Search, Dumbbell } from 'lucide-react-native'
import { useExercises, useMuscleGroups, useEquipmentTypes } from '@fit-nation/shared'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../context/ThemeContext'
import { ExerciseCard } from '../../components/exercises/ExerciseCard'
import { FilterChips } from '../../components/exercises/FilterChips'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation/types'
import type { ExerciseResource } from '@fit-nation/shared'

type Nav = NativeStackNavigationProp<AppStackParamList>

export function ExerciseCatalogScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<Nav>()
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const { data: exercises = [], isLoading, isError, refetch } = useExercises(debouncedSearch || undefined)
  const { data: muscleGroups = [] } = useMuscleGroups()
  const { data: equipmentTypes = [] } = useEquipmentTypes()

  const availableMuscleIds = useMemo(() => {
    const ids = new Set<string>()
    ;(exercises as ExerciseResource[]).forEach(ex =>
      ex.muscle_groups?.forEach(m => { if (m.is_primary) ids.add(m.id.toString()) })
    )
    return ids
  }, [exercises])

  const availableEquipmentCodes = useMemo(() => {
    const codes = new Set<string>()
    ;(exercises as ExerciseResource[]).forEach(ex => {
      if (ex.equipment_type?.code) codes.add(ex.equipment_type.code)
    })
    return codes
  }, [exercises])

  const filtered = useMemo(() => {
    return (exercises as ExerciseResource[]).filter(ex => {
      const matchesMuscle =
        !selectedMuscle ||
        ex.muscle_groups?.some(m => m.is_primary && m.id.toString() === selectedMuscle)
      const matchesEquipment =
        !selectedEquipment || ex.equipment_type?.code === selectedEquipment
      return matchesMuscle && matchesEquipment
    })
  }, [exercises, selectedMuscle, selectedEquipment])

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <Text className="text-3xl font-bold mb-4" style={{ color: colors.textPrimary }}>
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
            autoCapitalize="none"
            autoCorrect={false}
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
      {availableMuscleIds.size > 0 && (
        <FilterChips
          options={muscleGroups
            .filter(mg => availableMuscleIds.has(mg.id.toString()))
            .map(mg => ({ value: mg.id.toString(), label: mg.name }))}
          selected={selectedMuscle}
          onSelect={setSelectedMuscle}
        />
      )}

      {/* Equipment Filter Chips */}
      {availableEquipmentCodes.size > 0 && (
        <FilterChips
          options={equipmentTypes
            .filter(eq => availableEquipmentCodes.has(eq.code))
            .map(eq => ({ value: eq.code, label: eq.name }))}
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
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseName: item.name, initialTab: 'guidance' })}
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
