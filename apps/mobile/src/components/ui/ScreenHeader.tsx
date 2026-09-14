import type { ReactNode } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ArrowLeft } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { RADIUS, SCREEN } from '../../constants/layout'

/**
 * The header of a stacked screen: round back button, 24/700 title, optional
 * subtitle and trailing slot. Tab-root screens use <PageTitle> instead.
 *
 * Renders inside the screen's padded content, so it carries no horizontal
 * padding of its own. `ui-standards.test.ts` fails on an ArrowLeft outside
 * this file.
 */
export const HEADER = {
  title: 24,
  backIcon: 22,
  gap: 16,
} as const

export interface ScreenHeaderProps {
  title: string
  subtitle?: string
  /** Omit for a screen with no back navigation. */
  onBack?: () => void
  /** Trailing slot: an edit button, a menu. */
  right?: ReactNode
  /** Header centred title lines; long workout names get two. */
  titleLines?: number
}

export function ScreenHeader({ title, subtitle, onBack, right, titleLines = 2 }: ScreenHeaderProps) {
  const { colors } = useTheme()
  return (
    <View style={styles.row}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={[styles.back, { backgroundColor: colors.bgElevated }]}
        >
          <ArrowLeft size={HEADER.backIcon} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
      <View style={styles.text}>
        <Text numberOfLines={titleLines} style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        {!!subtitle && (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  )
}

/**
 * The title block of a tab-root screen (Plans, Progress, Profile, the
 * catalog): brand-coloured 30/700 with an optional one-line subtitle.
 */
export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { colors } = useTheme()
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[styles.pageTitle, { color: colors.primary }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER.gap,
    paddingTop: SCREEN.paddingTop,
    paddingBottom: SCREEN.paddingTop,
  },
  back: { padding: 8, borderRadius: RADIUS.pill },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: HEADER.title, fontWeight: '700' },
  pageTitle: { fontSize: 30, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 2 },
})
