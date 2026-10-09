import { StyleSheet, Text, View } from 'react-native'
import { formatDate, formatWeight, withAlpha } from '@fit-nation/shared'
import type { SetLogResource, WeightUnit } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../ui/Card'
import { SectionLabel } from '../ui/SectionLabel'
import { lastSessionSummary, type LastSessionTargets, type SetVerdict } from './lastSession'

/**
 * What happened last time on this exercise, under the sets: each set with
 * its verdict against the rep range, then the target, the rep total and the
 * volume. The numbers are lastSessionSummary(); this only draws them.
 */
export const LAST_SESSION = { label: 13, value: 15, caption: 13, chip: 12, chipRadius: 8, paddingX: 16 } as const

interface LastSessionCardProps extends LastSessionTargets {
  sets: SetLogResource[]
  weightUnit: WeightUnit
}

export function LastSessionCard({ sets, weightUnit, ...targets }: LastSessionCardProps) {
  const { colors } = useTheme()
  const summary = lastSessionSummary(sets, targets)
  const toneOf = (v: SetVerdict) => (v.kind === 'below' ? colors.warning : colors.success)

  const footerLeft = [summary.targetLabel, `${summary.totalReps} reps total`].filter(Boolean).join(' · ')

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <SectionLabel style={styles.headerLabel}>Last session</SectionLabel>
        {summary.date && (
          <Text style={[styles.caption, { color: colors.textSecondary }]}>{formatDate(summary.date, 'weekdayShort')}</Text>
        )}
      </View>

      {summary.rows.map((row, index) => (
        <View
          key={row.setNumber}
          style={[styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
        >
          <Text style={[styles.setLabel, { color: colors.textSecondary }]}>Set {row.setNumber}</Text>
          <View style={styles.values}>
            {targets.weighted && (
              <>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{formatWeight(row.weight)}</Text>
                <Text style={[styles.unit, { color: colors.textMuted }]}>{weightUnit}</Text>
                <Text style={[styles.unit, { color: colors.textMuted }]}>×</Text>
              </>
            )}
            <Text style={[styles.value, { color: colors.textPrimary }]}>{row.reps}</Text>
            {!targets.weighted && <Text style={[styles.unit, { color: colors.textMuted }]}>reps</Text>}
          </View>
          {row.verdict && (
            <View style={[styles.chip, { backgroundColor: withAlpha(toneOf(row.verdict), 0.12) }]}>
              <Text style={[styles.chipText, { color: toneOf(row.verdict) }]}>{row.verdict.label}</Text>
            </View>
          )}
        </View>
      ))}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.caption, styles.footerLeft, { color: colors.textSecondary }]}>{footerLeft}</Text>
        {summary.volume != null && (
          <Text style={[styles.total, { color: colors.textPrimary }]}>
            {formatWeight(summary.volume)} {weightUnit}
          </Text>
        )}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { padding: 0, marginBottom: 0, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAST_SESSION.paddingX,
    paddingTop: 14,
    paddingBottom: 6,
  },
  headerLabel: { marginBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: LAST_SESSION.paddingX, paddingVertical: 11 },
  setLabel: { fontSize: LAST_SESSION.label, fontWeight: '600', width: 48 },
  values: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  value: { fontSize: LAST_SESSION.value, fontWeight: '700' },
  unit: { fontSize: LAST_SESSION.caption },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: LAST_SESSION.chipRadius },
  chipText: { fontSize: LAST_SESSION.chip, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: LAST_SESSION.paddingX,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLeft: { flex: 1, minWidth: 0 },
  caption: { fontSize: LAST_SESSION.caption },
  total: { fontSize: LAST_SESSION.value, fontWeight: '800' },
})
