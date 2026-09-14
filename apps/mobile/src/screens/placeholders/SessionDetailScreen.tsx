import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Minus,
} from 'lucide-react-native'
import {
  exerciseTotals,
  formatDate,
  formatTime,
  formatVolumeFull,
  formatWeight,
  sessionTotals,
  summarizeSets,
  useSession,
  useStartSession,
  useTemplate,
  useWeightUnit,
  volumeComparison,
  volumeComparisonParts,
  withAlpha,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../../components/ui/Card'
import { RADIUS, SCREEN, SECTION_GAP } from '../../constants/layout'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { SectionLabel } from '../../components/ui/SectionLabel'
import { ExerciseRow, EXERCISE_ROW } from '../../components/exercises/ExerciseRow'
import { showToast } from '../../lib/toast'
import type { AppScreenProps } from '../../navigation/types'
import type { SessionExerciseDetail, SetLogResource } from '@fit-nation/shared'

type Props = AppScreenProps<'SessionDetail'>

type SessionState = 'completed' | 'active' | 'cancelled'

/**
 * A finished (or running) session at a glance: the workout, when it happened,
 * its totals and how they compare with last time, then one collapsible row per
 * exercise. Repeat starts the same template again (spec 0037).
 */
export function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const numericSessionId = Number(sessionId)

  const { data: session, isLoading, isError, refetch } = useSession(numericSessionId)
  const { data: template } = useTemplate(session?.workout_template_id ?? 0)
  const startSession = useStartSession()
  const unit = useWeightUnit()
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const exercises: SessionExerciseDetail[] = session?.exercises ?? []
  const totals = useMemo(() => sessionTotals({ exercises }), [exercises])
  const comparison = useMemo(
    () => volumeComparison(exercises, session?.performed_at),
    [exercises, session?.performed_at]
  )

  const header = <ScreenHeader title="Session Details" onBack={() => navigation.goBack()} />

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bgBase }]}>
        <View style={styles.content}>
          {header}
          <SkeletonBox height={196} style={{ marginBottom: 24 }} />
          <SkeletonBox height={14} style={{ marginBottom: 12 }} />
          <SkeletonBox height={320} />
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !session) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bgBase }]}>
        <View style={styles.content}>{header}</View>
        <ErrorState message="Failed to load session" onRetry={() => refetch()} />
      </SafeAreaView>
    )
  }

  const state: SessionState = session.completed_at
    ? 'completed'
    : session.status === 'cancelled'
      ? 'cancelled'
      : 'active'
  const name = template?.name ?? (session.is_auto_generated ? 'Generated workout' : 'Workout session')
  const dateLine = session.performed_at
    ? `${formatDate(session.performed_at, 'weekday')} · ${formatTime(session.performed_at)}`
    : 'Not started yet'

  const pill = {
    completed: { label: 'Completed', color: colors.success, check: true },
    active: { label: 'In progress', color: colors.warning, check: false },
    cancelled: { label: 'Cancelled', color: colors.textMuted, check: false },
  }[state]

  const stats: Array<{ value: string; unit?: string; label: string }> = [
    totals.hasWeighted
      ? { value: formatVolumeFull(totals.weightedVolume), unit, label: 'Total volume' }
      : { value: String(totals.bodyweightReps), label: 'Total reps' },
    { value: String(totals.exercisesCount), label: 'Exercises' },
    { value: String(totals.totalSets), label: 'Sets' },
  ]

  const canRepeat = session.workout_template_id != null
  const isActive = state === 'active'

  async function handleRepeat() {
    if (session?.workout_template_id == null) return
    try {
      const response = await startSession.mutateAsync(session.workout_template_id)
      const started = (response as any)?.data?.session || (response as any)?.data
      if (started?.id) {
        if (!started.performed_at) {
          navigation.navigate('WorkoutPreview', { sessionId: String(started.id) })
        } else {
          navigation.navigate('WorkoutSession', { sessionId: String(started.id) })
        }
      }
    } catch (e: any) {
      showToast(e?.message || "Couldn't start the workout. Check your connection and try again.", 'error')
    }
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bgBase }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: SCREEN.paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {header}

        {/* Summary card */}
        <Card variant="summary">
          <View style={styles.cardTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>{dateLine}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: withAlpha(pill.color, 0.15) }]}>
              {pill.check && <Check size={13} strokeWidth={3} color={pill.color} />}
              <Text style={[styles.pillText, { color: pill.color }]}>{pill.label}</Text>
            </View>
          </View>

          <View style={[styles.stats, { borderTopColor: colors.border }]}>
            {stats.map((stat, index) => (
              <View
                key={stat.label}
                style={[styles.stat, index > 0 && [styles.statDivider, { borderLeftColor: colors.border }]]}
              >
                <View style={styles.statValueRow}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                  {stat.unit && <Text style={[styles.statUnit, { color: colors.textMuted }]}>{stat.unit}</Text>}
                </View>
                <SectionLabel tone="muted" style={styles.statLabel}>
                  {stat.label}
                </SectionLabel>
              </View>
            ))}
          </View>

          {comparison && <ComparisonStrip parts={volumeComparisonParts(comparison)} />}
        </Card>

        {/* Exercises */}
        <SectionLabel style={styles.sectionLabel}>Exercises</SectionLabel>
        {exercises.length > 0 ? (
          <View style={{ gap: EXERCISE_ROW.rowGap }}>
            {exercises.map((detail) => {
              const se = detail.session_exercise
              return (
                <View key={se.id} style={[styles.exerciseCard, { backgroundColor: colors.bgSurface }]}>
                  <SessionExerciseRow
                    detail={detail}
                    unit={unit}
                    expanded={!!expanded[se.id]}
                    onToggle={() => setExpanded((prev) => ({ ...prev, [se.id]: !prev[se.id] }))}
                    onOpen={
                      se.exercise?.name
                        ? () => navigation.navigate('ExerciseDetail', { exerciseName: se.exercise!.name })
                        : undefined
                    }
                  />
                </View>
              )
            })}
          </View>
        ) : (
          <EmptyState variant="card" title="No exercises" />
        )}

        {!!session.notes && (
          <Card variant="summary" style={{ marginTop: 20 }}>
            <SectionLabel tone="muted" style={styles.notesLabel}>
              Notes
            </SectionLabel>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{session.notes}</Text>
          </Card>
        )}
      </ScrollView>

      {/* Footer — only when there is something to do with the session */}
      {(isActive || canRepeat) && (
        <View style={[styles.footer, { backgroundColor: colors.bgBase, paddingBottom: insets.bottom + 12 }]}>
          {isActive ? (
            <Button
              label="Continue Session"
              variant="accent"
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('WorkoutSession', { sessionId })}
            />
          ) : (
            <Button
              label="Repeat This Session"
              variant="secondary"
              style={{ flex: 1 }}
              loading={startSession.isPending}
              disabled={startSession.isPending}
              onPress={handleRepeat}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

function ComparisonStrip({ parts }: { parts: ReturnType<typeof volumeComparisonParts> }) {
  const { colors } = useTheme()
  const accent = parts.direction === 'up' ? colors.primary : colors.textSecondary
  const Icon = parts.direction === 'up' ? ArrowUp : parts.direction === 'down' ? ArrowDown : Minus
  return (
    <View style={[styles.compare, { backgroundColor: withAlpha(colors.textPrimary, 0.05) }]}>
      <Icon size={16} strokeWidth={2.5} color={accent} />
      <Text style={[styles.compareText, { color: colors.textSecondary }]}>
        {parts.percent ? <Text style={{ color: accent, fontWeight: '700' }}>{parts.percent} </Text> : null}
        {parts.text}
      </Text>
    </View>
  )
}

interface SessionExerciseRowProps {
  detail: SessionExerciseDetail
  unit: string
  expanded: boolean
  onToggle: () => void
  onOpen?: () => void
}

/** One exercise card: the standard row summarises its sets; tapping it lists them below. */
function SessionExerciseRow({ detail, unit, expanded, onToggle, onOpen }: SessionExerciseRowProps) {
  const { colors } = useTheme()
  const se = detail.session_exercise
  const weighted = se.progression_mode === 'double_progression'
  const sets = detail.logged_sets ?? []
  const totals = exerciseTotals(detail)
  const Chevron = expanded ? ChevronUp : ChevronDown

  return (
    <View>
      <ExerciseRow
        surface="plain"
        name={se.exercise?.name ?? 'Unknown exercise'}
        image={se.exercise?.image}
        meta={summarizeSets(sets, { weighted, unit })}
        onPress={onToggle}
        accessibilityState={{ expanded }}
        right={
          <>
            {sets.length > 0 && (
              <View style={styles.rowFigure}>
                <Text style={[styles.rowVolume, { color: colors.textPrimary }]}>
                  {weighted ? formatVolumeFull(totals.volume) : String(totals.reps)}
                </Text>
                <Text style={[styles.rowUnit, { color: colors.textMuted }]}>{weighted ? unit : 'reps'}</Text>
              </View>
            )}
            <Chevron size={18} color={colors.textMuted} style={{ marginRight: 4 }} />
          </>
        }
      />

      {expanded && (
        <View style={styles.setList}>
          {sets.map((set: SetLogResource, index) => (
            <View
              key={set.id}
              style={[styles.setRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
            >
              <Text style={[styles.setLabel, { color: colors.textSecondary }]}>Set {set.set_number}</Text>
              <Text style={[styles.setFigures, { color: colors.textPrimary }]}>
                {weighted && (
                  <>
                    {formatWeight(set.weight)}
                    <Text style={[styles.setUnit, { color: colors.textMuted }]}> {unit}</Text>
                    <Text style={[styles.setTimes, { color: colors.textPrimary }]}>  ×  </Text>
                  </>
                )}
                {set.reps}
                <Text style={[styles.setUnit, { color: colors.textMuted }]}> reps</Text>
              </Text>
              {weighted && (
                <Text style={[styles.setVolume, { color: colors.textMuted }]}>
                  {formatVolumeFull(set.weight * set.reps)} {unit}
                </Text>
              )}
            </View>
          ))}
          {sets.length === 0 && (
            <Text style={[styles.setEmpty, { color: colors.textMuted }]}>No sets logged</Text>
          )}
          {onOpen && (
            <TouchableOpacity onPress={onOpen} accessibilityRole="link" activeOpacity={0.7} style={styles.viewLink}>
              <Text style={[styles.viewLinkText, { color: colors.primary }]}>View exercise</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SCREEN.paddingX },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 22, fontWeight: '800' },
  date: { fontSize: 14, marginTop: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill, marginTop: 2 },
  pillText: { fontSize: 12, fontWeight: '700' },
  stats: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1, minWidth: 0 },
  statDivider: { borderLeftWidth: StyleSheet.hairlineWidth, paddingLeft: 14, marginLeft: 14 },
  statValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  statValue: { fontSize: 24, fontWeight: '700', lineHeight: 28 },
  statUnit: { fontSize: 13, fontWeight: '600', marginBottom: 3 },
  // Margins only — the caption itself is <SectionLabel>.
  statLabel: { marginBottom: 0, marginTop: 4 },
  compare: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14 },
  compareText: { flex: 1, fontSize: 14 },

  sectionLabel: { marginTop: SECTION_GAP, marginLeft: 4 },
  // The row itself is <ExerciseRow>; this card wraps it plus the expanded set list.
  exerciseCard: { borderRadius: EXERCISE_ROW.radius },
  rowFigure: { alignItems: 'flex-end' },
  rowVolume: { fontSize: EXERCISE_ROW.nameSize, fontWeight: '700' },
  rowUnit: { fontSize: EXERCISE_ROW.metaSize, marginTop: 1 },
  setList: { paddingHorizontal: 16, paddingBottom: 12 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  setLabel: { width: 52, fontSize: 14 },
  setFigures: { flex: 1, fontSize: 16, fontWeight: '700' },
  setUnit: { fontSize: 12, fontWeight: '400' },
  setTimes: { fontSize: 14, fontWeight: '700' },
  setVolume: { fontSize: 12 },
  setEmpty: { fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 8 },
  viewLinkText: { fontSize: 13, fontWeight: '600' },

  notesLabel: { marginBottom: 8 },
  notesText: { fontSize: 14, lineHeight: 20 },

  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: SCREEN.paddingX, paddingTop: 12 },
})
