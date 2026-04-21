import { useState, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import { LineChart } from 'react-native-gifted-charts'
import { X } from 'lucide-react-native'
import { useExercises, useExerciseHistory } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { GradientText } from '../../components/ui/GradientText'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { AppScreenProps } from '../../navigation/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function ExerciseVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => {
    p.loop = true
    p.muted = true
    p.play()
  })

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (error) console.warn('[ExerciseVideoPlayer] error', error)
    })
    return () => sub.remove()
  }, [player, uri])

  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
      nativeControls={false}
    />
  )
}

type Props = AppScreenProps<'WorkoutSessionExerciseDetail'>

export function WorkoutSessionExerciseDetailScreen({ route, navigation }: Props) {
  const { exerciseName } = route.params
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState<'guidance' | 'performance'>('guidance')

  const { data: exercises = [] } = useExercises()
  const exercise = useMemo(
    () => (exercises as any[]).find((e: any) => e.name.toLowerCase() === exerciseName.toLowerCase()),
    [exercises, exerciseName]
  )

  const allowWeightLogging = exercise?.equipment_type?.code !== 'BODYWEIGHT'

  const { data: historyData, isLoading: isLoadingHistory } = useExerciseHistory(
    exercise?.id ?? 0,
    undefined,
    { enabled: activeTab === 'performance' && !!exercise?.id }
  )

  const primaryMuscles = useMemo(
    () => exercise?.muscle_groups?.filter((m: any) => m.is_primary).map((m: any) => m.name) ?? [],
    [exercise]
  )

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Close button row */}
        <View
          className="flex-row items-center justify-between px-5 py-4"
          style={{ borderBottomWidth: 1, borderBottomColor: `${colors.textMuted}20` }}
        >
          <Text className="text-lg font-bold" style={{ color: colors.textPrimary }} numberOfLines={1}>
            {exerciseName}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.bgSurface }}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row mx-5 mt-4 mb-2 rounded-xl p-1" style={{ backgroundColor: colors.bgSurface }}>
          {(['guidance', 'performance'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-lg items-center"
              style={{
                backgroundColor: activeTab === tab ? colors.bgElevated : 'transparent',
              }}
              activeOpacity={0.7}
            >
              <Text
                className="text-sm font-semibold capitalize"
                style={{ color: activeTab === tab ? colors.textPrimary : colors.textMuted }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'guidance' ? (
            <>
              {/* Video or Image */}
              <View className="rounded-2xl overflow-hidden mb-5 mt-2" style={{ height: 220, backgroundColor: colors.bgSurface }}>
                {exercise?.video ? (
                  <ExerciseVideoPlayer uri={exercise.video} />
                ) : exercise?.image ? (
                  <Image
                    source={{ uri: exercise.image }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text style={{ color: colors.textMuted }}>No media available</Text>
                  </View>
                )}
              </View>

              {/* Name + primary muscles */}
              <GradientText style={{ fontSize: 26, fontWeight: '900', marginBottom: 4 }}>{exerciseName}</GradientText>
              {primaryMuscles.length > 0 && (
                <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                  {primaryMuscles.join(', ')}
                </Text>
              )}

              {/* Muscle groups */}
              {exercise?.muscle_groups && exercise.muscle_groups.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mb-5">
                  {exercise.muscle_groups.map((mg: any) => (
                    <View
                      key={mg.id}
                      className="px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: mg.is_primary ? `${colors.primary}20` : colors.bgSurface,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: mg.is_primary ? colors.primary : colors.textSecondary }}
                      >
                        {mg.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Description */}
              {exercise?.description && (
                <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: colors.bgSurface }}>
                  <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                    {exercise.description}
                  </Text>
                </View>
              )}

              {/* Equipment */}
              {exercise?.equipment_type && (
                <View className="flex-row items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: colors.bgSurface }}>
                  <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    Equipment:
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    {exercise.equipment_type.name}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {isLoadingHistory ? (
                <>
                  <SkeletonBox height={200} style={{ marginTop: 12, marginBottom: 16 }} />
                  <SkeletonBox height={100} />
                </>
              ) : historyData?.performance_data && historyData.performance_data.length > 0 ? (
                <>
                  <View className="mt-4 mb-4">
                    <Text className="text-sm font-bold mb-3" style={{ color: colors.textSecondary }}>
                      {allowWeightLogging ? 'WEIGHT PROGRESS' : 'REPS PROGRESS'}
                    </Text>
                    <LineChart
                      data={historyData.performance_data.map((p: any) => ({
                        value: allowWeightLogging ? p.weight : p.best_set_reps,
                        label: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      }))}
                      width={SCREEN_WIDTH - 80}
                      height={180}
                      color={colors.primary}
                      thickness={2}
                      dataPointsColor={colors.primary}
                      startFillColor={`${colors.primary}40`}
                      endFillColor={`${colors.primary}00`}
                      areaChart
                      hideRules
                      hideDataPoints={historyData.performance_data.length > 10}
                      xAxisColor={`${colors.textMuted}40`}
                      yAxisColor={`${colors.textMuted}40`}
                      yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                      xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                      noOfSections={4}
                      curved
                    />
                  </View>

                  {/* Stats */}
                  {historyData.stats && (
                    <View className="flex-row gap-3">
                      {allowWeightLogging && (
                        <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: colors.bgSurface }}>
                          <Text className="text-xs font-bold mb-1" style={{ color: colors.textSecondary }}>
                            BEST WEIGHT
                          </Text>
                          <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                            {historyData.stats.best_weight ?? 0} kg
                          </Text>
                        </View>
                      )}
                      <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: colors.bgSurface }}>
                        <Text className="text-xs font-bold mb-1" style={{ color: colors.textSecondary }}>
                          BEST REPS
                        </Text>
                        <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                          {historyData.stats.best_set_reps ?? 0}
                        </Text>
                      </View>
                      <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: colors.bgSurface }}>
                        <Text className="text-xs font-bold mb-1" style={{ color: colors.textSecondary }}>
                          SESSIONS
                        </Text>
                        <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                          {historyData.stats.total_sessions ?? 0}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <View className="items-center justify-center py-16">
                  <Text className="text-base font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    No history yet
                  </Text>
                  <Text className="text-sm text-center" style={{ color: colors.textMuted }}>
                    Complete a session with this exercise to see your progress
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
