import { useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { ArrowLeft, Check, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react-native'
import { estimateWorkoutDuration, useProgram, useStartSession, withAlpha } from '@fit-nation/shared'
import type { ProgramResource, WorkoutTemplateResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { showToast } from '../../lib/toast'
import {
  groupProgramWeeks,
  isWorkoutCompleted,
  programMetaLine,
  weekSummary,
  workoutMetaLine,
  type ProgramWeek,
} from '../../lib/programOverview'
import type { AppScreenProps } from '../../navigation/types'

type Props = AppScreenProps<'ProgramDetail'>

const CARD_RADIUS = 20
/** Side of the square day marker; the rail column is this wide too. */
const MARKER = 22

/** A small uppercase pill: ACTIVE on the summary, CURRENT / DONE on a week. */
function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: withAlpha(color, 0.125),
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color }}>
        {label}
      </Text>
    </View>
  )
}

/**
 * One segment per week, filled up to and including the week the user is in.
 * Past a dozen weeks the segments would be slivers, so a long program gets one
 * continuous bar instead.
 */
function WeekProgressBar({ total, reached }: { total: number; reached: number }) {
  const { colors } = useTheme()
  const track = withAlpha(colors.textPrimary, 0.08)

  if (total > 12) {
    const pct = Math.min(100, Math.max(0, (reached / total) * 100))
    return (
      <View style={{ height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: track }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.primary }} />
      </View>
    )
  }

  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < reached ? colors.primary : track }}
        />
      ))}
    </View>
  )
}

interface DayRowProps {
  workout: WorkoutTemplateResource
  dayNumber: number
  /** The program's next workout: outlined marker, "Next up" label, and the Start button. */
  isNext: boolean
  /** The last day of the week has no rail below its marker. */
  isLast: boolean
  starting: boolean
  onPress: () => void
  onStart?: () => void
}

