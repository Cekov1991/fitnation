import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useBrowsableRoutine, useStartSession, useTodayWorkout } from '@fit-nation/shared'
import type { WorkoutTemplateResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ArrowLeft, Dumbbell, ChevronRight } from 'lucide-react-native'
import { Image } from 'expo-image'
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
      Alert.alert('Error', e?.message || 'Failed to start workout')
    }
  }

  const header = (
    <View className="flex-row items-center gap-4 pt-6 mb-6">
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="p-2 rounded-full"
        style={{ backgroundColor: colors.bgElevated }}
      >
        <ArrowLeft size={22} color={colors.textSecondary} />
      </TouchableOpacity>
      <Text className="text-2xl font-bold flex-1" style={{ color: colors.primary }} numberOfLines={2}>
        {routine?.name || 'Routine'}
      </Text>
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View className="px-6">
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
        <View className="px-6">{header}</View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base mb-4 text-center" style={{ color: colors.textSecondary }}>
            Failed to load routine
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const workouts = routine.workout_templates ?? []

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
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
                  backgroundColor: 'rgba(0,0,0,0.45)',
                }}
              />
              <View className="p-6" style={{ minHeight: 140, justifyContent: 'flex-end' }}>
                <Text className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {routine.description || 'No description available.'}
                </Text>
                {workouts.length > 0 && (
                  <View className="flex-row gap-2 mt-4">
                    <View
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: `${colors.primary}33` }}
                    >
                      <Dumbbell size={14} color="#fff" />
                      <Text className="text-xs font-bold text-white">
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
                {routine.description || 'No description available.'}
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
          <View
            className="rounded-2xl p-6 items-center"
            style={{ backgroundColor: colors.bgSurface }}
          >
            <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
              No workouts in this routine.
            </Text>
          </View>
        ) : (
          <>
            <Text
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: colors.primary }}
            >
              Workouts
            </Text>
            <View style={{ gap: 12 }}>
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
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => navigation.navigate('RoutineWorkoutDetail', { routineId, workoutId: workout.id })}
                        className="flex-1 py-2.5 rounded-xl items-center"
                        style={{ backgroundColor: colors.bgElevated }}
                      >
                        <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          View Details
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleStartWorkout(workout.id)}
                        className="flex-1 py-2.5 rounded-xl items-center"
                        style={{ backgroundColor: hasActive ? colors.secondary : colors.primary }}
                      >
                        <Text className="text-sm font-bold text-white">
                          {hasActive ? 'Continue' : 'Start'}
                        </Text>
                      </TouchableOpacity>
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
