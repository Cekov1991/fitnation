import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Scale } from 'lucide-react-native'
import { useFitnessMetrics, withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import type { AppColors } from '../../constants/theme'
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

/** Status tint for a balance level: excellent → success, fair → warning, needs improvement → error, good → info. */
function getLevelColors(level: string, colors: AppColors): LevelColors {
  const tone =
    level === 'EXCELLENT'
      ? colors.success
      : level === 'FAIR'
        ? colors.warning
        : level === 'NEEDS_IMPROVEMENT'
          ? colors.error
          : colors.info
  return {
    bg: withAlpha(tone, 0.2),
    border: withAlpha(tone, 0.3),
    text: tone,
    iconBg: withAlpha(tone, 0.2),
    iconText: tone,
  }
}

function getMuscleGroupColor(name: string, colors: AppColors): string {
  const n = name.toLowerCase()
  if (n.includes('chest')) return colors.primary
  if (n.includes('lats') || n.includes('upper back') || n.includes('lower back')) return colors.secondary
  if (n.includes('quad') || n.includes('hamstring') || n.includes('glute') || n.includes('calve')) return colors.success
  if (n.includes('delt') || n.includes('shoulder') || n.includes('trap')) return colors.secondary
  if (n.includes('bicep') || n.includes('tricep') || n.includes('forearm')) return colors.primary
  if (n.includes('abs') || n.includes('oblique') || n.includes('core')) return colors.warning
  return colors.primary
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
  const levelColors = getLevelColors(level, colors)

  const sortedMuscleGroups = Object.entries(muscleGroups)
    .map(([name, value]) => ({ name, percentage: value as number }))
    .sort((a, b) => b.percentage - a.percentage)

  const activeGroups = sortedMuscleGroups.filter((g) => g.percentage > 0)
  const totalGroups = sortedMuscleGroups.length

  const recentChangeColor = isPositive ? colors.success : isNeutral ? colors.info : colors.error

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
            const color = getMuscleGroupColor(group.name, colors)
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
