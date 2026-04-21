import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { ArrowLeft, Clock, Dumbbell, TrendingUp, CheckCircle2, Circle, ChevronRight } from 'lucide-react-native'
import { useSession } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { GradientText } from '../../components/ui/GradientText'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { AppScreenProps } from '../../navigation/types'
import type { SessionExerciseDetail, SetLogResource } from '@fit-nation/shared'

type Props = AppScreenProps<'SessionDetail'>

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return 'N/A'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function calcDuration(performedAt: string | null, completedAt: string | null): number | null {
  if (!performedAt || !completedAt) return null
  return Math.floor((new Date(completedAt).getTime() - new Date(performedAt).getTime()) / 60000)
}

function formatWeight(weight: number): string {
  return Number.isInteger(weight) ? weight.toString() : weight.toFixed(1)
}

export function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params
  const { colors } = useTheme()
  const numericSessionId = Number(sessionId)

  const { data: sessionData, isLoading, isError, refetch } = useSession(numericSessionId)

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View className="px-5 pt-4">
          <SkeletonBox height={50} style={{ marginBottom: 16 }} />
          <SkeletonBox height={120} style={{ marginBottom: 16 }} />
          <SkeletonBox height={200} />
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !sessionData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
        <Text style={{ color: colors.textSecondary }}>Failed to load session</Text>
        <TouchableOpacity onPress={() => refetch()} className="mt-4 px-6 py-3 rounded-xl" style={{ backgroundColor: colors.primary }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const exercises: SessionExerciseDetail[] = (sessionData as any).exercises ?? []
  const duration = calcDuration(sessionData.performed_at, sessionData.completed_at)

  const hasWeighted = exercises.some(
    ex => ex.session_exercise.progression_mode === 'double_progression'
  )
  const totalVolume = exercises
    .filter(ex => ex.session_exercise.progression_mode === 'double_progression')
    .reduce((sum, ex) => {
      return sum + (ex.logged_sets ?? []).reduce((s: number, set: SetLogResource) => s + set.weight * set.reps, 0)
    }, 0)
  const totalBodyweightReps = exercises
    .filter(ex => ex.session_exercise.progression_mode === 'total_reps')
    .reduce((sum, ex) => {
      return sum + (ex.logged_sets ?? []).reduce((s: number, set: SetLogResource) => s + set.reps, 0)
    }, 0)

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View
        className="flex-row items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: `${colors.textMuted}20` }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full"
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <GradientText style={{ fontSize: 20, fontWeight: '700' }}>Session Details</GradientText>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View
          className="rounded-2xl p-6 border mt-4 mb-5"
          style={{
            backgroundColor: colors.bgSurface,
            borderColor: `${colors.textMuted}20`,
          }}
        >
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                Workout Session
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {sessionData.performed_at ? formatDate(sessionData.performed_at) : 'Unknown date'}
              </Text>
            </View>
            <View
              className="flex-row items-center gap-1.5 px-3 py-1 rounded-full"
              style={{
                backgroundColor: sessionData.completed_at ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
              }}
            >
              {sessionData.completed_at ? (
                <CheckCircle2 size={14} color="#22c55e" />
              ) : (
                <Circle size={14} color="#f59e0b" />
              )}
              <Text
                className="text-xs font-bold"
                style={{ color: sessionData.completed_at ? '#22c55e' : '#f59e0b' }}
              >
                {sessionData.completed_at ? 'Completed' : 'Incomplete'}
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="flex-row gap-3">
            <View
              className="flex-1 rounded-xl p-3 border"
              style={{ backgroundColor: colors.bgBase, borderColor: `${colors.textMuted}20` }}
            >
              <Clock size={16} color={colors.primary} style={{ marginBottom: 4 }} />
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                {formatDuration(duration)}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>Duration</Text>
            </View>
            <View
              className="flex-1 rounded-xl p-3 border"
              style={{ backgroundColor: colors.bgBase, borderColor: `${colors.textMuted}20` }}
            >
              <Dumbbell size={16} color={colors.secondary} style={{ marginBottom: 4 }} />
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                {exercises.length}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>Exercises</Text>
            </View>
            <View
              className="flex-1 rounded-xl p-3 border"
              style={{ backgroundColor: colors.bgBase, borderColor: `${colors.textMuted}20` }}
            >
              <TrendingUp size={16} color={colors.primary} style={{ marginBottom: 4 }} />
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                {hasWeighted ? formatWeight(totalVolume) : totalBodyweightReps}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {hasWeighted ? 'Volume (kg)' : 'Total Reps'}
              </Text>
            </View>
          </View>
        </View>

        {/* Exercises */}
        {exercises.length > 0 ? (
          <View
            className="rounded-xl p-4 border"
            style={{ backgroundColor: colors.bgSurface, borderColor: `${colors.textMuted}20` }}
          >
            <Text className="text-sm font-bold mb-4" style={{ color: colors.textPrimary }}>
              Exercises
            </Text>
            <View className="gap-4">
              {exercises.map((exerciseDetail: SessionExerciseDetail) => {
                const se = exerciseDetail.session_exercise
                const ex = se.exercise
                const loggedSets = exerciseDetail.logged_sets ?? []
                const isBodyweight = se.progression_mode === 'total_reps'
                const exerciseName = ex?.name ?? 'Unknown Exercise'
                const imageSrc = ex?.image ?? null

                return (
                  <View
                    key={se.id}
                    className="rounded-lg p-4 border"
                    style={{ backgroundColor: colors.bgElevated, borderColor: `${colors.textMuted}15` }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        if (ex?.name) navigation.navigate('ExerciseDetail', { exerciseName: ex.name })
                      }}
                      className="flex-row items-center justify-between mb-3 gap-2"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-3 flex-1 min-w-0">
                        {imageSrc ? (
                          <Image
                            source={{ uri: imageSrc }}
                            style={{ width: 44, height: 44, borderRadius: 8 }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: colors.bgSurface }}
                          />
                        )}
                        <Text
                          className="text-sm font-bold flex-1"
                          style={{ color: colors.textPrimary }}
                          numberOfLines={1}
                        >
                          {exerciseName}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        {exerciseDetail.is_completed && (
                          <CheckCircle2 size={16} color="#22c55e" />
                        )}
                        {ex?.name && <ChevronRight size={18} color={colors.textMuted} />}
                      </View>
                    </TouchableOpacity>

                    {loggedSets.length > 0 ? (
                      <View className="gap-2">
                        {loggedSets.map((set: SetLogResource) => (
                          <View
                            key={set.id}
                            className="flex-row items-center justify-between p-3 rounded-lg border"
                            style={{ backgroundColor: colors.bgSurface, borderColor: `${colors.textMuted}15` }}
                          >
                            <View className="flex-row items-center gap-4 flex-1">
                              <Text className="text-sm font-bold" style={{ color: colors.textSecondary, minWidth: 40 }}>
                                Set {set.set_number}
                              </Text>
                              {!isBodyweight && (
                                <>
                                  <View className="flex-row items-center gap-1">
                                    <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
                                      {formatWeight(set.weight)}
                                    </Text>
                                    <Text className="text-xs" style={{ color: colors.textMuted }}>kg</Text>
                                  </View>
                                  <Text style={{ color: `${colors.textMuted}60` }}>×</Text>
                                </>
                              )}
                              <View className="flex-row items-center gap-1">
                                <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
                                  {set.reps}
                                </Text>
                                <Text className="text-xs" style={{ color: colors.textMuted }}>reps</Text>
                              </View>
                            </View>
                            {!isBodyweight && (
                              <View className="items-end">
                                <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
                                  {formatWeight(set.weight * set.reps)} kg
                                </Text>
                                <Text style={{ color: colors.textMuted, fontSize: 10 }}>volume</Text>
                              </View>
                            )}
                          </View>
                        ))}
                        {loggedSets.length > 1 && (
                          <View
                            className="flex-row items-center justify-between mt-2 pt-3 border-t"
                            style={{ borderColor: `${colors.textMuted}20` }}
                          >
                            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                              {isBodyweight ? 'Total reps' : 'Volume'}
                            </Text>
                            <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                              {isBodyweight
                                ? `${loggedSets.reduce((s: number, set: SetLogResource) => s + set.reps, 0)} reps`
                                : `${formatWeight(loggedSets.reduce((s: number, set: SetLogResource) => s + set.weight * set.reps, 0))} kg`}
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text className="text-xs italic" style={{ color: colors.textMuted }}>
                        No sets logged
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        ) : (
          <View
            className="rounded-xl p-4 border items-center"
            style={{ backgroundColor: colors.bgSurface, borderColor: `${colors.textMuted}20` }}
          >
            <Text className="text-sm" style={{ color: colors.textSecondary }}>No exercises in this session</Text>
          </View>
        )}

        {/* Notes */}
        {sessionData.notes && (
          <View
            className="rounded-xl p-4 border mt-4"
            style={{ backgroundColor: colors.bgSurface, borderColor: `${colors.textMuted}20` }}
          >
            <Text className="text-sm font-bold mb-2" style={{ color: colors.textPrimary }}>Notes</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>{sessionData.notes}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
