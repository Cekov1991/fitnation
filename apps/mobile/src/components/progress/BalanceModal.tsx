import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Scale } from 'lucide-react-native'
import { useFitnessMetrics } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { ProgressDetailModal, InfoBlock, Pill } from './ProgressDetailModal'

interface BalanceModalProps {
  visible: boolean
  onClose: () => void
}

interface LevelColors {
  bg: string
  border: string
  text: string
  iconBg: string
  iconText: string
}

function getLevelColors(level: string): LevelColors {
  switch (level) {
    case 'EXCELLENT':
      return {
        bg: 'rgba(34,197,94,0.2)',
        border: 'rgba(34,197,94,0.3)',
        text: '#4ade80',
        iconBg: 'rgba(34,197,94,0.2)',
        iconText: '#4ade80',
      }
    case 'FAIR':
      return {
        bg: 'rgba(234,179,8,0.2)',
        border: 'rgba(234,179,8,0.3)',
        text: '#facc15',
        iconBg: 'rgba(234,179,8,0.2)',
        iconText: '#facc15',
      }
    case 'NEEDS_IMPROVEMENT':
      return {
        bg: 'rgba(239,68,68,0.2)',
        border: 'rgba(239,68,68,0.3)',
        text: '#f87171',
        iconBg: 'rgba(239,68,68,0.2)',
        iconText: '#f87171',
      }
    case 'GOOD':
    default:
      return {
        bg: 'rgba(59,130,246,0.2)',
        border: 'rgba(59,130,246,0.3)',
        text: '#60a5fa',
        iconBg: 'rgba(59,130,246,0.2)',
        iconText: '#60a5fa',
      }
  }
}

function getMuscleGroupColor(name: string, primary: string, secondary: string): string {
  const n = name.toLowerCase()
  if (n.includes('chest')) return primary
  if (n.includes('lats') || n.includes('upper back') || n.includes('lower back')) return secondary
  if (n.includes('quad') || n.includes('hamstring') || n.includes('glute') || n.includes('calve')) return '#10b981'
  if (n.includes('delt') || n.includes('shoulder') || n.includes('trap')) return '#f97316'
  if (n.includes('bicep') || n.includes('tricep') || n.includes('forearm')) return '#06b6d4'
  if (n.includes('abs') || n.includes('oblique') || n.includes('core')) return '#eab308'
  return primary
}

export function BalanceModal({ visible, onClose }: BalanceModalProps) {
  const { colors } = useTheme()
  const { data: metrics } = useFitnessMetrics()

  const balance = metrics?.strength_balance
  const percentage = balance?.percentage ?? 0
  const level = balance?.level ?? 'FAIR'
  const recentChange = balance?.recent_change ?? 0
  const muscleGroups = balance?.muscle_groups ?? {}

  const isPositive = recentChange > 0
  const isNeutral = recentChange === 0
  const levelColors = getLevelColors(level)

  const sortedMuscleGroups = Object.entries(muscleGroups)
    .map(([name, value]) => ({ name, percentage: value as number }))
    .sort((a, b) => b.percentage - a.percentage)

  const activeGroups = sortedMuscleGroups.filter((g) => g.percentage > 0)
  const totalGroups = sortedMuscleGroups.length

  const recentChangeColor = isPositive ? '#4ade80' : isNeutral ? '#60a5fa' : '#f87171'

  return (
    <ProgressDetailModal visible={visible} onClose={onClose} title="Strength Balance Details">
      {/* Main Balance Card */}
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
            style={{ backgroundColor: levelColors.iconBg }}
          >
            <Scale size={32} color={levelColors.iconText} />
          </View>
          <View className="items-end">
            <Text className="text-5xl font-black" style={{ color: colors.textPrimary }}>
              {Math.round(percentage)}%
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Balance Score
            </Text>
          </View>
        </View>
        <Pill label={level.replace(/_/g, ' ')} color={levelColors.text} bgColor={levelColors.bg} borderColor={levelColors.border} />
      </LinearGradient>

      {/* Stats Grid */}
      <View className="flex-row gap-3 mb-4">
        <InfoBlock style={{ flex: 1 }}>
          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
            Recent Change
          </Text>
          <Text className="text-xl font-bold" style={{ color: recentChangeColor }}>
            {isPositive ? '+' : ''}
            {Math.round(recentChange)}%
          </Text>
        </InfoBlock>
        <InfoBlock style={{ flex: 1 }}>
          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
            Active Groups
          </Text>
          <Text className="text-xl font-bold" style={{ color: colors.primary }}>
            {activeGroups.length}/{totalGroups}
          </Text>
        </InfoBlock>
        <InfoBlock style={{ flex: 1 }}>
          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
            Period
          </Text>
          <Text className="text-xl font-bold" style={{ color: colors.primary }}>
            30d
          </Text>
        </InfoBlock>
      </View>

      {/* Description */}
      <InfoBlock style={{ marginBottom: 16 }}>
        <Text className="text-sm font-bold mb-2" style={{ color: colors.textPrimary }}>
          What This Means
        </Text>
        <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
          Your balance score is based on the last 30 days of completed sessions. It rewards both
          training more muscle groups (coverage) and distributing volume evenly across them.
        </Text>
        <Text className="text-sm leading-5 mt-2" style={{ color: colors.textSecondary }}>
          {activeGroups.length === 0 && 'No completed sessions in the last 30 days.'}
          {activeGroups.length > 0 &&
            activeGroups.length < 5 &&
            `You've trained ${activeGroups.length} out of ${totalGroups} groups. Adding more variety will boost your score.`}
          {activeGroups.length >= 5 && isPositive && "You're improving your balance — keep it up!"}
          {activeGroups.length >= 5 && isNeutral && 'Your balance has remained steady.'}
          {activeGroups.length >= 5 &&
            !isPositive &&
            !isNeutral &&
            'Try spreading volume more evenly across muscle groups to improve your score.'}
        </Text>
      </InfoBlock>

      {/* Muscle Group Distribution */}
      {sortedMuscleGroups.length > 0 && (
        <InfoBlock>
          <Text className="text-sm font-bold mb-3" style={{ color: colors.textPrimary }}>
            Muscle Group Distribution
          </Text>
          {sortedMuscleGroups.map((group) => {
            const displayName =
              group.name.charAt(0).toUpperCase() + group.name.slice(1).replace(/_/g, ' ')
            const color = getMuscleGroupColor(group.name, colors.primary, colors.secondary)
            return (
              <View key={group.name} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    {displayName}
                  </Text>
                  <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                    {Math.round(group.percentage)}%
                  </Text>
                </View>
                <View
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.bgSurface }}
                >
                  <LinearGradient
                    colors={[color, `${color}cc`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, group.percentage))}%`,
                    }}
                  />
                </View>
              </View>
            )
          })}
        </InfoBlock>
      )}
    </ProgressDetailModal>
  )
}