/** One day on a week's timeline: marker on the rail, label, name, and the exercise count and duration. */
function DayRow({ workout, dayNumber, isNext, isLast, starting, onPress, onStart }: DayRowProps) {
  const { colors } = useTheme()
  const completed = isWorkoutCompleted(workout)
  const exercises = workout.exercises ?? []
  const meta = workoutMetaLine(exercises.length, estimateWorkoutDuration(exercises))

  const label = isNext ? `Day ${dayNumber} · Next up` : completed ? `Day ${dayNumber} · Done` : `Day ${dayNumber}`
  const labelColor = isNext ? colors.primary : completed ? colors.success : colors.textMuted

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${workout.name}, ${meta}`}
      style={{ flexDirection: 'row' }}
    >
      {/* The rail: this day's marker, then the line down to the next day. */}
      <View style={{ width: MARKER, alignItems: 'center', marginRight: 14 }}>
        {isNext ? (
          <View
            style={{
              width: MARKER,
              height: MARKER,
              marginTop: 6,
              borderRadius: 7,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          />
        ) : completed ? (
          <View
            style={{
              width: MARKER,
              height: MARKER,
              marginTop: 6,
              borderRadius: 7,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
            }}
          >
            <Check size={14} color={colors.textButton} strokeWidth={3} />
          </View>
        ) : (
          <View style={{ width: MARKER, height: MARKER, marginTop: 6, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: withAlpha(colors.textPrimary, 0.18) }}
            />
          </View>
        )}
        {!isLast && (
          <View style={{ flex: 1, width: 2, marginTop: 6, backgroundColor: withAlpha(colors.textPrimary, 0.1) }} />
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: labelColor }}
            >
              {label}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: '700', marginTop: 2, color: colors.textPrimary }}>
              {workout.name}
            </Text>
            <Text style={{ fontSize: 13, marginTop: 2, color: colors.textSecondary }}>{meta}</Text>
          </View>
          {!isNext && <ChevronRight size={18} color={colors.textMuted} />}
        </View>

        {isNext && onStart && (
          <TouchableOpacity
            onPress={onStart}
            disabled={starting}
            activeOpacity={0.8}
            accessibilityRole="button"
            style={{
              alignSelf: 'flex-start',
              minWidth: 150,
              marginTop: 12,
              paddingHorizontal: 22,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
              opacity: starting ? 0.7 : 1,
            }}
          >
            {starting ? (
              <ActivityIndicator size="small" color={colors.textButton} />
            ) : (
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textButton }}>Start workout</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

interface WeekCardProps {
  week: ProgramWeek
  expanded: boolean
  /** The current week is always open; every other week folds down to a one-line summary. */
  collapsible: boolean
  onToggle: () => void
  nextWorkoutId: number | null
  starting: boolean
  onWorkoutPress: (workout: WorkoutTemplateResource) => void
  onStart: (workout: WorkoutTemplateResource) => void
}

function WeekCard({
  week,
  expanded,
  collapsible,
  onToggle,
  nextWorkoutId,
  starting,
  onWorkoutPress,
  onStart,
}: WeekCardProps) {
  const { colors } = useTheme()
  const Chevron = expanded ? ChevronUp : ChevronDown

  return (
    <View style={{ borderRadius: CARD_RADIUS, padding: 20, marginBottom: 12, backgroundColor: colors.bgSurface }}>
      <TouchableOpacity
        onPress={onToggle}
        disabled={!collapsible}
        activeOpacity={0.7}
        accessibilityRole={collapsible ? 'button' : undefined}
        accessibilityState={collapsible ? { expanded } : undefined}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>Week {week.weekNumber}</Text>
            {!expanded && (
              <Text numberOfLines={2} style={{ fontSize: 13, marginTop: 4, color: colors.textSecondary }}>
                {weekSummary(week)}
              </Text>
            )}
          </View>
          {week.status === 'current' && <StatusChip label="Current" color={colors.primary} />}
          {week.status === 'done' && <StatusChip label="Done" color={colors.success} />}
          {collapsible && <Chevron size={20} color={colors.textMuted} />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ marginTop: 18 }}>
          {week.workouts.map((workout, index) => {
            const isNext = workout.id === nextWorkoutId
            return (
              <DayRow
                key={workout.id}
                workout={workout}
                dayNumber={index + 1}
                isNext={isNext}
                isLast={index === week.workouts.length - 1}
                starting={isNext && starting}
                onPress={() => onWorkoutPress(workout)}
                onStart={isNext ? () => onStart(workout) : undefined}
              />
            )
          })}
        </View>
      )}
    </View>
  )
}

export function ProgramDetailScreen({ route, navigation }: Props) {
  const { programId } = route.params
  const { colors } = useTheme()
  const { data: program, isLoading, isError, refetch } = useProgram(programId)
  const startSession = useStartSession()
  /** Weeks the user has opened or closed by hand; anything else falls back to the default. */
  const [toggled, setToggled] = useState<Record<number, boolean>>({})

  const prog = (program ?? null) as ProgramResource | null
  const weeks = useMemo(() => (prog ? groupProgramWeeks(prog) : []), [prog])
  const hasCurrentWeek = weeks.some((week) => week.status === 'current')
  const nextWorkoutId = prog?.is_active ? prog.next_workout?.id ?? null : null

  // The current week is always open. Without one (a program that isn't
  // running yet) the first week opens so the screen isn't just headings.
  function isExpanded(week: ProgramWeek, index: number): boolean {
    if (week.status === 'current') return true
    return toggled[week.weekNumber] ?? (!hasCurrentWeek && index === 0)
  }

  function handleWorkoutPress(workout: WorkoutTemplateResource) {
    if (workout.last_completed_session_id != null) {
      navigation.navigate('SessionDetail', { sessionId: String(workout.last_completed_session_id) })
      return
    }
    navigation.navigate('ManageExercises', { templateId: workout.id })
  }

  // Same route the dashboard's START WORKOUT takes: a session that hasn't been
  // performed yet is previewed first, a resumed one goes straight in.
  async function handleStart(workout: WorkoutTemplateResource) {
    if (startSession.isPending) return
    try {
      const response = await startSession.mutateAsync(workout.id)
      const session = response.data
      if (!session?.id) return
      if (!session.performed_at) {
        navigation.navigate('WorkoutPreview', { sessionId: String(session.id) })
      } else {
        navigation.navigate('WorkoutSession', { sessionId: String(session.id) })
      }
    } catch (e) {
      console.error('Failed to start workout', e)
      showToast("Couldn't start the workout. Check your connection and try again.", 'error')
    }
  }

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 24, marginBottom: 24 }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={{ padding: 8, borderRadius: 999, backgroundColor: colors.bgElevated }}
      >
        <ArrowLeft size={22} color={colors.textSecondary} />
      </TouchableOpacity>
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>Program Details</Text>
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bgBase }}>
        <View style={{ paddingHorizontal: 24 }}>
          {header}
          <SkeletonBox height={150} style={{ marginBottom: 16 }} />
          <SkeletonBox height={280} style={{ marginBottom: 12 }} />
          <SkeletonBox height={72} style={{ marginBottom: 12 }} />
          <SkeletonBox height={72} style={{ marginBottom: 12 }} />
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !prog) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bgBase }}>
        <View style={{ paddingHorizontal: 24 }}>{header}</View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 16, color: colors.textSecondary }}>
            Failed to load program
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            accessibilityRole="button"
            style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary }}
          >
            <Text style={{ fontWeight: '600', color: colors.textButton }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const totalWeeks = prog.duration_weeks ?? weeks.length

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {header}

        {/* Summary: name and status, the blurb, where the user is in the program */}
        <View style={{ borderRadius: CARD_RADIUS, marginBottom: 16, overflow: 'hidden', backgroundColor: colors.bgSurface }}>
          {prog.cover_image && (
            <Image source={{ uri: prog.cover_image }} style={{ width: '100%', height: 140 }} contentFit="cover" />
          )}
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Text style={{ flex: 1, fontSize: 22, fontWeight: '800', color: colors.textPrimary }}>{prog.name}</Text>
              {prog.is_active && (
                <View style={{ marginTop: 4 }}>
                  <StatusChip label="Active" color={colors.success} />
                </View>
              )}
            </View>
            {prog.description && (
              <Text style={{ fontSize: 14, lineHeight: 20, marginTop: 4, color: colors.textSecondary }}>
                {prog.description}
              </Text>
            )}
            {prog.is_active && totalWeeks > 0 && (
              <View style={{ marginTop: 16 }}>
                <WeekProgressBar total={totalWeeks} reached={prog.current_active_week ?? 1} />
              </View>
            )}
            <Text style={{ fontSize: 13, marginTop: prog.is_active ? 10 : 12, color: colors.textSecondary }}>
              {programMetaLine(prog, weeks)}
            </Text>
          </View>
        </View>

        {weeks.length === 0 ? (
          <EmptyState title="No workouts yet" description="This program doesn't have any workouts scheduled." />
        ) : (
          weeks.map((week, index) => {
            const expanded = isExpanded(week, index)
            return (
              <WeekCard
                key={week.weekNumber}
                week={week}
                expanded={expanded}
                collapsible={week.status !== 'current'}
                onToggle={() => setToggled((prev) => ({ ...prev, [week.weekNumber]: !expanded }))}
                nextWorkoutId={nextWorkoutId}
                starting={startSession.isPending}
                onWorkoutPress={handleWorkoutPress}
                onStart={handleStart}
              />
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
