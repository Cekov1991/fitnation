import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { RADIUS } from '../../constants/layout'

/**
 * One row of the Profile tab's settings list: a tinted icon tile, the
 * section title, a one-line summary of its current values, and a chevron.
 * Tapping opens that section's edit page. Rows stack inside a padding-0
 * `Card`; every row after the first draws a hairline above itself.
 */
export const PROFILE_SECTION_ROW = {
  tile: 36,
  icon: 18,
  chevron: 18,
  title: 15,
  summary: 12,
  paddingX: 16,
  paddingY: 14,
  gap: 12,
} as const

interface ProfileSectionRowProps {
  icon: LucideIcon
  title: string
  /** Current values, e.g. "30 · 180 cm · 80 kg". Clipped to one line. */
  summary: string
  onPress: () => void
  /** The first row in a card has no divider above it. */
  first?: boolean
}

export function ProfileSectionRow({ icon: Icon, title, summary, onPress, first = false }: ProfileSectionRowProps) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${summary}`}
      style={[styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
    >
      <View style={[styles.tile, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
        <Icon size={PROFILE_SECTION_ROW.icon} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.summary, { color: colors.textSecondary }]}>
          {summary}
        </Text>
      </View>
      <ChevronRight size={PROFILE_SECTION_ROW.chevron} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PROFILE_SECTION_ROW.gap,
    paddingHorizontal: PROFILE_SECTION_ROW.paddingX,
    paddingVertical: PROFILE_SECTION_ROW.paddingY,
  },
  tile: {
    width: PROFILE_SECTION_ROW.tile,
    height: PROFILE_SECTION_ROW.tile,
    borderRadius: RADIUS.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: PROFILE_SECTION_ROW.title, fontWeight: '600' },
  summary: { fontSize: PROFILE_SECTION_ROW.summary, marginTop: 2 },
})
