import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { RADIUS } from '../../constants/layout'
import { Button } from './Button'

/**
 * "Nothing here yet", in two shapes:
 * - page: fills the screen — a list with no items, a tab with no data.
 * - card: sits in the flow where a list would be ("No exercises in this workout").
 *
 * Screens do not write their own centred grey sentence; `ui-standards.test.ts`
 * fails on a hand-rolled "No … found".
 */
interface EmptyStateAction {
  label: string
  onPress: () => void
}

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: EmptyStateAction
  variant?: 'page' | 'card'
}

export function EmptyState({ title, description, icon: Icon, action, variant = 'page' }: EmptyStateProps) {
  const { colors } = useTheme()

  if (variant === 'card') {
    return (
      <View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
        {Icon && <Icon size={24} color={colors.textMuted} />}
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>
        {!!description && <Text style={[styles.cardDescription, { color: colors.textMuted }]}>{description}</Text>}
        {action && (
          <TouchableOpacity onPress={action.onPress} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.link, { color: colors.primary }]}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={styles.page}>
      {Icon && <Icon size={40} color={colors.textMuted} />}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {!!description && <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>}
      {action && <Button label={action.label} size="sm" onPress={action.onPress} style={styles.action} />}
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 8 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  description: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  action: { alignSelf: 'center', marginTop: 16, minWidth: 160 },

  card: { borderRadius: RADIUS.row, padding: 24, alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  cardDescription: { fontSize: 13, textAlign: 'center' },
  link: { fontSize: 14, fontWeight: '600', marginTop: 4 },
})
