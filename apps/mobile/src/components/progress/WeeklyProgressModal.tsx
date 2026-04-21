import { View, Text, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { LineChart } from 'react-native-gifted-charts'
import { TrendingUp, Calendar, Dumbbell } from 'lucide-react-native'
import { useFitnessMetrics, useProfile } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { ProgressDetailModal, InfoBlock, Pill } from './ProgressDetailModal'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface WeeklyProgressModalProps {
  visible: boolean
  onClose: () => void
}

function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`
  return volume.toString()
}

function formatVolumeFull(volume: number): string {
  return volume.toLocaleString()
}

function minutesToHours(minutes: number): string {
  const hours = minutes / 60
  return `${hours.toFixed(1)}h`
}

function formatIsoWeekLabel(week: string): string {
  const match = week.match(/W(\d+)/i)
  return match ? `W${match[1]}` : week
}

function getWeeklyGoalMessage(
  currentWeekWorkouts: number,
  trainingDaysGoal: number | null
): string | null {
  if (trainingDaysGoal == null || trainingDaysGoal <= 0) return null
  if (currentWeekWorkouts > trainingDaysGoal) {
    return `You exceeded your ${trainingDaysGoal}-day goal — great week!`
  }
  if (currentWeekWorkouts === trainingDaysGoal) {
    return `You hit your ${trainingDaysGoal}-day goal this week`
  }
  return `${currentWeekWorkouts} of ${trainingDaysGoal} day${trainingDaysGoal !== 1 ? 's' : ''} done — finish strong!`
}

export function WeeklyProgressModal({ visible, onClose }: WeeklyProgressModalProps) {
  const { colors } = useTheme()
  const { data: metrics } = useFitnessMetrics()
  const { data: profileUser } = useProfile()

  const weeklyProgress = metrics?.weekly_progress
  const percentage = weeklyProgress?.percentage ?? 0
  const trend = weeklyProgress?.trend ?? 'same'
  const currentWeekWorkouts = weeklyProgress?.current_week_workouts ?? 0
  const currentWeekVolume = weeklyProgress?.current_week_volume ?? 0
  const currentWeekTimeMinutes = weeklyProgress?.current_week_time_minutes ?? 0
  const previousWeekVolume = weeklyProgress?.previous_week_volume ?? 0
  const volumeDifference = weeklyProgress?.volume_difference ?? 0
  const volumeDifferencePercent = weeklyProgress?.volume_difference_percent ?? 0
  const dailyBreakdown = weeklyProgress?.daily_breakdown ?? []
  const historicalWeeks = weeklyProgress?.historical_weeks ?? []
  const trainingDaysGoal = profileUser?.profile?.training_days_per_week ?? null
  const weeklyGoalMessage = getWeeklyGoalMessage(currentWeekWorkouts, trainingDaysGoal)

  const isPositive = trend === 'up'
  const isNeutral = trend === 'same'

  const trendColor = isPositive ? '#4ade80' : isNeutral ? colors.primary : '#f87171'
  const trendBg = isPositive
    ? 'rgba(16,185,129,0.2)'
    : isNeutral
      ? `${colors.primary}33`
      : 'rgba(239,68,68,0.2)'
  const trendBorder = isPositive
    ? 'rgba(16,185,129,0.3)'
    : isNeutral
      ? `${colors.primary}4D`
      : 'rgba(239,68,68,0.3)'
  const trendLabel = isPositive ? 'IMPROVING' : isNeutral ? 'STEADY' : 'DECLINING'

  const chartData = dailyBreakdown.map((day: { day_of_week: number; volume: number; workouts: number }) => ({
    value: day.volume,
    label: DAY_NAMES[day.day_of_week] ?? '',
    workouts: day.workouts,
  }))

  const maxHistoricalWorkouts =
    historicalWeeks.reduce((m: number, w: { workouts: number }) => Math.max(m, w.workouts), 0) || 1
  // ScreenWidth minus modal padding (40) minus InfoBlock padding (32) minus small safety
  const chartWidth = SCREEN_WIDTH - 96

  return (
    <ProgressDetailModal visible={visible} onClose={onClose} title="Weekly Progress">
      {/* Main Progress Card */}
      <LinearGradient
        colors={[colors.bgElevated, colors.bgSurface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: trendBg }}
          >
            <TrendingUp size={32} color={trendColor} />
          </View>
          <View className="items-end">
            <Text className="text-5xl font-black" style={{ color: trendColor }}>
              {isPositive ? '+' : ''}
              {Math.round(percentage)}%
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              vs Last Week
            </Text>
          </View>
        </View>
        <Pill label={trendLabel} color={trendColor} bgColor={trendBg} borderColor={trendBorder} />
      </LinearGradient>

      {/* Stats Grid */}
      <View className="flex-row gap-3 mb-4">
        <InfoBlock style={{ flex: 1 }}>
          <Calendar size={18} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            {currentWeekWorkouts}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            Workouts
          </Text>
        </InfoBlock>
        <InfoBlock style={{ flex: 1 }}>
          <Dumbbell size={18} color={colors.secondary} style={{ marginBottom: 8 }} />
          <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            {formatVolume(currentWeekVolume)}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            Volume (kg)
          </Text>
        </InfoBlock>
        <InfoBlock style={{ flex: 1 }}>
          <TrendingUp size={18} color="#4ade80" style={{ marginBottom: 8 }} />
          <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            {minutesToHours(currentWeekTimeMinutes)}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            Total Time
          </Text>
        </InfoBlock>
      </View>

      {weeklyGoalMessage && (
        <View
          className="rounded-xl px-4 py-3 items-center mb-4"
          style={{
            backgroundColor: `${colors.primary}1A`,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text className="text-sm font-semibold text-center" style={{ color: colors.textPrimary }}>
            {weeklyGoalMessage}
          </Text>
        </View>
      )}

      {/* Training Volume Chart */}
      {chartData.length > 0 && (
        <InfoBlock style={{ marginBottom: 16 }}>
          <Text className="text-sm font-bold mb-4" style={{ color: colors.textPrimary }}>
            Training Volume
          </Text>
          <View style={{ alignItems: 'center' }}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={150}
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
              initialSpacing={12}
            />
          </View>
        </InfoBlock>
      )}

      {/* 8-week history */}
      {historicalWeeks.length > 0 && (
        <InfoBlock style={{ marginBottom: 16 }}>
          <Text className="text-sm font-bold mb-4" style={{ color: colors.textPrimary }}>
            Workouts per week (last {historicalWeeks.length})
          </Text>
          <View className="flex-row justify-between items-end" style={{ height: 120 }}>
            {historicalWeeks.map((week: { week: string; workouts: number }, i: number) => {
              const heightPercent = Math.max((week.workouts / maxHistoricalWorkouts) * 100, 4)
              return (
                <View key={i} className="items-center gap-2 flex-1">
                  <Text
                    className="text-[10px] font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {week.workouts > 0 ? week.workouts : ''}
                  </Text>
                  <View
                    className="w-full rounded-t-md"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: week.workouts > 0 ? colors.primary : colors.bgSurface,
                      maxWidth: 22,
                      alignSelf: 'center',
                    }}
                  />
                  <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                    {formatIsoWeekLabel(week.week)}
                  </Text>
                </View>
              )
            })}
          </View>
        </InfoBlock>
      )}

      {/* Daily Breakdown */}
      {chartData.length > 0 && (
        <InfoBlock style={{ marginBottom: 16 }}>
          <Text className="text-sm font-bold mb-3" style={{ color: colors.textPrimary }}>
            Daily Breakdown
          </Text>
          <View className="gap-2">
            {chartData.map((day: { value: number; label: string; workouts: number }) => (
              <View
                key={day.label}
                className="flex-row items-center justify-between px-3 py-3 rounded-lg"
                style={{
                  backgroundColor: day.workouts > 0 ? `${colors.primary}1A` : colors.bgSurface,
                }}
              >
                <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                  {day.label}
                </Text>
                <View className="flex-row items-center gap-3">
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    {day.workouts > 0 ? `${formatVolumeFull(day.value)} kg` : 'Rest'}
                  </Text>
                  {day.workouts > 0 && (
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                  )}
                </View>
              </View>
            ))}
          </View>
        </InfoBlock>
      )}

      {/* Comparison */}
      <InfoBlock>
        <Text className="text-sm font-bold mb-3" style={{ color: colors.textPrimary }}>
          Comparison
        </Text>
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              This Week
            </Text>
            <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>
              {formatVolumeFull(currentWeekVolume)} kg
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Last Week
            </Text>
            <Text className="text-sm font-bold" style={{ color: colors.textMuted }}>
              {formatVolumeFull(previousWeekVolume)} kg
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View className="flex-row items-center justify-between">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Difference
            </Text>
            <Text
              className="text-sm font-bold"
              style={{ color: volumeDifference >= 0 ? '#4ade80' : '#f87171' }}
            >
              {volumeDifference >= 0 ? '+' : ''}
              {formatVolumeFull(volumeDifference)} kg ({volumeDifferencePercent >= 0 ? '+' : ''}
              {Math.round(volumeDifferencePercent)}%)
            </Text>
          </View>
        </View>
      </InfoBlock>
    </ProgressDetailModal>
  )
}
