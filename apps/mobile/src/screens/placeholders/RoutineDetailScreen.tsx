import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useBrowsableRoutine, useStartSession, useTodayWorkout, withAlpha } from '@fit-nation/shared'
import type { WorkoutTemplateResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SCREEN, STACK_GAP } from '../../constants/layout'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { SectionLabel } from '../../components/ui/SectionLabel'
import { Dumbbell } from 'lucide-react-native'
import { Image } from 'expo-image'
import { showToast } from '../../lib/toast'
import type { AppScreenProps } from '../../navigation/types'

type Props = AppScreenProps<'RoutineDetail'>

export function RoutineDetailScreen({ route, navigation }: Props) {
  const { routineId } = route.params
  const { colors } = useTheme()
  const { data: routine, isLoading, isError, refetch } = useBrowsableRoutine(routineId)
  const startSession = useStartSession()
  const { data: todayWorkout } = useTodayWorkout()

  async function handleStartWorkout(templateId: number) {
    const activeSession = todayWorkout?.session
    if (activeSession && !activeSession.completed_at && activeSession.workout_template_id === templateId) {
      navigation.navigate('WorkoutSession', { sessionId: String(activeSession.id) })
      return
    }
    try {
      const response = await startSession.mutateAsync(templateId)
      const session = (response as any)?.data?.session || (response as any)?.data
      if (session?.id) {
        navigation.navigate('WorkoutSession', { sessionId: String(session.id) })
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to start workout', 'error')
    }
  }

  const header = <ScreenHeader title={routine?.name || 'Routine'} onBack={() => navigation.goBack()} />

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View style={{ paddingHorizontal: SCREEN.paddingX }}>
          {header}
          <SkeletonBox height={140} className="mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBox key={i} height={100} className="mb-3" />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !routine) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View style={{ paddingHorizontal: SCREEN.paddingX }}>{header}</View>
        <ErrorState message="Failed to load routine" onRetry={() => refetch()} />
      </SafeAreaView>
    )
  }

  const workouts = routine.workout_templates ?? []

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {header}

        {/* Cover + Description */}
        <View
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            backgroundColor: routine.cover_image ? undefined : colors.bgSurface,
            minHeight: 140,
          }}
        >
          {routine.cover_image ? (
            <>
              <Image
                source={{ uri: routine.cover_image }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                contentFit="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: colors.imageScrim,
                }}
              />
              <View className="p-6" style={{ minHeight: 140, justifyContent: 'flex-end' }}>
                <Text className="text-sm leading-relaxed" style={{ color: withAlpha(colors.textOnImage, 0.9) }}>
                  {routine.description || 'This routine has no description yet.'}
                </Text>
                {workouts.length > 0 && (
                  <View className="flex-row gap-2 mt-4">
                    <View
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: withAlpha(colors.primary, 0.2) }}
                    >
                      <Dumbbell size={14} color={colors.textOnImage} />
                      <Text className="text-xs font-bold" style={{ color: colors.textOnImage }}>
                        {workouts.length} WORKOUTS
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View className="p-6">
              <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                {routine.description || 'This routine has no description yet.'}
              </Text>
              {workouts.length > 0 && (
                <View className="flex-row gap-2 mt-4">
                  <View
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: colors.bgElevated }}
                  >
                    <Dumbbell size={14} color={colors.textSecondary} />
                    <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                      {workouts.length} WORKOUTS
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Workouts */}
        {workouts.length === 0 ? (
          <EmptyState variant="card" title="No workouts" />
        ) : (
          <>
            <SectionLabel>Workouts</SectionLabel>
            <View style={{ gap: STACK_GAP }}>
              {workouts.map((workout: WorkoutTemplateResource) => {
                const exerciseCount = workout.exercises?.length ?? 0
                const activeSession = todayWorkout?.session
                const hasActive = activeSession && !activeSession.completed_at && activeSession.workout_template_id === workout.id
                return (
                  <View
                    key={workout.id}
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: colors.bgSurface }}
                  >
                    <View className="flex-row items-start justify-between gap-4 mb-3">
                      <View className="flex-1 min-w-0">
                        <Text className="font-bold text-base mb-1" style={{ color: colors.textPrimary }}>
                          {workout.name}
                        </Text>
                        {workout.description && (
                          <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            {workout.description}
                          </Text>
                        )}
                        {exerciseCount > 0 && (
                          <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>
                            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View className="flex-row gap-3">
                      <Button
                        label="View Details"
                        variant="secondary"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => navigation.navigate('RoutineWorkoutDetail', { routineId, workoutId: workout.id })}
                      />
                      <Button
                        label={hasActive ? 'Continue' : 'Start'}
                        variant={hasActive ? 'accent' : 'primary'}
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => handleStartWorkout(workout.id)}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
