import type { ReactNode } from 'react'
import type { ExerciseResource } from '@fit-nation/shared'
import { ExerciseRow, EXERCISE_ROW } from './ExerciseRow'

interface ExerciseCardProps {
  exercise: ExerciseResource
  onPress: () => void
  rightAction?: ReactNode
}

/**
 * Catalog / picker list item: the standard ExerciseRow fed from an
 * ExerciseResource, with the row gap baked in for FlatList use.
 */
export function ExerciseCard({ exercise, onPress, rightAction }: ExerciseCardProps) {
  const primaryMuscle = exercise.muscle_groups?.find(m => m.is_primary)?.name

  return (
    <ExerciseRow
      name={exercise.name}
      image={exercise.image}
      meta={[exercise.equipment_type?.name, primaryMuscle].filter(Boolean).join(' · ')}
      onPress={onPress}
      right={rightAction}
      style={{ marginBottom: EXERCISE_ROW.rowGap }}
    />
  )
}
