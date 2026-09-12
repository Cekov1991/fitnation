import { useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Dumbbell,
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
import { SkeletonBox } from '../../components/ui/SkeletonBox'
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

  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={[styles.backBtn, { backgroundColor: colors.bgElevated }]}
      >
        <ArrowLeft size={22} color={colors.textSecondary} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Session Details</Text>
    </View>
  )

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
        <View style={styles.errorWrap}>
          <Text style={{ color: colors.textSecondary }}>Failed to load session</Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.textButton, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
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
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 }]} showsVerticalScrollIndicator={false}>
        {header}

        {/* Summary card */}
        <View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
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
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {comparison && <ComparisonStrip parts={volumeComparisonParts(comparison)} />}
        </View>

        {/* Exercises */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Exercises</Text>
        {exercises.length > 0 ? (
          <View style={[styles.listCard, { backgroundColor: colors.bgSurface }]}>
            {exercises.map((detail, index) => {
              const se = detail.session_exercise
              return (
                <View
                  key={se.id}
                  style={index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}
                >
                  <ExerciseRow
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
          <View style={[styles.listCard, { backgroundColor: colors.bgSurface, paddingVertical: 20, alignItems: 'center' }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>No exercises in this session</Text>
          </View>
        )}

        {!!session.notes && (
          <View style={[styles.notesCard, { backgroundColor: colors.bgSurface }]}>
            <Text style={[styles.notesLabel, { color: colors.textMuted }]}>Notes</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{session.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer — only when there is something to do with the session */}
      {(isActive || canRepeat) && (
        <View style={[styles.footer, { backgroundColor: colors.bgBase, paddingBottom: insets.bottom + 12 }]}>
          {isActive ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('WorkoutSession', { sessionId })}
            accessibilityRole="button"
            activeOpacity={0.8}
            style={[styles.mainBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.mainBtnText, { color: colors.textButton }]}>Continue session</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleRepeat}
            disabled={startSession.isPending}
            accessibilityRole="button"
            activeOpacity={0.7}
            style={[
              styles.mainBtn,
              { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, opacity: startSession.isPending ? 0.7 : 1 },
            ]}
          >
            {startSession.isPending ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={[styles.mainBtnText, { color: colors.textPrimary }]}>Repeat this session</Text>
            )}
          </TouchableOpacity>
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

interface ExerciseRowProps {
  detail: SessionExerciseDetail
  unit: string
  expanded: boolean
  onToggle: () => void
  onOpen?: () => void
}

/** One exercise: the row summarises its sets; tapping it lists them. */
function ExerciseRow({ detail, unit, expanded, onToggle, onOpen }: ExerciseRowProps) {
  const { colors } = useTheme()
  const se = detail.session_exercise
  const weighted = se.progression_mode === 'double_progression'
  const sets = detail.logged_sets ?? []
  const totals = exerciseTotals(detail)
  const Chevron = expanded ? ChevronUp : ChevronDown

  return (
    <View>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={styles.row}
      >
        {se.exercise?.image ? (
          <Image source={{ uri: se.exercise.image }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty, { backgroundColor: withAlpha(colors.primary, 0.094) }]}>
            <Dumbbell size={22} color={colors.primary} />
          </View>
        )}
        <View style={styles.rowText}>
          <Text numberOfLines={1} style={[styles.rowName, { color: colors.textPrimary }]}>
            {se.exercise?.name ?? 'Unknown exercise'}
          </Text>
          <Text numberOfLines={1} style={[styles.rowMeta, { color: colors.textSecondary }]}>
            {summarizeSets(sets, { weighted, unit })}
          </Text>
        </View>
        {sets.length > 0 && (
          <View style={styles.rowFigure}>
            <Text style={[styles.rowVolume, { color: colors.textPrimary }]}>
              {weighted ? formatVolumeFull(totals.volume) : String(totals.reps)}
            </Text>
            <Text style={[styles.rowUnit, { color: colors.textMuted }]}>{weighted ? unit : 'reps'}</Text>
          </View>
        )}
        <Chevron size={18} color={colors.textMuted} />
      </TouchableOpacity>

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
  content: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 16, paddingBottom: 16 },
  backBtn: { padding: 8, borderRadius: 999 },
  title: { fontSize: 24, fontWeight: '700' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },

  card: { borderRadius: 24, padding: 20 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 22, fontWeight: '800' },
  date: { fontSize: 14, marginTop: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginTop: 2 },
  pillText: { fontSize: 12, fontWeight: '700' },
  stats: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1, minWidth: 0 },
  statDivider: { borderLeftWidth: StyleSheet.hairlineWidth, paddingLeft: 14, marginLeft: 14 },
  statValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  statValue: { fontSize: 24, fontWeight: '700', lineHeight: 28 },
  statUnit: { fontSize: 13, fontWeight: '600', marginBottom: 3 },
  statLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  compare: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14 },
  compareText: { flex: 1, fontSize: 14 },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 10, marginLeft: 4 },
  listCard: { borderRadius: 24, paddingVertical: 4, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  thumb: { width: 64, height: 64, borderRadius: 16 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 17, fontWeight: '700' },
  rowMeta: { fontSize: 13, marginTop: 3 },
  rowFigure: { alignItems: 'flex-end' },
  rowVolume: { fontSize: 17, fontWeight: '700' },
  rowUnit: { fontSize: 12, marginTop: 1 },
  setList: { paddingLeft: 12, paddingBottom: 12 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  setLabel: { width: 52, fontSize: 14 },
  setFigures: { flex: 1, fontSize: 16, fontWeight: '700' },
  setUnit: { fontSize: 12, fontWeight: '400' },
  setTimes: { fontSize: 14, fontWeight: '700' },
  setVolume: { fontSize: 12 },
  setEmpty: { fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 8 },
  viewLinkText: { fontSize: 13, fontWeight: '600' },

  notesCard: { borderRadius: 24, padding: 20, marginTop: 20 },
  notesLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  notesText: { fontSize: 14, lineHeight: 20 },

  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  mainBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mainBtnText: { fontSize: 16, fontWeight: '600' },
})
