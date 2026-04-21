import { useState, useMemo, useCallback } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Dumbbell,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native'
import {
  useFitnessMetrics,
  useCalendar,
  formatCalendarDateKey,
  getWeekStartMonday,
  formatWeekRangeLabel,
  addDaysToCalendarDateKey,
} from '@fit-nation/shared'
import type { WorkoutSessionCalendarResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { StrengthScoreModal } from '../../components/progress/StrengthScoreModal'
import { BalanceModal } from '../../components/progress/BalanceModal'
import { WeeklyProgressModal } from '../../components/progress/WeeklyProgressModal'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation/types'

type Nav = NativeStackNavigationProp<AppStackParamList>

type ProgressTab = 'calendar' | 'metrics'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDayHeading(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatDuration(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return ''
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

interface MetricCardItemProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  onPress?: () => void
}

function MetricCardItem({ title, value, subtitle, icon: Icon, onPress }: MetricCardItemProps) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="rounded-2xl p-5 mb-4"
      style={{
        backgroundColor: colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <View className="flex-row items-start justify-between mb-4">
        <View
          className="p-2 rounded-xl"
          style={{ backgroundColor: `${colors.primary}1A` }}
        >
          <Icon size={20} color={colors.primary} />
        </View>
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
      <Text
        className="text-3xl font-bold tracking-tight mb-1"
        style={{ color: colors.textPrimary }}
      >
        {value}
      </Text>
      <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
        {title}
      </Text>
      {subtitle && (
        <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  )
}

export function ProgressScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<Nav>()
  const [progressTab, setProgressTab] = useState<ProgressTab>('calendar')
  const [isStrengthModalOpen, setStrengthModalOpen] = useState(false)
  const [isBalanceModalOpen, setBalanceModalOpen] = useState(false)
  const [isWeeklyModalOpen, setWeeklyModalOpen] = useState(false)

  // Calendar state
  const todayAnchor = useMemo(() => new Date(), [])
  const [weekStartMonday, setWeekStartMonday] = useState<Date>(() => getWeekStartMonday(todayAnchor))
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    formatCalendarDateKey(todayAnchor)
  )
  const todayKey = useMemo(() => formatCalendarDateKey(todayAnchor), [todayAnchor])

  const weekEnd = useMemo(() => {
    const end = new Date(weekStartMonday)
    end.setDate(weekStartMonday.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
  }, [weekStartMonday])

  const isCurrentWeek = useMemo(
    () =>
      formatCalendarDateKey(getWeekStartMonday(todayAnchor)) ===
      formatCalendarDateKey(weekStartMonday),
    [todayAnchor, weekStartMonday]
  )

  const { data: calendar, isLoading: isCalendarLoading } = useCalendar(
    formatCalendarDateKey(weekStartMonday),
    formatCalendarDateKey(weekEnd)
  )

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSessionCalendarResource[]>()
    if (calendar?.sessions) {
      calendar.sessions.forEach((session: WorkoutSessionCalendarResource) => {
        const list = map.get(session.date) ?? []
        list.push(session)
        map.set(session.date, list)
      })
      map.forEach((list) => list.sort((a, b) => b.id - a.id))
    }
    return map
  }, [calendar])

  const weekData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(weekStartMonday)
      date.setDate(weekStartMonday.getDate() + index)
      const dateKey = formatCalendarDateKey(date)
      const sessions = sessionsByDate.get(dateKey) ?? []
      const allCompleted = sessions.length > 0 && sessions.every((s) => s.completed)
      const progress =
        sessions.length > 0
          ? sessions.reduce((acc, s) => acc + (s.completed ? 100 : 50), 0) / sessions.length
          : 0
      return {
        day: WEEKDAY_LABELS[index],
        date: date.getDate(),
        dateKey,
        sessions,
        progress,
        isToday: dateKey === todayKey,
        isCompleted: allCompleted,
      }
    })
  }, [weekStartMonday, sessionsByDate, todayKey])

  const selectedSessions = sessionsByDate.get(selectedDateKey) ?? []

  const handleWeekShift = useCallback(
    (direction: 'prev' | 'next') => {
      const delta = direction === 'prev' ? -7 : 7
      const monday = new Date(weekStartMonday)
      monday.setDate(monday.getDate() + delta)
      setWeekStartMonday(monday)
      setSelectedDateKey(addDaysToCalendarDateKey(selectedDateKey, delta))
    },
    [weekStartMonday, selectedDateKey]
  )

  // Metrics
  const { data: metrics, isLoading: isMetricsLoading } = useFitnessMetrics()

  const strengthScoreValue = metrics?.strength_score
    ? `${metrics.strength_score.current}`
    : '--'
  const strengthScoreSubtitle = metrics?.strength_score
    ? `${metrics.strength_score.level} • +${metrics.strength_score.recent_gain}`
    : undefined

  const balanceValue = metrics?.strength_balance
    ? `${metrics.strength_balance.percentage}%`
    : '--'
  const balanceSubtitle = metrics?.strength_balance
    ? (() => {
        const groups = metrics.strength_balance.muscle_groups ?? {}
        const activeCount = Object.values(groups).filter((v) => (v as number) > 0).length
        const change = metrics.strength_balance.recent_change
        const sign = change >= 0 ? '+' : ''
        return `${metrics.strength_balance.level} • ${sign}${change}% • ${activeCount} active`
      })()
    : undefined

  const weeklyValue = metrics?.weekly_progress
    ? (() => {
        const sign = metrics.weekly_progress.percentage >= 0 ? '+' : ''
        return `${sign}${metrics.weekly_progress.percentage}%`
      })()
    : '--'
  const weeklySubtitle = metrics?.weekly_progress
    ? `${metrics.weekly_progress.current_week_workouts} workouts`
    : undefined

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-8 pb-4">
          <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
            Progress
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Track your fitness journey
          </Text>
        </View>

        {/* Segment Switcher */}
        <View
          className="flex-row rounded-full p-1 mb-6"
          style={{ backgroundColor: colors.segmentTrack }}
        >
          {(['calendar', 'metrics'] as ProgressTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setProgressTab(tab)}
              className="flex-1 rounded-full py-3 items-center"
              style={{
                backgroundColor: progressTab === tab ? colors.segmentActive : 'transparent',
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: progressTab === tab ? colors.textPrimary : colors.textSecondary }}
              >
                {tab === 'calendar' ? 'Calendar' : 'Metrics'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Calendar Tab ── */}
        {progressTab === 'calendar' && (
          <View
            className="rounded-3xl p-5 mb-6"
            style={{ backgroundColor: colors.bgSurface }}
          >
            {/* Week navigation */}
            <View className="flex-row items-center gap-2 mb-6">
              <TouchableOpacity
                onPress={() => handleWeekShift('prev')}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.bgElevated }}
              >
                <ChevronLeft size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text
                className="flex-1 text-center text-base font-semibold"
                style={{ color: colors.textPrimary }}
              >
                {isCurrentWeek ? 'This week' : formatWeekRangeLabel(weekStartMonday)}
              </Text>
              <TouchableOpacity
                onPress={() => handleWeekShift('next')}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.bgElevated }}
              >
                <ChevronRight size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Day Columns */}
            {isCalendarLoading ? (
              <View className="flex-row justify-around">
                {Array.from({ length: 7 }).map((_, i) => (
                  <SkeletonBox key={i} width={36} height={80} />
                ))}
              </View>
            ) : (
              <View className="flex-row justify-around">
                {weekData.map((item, index) => {
                  const isSelected = selectedDateKey === item.dateKey
                  const hasSession = item.sessions.length > 0
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedDateKey(item.dateKey)}
                      className="items-center gap-2"
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
                        {item.day}
                      </Text>
                      <Text
                        className="text-sm font-bold"
                        style={{
                          color: item.isToday ? colors.textPrimary : colors.textSecondary,
                        }}
                      >
                        {item.date}
                      </Text>
                      {/* Progress circle */}
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: isSelected
                            ? `${colors.primary}20`
                            : hasSession
                            ? item.isCompleted
                              ? `${colors.primary}15`
                              : `#fbbf2415`
                            : colors.bgElevated,
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: colors.primary,
                        }}
                      >
                        {item.isCompleted ? (
                          <CheckCircle2 size={18} color={colors.primary} />
                        ) : item.progress > 0 ? (
                          <Clock size={16} color="#fbbf24" />
                        ) : item.isToday ? (
                          <View
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: colors.primary }}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* Selected Day Sessions */}
            <View
              className="mt-6 pt-5"
              style={{ borderTopWidth: 1, borderTopColor: `${colors.bgElevated}` }}
            >
              <Text className="text-sm font-bold mb-3" style={{ color: colors.textPrimary }}>
                {formatDayHeading(selectedDateKey)}
              </Text>
              {selectedSessions.length === 0 ? (
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  No workouts logged on this day.
                </Text>
              ) : (
                selectedSessions.map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    onPress={() =>
                      navigation.navigate('SessionDetail', { sessionId: String(session.id) })
                    }
                    className="flex-row items-center gap-3 rounded-2xl p-4 mb-2"
                    style={{ backgroundColor: colors.bgElevated }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{
                        backgroundColor: session.completed
                          ? `${colors.primary}22`
                          : `#fbbf2422`,
                      }}
                    >
                      {session.completed ? (
                        <CheckCircle2 size={20} color={colors.primary} />
                      ) : (
                        <Clock size={20} color="#fbbf24" />
                      )}
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="font-bold" style={{ color: colors.textPrimary }}>
                        {session.workout_name?.trim() || 'Workout'}
                      </Text>
                      <View className="flex-row items-center gap-3 mt-1">
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          {session.completed ? 'Completed' : 'In progress'}
                        </Text>
                        {formatDuration(session.duration_minutes) && (
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            {formatDuration(session.duration_minutes)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* ── Metrics Tab ── */}
        {progressTab === 'metrics' && (
          <>
            {isMetricsLoading ? (
              <>
                <SkeletonBox height={120} className="mb-4" />
                <SkeletonBox height={120} className="mb-4" />
                <SkeletonBox height={120} className="mb-4" />
              </>
            ) : (
              <>
                <MetricCardItem
                  title="Strength Score"
                  value={strengthScoreValue}
                  subtitle={strengthScoreSubtitle}
                  icon={Dumbbell}
                  onPress={() => setStrengthModalOpen(true)}
                />
                <MetricCardItem
                  title="Balance"
                  value={balanceValue}
                  subtitle={balanceSubtitle}
                  icon={TrendingUp}
                  onPress={() => setBalanceModalOpen(true)}
                />
                <MetricCardItem
                  title="Weekly Progress"
                  value={weeklyValue}
                  subtitle={weeklySubtitle}
                  icon={TrendingDown}
                  onPress={() => setWeeklyModalOpen(true)}
                />
              </>
            )}
          </>
        )}
      </ScrollView>

      <StrengthScoreModal
        visible={isStrengthModalOpen}
        onClose={() => setStrengthModalOpen(false)}
      />
      <BalanceModal
        visible={isBalanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
      />
      <WeeklyProgressModal
        visible={isWeeklyModalOpen}
        onClose={() => setWeeklyModalOpen(false)}
      />
    </SafeAreaView>
  )
}
