import { StyleSheet, Text, View } from 'react-native'
import { Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { formatWeight, withAlpha } from '@fit-nation/shared'
import type { WeightUnit } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { RADIUS } from '../../constants/layout'
import type { ProgressionCopy, ProgressionKind } from './progressionCopy'

/**
 * Above the first set: where today's targets came from — a new exercise, a
 * tough last session, a session that earned more weight — and, after a tough
 * one, the choice between one step down and the current weight. The words are
 * progressionCopy(); this only draws them.
 */
export const PROGRESSION_BANNER = { tile: 36, icon: 18, title: 15, body: 13 } as const

const ICONS: Record<ProgressionKind, LucideIcon> = {
  new: Sparkles,
  tough: TrendingDown,
  heavier: TrendingUp,
  total: Target,
}

interface ProgressionBannerProps {
  copy: ProgressionCopy
  weightUnit: WeightUnit
  /** "Use 60 kg": put the lighter weight into the Weight field. */
  onUseWeight?: (weight: number) => void
  /** "Keep 62.5": stay with today's suggestion and dismiss the banner. */
  onKeep?: () => void
}

export function ProgressionBanner({ copy, weightUnit, onUseWeight, onKeep }: ProgressionBannerProps) {
  const { colors } = useTheme()
  const tone = { info: colors.primary, warning: colors.warning, success: colors.success }[copy.tone]
  const Icon = ICONS[copy.kind]

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.tile, { backgroundColor: withAlpha(tone, 0.12) }]}>
          <Icon size={PROGRESSION_BANNER.icon} color={tone} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{copy.title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{copy.body}</Text>
        </View>
      </View>

      {copy.offer && onUseWeight && onKeep && (
        <View style={styles.actions}>
          <Button
            size="sm"
            label={`Use ${formatWeight(copy.offer.use)} ${weightUnit}`}
            onPress={() => onUseWeight(copy.offer!.use)}
            style={styles.action}
          />
          <Button
            size="sm"
            variant="secondary"
            label={`Keep ${formatWeight(copy.offer.keep)}`}
            onPress={onKeep}
            style={styles.action}
          />
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 0, paddingHorizontal: 16, paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tile: {
    width: PROGRESSION_BANNER.tile,
    height: PROGRESSION_BANNER.tile,
    borderRadius: RADIUS.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: PROGRESSION_BANNER.title, fontWeight: '700' },
  body: { fontSize: PROGRESSION_BANNER.body, lineHeight: 18, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  action: { flex: 1 },
})
