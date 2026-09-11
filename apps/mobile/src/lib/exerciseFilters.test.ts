import { describe, expect, it } from 'vitest'
import {
  NO_FILTERS,
  activeFilterCount,
  exerciseCountLabel,
  filterExercises,
  hasActiveFilter,
  matchesFilters,
  type FilterableExercise,
} from './exerciseFilters'
import type { EquipmentTypeResource, MuscleGroupResource } from '@fit-nation/shared'

function muscle(id: number, is_primary: boolean): MuscleGroupResource {
  return { id, name: `muscle-${id}`, is_primary } as unknown as MuscleGroupResource
}

function equipment(code: string): EquipmentTypeResource {
  return { id: 1, code, name: code, display_order: 1, supports_added_weight: true }
}

// Primary chest, secondary triceps, barbell.
const benchPress: FilterableExercise = {
  muscle_groups: [muscle(3, true), muscle(7, false)],
  equipment_type: equipment('BARBELL'),
}
// Primary quads, dumbbell.
const gobletSquat: FilterableExercise = {
  muscle_groups: [muscle(9, true)],
  equipment_type: equipment('DUMBBELL'),
}
// No taxonomy on record at all.
const bare: FilterableExercise = { muscle_groups: null, equipment_type: null }

describe('matchesFilters', () => {
  it('matches everything when no filter is set', () => {
    expect(matchesFilters(benchPress, NO_FILTERS)).toBe(true)
    expect(matchesFilters(bare, NO_FILTERS)).toBe(true)
  })

  it('matches a muscle filter on the primary muscle groups only', () => {
    expect(matchesFilters(benchPress, { muscleId: '3', equipmentCode: null })).toBe(true)
    expect(matchesFilters(benchPress, { muscleId: '7', equipmentCode: null })).toBe(false)
    expect(matchesFilters(bare, { muscleId: '3', equipmentCode: null })).toBe(false)
  })

  it('matches an equipment filter on the equipment code', () => {
    expect(matchesFilters(benchPress, { muscleId: null, equipmentCode: 'BARBELL' })).toBe(true)
    expect(matchesFilters(benchPress, { muscleId: null, equipmentCode: 'DUMBBELL' })).toBe(false)
    expect(matchesFilters(bare, { muscleId: null, equipmentCode: 'BARBELL' })).toBe(false)
  })

  it('requires both filters when both are set', () => {
    expect(matchesFilters(benchPress, { muscleId: '3', equipmentCode: 'BARBELL' })).toBe(true)
    expect(matchesFilters(benchPress, { muscleId: '3', equipmentCode: 'DUMBBELL' })).toBe(false)
    expect(matchesFilters(benchPress, { muscleId: '9', equipmentCode: 'BARBELL' })).toBe(false)
  })
})

describe('filterExercises', () => {
  const all = [benchPress, gobletSquat, bare]

  it('returns a copy of the list when nothing is filtered', () => {
    const result = filterExercises(all, NO_FILTERS)
    expect(result).toEqual(all)
    expect(result).not.toBe(all)
  })

  it('keeps the original order of the matches', () => {
    expect(filterExercises(all, { muscleId: null, equipmentCode: 'DUMBBELL' })).toEqual([gobletSquat])
    expect(filterExercises([gobletSquat, benchPress], { muscleId: null, equipmentCode: 'BARBELL' })).toEqual([
      benchPress,
    ])
  })
})

describe('hasActiveFilter / activeFilterCount', () => {
  it('counts the dropdowns that are set', () => {
    expect(hasActiveFilter(NO_FILTERS)).toBe(false)
    expect(activeFilterCount(NO_FILTERS)).toBe(0)
    expect(hasActiveFilter({ muscleId: '3', equipmentCode: null })).toBe(true)
    expect(activeFilterCount({ muscleId: '3', equipmentCode: null })).toBe(1)
    expect(activeFilterCount({ muscleId: '3', equipmentCode: 'BARBELL' })).toBe(2)
  })
})

describe('exerciseCountLabel', () => {
  it('pluralises', () => {
    expect(exerciseCountLabel(0)).toBe('0 exercises')
    expect(exerciseCountLabel(1)).toBe('1 exercise')
    expect(exerciseCountLabel(24)).toBe('24 exercises')
  })
})
