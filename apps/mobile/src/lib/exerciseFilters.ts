import type { ExerciseResource } from '@fit-nation/shared'

/**
 * The two dropdown filters on the exercise lists (catalog, template picker,
 * session picker). Route params carry the muscle group id as a string, so the
 * filter does too; equipment is matched on its code, the same key the chips used.
 */
export interface ExerciseFilterState {
  /** Primary muscle group id, or null for All. */
  muscleId: string | null
  /** Equipment type code, or null for All. */
  equipmentCode: string | null
}

export const NO_FILTERS: ExerciseFilterState = { muscleId: null, equipmentCode: null }

export type FilterableExercise = Pick<ExerciseResource, 'muscle_groups' | 'equipment_type'>

export function hasActiveFilter(filters: ExerciseFilterState): boolean {
  return filters.muscleId != null || filters.equipmentCode != null
}

/** How many of the two dropdowns are set — drives "Clear filter" vs "Clear filters". */
export function activeFilterCount(filters: ExerciseFilterState): number {
  return (filters.muscleId != null ? 1 : 0) + (filters.equipmentCode != null ? 1 : 0)
}

/** A muscle filter matches on the exercise's primary muscle groups only. */
export function matchesFilters(exercise: FilterableExercise, filters: ExerciseFilterState): boolean {
  const matchesMuscle =
    filters.muscleId == null ||
    (exercise.muscle_groups?.some((m) => m.is_primary && String(m.id) === filters.muscleId) ?? false)
  const matchesEquipment =
    filters.equipmentCode == null || exercise.equipment_type?.code === filters.equipmentCode
  return matchesMuscle && matchesEquipment
}

export function filterExercises<T extends FilterableExercise>(
  exercises: readonly T[],
  filters: ExerciseFilterState
): T[] {
  if (!hasActiveFilter(filters)) return [...exercises]
  return exercises.filter((exercise) => matchesFilters(exercise, filters))
}

/** "1 exercise" / "24 exercises" — the count line under the dropdowns. */
export function exerciseCountLabel(count: number): string {
  return count === 1 ? '1 exercise' : `${count} exercises`
}
