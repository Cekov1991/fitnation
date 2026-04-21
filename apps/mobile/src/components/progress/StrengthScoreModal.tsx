import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { TrendingUp } from 'lucide-react-native'
import { useFitnessMetrics } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { ProgressDetailModal, InfoBlock, Pill } from './ProgressDetailModal'

interface StrengthScoreModalProps {
  visible: boolean
  onClose: () => void
}

interface LevelColors {
  bg: string
  border: string
  text: string
}

function getLevelColors(level: string): LevelColors {
  switch (level) {
    case 'ADVANCED':
      return { bg: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.3)', text: '#4ade80' }
    case 'BEGINNER':
      return { bg: 'rgba(234,179,8,0.2)', border: 'rgba(234,179,8,0.3)', text: '#facc15' }
    case 'INTERMEDIATE':
    default:
      return { bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' }
  }
}

function getMuscleGroupColor(name: string, primary: string, secondary: string): string {
  const n = name.toLowerCase()
  if (n.includes('chest')) return primary
  if (n.includes('back')) return secondary
  if (n.includes('leg') || n.includes('quad') || n.includes('hamstring') || n.includes('glute') || n.includes('calve')) return '#10b981'
  if (n.includes('shoulder') || n.includes('delt')) return '#f97316'
  if (n.includes('arm') || n.includes('bicep') || n.includes('tricep') || n.includes('forearm')) return '#06b6d4'
  return primary
}

export function StrengthScoreModal({ visible, onClose }: StrengthScoreModalProps) {
  const { colors } = useTheme()
  const { data: metrics } = useFitnessMetrics()

  const strengthScore = metrics?.strength_score
  const current = strengthScore?.current ?? 0
  const level = strengthScore?.level ?? 'INTERMEDIATE'
  const recentGain = strengthScore?.recent_gain ?? 0
  const muscleGroups =
    (strengthScore as unknown as { muscle_groups?: Record<string, number> } | undefined)
      ?.muscle_groups ?? {}

  const percentile = (strengthScore as unknown as { percentile?: number } | undefined)?.percentile
  const ranking = (strengthScore as unknown as { ranking?: string } | undefined)?.ranking
  const rankingDisplay = ranking ?? (percentile !== undefined ? `Top ${100 - Math.round(percentile)}%` : null)

  const isPositive = recentGain >= 0
  const levelColors = getLevelColors(level)

  const sortedMuscleGroups = Object.entries(muscleGroups)
    .map(([name, score]) => ({ name, score: score as number }))
    .sort((a, b) => b.score - a.score)
  const maxScore = sortedMuscleGroups[0]?.score ?? 0

  return (
    <ProgressDetailModal visible={visible} onClose={onClose} title="Strength Score Details">
      {/* Main Score Card */}
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
            style={{ backgroundColor: `${colors.primary}33` }}
          >
            <TrendingUp size={32} color={colors.primary} />
          </View>
          <View className="items-end">
            <Text className="text-5xl font-black" style={{ color: colors.textPrimary }}>
              {Math.round(current)}
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Strength Score
            </Text>
          </View>
        </View>
        <Pill label={level} color={levelColors.text} bgColor={levelColors.bg} borderColor={levelColors.border} />
      </LinearGradient>

      {/* Stats Grid */}
      <View className="flex-row gap-3 mb-4">
        <InfoBlock style={{ flex: 1 }}>
          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
            Recent Change
          </Text>
          <Text
            className="text-2xl font-bold"
            style={{ color: isPositive ? '#4ade80' : '#f87171' }}
          >
            {isPositive ? '+' : ''}
            {Math.round(recentGain)}
          </Text>
        </InfoBlock>
        <InfoBlock style={{ flex: 1 }}>
          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
            Ranking
          </Text>
          <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
            {rankingDisplay ?? '--'}
          </Text>
        </InfoBlock>
      </View>

      {/* Description */}
      <InfoBlock style={{ marginBottom: 16 }}>
        <Text className="text-sm font-bold mb-2" style={{ color: colors.textPrimary }}>
          What This Means
        </Text>
        <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
          Your strength score of {Math.round(current)} indicates {level.toLowerCase()} overall
          strength development.
          {recentGain >= 0
            ? ` You've gained ${Math.round(recentGain)} points in the last 30 days.`
            : ` Your score has decreased by ${Math.round(Math.abs(recentGain))} points recently.`}
          {rankingDisplay ? ` You're performing in the ${rankingDisplay.toLowerCase()} of users with similar profiles.` : ''}
          {' '}Keep up the consistent training to maintain and improve this score.
        </Text>
      </InfoBlock>

      {/* Muscle Groups */}
      {sortedMuscleGroups.length > 0 && (
        <InfoBlock>
          <Text className="text-sm font-bold mb-3" style={{ color: colors.textPrimary }}>
            Strength by Muscle Group
          </Text>
          {sortedMuscleGroups.map((group) => {
            const displayName =
              group.name.charAt(0).toUpperCase() + group.name.slice(1).replace(/_/g, ' ')
            const percentage = maxScore > 0 ? (group.score / maxScore) * 100 : 0
            const color = getMuscleGroupColor(group.name, colors.primary, colors.secondary)
            return (
              <View key={group.name} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    {displayName}
                  </Text>
                  <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                    {Math.round(group.score)}
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
                      width: `${Math.min(100, Math.max(0, percentage))}%`,
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
