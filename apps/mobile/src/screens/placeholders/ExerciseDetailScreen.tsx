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

// Format ISO date (YYYY-MM-DD) → "Jan 15"
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}`
}

// Isolated player sub-component — only mounts when a real URL exists,
// so useVideoPlayer receives a valid source at mount (its setup callback
// runs exactly once, never with null/undefined).
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
      if (error) {
        console.warn('[ExerciseVideoPlayer] status', status, 'error:', error, 'uri:', uri)
      }
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

export function ExerciseDetailScreen({ route, navigation }: AppScreenProps<'ExerciseDetail'>) {
  const { exerciseName } = route.params
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState<'guidance' | 'performance'>('guidance')

  const { data: exercises = [] } = useExercises()
  const exercise = useMemo(
    () => exercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase()),
    [exercises, exerciseName]
  )

  const allowWeightLogging = exercise?.equipment_type?.code !== 'BODYWEIGHT'

  const { data: historyData, isLoading: isLoadingHistory } = useExerciseHistory(
    exercise?.id ?? 0,
    undefined,
    { enabled: activeTab === 'performance' && !!exercise?.id }
  )

  const primaryMuscles = useMemo(
    () => exercise?.muscle_groups?.filter(m => m.is_primary).map(m => m.name) ?? [],
    [exercise]
  )

  const secondaryMuscles = useMemo(
    () => exercise?.muscle_groups?.filter(m => !m.is_primary).map(m => m.name) ?? [],
    [exercise]
  )

  const chartData = useMemo(() => {
    if (!historyData?.performance_data) return []
    return historyData.performance_data.map(point => ({
      value: allowWeightLogging ? point.volume : point.best_set_reps,
      label: point.date.slice(5), // MM-DD
    }))
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

  const recentSessions = useMemo(() => {
    if (!historyData?.performance_data) return []
    return [...historyData.performance_data].reverse().slice(0, 3)
  }, [historyData])

  const currentStat = useMemo(() => {
    if (!historyData?.performance_data?.length) return '—'
    const latest = historyData.performance_data[historyData.performance_data.length - 1]
    return allowWeightLogging
      ? `${latest.volume}`
      : `${historyData.stats.current_best_set_reps} reps`
  }, [historyData, allowWeightLogging])

  const bestStat = useMemo(() => {
    if (!historyData?.performance_data?.length) return '—'
    return allowWeightLogging
      ? `${Math.max(...historyData.performance_data.map(p => p.volume))}`
      : `${historyData.stats.best_set_reps} reps`
  }, [historyData, allowWeightLogging])

  const progressSign = progressPercentage >= 0 ? '+' : ''
  const progressStat = `${progressSign}${progressPercentage.toFixed(0)}%`

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row items-center gap-4 px-6 py-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: colors.bgSurface }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <GradientText
            className="flex-1 text-2xl font-bold"
            style={{ fontSize: 22, fontWeight: 'bold' }}
            numberOfLines={1}
          >
            {exercise?.name || exerciseName}
          </GradientText>
        </View>

        {/* Tab Pill Switcher — comes before video, matching web layout */}
        <View className="px-6 mb-4">
          <View
            className="flex-row p-1 rounded-full"
            style={{ backgroundColor: colors.segmentTrack }}
          >
            {(['guidance', 'performance'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="flex-1 py-3 rounded-full items-center"
                style={{
                  backgroundColor:
                    activeTab === tab ? colors.segmentActive : 'transparent',
                }}
                activeOpacity={0.7}
              >
                <Text
                  className="text-sm font-medium capitalize"
                  style={{
                    color: activeTab === tab ? colors.textPrimary : colors.textSecondary,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Video / Image — full width, 16:9 */}
        <View
          style={{
            width: SCREEN_WIDTH,
            aspectRatio: 16 / 9,
            backgroundColor: colors.bgElevated,
            marginBottom: 16,
          }}
        >
          {exercise?.video ? (
            <ExerciseVideoPlayer key={exercise.video} uri={exercise.video} />
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

        {/* ── Guidance Tab ── */}
        {activeTab === 'guidance' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}
          >
            {/* Muscles Worked Card */}
            <View
              className="rounded-2xl p-5"
              style={{
                width: SCREEN_WIDTH * 0.85,
                backgroundColor: colors.bgSurface,
              }}
            >
              <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
                Muscles Worked
              </Text>

              <View className="flex-row gap-6">
                {/* Primary */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      Primary
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {primaryMuscles.length > 0 ? (
                      primaryMuscles.map(m => (
                        <View
                          key={m}
                          className="px-3 py-1.5 rounded-full border"
                          style={{ borderColor: colors.primary }}
                        >
                          <Text
                            className="text-xs font-semibold uppercase"
                            style={{ color: colors.textPrimary }}
                          >
                            {m}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={{ color: colors.textMuted }}>—</Text>
                    )}
                  </View>
                </View>

                {/* Secondary */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors.bgElevated }}
                    />
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      Secondary
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {secondaryMuscles.length > 0 ? (
                      secondaryMuscles.map(m => (
                        <View
                          key={m}
                          className="px-3 py-1.5 rounded-full border"
                          style={{ borderColor: colors.bgElevated }}
                        >
                          <Text
                            className="text-xs font-semibold uppercase"
                            style={{ color: colors.textSecondary }}
                          >
                            {m}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={{ color: colors.textMuted }}>—</Text>
                    )}
                  </View>
                </View>
              </View>

              {exercise?.muscle_group_image && (
                <Image
                  source={{ uri: exercise.muscle_group_image }}
                  style={{ width: '100%', height: 200, marginTop: 16, borderRadius: 12 }}
                  contentFit="contain"
                />
              )}
            </View>

            {/* Instructions Card */}
            <View
              className="rounded-2xl p-5"
              style={{
                width: SCREEN_WIDTH * 0.85,
                backgroundColor: colors.bgSurface,
              }}
            >
              <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
                Instructions
              </Text>
              <Text
                className="text-sm leading-6"
                style={{ color: colors.textSecondary }}
              >
                {exercise?.description || 'No instructions available yet.'}
              </Text>
            </View>
          </ScrollView>
        )}

        {/* ── Performance Tab ── */}
        {activeTab === 'performance' && (
          <View className="px-4">
            <View
              className="rounded-2xl p-5"
              style={{ backgroundColor: colors.bgSurface }}
            >
              <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
                Performance History
              </Text>

              {isLoadingHistory ? (
                <SkeletonBox height={160} />
              ) : !historyData?.performance_data?.length ? (
                <Text
                  className="text-center py-8 text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  No history available yet.
                </Text>
              ) : (
                <>
                  {/* Stats grid */}
                  <View className="flex-row gap-3 mb-6">
                    {[
                      { label: 'Current', value: currentStat, valueColor: colors.textPrimary },
                      { label: 'Best', value: bestStat, valueColor: colors.success },
                      { label: 'Progress', value: progressStat, valueColor: colors.primary },
                    ].map(stat => (
                      <View
                        key={stat.label}
                        className="flex-1 rounded-xl p-3 items-center"
                        style={{ backgroundColor: colors.bgElevated }}
                      >
                        <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                          {stat.label}
                        </Text>
                        <Text
                          className="text-lg font-bold"
                          style={{ color: stat.valueColor }}
                        >
                          {stat.value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Chart */}
                  {chartData.length > 1 && (
                    <View className="mb-4">
                      <LineChart
                        data={chartData}
                        width={SCREEN_WIDTH - 96}
                        height={160}
                        color={colors.primary}
                        thickness={2}
                        dataPointsColor={colors.primary}
                        startFillColor={`${colors.primary}40`}
                        endFillColor="transparent"
                        areaChart
                        hideRules
                        xAxisColor={colors.bgElevated}
                        yAxisColor={colors.bgElevated}
                        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                        curved
                      />
                    </View>
                  )}

                  {/* Recent Sessions */}
                  {recentSessions.length > 0 && (
                    <>
                      <Text
                        className="text-sm font-semibold mb-2"
                        style={{ color: colors.textSecondary }}
                      >
                        Recent Sessions
                      </Text>
                      {recentSessions.map(session => (
                        <View
                          key={`${session.session_id}-${session.date}`}
                          className="flex-row items-center justify-between p-3 rounded-xl mb-2"
                          style={{ backgroundColor: colors.bgElevated }}
                        >
                          <View>
                            <Text
                              className="text-sm font-medium"
                              style={{ color: colors.textPrimary }}
                            >
                              {formatDate(session.date)}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                              {allowWeightLogging
                                ? `${session.volume} kg volume · ${session.sets} sets`
                                : `${session.best_set_reps} reps (best set) · ${session.sets} sets`}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text
                              className="text-sm font-bold"
                              style={{ color: colors.primary }}
                            >
                              {allowWeightLogging ? session.volume : session.reps}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                              {allowWeightLogging ? 'volume' : 'total reps'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
