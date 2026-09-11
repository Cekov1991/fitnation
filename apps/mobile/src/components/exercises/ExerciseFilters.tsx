import { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { EquipmentTypeResource, MuscleGroupResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import {
  NO_FILTERS,
  activeFilterCount,
  exerciseCountLabel,
  type ExerciseFilterState,
} from '../../lib/exerciseFilters'
import { FilterSelect } from './FilterSelect'

interface ExerciseFiltersProps {
  muscleGroups: ReadonlyArray<MuscleGroupResource>
  equipmentTypes: ReadonlyArray<EquipmentTypeResource>
  filters: ExerciseFilterState
  onChange: (next: ExerciseFilterState) => void
  /** Exercises left after filtering; null while the list is loading or failed. */
  resultCount: number | null
}

/**
 * The filter block under the search bar on every exercise list: the Muscle and
 * Equipment dropdowns side by side, then the result count on the left and, while
 * a dropdown is set, "Clear filter" on the right. The options are the full
 * taxonomy, so a muscle preselected by a swap shows even before the list loads.
 */
export function ExerciseFilters({ muscleGroups, equipmentTypes, filters, onChange, resultCount }: ExerciseFiltersProps) {
  const { colors } = useTheme()

  const muscleOptions = useMemo(
    () => muscleGroups.map((m) => ({ value: String(m.id), label: m.name })),
    [muscleGroups]
  )
  const equipmentOptions = useMemo(
    () =>
      [...equipmentTypes]
        .sort((a, b) => a.display_order - b.display_order)
        .map((e) => ({ value: e.code, label: e.name })),
    [equipmentTypes]
  )

  const activeCount = activeFilterCount(filters)

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <FilterSelect
          label="Muscle"
          options={muscleOptions}
          value={filters.muscleId}
          onChange={(muscleId) => onChange({ ...filters, muscleId })}
        />
        <FilterSelect
          label="Equipment"
          options={equipmentOptions}
          value={filters.equipmentCode}
          onChange={(equipmentCode) => onChange({ ...filters, equipmentCode })}
        />
      </View>

      <View style={styles.summaryRow}>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {resultCount == null ? '' : exerciseCountLabel(resultCount)}
        </Text>
        {activeCount > 0 && (
          <TouchableOpacity
            onPress={() => onChange(NO_FILTERS)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
          >
            <Text style={[styles.clear, { color: colors.primary }]}>
              {activeCount > 1 ? 'Clear filters' : 'Clear filter'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 6 },
  row: { flexDirection: 'row', gap: 10 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 20,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  count: { fontSize: 13, fontWeight: '500' },
  clear: { fontSize: 13, fontWeight: '600' },
})
