import { StyleSheet, Text } from 'react-native'
import type { StyleProp, TextStyle } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

/**
 * The small-caps caption above a group of content ("EXERCISES", "NOTES",
 * "WORKOUT PLAN") and under a figure in a stats row. One spelling for what
 * used to be seven. Bigger headings with an action belong to <SectionHeader>.
 */
export const SECTION_LABEL = { fontSize: 12, letterSpacing: 1, marginBottom: 12 } as const

interface SectionLabelProps {
  children: string
  /** `muted` for captions inside a card; default sits on the page background. */
  tone?: 'default' | 'muted'
  /** A status or brand colour for a caption that carries meaning (a status chip, a plan name on a brand card). Overrides `tone`. */
  color?: string
  numberOfLines?: number
  /** Margins only — never a size. */
  style?: StyleProp<TextStyle>
}

export function SectionLabel({ children, tone = 'default', color, numberOfLines, style }: SectionLabelProps) {
  const { colors } = useTheme()
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles.label, { color: color ?? (tone === 'muted' ? colors.textMuted : colors.textSecondary) }, style]}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: SECTION_LABEL.fontSize,
    fontWeight: '700',
    letterSpacing: SECTION_LABEL.letterSpacing,
    textTransform: 'uppercase',
    marginBottom: SECTION_LABEL.marginBottom,
  },
})
