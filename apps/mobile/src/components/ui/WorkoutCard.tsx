import { useMemo } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Activity, Clock, Dumbbell, Edit2 } from 'lucide-react-native'
import {
  estimateWorkoutDuration,
  formatRepRange,
  useWeightUnit,
  type TemplateExercise,
  type WorkoutTemplateResource,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Button } from './Button'
import { GradientText } from './GradientText'
import { SectionLabel } from './SectionLabel'
import { ExerciseRow, EXERCISE_ROW } from '../exercises/ExerciseRow'

interface WorkoutCardProps {
  template: WorkoutTemplateResource | null
  title?: string
  onStartWorkout?: (templateId: number) => void
  onStartNextWorkout?: () => void
  showStartButton?: boolean
  startButtonText?: string
  startButtonDisabled?: boolean
  startButtonLoading?: boolean
  onExerciseClick?: (exerciseName: string) => void
  onEditWorkout?: (templateId: number) => void
}

/** Mirrors apps/web/src/components/WorkoutCard.tsx */
export function WorkoutCard({
  template,
  title = "TODAY'S WORKOUT",
  onStartWorkout,
  onStartNextWorkout,
  showStartButton = false,
  startButtonText = 'Start Workout',
  startButtonDisabled = false,
  startButtonLoading = false,
  onExerciseClick,
  onEditWorkout,
}: WorkoutCardProps) {
  const { colors } = useTheme()
  const weightUnit = useWeightUnit()

  const exercises = useMemo<TemplateExercise[]>(() => {
    if (!template) return []
    if (Array.isArray((template as any).exercises)) {
      return (template as any).exercises as TemplateExercise[]
    }
    return []
  }, [template])

  const duration = useMemo(() => estimateWorkoutDuration(exercises), [exercises])
  const sortedExercises = useMemo(
    () => [...exercises].sort((a, b) => (a.pivot?.order ?? 0) - (b.pivot?.order ?? 0)),
    [exercises],
  )

  if (!template) return null

  return (
    <View
      style={{
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        backgroundColor: colors.bgSurface,
        borderColor: colors.borderSubtle,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Activity size={20} color={colors.primary} />
          <GradientText
            style={{ fontSize: 18, fontWeight: '700' }}
            numberOfLines={1}
          >
            {title}
          </GradientText>
        </View>
        {onEditWorkout && (
          <TouchableOpacity
            onPress={() => template.id && onEditWorkout(template.id)}
            style={{
              padding: 8,
              borderRadius: 9999,
              backgroundColor: colors.borderSubtle,
            }}
            activeOpacity={0.7}
          >
            <Edit2 size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Duration + exercise count */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
            {duration} min
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Dumbbell size={16} color={colors.textSecondary} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
            {exercises.length} exercises
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: colors.borderSubtle, marginBottom: 16 }} />

      {/* Workout plan */}
      <SectionLabel tone="muted">Workout plan</SectionLabel>

      {sortedExercises.length === 0 ? (
        <Text
          style={{
            fontSize: 14,
            textAlign: 'center',
            color: colors.textSecondary,
            paddingVertical: 16,
          }}
        >
          No exercises in this workout
        </Text>
      ) : (
        <View style={{ gap: EXERCISE_ROW.rowGap }}>
          {sortedExercises.map((ex) => {
            const sets = ex.pivot?.target_sets ?? 0
            const minReps = ex.pivot?.min_target_reps ?? 0
            const maxReps = ex.pivot?.max_target_reps ?? 0
            const weight = ex.pivot?.target_weight ?? 0
            const label = `${sets} sets × ${formatRepRange(minReps, maxReps)} reps${weight ? ` × ${weight} ${weightUnit}` : ''}`

            return (
              <ExerciseRow
                key={ex.pivot?.id ?? ex.id}
                name={ex.name}
                image={ex.image}
                meta={label}
                surface="elevated"
                onPress={onExerciseClick ? () => onExerciseClick(ex.name) : undefined}
              />
            )
          })}
        </View>
      )}

      {/* Start button */}
      {showStartButton && (
        <View
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
          }}
        >
          <Button
            label={startButtonText}
            variant="primary"
            loading={startButtonLoading}
            disabled={startButtonDisabled}
            onPress={() => {
              if (onStartNextWorkout) onStartNextWorkout()
              else if (onStartWorkout && template.id) onStartWorkout(template.id)
            }}
          />
        </View>
      )}
    </View>
  )
}
