import { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProgram } from '@fit-nation/shared'
import type { ProgramResource, WorkoutTemplateResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ArrowLeft, ChevronRight } from 'lucide-react-native'
import { Image } from 'expo-image'
import type { AppScreenProps } from '../../navigation/types'

interface WeekGroup {
  weekNumber: number
  workouts: WorkoutTemplateResource[]
  isActive: boolean
}

function groupWorkoutsByWeek(program: ProgramResource): WeekGroup[] {
  if (!program?.workout_templates) return []

  const weekMap = new Map<number, WorkoutTemplateResource[]>()
  program.workout_templates.forEach((t) => {
    const wk = t.week_number || 1
    if (!weekMap.has(wk)) weekMap.set(wk, [])
    weekMap.get(wk)!.push(t)
  })

  weekMap.forEach((workouts) => workouts.sort((a, b) => a.order_index - b.order_index))

  const currentActiveWeek = program.current_active_week ?? 1
  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekNumber, workouts]) => ({
      weekNumber,
      workouts,
      isActive: weekNumber === currentActiveWeek && program.is_active,
    }))
}

type Props = AppScreenProps<'ProgramDetail'>

export function ProgramDetailScreen({ route, navigation }: Props) {
  const { programId } = route.params
  const { colors } = useTheme()
  const { data: program, isLoading, isError, refetch } = useProgram(programId)

  const programWeeks = useMemo(() => {
    if (!program) return []
    return groupWorkoutsByWeek(program as ProgramResource)
  }, [program])

  function handleWorkoutPress(workout: WorkoutTemplateResource) {
    if (workout.last_completed_session_id != null) {
      navigation.navigate('SessionDetail', { sessionId: String(workout.last_completed_session_id) })
      return
    }

    navigation.navigate('ManageExercises', { templateId: workout.id })
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
      <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
        Program Details
      </Text>
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View className="px-6">
          {header}
          <SkeletonBox height={160} className="mb-4" />
          <SkeletonBox height={100} className="mb-3" />
          <SkeletonBox height={100} className="mb-3" />
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !program) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View className="px-6">{header}</View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base mb-4 text-center" style={{ color: colors.textSecondary }}>
            Failed to load program
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

  const prog = program as ProgramResource

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {header}

        {/* Program Info Card */}
        <View
          className="rounded-2xl overflow-hidden mb-6"
          style={{ backgroundColor: colors.bgSurface }}
        >
          {prog.cover_image && (
            <View style={{ height: 140 }}>
              <Image
                source={{ uri: prog.cover_image }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                }}
              />
            </View>
          )}
          <View className="p-5">
            <Text className="text-xl font-bold mb-1" style={{ color: colors.textPrimary }}>
              {prog.name}
            </Text>
            {prog.description && (
              <Text className="text-sm leading-relaxed mb-3" style={{ color: colors.textSecondary }}>
                {prog.description}
              </Text>
            )}
            <View className="flex-row flex-wrap gap-2">
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Text className="text-xs font-bold uppercase" style={{ color: colors.primary }}>
                  {prog.duration_weeks} Weeks
                </Text>
              </View>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Text className="text-xs font-bold uppercase" style={{ color: colors.primary }}>
                  {prog.workout_templates?.length || 0} Workouts
                </Text>
              </View>
              {prog.is_active && (
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${colors.success}20` }}
                >
                  <Text className="text-xs font-bold uppercase" style={{ color: colors.success }}>
                    Active
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Timeline of weeks */}
        {programWeeks.length > 0 && (
          <View style={{ position: 'relative' }}>
            {/* Timeline line */}
            <View
              style={{
                position: 'absolute',
                left: 9,
                top: 24,
                bottom: 24,
                width: 2,
                backgroundColor: colors.bgElevated,
              }}
            />

            <View style={{ gap: 12 }}>
              {programWeeks.map((week) => (
                <View key={week.weekNumber} className="flex-row items-start">
                  {/* Dot */}
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      marginTop: 20,
                      marginRight: 12,
                      borderWidth: 2,
                      backgroundColor: week.isActive ? colors.primary : colors.bgSurface,
                      borderColor: week.isActive ? colors.primary : colors.bgElevated,
                      zIndex: 1,
                    }}
                  />

                  {/* Week Card */}
                  <View
                    className="flex-1 rounded-2xl p-4"
                    style={{
                      backgroundColor: week.isActive ? `${colors.primary}12` : colors.bgSurface,
                      borderWidth: 1,
                      borderColor: week.isActive ? `${colors.primary}40` : 'transparent',
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-sm font-bold uppercase tracking-wider" style={{ color: week.isActive ? colors.primary : colors.textSecondary }}>
                        Week {week.weekNumber}
                      </Text>
                      {week.isActive && (
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.primary}20` }}>
                          <Text className="text-xs font-bold" style={{ color: colors.primary }}>Current</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ gap: 8 }}>
                      {week.workouts.map((workout) => {
                        const isNext = prog.is_active && prog.next_workout?.id === workout.id
                        const isCompleted = workout.last_completed_session_id != null
                        return (
                          <TouchableOpacity
                            key={workout.id}
                            onPress={() => handleWorkoutPress(workout)}
                            className="flex-row items-center justify-between px-3 py-3 rounded-xl"
                            style={{
                              backgroundColor: isNext ? `${colors.primary}18` : colors.bgElevated,
                              borderWidth: isNext ? 1 : 0,
                              borderColor: isNext ? `${colors.primary}40` : 'transparent',
                            }}
                          >
                            <View className="flex-1 min-w-0 mr-2">
                              <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }} numberOfLines={1}>
                                {workout.name}
                              </Text>
                              {workout.exercises && (
                                <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                                  {workout.exercises.length} exercises
                                </Text>
                              )}
                            </View>
                            {isCompleted ? (
                              <Text className="text-xs font-semibold" style={{ color: colors.success }}>
                                Completed
                              </Text>
                            ) : (
                              <ChevronRight size={16} color={colors.textMuted} />
                            )}
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
