import { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useBrowsableRoutine, useStartSession, useTodayWorkout, formatRepRange } from '@fit-nation/shared'
import type { TemplateExercise, WorkoutTemplateResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ArrowLeft, ChevronRight } from 'lucide-react-native'
import { Image } from 'expo-image'
import type { AppScreenProps } from '../../navigation/types'

type Props = AppScreenProps<'RoutineWorkoutDetail'>

export function RoutineWorkoutDetailScreen({ route, navigation }: Props) {
  const { routineId, workoutId } = route.params
  const { colors } = useTheme()
  const { data: routine, isLoading, isError, refetch } = useBrowsableRoutine(routineId)
  const startSession = useStartSession()
  const { data: todayWorkout } = useTodayWorkout()

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
      Alert.alert('Error', e?.message || 'Failed to start workout')
    }
  }

  const backButton = (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      className="p-2 rounded-full"
      style={{ backgroundColor: colors.bgElevated }}
    >
      <ArrowLeft size={22} color={colors.textSecondary} />
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View className="flex-row items-center gap-4 px-6 pt-6 mb-6">
          {backButton}
        </View>
        <View className="px-6">
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
        <View className="flex-row items-center gap-4 px-6 pt-6 mb-6">{backButton}</View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base mb-4 text-center" style={{ color: colors.textSecondary }}>
            {!workout && !isLoading && !isError ? 'Workout not found.' : 'Failed to load workout'}
          </Text>
          {isError && (
            <TouchableOpacity
              onPress={() => refetch()}
              className="px-6 py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="font-semibold text-white">Retry</Text>
            </TouchableOpacity>
          )}
        </View>
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
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center gap-4 pt-6 mb-6">
          {backButton}
          <Text className="text-2xl font-bold flex-1" style={{ color: colors.textPrimary }} numberOfLines={2}>
            {workout.name}
          </Text>
        </View>

        <Text
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: colors.textSecondary }}
        >
          Exercises
        </Text>

        {exercises.length === 0 ? (
          <View
            className="rounded-2xl p-6 items-center"
            style={{ backgroundColor: colors.bgSurface }}
          >
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              No exercises in this workout.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {exercises.map((ex: TemplateExercise) => {
              const sets = ex.pivot?.target_sets ?? 0
              const minReps = ex.pivot?.min_target_reps ?? 0
              const maxReps = ex.pivot?.max_target_reps ?? 0
              const weight = ex.pivot?.target_weight ?? 0
              return (
                <TouchableOpacity
                  key={ex.pivot?.id ?? ex.id}
                  onPress={() => navigation.navigate('ExerciseDetail', { exerciseName: ex.name })}
                  className="flex-row items-center gap-4 p-2 rounded-2xl"
                  style={{ backgroundColor: colors.bgSurface }}
                  activeOpacity={0.75}
                >
                  <View
                    className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: colors.bgElevated }}
                  >
                    {ex.image ? (
                      <Image
                        source={{ uri: ex.image }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Text style={{ color: colors.textMuted, fontSize: 22 }}>💪</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="font-semibold text-sm mb-1" style={{ color: colors.textPrimary }} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      {sets} sets · {formatRepRange(minReps, maxReps)} reps{weight > 0 ? ` · ${weight} kg` : ' · 0 kg'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} style={{ flexShrink: 0, marginRight: 4 }} />
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Start / Continue Workout button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4"
        style={{ backgroundColor: colors.bgBase }}
      >
        <TouchableOpacity
          onPress={handleStartWorkout}
          className="py-4 rounded-xl items-center"
          style={{ backgroundColor: hasActiveSession ? colors.secondary : colors.primary }}
        >
          <Text className="font-bold text-white text-base">
            {hasActiveSession ? 'Continue Workout' : 'Start Workout'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
