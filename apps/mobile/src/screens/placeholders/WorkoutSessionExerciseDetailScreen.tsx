import { useState, useMemo, useEffect, useRef } from 'react'
import {
  AppState,
  AppStateStatus,
  Modal,
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
import { ArrowLeft, Maximize2, X } from 'lucide-react-native'
import * as ScreenOrientation from 'expo-screen-orientation'
import { useExercises, useExerciseHistory } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { GradientText } from '../../components/ui/GradientText'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { AppScreenProps } from '../../navigation/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Helper: "Jan 15" from ISO date string
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}`
}

// Helper: "+12%" or "-5%"
function formatProgress(percentage: number): string {
  const sign = percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(0)}%`
}

function ExerciseVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => {
    p.loop = true
    p.muted = true
    p.play()
  })

  const appState = useRef(AppState.currentState)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        player.play()
      }
      appState.current = nextState
    })
    return () => sub.remove()
  }, [player])

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (error) console.warn('[ExerciseVideoPlayer] error', error)
    })
    return () => sub.remove()
  }, [player, uri])

  const openFullscreen = () => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
    setIsFullscreen(true)
  }

  const closeFullscreen = () => {
    setIsFullscreen(false)
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
  }

  return (
    <View style={{ width: '100%', height: '100%' }}>
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
      />
      <TouchableOpacity
        onPress={openFullscreen}
        activeOpacity={0.75}
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          padding: 8,
          borderRadius: 8,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <Maximize2 size={18} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={isFullscreen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeFullscreen}
        supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <VideoView
            player={player}
            style={{ flex: 1 }}
            contentFit="contain"
            nativeControls={false}
          />
          <TouchableOpacity
            onPress={closeFullscreen}
            activeOpacity={0.75}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              padding: 8,
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

type Props = AppScreenProps<'WorkoutSessionExerciseDetail'>

export function WorkoutSessionExerciseDetailScreen({ route, navigation }: Props) {
  const { exerciseId } = route.params
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState<'guidance' | 'performance'>('guidance')

  const { data: exercises = [] } = useExercises()
  const exercise = useMemo(
    () => (exercises as any[]).find((e: any) => e.id === exerciseId) ?? null,
    [exercises, exerciseId]
  )

  const allowWeightLogging = exercise?.equipment_type?.code !== 'BODYWEIGHT'

  const { data: historyData, isLoading: isLoadingHistory } = useExerciseHistory(
    exercise?.id ?? 0,
    undefined,
    { enabled: activeTab === 'performance' && !!exercise?.id }
  )

  // Chart data: use volume for weighted exercises, best_set_reps for bodyweight
  const chartData = useMemo(() => {
    if (!historyData?.performance_data) return []
    return historyData.performance_data.map((p: any) => ({
      value: allowWeightLogging ? p.volume : p.best_set_reps,
      label: formatDateForDisplay(p.date),
    }))
  }, [historyData, allowWeightLogging])

  // Stats matching web: current / best / progress
  const currentValue = useMemo(() => {
    if (!historyData?.performance_data?.length) return 0
    const latest = historyData.performance_data[historyData.performance_data.length - 1]
    return allowWeightLogging ? latest.volume : latest.best_set_reps
  }, [historyData, allowWeightLogging])

  const bestValue = useMemo(() => {
    if (!historyData?.performance_data?.length) return 0
    if (allowWeightLogging) {
      return Math.max(...historyData.performance_data.map((p: any) => p.volume))
    }
    return historyData.stats?.best_set_reps ?? 0
  }, [historyData, allowWeightLogging])

  const progressPercentage = useMemo(() => {
    if (!historyData?.performance_data?.length) return 0
    const data = historyData.performance_data
    const first = allowWeightLogging ? data[0].volume : data[0].best_set_reps
    const last = allowWeightLogging
      ? data[data.length - 1].volume
      : data[data.length - 1].best_set_reps
    if (first === 0) return 0
    return ((last - first) / first) * 100
  }, [historyData, allowWeightLogging])

  // Recent sessions: last 3, most recent first
  const recentSessions = useMemo(() => {
    if (!historyData?.performance_data) return []
    return [...historyData.performance_data].reverse().slice(0, 3)
  }, [historyData])

  const primaryMuscles = useMemo(
    () => exercise?.muscle_groups?.filter((m: any) => m.is_primary).map((m: any) => m.name) ?? [],
    [exercise]
  )

  const secondaryMuscles = useMemo(
    () => exercise?.muscle_groups?.filter((m: any) => !m.is_primary).map((m: any) => m.name) ?? [],
    [exercise]
  )

  const instructions = exercise?.description || 'No instructions available yet.'

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* Header — ArrowLeft + gradient title */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: `${colors.textMuted}20`,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              padding: 8,
              borderRadius: 999,
              backgroundColor: `${colors.textPrimary}0D`,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <GradientText
            style={{ fontSize: 22, fontWeight: '700', flex: 1 }}
            numberOfLines={1}
          >
            {exercise?.name ?? ''}
          </GradientText>
        </View>

        {/* Tabs — pill style matching web segmentTrack */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 24,
            marginTop: 16,
            marginBottom: 16,
            borderRadius: 999,
            padding: 4,
            backgroundColor: colors.segmentTrack,
          }}
        >
          {(['guidance', 'performance'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 999,
                alignItems: 'center',
                backgroundColor: activeTab === tab ? colors.segmentActive : 'transparent',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  textTransform: 'capitalize',
                  color: activeTab === tab ? colors.textPrimary : colors.textSecondary,
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Video / Image — full-width 16:9, shown on both tabs */}
        <View
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            backgroundColor: colors.bgElevated,
            marginBottom: 24,
          }}
        >
          {exercise?.video ? (
            <ExerciseVideoPlayer uri={exercise.video} />
          ) : exercise?.image ? (
            <Image
              source={{ uri: exercise.image }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>No media available</Text>
            </View>
          )}
        </View>

        {/* Tab-specific content */}
        {activeTab === 'guidance' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16, paddingBottom: 40 }}
            style={{ flex: 1 }}
          >
            {/* Muscles Worked Card */}
            <View
              style={{
                width: SCREEN_WIDTH * 0.85,
                borderRadius: 16,
                padding: 20,
                backgroundColor: colors.bgSurface,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Muscles Worked
              </Text>

              <View style={{ flexDirection: 'row', gap: 24, marginBottom: 16 }}>
                {/* Primary */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.primary,
                      }}
                    />
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Primary</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {primaryMuscles.length > 0 ? (
                      primaryMuscles.map((muscle: string) => (
                        <View
                          key={muscle}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: `${colors.textPrimary}30`,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              color: colors.textPrimary,
                            }}
                          >
                            {muscle}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>—</Text>
                    )}
                  </View>
                </View>

                {/* Secondary */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.textMuted,
                      }}
                    />
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Secondary</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {secondaryMuscles.length > 0 ? (
                      secondaryMuscles.map((muscle: string) => (
                        <View
                          key={muscle}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: `${colors.textPrimary}30`,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              color: colors.textPrimary,
                            }}
                          >
                            {muscle}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>—</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Muscle group image */}
              {exercise?.muscle_group_image && (
                <View style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden' }}>
                  <Image
                    source={{ uri: exercise.muscle_group_image }}
                    style={{ width: '100%', aspectRatio: 4 / 3 }}
                    contentFit="contain"
                  />
                </View>
              )}
            </View>

            {/* Instructions Card */}
            <View
              style={{
                width: SCREEN_WIDTH * 0.85,
                borderRadius: 16,
                padding: 20,
                backgroundColor: colors.bgSurface,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Instructions
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: colors.textSecondary,
                }}
              >
                {instructions}
              </Text>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                borderRadius: 16,
                padding: 24,
                backgroundColor: colors.bgSurface,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Performance History
              </Text>

              {isLoadingHistory ? (
                <>
                  <SkeletonBox height={60} style={{ marginBottom: 16 }} />
                  <SkeletonBox height={180} style={{ marginBottom: 16 }} />
                  <SkeletonBox height={80} />
                </>
              ) : !historyData || historyData.performance_data.length === 0 ? (
                <Text
                  style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingVertical: 32 }}
                >
                  No history available yet.
                </Text>
              ) : (
                <>
                  {/* Stats — 3 col grid matching web */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        padding: 12,
                        alignItems: 'center',
                        backgroundColor: colors.bgElevated,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                        Current
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
                        {allowWeightLogging
                          ? `${currentValue}`
                          : `${historyData.stats?.current_best_set_reps ?? currentValue} reps`}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        padding: 12,
                        alignItems: 'center',
                        backgroundColor: colors.bgElevated,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                        Best
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.success }}>
                        {allowWeightLogging
                          ? `${bestValue}`
                          : `${historyData.stats?.best_set_reps ?? bestValue} reps`}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        padding: 12,
                        alignItems: 'center',
                        backgroundColor: colors.bgElevated,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                        Progress
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                        {formatProgress(progressPercentage)}
                      </Text>
                    </View>
                  </View>

                  {/* Chart */}
                  {chartData.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <LineChart
                        data={chartData}
                        width={SCREEN_WIDTH - 96}
                        height={180}
                        color={colors.primary}
                        thickness={2}
                        dataPointsColor={colors.primary}
                        startFillColor={`${colors.primary}40`}
                        endFillColor={`${colors.primary}00`}
                        areaChart
                        hideRules
                        hideDataPoints={chartData.length > 10}
                        xAxisColor={`${colors.textMuted}40`}
                        yAxisColor={`${colors.textMuted}40`}
                        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                        noOfSections={4}
                        curved
                      />
                    </View>
                  )}

                  {/* Recent Sessions */}
                  {recentSessions.length > 0 && (
                    <View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: colors.textSecondary,
                          marginBottom: 12,
                        }}
                      >
                        Recent Sessions
                      </Text>
                      <View style={{ gap: 8 }}>
                        {recentSessions.map((session: any) => (
                          <View
                            key={`${session.session_id}-${session.date}`}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: 12,
                              borderRadius: 10,
                              backgroundColor: colors.bgElevated,
                            }}
                          >
                            <View>
                              <Text
                                style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}
                              >
                                {formatDateForDisplay(session.date)}
                              </Text>
                              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                {allowWeightLogging
                                  ? `${session.volume} kg volume · ${session.sets} sets`
                                  : `${session.best_set_reps} reps (best set) · ${session.sets} sets`}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                                {allowWeightLogging ? session.volume : session.reps}
                              </Text>
                              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                {allowWeightLogging ? 'volume' : 'total reps'}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        )}

      </SafeAreaView>
    </View>
  )
}
