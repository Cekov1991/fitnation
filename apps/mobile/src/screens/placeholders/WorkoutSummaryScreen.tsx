import { useMemo } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Award, CheckCircle2, Clock, Dumbbell, Target, TrendingUp, Trophy } from 'lucide-react-native'
import { useSession } from '@fit-nation/shared'
import type { SessionExerciseDetail, SetLogResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { GradientText } from '../../components/ui/GradientText'
import type { AppScreenProps } from '../../navigation/types'

type Props = AppScreenProps<'WorkoutSummary'>

function formatDuration(performedAt: string | null, completedAt: string | null): string {
  if (!performedAt || !completedAt) return 'N/A'
  const minutes = Math.floor((new Date(completedAt).getTime() - new Date(performedAt).getTime()) / 60000)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatWeight(weight: number): string {
  return Number.isInteger(weight) ? weight.toString() : weight.toFixed(1)
}

export function WorkoutSummaryScreen({ route, navigation }: Props) {
  const { sessionId, newPrs = [] } = route.params
  const { colors } = useTheme()
  const numericSessionId = Number(sessionId)
  const { data: sessionData, isLoading, isError, refetch } = useSession(numericSessionId)

  const exercises: SessionExerciseDetail[] = (sessionData as any)?.exercises ?? []
  const duration = formatDuration(sessionData?.performed_at ?? null, sessionData?.completed_at ?? null)

  const stats = useMemo(() => {
    let totalSets = 0
    let weightedVolume = 0
    let bodyweightReps = 0
    let hasWeighted = false
    let hasBodyweight = false

    exercises.forEach((exercise) => {
      const loggedSets = exercise.logged_sets ?? []
      totalSets += loggedSets.length
      if (exercise.session_exercise.progression_mode === 'double_progression') {
        hasWeighted = true
        weightedVolume += loggedSets.reduce((sum: number, set: SetLogResource) => sum + set.weight * set.reps, 0)
      } else {
        hasBodyweight = true
        bodyweightReps += loggedSets.reduce((sum: number, set: SetLogResource) => sum + set.reps, 0)
      }
    })

    return { totalSets, weightedVolume, bodyweightReps, hasWeighted, hasBodyweight }
  }, [exercises])

  const visiblePrs = newPrs.filter((pr) => !(pr.pr_type === 'weight' && pr.new_best === 0))

  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tabs', params: { screen: 'Dashboard' } }],
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View className="px-4 pt-4">
          <SkeletonBox height={140} style={{ marginBottom: 16 }} />
          <SkeletonBox height={170} style={{ marginBottom: 16 }} />
          <SkeletonBox height={220} />
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !sessionData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bgBase }}>
        <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>Failed to load workout summary</Text>
        <TouchableOpacity onPress={() => refetch()} className="px-6 py-3 rounded-xl" style={{ backgroundColor: colors.primary }}>
          <Text style={{ color: colors.textButton, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
          >
            <Award size={36} color={colors.textButton} />
          </LinearGradient>
          <GradientText style={{ fontSize: 34, fontWeight: '800', marginBottom: 6 }}>Great Work!</GradientText>
          <Text style={{ fontSize: 16, color: colors.textSecondary }}>Workout completed successfully</Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <View className="rounded-2xl p-4 border" style={{ width: '48%', backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }}>
            <Clock size={18} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>{duration}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Duration</Text>
          </View>
          <View className="rounded-2xl p-4 border" style={{ width: '48%', backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }}>
            <Dumbbell size={18} color={colors.secondary} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>{exercises.length}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Exercises</Text>
          </View>
          <View className="rounded-2xl p-4 border" style={{ width: '48%', backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }}>
            <Target size={18} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>{stats.totalSets}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Total Sets</Text>
          </View>
          <View className="rounded-2xl p-4 border" style={{ width: '48%', backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }}>
            <TrendingUp size={18} color={colors.secondary} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>
              {stats.hasWeighted ? formatWeight(stats.weightedVolume) : stats.bodyweightReps}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {stats.hasWeighted ? 'Volume (kg)' : 'Total Reps'}
            </Text>
          </View>
        </View>

        {stats.hasBodyweight && stats.hasWeighted && (
          <View className="rounded-2xl p-5 border mb-5" style={{ backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>Bodyweight Reps</Text>
            <Text style={{ fontSize: 30, fontWeight: '800', color: colors.textPrimary }}>{stats.bodyweightReps}</Text>
          </View>
        )}

        {visiblePrs.length > 0 && (
          <View className="mb-5">
            <View className="flex-row items-center gap-2 mb-3">
              <Trophy size={18} color={colors.primary} />
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>New Personal Records</Text>
            </View>
            <View style={{ gap: 10 }}>
              {visiblePrs.map((pr) => (
                <View
                  key={`${pr.exercise_id}-${pr.pr_type}`}
                  className="rounded-xl p-4 border"
                  style={{ backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 }}>{pr.exercise_name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                    {pr.pr_type === 'weight' ? 'Max weight' : 'Max reps'}
                    {pr.previous_best > 0 && (
                      <Text>
                        {' · was '}
                        {pr.pr_type === 'weight' ? `${formatWeight(pr.previous_best)} kg` : `${pr.previous_best} reps`}
                      </Text>
                    )}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>
                      {pr.pr_type === 'weight' ? `${formatWeight(pr.new_best)} kg` : `${pr.new_best} reps`}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>NEW PR</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="mb-6">
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 }}>Exercise Summary</Text>
          <View style={{ gap: 10 }}>
            {exercises.map((exercise, index) => {
              const loggedSets = exercise.logged_sets ?? []
              const isBodyweight = exercise.session_exercise.progression_mode === 'total_reps'
              const totalReps = loggedSets.reduce((sum: number, set: SetLogResource) => sum + set.reps, 0)
              const bestSet = loggedSets.reduce<SetLogResource | null>((best, current) => {
                if (!best) return current
                return current.weight * current.reps > best.weight * best.reps ? current : best
              }, null)
              const volume = loggedSets.reduce((sum: number, set: SetLogResource) => sum + set.weight * set.reps, 0)

              return (
                <View key={exercise.session_exercise.id} className="rounded-xl p-4 border" style={{ backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }}>
                  <View className="flex-row items-start justify-between">
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 }}>
                        {index + 1}. {exercise.session_exercise.exercise?.name ?? 'Exercise'}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {loggedSets.length} set{loggedSets.length === 1 ? '' : 's'} completed
                      </Text>
                    </View>
                    {isBodyweight ? (
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>{totalReps} reps</Text>
                    ) : (
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                        {bestSet ? `${formatWeight(bestSet.weight)} kg × ${bestSet.reps}` : 'No sets'}
                      </Text>
                    )}
                  </View>
                  {!isBodyweight && volume > 0 && (
                    <View className="flex-row items-center justify-between mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>Volume</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{formatWeight(volume)} kg</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>

        <TouchableOpacity onPress={handleDone} className="rounded-2xl py-4" style={{ backgroundColor: colors.success }}>
          <View className="flex-row items-center justify-center gap-2">
            <CheckCircle2 size={22} color={colors.textButton} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textButton }}>Done</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
