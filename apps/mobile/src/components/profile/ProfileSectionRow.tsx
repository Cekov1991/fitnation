import type { ReactNode } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { RADIUS } from '../../constants/layout'

/**
 * One row of a settings list (the Profile tab, the Account page): a tinted
 * icon tile, the title, an optional summary — the section's current values,
 * or a sentence on what the row does — and a chevron, or in its place a
 * control such as a Switch. `tone="danger"` paints the tile and the title in
 * the error colour for the one row that deletes the account. Rows stack
 * inside a padding-0 `Card`; every row after the first draws a hairline
 * above itself.
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
  /** Current values, e.g. "30 · 180 cm · 80 kg", or a sentence on what the row does. */
  summary?: string
  /** Lines the summary may take before it is clipped. Values fit in 1; a sentence needs 2. */
  summaryLines?: number
  onPress: () => void
  /** The first row in a card has no divider above it. */
  first?: boolean
  /** `danger`: tile and title in the error colour — the row that deletes the account. */
  tone?: 'default' | 'danger'
  /** A control in place of the chevron (a Switch). The row's onPress should do what the control does. */
  right?: ReactNode
  /** Trailing chevron. Off by default when `right` is given; pass false for a row that acts in place (Log out). */
  chevron?: boolean
}

export function ProfileSectionRow({
  icon: Icon,
  title,
  summary,
  summaryLines = 1,
  onPress,
  first = false,
  tone = 'default',
  right,
  chevron = right === undefined,
}: ProfileSectionRowProps) {
  const { colors } = useTheme()
  const accent = tone === 'danger' ? colors.error : colors.primary
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={summary ? `${title}, ${summary}` : title}
      style={[styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
    >
      <View style={[styles.tile, { backgroundColor: withAlpha(accent, 0.1) }]}>
        <Icon size={PROFILE_SECTION_ROW.icon} color={accent} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: tone === 'danger' ? colors.error : colors.textPrimary }]}>{title}</Text>
        {!!summary && (
          <Text numberOfLines={summaryLines} style={[styles.summary, { color: colors.textSecondary }]}>
            {summary}
          </Text>
        )}
      </View>
      {right}
      {chevron && <ChevronRight size={PROFILE_SECTION_ROW.chevron} color={colors.textMuted} />}
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
