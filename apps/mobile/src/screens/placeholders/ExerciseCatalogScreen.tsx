import { useState, useMemo } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Search, Dumbbell } from 'lucide-react-native'
import { useExercises, useMuscleGroups, useEquipmentTypes } from '@fit-nation/shared'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../context/ThemeContext'
import { ExerciseCard } from '../../components/exercises/ExerciseCard'
import { ExerciseFilters } from '../../components/exercises/ExerciseFilters'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { PageTitle } from '../../components/ui/ScreenHeader'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { SCREEN } from '../../constants/layout'
import { NO_FILTERS, filterExercises, hasActiveFilter, type ExerciseFilterState } from '../../lib/exerciseFilters'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation/types'
import type { ExerciseResource } from '@fit-nation/shared'

type Nav = NativeStackNavigationProp<AppStackParamList>

export function ExerciseCatalogScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<Nav>()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ExerciseFilterState>(NO_FILTERS)

  const debouncedSearch = useDebounce(search, 300)
  const { data: exercises = [], isLoading, isError, refetch } = useExercises(debouncedSearch || undefined)
  const { data: muscleGroups = [] } = useMuscleGroups()
  const { data: equipmentTypes = [] } = useEquipmentTypes()

  const filtered = useMemo(
    () => filterExercises(exercises as ExerciseResource[], filters),
    [exercises, filters]
  )
  const isNarrowed = search.length > 0 || hasActiveFilter(filters)

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View className="pb-3" style={{ paddingHorizontal: SCREEN.paddingX }}>
        <PageTitle title="Exercises" />

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

      {/* Muscle / Equipment dropdowns + result count */}
      <ExerciseFilters
        muscleGroups={muscleGroups}
        equipmentTypes={equipmentTypes}
        filters={filters}
        onChange={setFilters}
        resultCount={isLoading || isError ? null : filtered.length}
      />

      {/* Exercise List */}
      {isLoading ? (
        <View className="pt-2" style={{ paddingHorizontal: SCREEN.paddingX }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBox key={i} height={72} className="mb-3" />
          ))}
        </View>
      ) : isError ? (
        <ErrorState message="Failed to load exercises" onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: SCREEN.paddingX, paddingTop: 4, paddingBottom: SCREEN.paddingBottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ExerciseCard
              exercise={item}
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseName: item.name, initialTab: 'guidance' })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Dumbbell}
              title={isNarrowed ? 'No exercises match' : 'The catalog is empty'}
              description={isNarrowed ? 'Try a different search or clear the filters.' : undefined}
              action={
                isNarrowed
                  ? {
                      label: 'Clear filters',
                      onPress: () => {
                        setSearch('')
                        setFilters(NO_FILTERS)
                      },
                    }
                  : undefined
              }
            />
          }
        />
      )}
    </SafeAreaView>
  )
}
