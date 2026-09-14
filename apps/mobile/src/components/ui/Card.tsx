import { StyleSheet, View, type ViewProps } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { RADIUS } from '../../constants/layout'

/**
 * A surface block.
 * - default  radius 16, padding 20, 16 below — a block in a stack of blocks.
 * - summary  radius 24, padding 20, hairline border — the headline card of a
 *            screen (session totals, an auth form), or a notes card.
 *
 * Screens do not spell out `borderRadius: 24` themselves.
 */
interface CardProps extends ViewProps {
  variant?: 'default' | 'summary'
}

export function Card({ children, style, variant = 'default', ...props }: CardProps) {
  const { colors } = useTheme()
  return (
    <View
      style={[
        variant === 'summary' ? styles.summary : styles.card,
        { backgroundColor: colors.bgSurface },
        variant === 'summary' && { borderColor: colors.border },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.row, padding: 20, marginBottom: 16 },
  summary: { borderRadius: RADIUS.card, padding: 20, borderWidth: StyleSheet.hairlineWidth },
})
