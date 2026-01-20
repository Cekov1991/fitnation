import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, Calendar, Dumbbell } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useFitnessMetrics } from '../hooks/useApi'
import { useModalTransition } from '../utils/animations'

interface WeeklyProgressModalProps {
  isOpen: boolean
  onClose: () => void
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`
  }
  return volume.toString()
}

function formatVolumeFull(volume: number): string {
  return volume.toLocaleString()
}

function minutesToHours(minutes: number): string {
  const hours = minutes / 60
  return `${hours.toFixed(1)}h`
}

export function WeeklyProgressModal({
  isOpen,
  onClose,
}: WeeklyProgressModalProps) {
  const { data: metrics } = useFitnessMetrics()
  
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
  const modalTransition = useModalTransition()

  const isPositive = trend === 'up'
  const isNeutral = trend === 'same'

  // Transform daily breakdown for chart
  interface ChartDataItem {
    day: string
    volume: number
    workouts: number
  }
  
  const chartData: ChartDataItem[] = dailyBreakdown.map((day: { day_of_week: number; volume: number; workouts: number }) => ({
    day: DAY_NAMES[day.day_of_week] || 'Unknown',
    volume: day.volume,
    workouts: day.workouts,
  }))

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
          {...modalTransition}
            onClick={onClose}
            className="fixed inset-0 bg-black/60  "
            style={{ zIndex: 10000 }}
          />

          {/* Modal */}
          <motion.div
           {...modalTransition}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto"
            style={{ zIndex: 10001 }}
          >
            <div 
              className="rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--color-bg-modal)' }}
            >
              {/* Header */}
              <div 
                className="sticky top-0 border-b p-6 flex items-center justify-between rounded-t-3xl"
                style={{ 
                  backgroundColor: 'var(--color-bg-modal)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <h2 
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
                >
                  Weekly Progress
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Main Progress Card */}
                <div 
                  className="bg-gradient-to-br rounded-2xl p-6 border"
                  style={{ 
                    background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: isPositive 
                          ? 'color-mix(in srgb, #10b981 20%, transparent)' 
                          : isNeutral 
                            ? 'color-mix(in srgb, var(--color-primary) 20%, transparent)' 
                            : 'color-mix(in srgb, #ef4444 20%, transparent)' 
                      }}
                    >
                      <TrendingUp 
                        className="w-8 h-8" 
                        style={{ 
                          color: isPositive 
                            ? '#10b981' 
                            : isNeutral 
                              ? 'var(--color-primary)' 
                              : '#ef4444' 
                        }} 
                      />
                    </div>
                    <div className="text-right">
                      <p className={`text-5xl font-black ${isPositive ? 'text-green-400' : isNeutral ? 'text-blue-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{Math.round(percentage)}%
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>vs Last Week</p>
                    </div>
                  </div>
                  <div 
                    className="inline-block px-4 py-2 border rounded-full"
                    style={{
                      backgroundColor: isPositive 
                        ? 'color-mix(in srgb, #10b981 20%, transparent)' 
                        : isNeutral 
                          ? 'color-mix(in srgb, var(--color-primary) 20%, transparent)' 
                          : 'color-mix(in srgb, #ef4444 20%, transparent)',
                      borderColor: isPositive 
                        ? 'color-mix(in srgb, #10b981 30%, transparent)' 
                        : isNeutral 
                          ? 'color-mix(in srgb, var(--color-primary) 30%, transparent)' 
                          : 'color-mix(in srgb, #ef4444 30%, transparent)'
                    }}
                  >
                    <span 
                      className="text-sm font-bold"
                      style={{
                        color: isPositive 
                          ? '#10b981' 
                          : isNeutral 
                            ? 'var(--color-primary)' 
                            : '#ef4444'
                      }}
                    >
                      {isPositive ? 'IMPROVING' : isNeutral ? 'STEADY' : 'DECLINING'}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    className="rounded-xl p-4 border"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <Calendar className="w-5 h-5 mb-2" style={{ color: 'var(--color-primary)' }} />
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{currentWeekWorkouts}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Workouts</p>
                  </div>
                  <div 
                    className="rounded-xl p-4 border"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <Dumbbell className="w-5 h-5 mb-2" style={{ color: 'var(--color-secondary)' }} />
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatVolume(currentWeekVolume)}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Volume (kg)</p>
                  </div>
                  <div 
                    className="rounded-xl p-4 border"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <TrendingUp className="text-green-400 w-5 h-5 mb-2" />
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{minutesToHours(currentWeekTimeMinutes)}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Total Time</p>
                  </div>
                </div>

                {/* Weekly Volume Chart */}
                {chartData.length > 0 && (
                  <div 
                    className="rounded-xl p-4 border"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      Training Volume
                    </h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis
                            dataKey="day"
                            stroke="#9CA3AF"
                            style={{
                              fontSize: '12px',
                            }}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            style={{
                              fontSize: '12px',
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff',
                            }}
                            formatter={(value: number) => [`${value} kg`, 'Volume']}
                          />
                          <Line
                            type="monotone"
                            dataKey="volume"
                            stroke="var(--color-primary)"
                            strokeWidth={3}
                            dot={{
                              fill: 'var(--color-primary)',
                              r: 5,
                            }}
                            activeDot={{
                              r: 7,
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Daily Breakdown */}
                {chartData.length > 0 && (
                  <div 
                    className="rounded-xl p-4 border"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                      Daily Breakdown
                    </h3>
                    <div className="space-y-2">
                      {chartData.map((day) => (
                        <div
                          key={day.day}
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{
                            backgroundColor: day.workouts > 0 
                              ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' 
                              : 'var(--color-bg-elevated)'
                          }}
                        >
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            {day.day}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              {day.workouts > 0 ? `${formatVolumeFull(day.volume)} kg` : 'Rest'}
                            </span>
                            {day.workouts > 0 && (
                              <div className="w-2 h-2 bg-green-400 rounded-full" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comparison */}
                <div 
                  className="rounded-xl p-4 border"
                  style={{ 
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                >
                  <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Comparison
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>This Week</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {formatVolumeFull(currentWeekVolume)} kg
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Last Week</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>
                        {formatVolumeFull(previousWeekVolume)} kg
                      </span>
                    </div>
                    <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Difference</span>
                      <span className={`text-sm font-bold ${volumeDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {volumeDifference >= 0 ? '+' : ''}{formatVolumeFull(volumeDifference)} kg ({volumeDifferencePercent >= 0 ? '+' : ''}{Math.round(volumeDifferencePercent)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
