import type { LucideIcon } from 'lucide-react-native'
import { Text, TouchableOpacity } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'

interface SwipeActionProps {
  icon: LucideIcon
  label: string
  onPress: () => void
  /**
   * Only the destructive tone carries colour. Utility actions stay neutral so
   * a partner's primary and secondary never end up as three loud blocks behind
   * a row — brand colour is for real calls to action, not for swipe actions.
   */
  tone?: 'neutral' | 'destructive'
  style?: StyleProp<ViewStyle>
}

/** One button revealed by swiping a row: an icon over a short label. */
export function SwipeAction({ icon: Icon, label, onPress, tone = 'neutral', style }: SwipeActionProps) {
  const { colors } = useTheme()
  const destructive = tone === 'destructive'
  const color = destructive ? colors.error : colors.textSecondary
  const backgroundColor = destructive
    ? withAlpha(colors.error, 0.12)
    : withAlpha(colors.textPrimary, 0.06)

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.7}
      style={[
        { width: 64, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 16, backgroundColor },
        style,
      ]}
    >
      <Icon size={20} color={color} />
      <Text style={{ fontSize: 11, fontWeight: '600', color }}>{label}</Text>
    </TouchableOpacity>
  )
}
