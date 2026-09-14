import { useMemo } from 'react'
import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useBrowsableRoutine, useStartSession, useTodayWorkout, useWeightUnit, formatRepRange } from '@fit-nation/shared'
import type { TemplateExercise, WorkoutTemplateResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SCREEN } from '../../constants/layout'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { SectionLabel } from '../../components/ui/SectionLabel'
import { ExerciseRow, EXERCISE_ROW } from '../../components/exercises/ExerciseRow'
import { ChevronRight } from 'lucide-react-native'
import { showToast } from '../../lib/toast'
import type { AppScreenProps } from '../../navigation/types'

type Props = AppScreenProps<'RoutineWorkoutDetail'>

export function RoutineWorkoutDetailScreen({ route, navigation }: Props) {
  const { routineId, workoutId } = route.params
  const { colors } = useTheme()
  const { data: routine, isLoading, isError, refetch } = useBrowsableRoutine(routineId)
  const startSession = useStartSession()
  const { data: todayWorkout } = useTodayWorkout()
  const weightUnit = useWeightUnit()

  const workout = useMemo(() => {
    if (!routine?.workout_templates) return null
    return routine.workout_templates.find((w: WorkoutTemplateResource) => w.id === workoutId) ?? null
  }, [routine, workoutId])

  async function handleStartWorkout() {
    const activeSession = todayWorkout?.session
    if (activeSession && !activeSession.completed_at && activeSession.workout_template_id === workoutId) {
      navigation.navigate('WorkoutSession', { sessionId: String(activeSession.id) })
      return
    }
    try {
      const response = await startSession.mutateAsync(workoutId)
      const session = (response as any)?.data?.session || (response as any)?.data
      if (session?.id) {
        navigation.navigate('WorkoutSession', { sessionId: String(session.id) })
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to start workout', 'error')
    }
  }

  const header = <ScreenHeader title={workout?.name ?? 'Workout'} onBack={() => navigation.goBack()} />

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View style={{ paddingHorizontal: SCREEN.paddingX }}>
          {header}
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} height={80} className="mb-3" />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !workout) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View style={{ paddingHorizontal: SCREEN.paddingX }}>{header}</View>
        <ErrorState
          message={!workout && !isLoading && !isError ? 'Workout not found.' : 'Failed to load workout'}
          onRetry={isError ? () => refetch() : undefined}
        />
      </SafeAreaView>
    )
  }

  const exercises = workout.exercises ?? []
  const activeSession = todayWorkout?.session
  const hasActiveSession = activeSession && !activeSession.completed_at && activeSession.workout_template_id === workoutId

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottomWithFooter }}
        showsVerticalScrollIndicator={false}
      >
        {header}

        <SectionLabel>Exercises</SectionLabel>

        {exercises.length === 0 ? (
          <EmptyState variant="card" title="No exercises" />
        ) : (
          <View style={{ gap: EXERCISE_ROW.rowGap }}>
            {exercises.map((ex: TemplateExercise) => {
              const sets = ex.pivot?.target_sets ?? 0
              const minReps = ex.pivot?.min_target_reps ?? 0
              const maxReps = ex.pivot?.max_target_reps ?? 0
              const weight = ex.pivot?.target_weight ?? 0
              return (
                <ExerciseRow
                  key={ex.pivot?.id ?? ex.id}
                  name={ex.name}
                  image={ex.image}
                  meta={`${sets} sets · ${formatRepRange(minReps, maxReps)} reps · ${weight > 0 ? weight : 0} ${weightUnit}`}
                  onPress={() => navigation.navigate('ExerciseDetail', { exerciseName: ex.name })}
                  right={<ChevronRight size={18} color={colors.textMuted} style={{ marginRight: 4 }} />}
                />
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Start / Continue Workout button */}
      <View
        className="absolute bottom-0 left-0 right-0 pb-8 pt-4"
        style={{ backgroundColor: colors.bgBase, paddingHorizontal: SCREEN.paddingX }}
      >
        <Button
          label={hasActiveSession ? 'Continue Workout' : 'Start Workout'}
          variant={hasActiveSession ? 'accent' : 'primary'}
          onPress={handleStartWorkout}
        />
      </View>
    </SafeAreaView>
  )
}
