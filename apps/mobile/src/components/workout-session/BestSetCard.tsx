import { StyleSheet, Text, View } from 'react-native'
import { Trophy } from 'lucide-react-native'
import { formatDate, formatWeight, withAlpha } from '@fit-nation/shared'
import type { BestSetResource, WeightUnit } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../ui/Card'
import { SectionLabel } from '../ui/SectionLabel'
import { RADIUS } from '../../constants/layout'

/**
 * The best set ever on this exercise — the highest estimated one-rep max the
 * server has on record before today — so a weaker day never hides what the
 * person has already lifted. Trophy tile, "All-time best", the set, its date.
 */
export const BEST_SET = { tile: 44, icon: 22, value: 22, unit: 15, date: 14 } as const

interface BestSetCardProps {
  best: BestSetResource
  weighted: boolean
  weightUnit: WeightUnit
}

export function BestSetCard({ best, weighted, weightUnit }: BestSetCardProps) {
  const { colors } = useTheme()
  const set = weighted ? `${formatWeight(best.weight)} ${weightUnit} × ${best.reps}` : String(best.reps)

  return (
    <Card style={styles.card}>
      <View style={[styles.tile, { backgroundColor: withAlpha(colors.warning, 0.15) }]}>
        <Trophy size={BEST_SET.icon} color={colors.warning} />
      </View>
      <View style={styles.text}>
        <SectionLabel color={colors.warning} style={styles.label}>
          All-time best
        </SectionLabel>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{set}</Text>
          <Text style={[styles.unit, { color: colors.textMuted }]}>reps</Text>
        </View>
      </View>
      <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(best.performed_at, 'short')}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 0 },
  tile: {
    width: BEST_SET.tile,
    height: BEST_SET.tile,
    borderRadius: RADIUS.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  label: { marginBottom: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  value: { fontSize: BEST_SET.value, fontWeight: '800' },
  unit: { fontSize: BEST_SET.unit, fontWeight: '500' },
  date: { fontSize: BEST_SET.date, fontWeight: '500' },
})
