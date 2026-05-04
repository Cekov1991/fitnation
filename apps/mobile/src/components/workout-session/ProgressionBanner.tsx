import { View, Text } from 'react-native'
import { AlertTriangle, Info, Sparkles, Target } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface ProgressionBannerProps {
  status: 'no_history' | 'below_min' | 'working' | 'ready'
  maxTargetReps: number
  progressionMode: 'double_progression' | 'total_reps'
  totalRepsPrevious?: number | null
  totalRepsTarget?: number | null
}

const WEIGHTED_COPY = {
  no_history: "First time logging this exercise! We've estimated a starting weight for you.",
  below_min: 'Last session was tough — consider lowering your weight to hit your target reps.',
  ready: (reps: number) => `Weight increase! You hit ${reps} reps last time.`,
}

const BODYWEIGHT_COPY = {
  no_history: "First time logging this exercise! Give it your best effort.",
  below_min: 'Last session was tough — keep pushing toward your rep target.',
  ready: (reps: number) => `Great work! You hit ${reps} reps last time — try to beat it.`,
}

export function ProgressionBanner({
  status,
  maxTargetReps,
  progressionMode,
  totalRepsPrevious,
  totalRepsTarget,
}: ProgressionBannerProps) {
  const { colors } = useTheme()

  if (status === 'working' && progressionMode === 'double_progression') return null

  const statusMeta = {
    no_history: { color: colors.primary, Icon: Info },
    below_min: { color: colors.warning, Icon: AlertTriangle },
    working: { color: colors.primary, Icon: Target },
    ready: { color: colors.success, Icon: Sparkles },
  }

  if (status === 'working' && progressionMode === 'total_reps') {
    if (totalRepsTarget == null) return null
    const text =
      totalRepsPrevious != null
        ? `Nice work hitting ${totalRepsPrevious} total reps! Go for ${totalRepsTarget} this time.`
        : `Go for ${totalRepsTarget} total reps this session.`
    const { color, Icon } = statusMeta.working
    return (
      <View
        className="flex-row items-center gap-3 rounded-xl border px-4 py-3 mx-6 mb-4"
        style={{
          backgroundColor: `${color}10`,
          borderColor: `${color}20`,
        }}
      >
        <Icon size={16} color={color} />
        <Text className="flex-1 text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
          {text}
        </Text>
      </View>
    )
  }

  const { color, Icon } = statusMeta[status]
  const copy = progressionMode === 'double_progression' ? WEIGHTED_COPY : BODYWEIGHT_COPY
  const text =
    status === 'ready'
      ? copy.ready(maxTargetReps)
      : copy[status as 'no_history' | 'below_min']

  return (
    <View
      className="flex-row items-center gap-3 rounded-xl border px-4 py-3 mx-6 mb-4"
      style={{
        backgroundColor: `${color}10`,
        borderColor: `${color}20`,
      }}
    >
      <Icon size={16} color={color} />
      <Text className="flex-1 text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
        {text}
      </Text>
    </View>
  )
}
