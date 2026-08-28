import { useState, useCallback, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import * as Haptics from 'expo-haptics'
import { ArrowRight, Plus } from 'lucide-react-native'
import {
  useLogSet,
  useUpdateSet,
  useDeleteSet,
  useUpdateSessionExercise,
  useWeightUnit,
  isProvisionalSetLogId,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { ProgressionBanner } from './ProgressionBanner'
import { CompletedSetRow, PendingSetRow } from './SetRow'
import { SetLogCard } from './SetLogCard'
import { SetEditCard } from './SetEditCard'
import { SetOptionsMenu } from './SetOptionsMenu'
import { isExerciseComplete } from './progress'
import { showToast } from '../../lib/toast'
import type { SessionExerciseDetail } from '@fit-nation/shared'

const BODYWEIGHT_EQUIPMENT = ['BODYWEIGHT', 'TRX']

// Tracks which session_exercise ids have had a background default-patch
// attempted this app session, so remounts don't re-fire it. Note this page now
// remounts on every exercise switch (one page is rendered at a time), so the
// guard is what keeps a PATCH from firing each time the user flips between two
// exercises. It records *attempts*, so a failed patch is never retried — see
// docs/specs/0007-default-target-autopatch-never-retries.md.
const autoFixedSessionExerciseIds = new Set<number>()

const DEFAULT_SETS = 3
const DEFAULT_MIN_REPS = 8
const DEFAULT_MAX_REPS = 12

interface ExercisePageProps {
  exerciseDetail: SessionExerciseDetail
  sessionId: number
  /** Draft set input, owned by the screen so it survives an exercise switch. */
  logWeight: string
  logReps: string
  onLogWeightChange: (v: string) => void
  onLogRepsChange: (v: string) => void
  /** The rest timer lives above this page so it outlives an exercise switch. */
  isRestRunning: boolean
  onStartRest: (seconds: number) => void
  onNext?: () => void
}

type SetSlot =
  | { kind: 'completed'; setNumber: number; logId: number; weight: number; reps: number }
  | { kind: 'pending'; setNumber: number }

export function ExercisePage({
  exerciseDetail,
  sessionId,
  logWeight,
  logReps,
  onLogWeightChange,
  onLogRepsChange,
  isRestRunning,
  onStartRest,
  onNext,
}: ExercisePageProps) {
  const { colors } = useTheme()
  // Computed once here and passed down; the set cards/rows stay presentational.
  const weightUnit = useWeightUnit()
  const logSet = useLogSet()
  const updateSet = useUpdateSet()
  const deleteSet = useDeleteSet()
  const updateSessionExercise = useUpdateSessionExercise()

  const [editingLogId, setEditingLogId] = useState<number | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')

  const [setMenuSetNumber, setSetMenuSetNumber] = useState<number | null>(null)

  const { session_exercise, logged_sets, previous_sets } = exerciseDetail
  const exercise = session_exercise.exercise
  // Fall back to sane defaults so the UI is always usable even when the server
  // row has null targets. A background patch (see effect below) persists these.
  const targetSets = session_exercise.target_sets || DEFAULT_SETS
  const minReps = session_exercise.min_target_reps || DEFAULT_MIN_REPS
  const maxReps = session_exercise.max_target_reps || DEFAULT_MAX_REPS
  const progressionMode = session_exercise.progression_mode
  const progressionStatus = session_exercise.progression_status ?? 'no_history'
  const allowWeightLogging = !BODYWEIGHT_EQUIPMENT.includes(
    exercise?.equipment_type?.code ?? ''
  )

  // Build ordered slots (1..targetSets). Completed if a log exists for that set_number.
  const slots = useMemo<SetSlot[]>(() => {
    return Array.from({ length: targetSets }, (_, i) => {
      const n = i + 1
      const log = logged_sets.find(l => l.set_number === n)
      if (log) {
        return {
          kind: 'completed' as const,
          setNumber: n,
          logId: log.id,
          weight: log.weight,
          reps: log.reps,
        }
      }
      return { kind: 'pending' as const, setNumber: n }
    })
  }, [targetSets, logged_sets])

  const firstPendingSetNumber = slots.find(s => s.kind === 'pending')?.setNumber ?? null

  const prevActiveSet = previous_sets.find(s => s.set_number === (firstPendingSetNumber ?? 1))
  const defaultWeight = session_exercise.target_weight ?? prevActiveSet?.weight ?? 0
  const defaultReps = prevActiveSet?.reps ?? (minReps > 0 ? minReps : 0)

  // logSet is deliberately absent: it is optimistic, so an in-flight log is
  // not a reason to grey out the rest of the page.
  const anyLoading =
    updateSet.isPending ||
    deleteSet.isPending ||
    updateSessionExercise.isPending

  const isComplete = isExerciseComplete(exerciseDetail)

  // Silently patch missing targets on the server the first time we see them.
  // The UI always uses the defaults above so this never blocks interaction.
  const hasMissingTargets =
    !session_exercise.target_sets ||
    (!session_exercise.min_target_reps && !session_exercise.max_target_reps)

  useEffect(() => {
    if (!hasMissingTargets) return
    if (autoFixedSessionExerciseIds.has(session_exercise.id)) return
    autoFixedSessionExerciseIds.add(session_exercise.id)
    updateSessionExercise.mutate({
      sessionId,
      exerciseId: session_exercise.id,
      data: {
        target_sets: session_exercise.target_sets || DEFAULT_SETS,
        min_target_reps: session_exercise.min_target_reps || DEFAULT_MIN_REPS,
        max_target_reps: session_exercise.max_target_reps || DEFAULT_MAX_REPS,
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMissingTargets, session_exercise.id])

  const handleLog = useCallback(async () => {
    if (firstPendingSetNumber == null) return
    const reps = parseInt(logReps || '', 10)
    const weight = allowWeightLogging
      ? parseFloat(logWeight || '') || defaultWeight
      : 0
    const repsToLog = isNaN(reps) || reps <= 0 ? defaultReps : reps
    if (repsToLog <= 0) return

    // useLogSet puts the row on screen in onMutate, so everything that belongs
    // to "the set is logged" fires here rather than after the round trip —
    // waiting would leave the haptic and the rest timer trailing the row the
    // user is already looking at. Undone below if the log fails.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onLogWeightChange('')
    onLogRepsChange('')
    if (session_exercise.rest_seconds && session_exercise.rest_seconds > 0) {
      onStartRest(session_exercise.rest_seconds)
    }

    try {
      await logSet.mutateAsync({
        sessionId,
        data: {
          workout_session_exercise_id: session_exercise.id,
          exercise_id: session_exercise.exercise_id,
          set_number: firstPendingSetNumber,
          weight: weight ?? 0,
          reps: repsToLog,
          rest_seconds: session_exercise.rest_seconds ?? undefined,
        },
      })
    } catch (err) {
      console.error('Log set failed:', err)
      // The row has just rolled back out of the list, so hand the typed values
      // back rather than making the user retype them.
      onLogWeightChange(logWeight)
      onLogRepsChange(logReps)
      showToast('Could not log that set. Check your connection and try again.', 'error')
    }
  }, [
    firstPendingSetNumber,
    logReps,
    logWeight,
    allowWeightLogging,
    defaultWeight,
    defaultReps,
    logSet,
    sessionId,
    session_exercise,
    onLogWeightChange,
    onLogRepsChange,
    onStartRest,
  ])

  const handleStartTimer = () => {
    if (session_exercise.rest_seconds && session_exercise.rest_seconds > 0) {
      onStartRest(session_exercise.rest_seconds)
    }
  }

  const handleAddSet = useCallback(async () => {
    try {
      await updateSessionExercise.mutateAsync({
        sessionId,
        exerciseId: session_exercise.id,
        data: { target_sets: targetSets + 1 },
      })
    } catch (err) {
      console.error('Add set failed:', err)
    }
  }, [sessionId, session_exercise.id, targetSets, updateSessionExercise])

  const handleOpenSetMenu = (setNumber: number) => {
    setSetMenuSetNumber(setNumber)
  }

  const activeSlot =
    setMenuSetNumber != null ? slots.find(s => s.setNumber === setMenuSetNumber) : null
  const activeLogId = activeSlot?.kind === 'completed' ? activeSlot.logId : null
  // A row logged optimistically carries a negative id until the server replies.
  // Edit and remove both address the server by that id, so neither is offered
  // for the one request's worth of time in which the row is still provisional.
  const isActiveSlotProvisional = isProvisionalSetLogId(activeLogId)
  const canEditSet = activeLogId != null && !isActiveSlotProvisional
  // Any set can be removed as long as at least one set remains. The server
  // re-sequences the remaining sets' set_number after a delete.
  const canRemoveSet = setMenuSetNumber != null && targetSets > 1 && !isActiveSlotProvisional

  const handleEditFromMenu = () => {
    if (activeSlot?.kind === 'completed') {
      setEditingLogId(activeSlot.logId)
      setEditWeight(activeSlot.weight.toString())
      setEditReps(activeSlot.reps.toString())
    }
    setSetMenuSetNumber(null)
  }

  const handleSaveEdit = useCallback(async () => {
    // The menu already refuses to open an edit on a provisional row; this is
    // the guard for anything that reaches the handler another way.
    if (editingLogId == null || isProvisionalSetLogId(editingLogId)) return
    const weight = allowWeightLogging
      ? parseFloat(editWeight || '0')
      : 0
    const reps = parseInt(editReps || '0', 10)
    if (isNaN(reps) || reps <= 0) return

    try {
      await updateSet.mutateAsync({
        sessionId,
        setLogId: editingLogId,
        data: { weight: isNaN(weight) ? 0 : weight, reps },
      })
      setEditingLogId(null)
    } catch (err) {
      console.error('Update set failed:', err)
    }
  }, [editingLogId, editWeight, editReps, allowWeightLogging, updateSet, sessionId])

  const handleCancelEdit = () => {
    setEditingLogId(null)
  }

  const handleRemoveFromMenu = useCallback(async () => {
    if (!activeSlot) return
    if (targetSets <= 1) {
      showToast('Remove the exercise instead of the last set.', 'error')
      return
    }
    try {
      if (activeSlot.kind === 'completed') {
        if (isProvisionalSetLogId(activeSlot.logId)) return
        await deleteSet.mutateAsync({ sessionId, setLogId: activeSlot.logId })
      }
      await updateSessionExercise.mutateAsync({
        sessionId,
        exerciseId: session_exercise.id,
        data: { target_sets: targetSets - 1 },
      })
      setSetMenuSetNumber(null)
    } catch (err) {
      console.error('Remove set failed:', err)
    }
  }, [activeSlot, deleteSet, updateSessionExercise, sessionId, session_exercise.id, targetSets])

  const content = (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgBase }}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Progression banner */}
      {logged_sets.length === 0 && (
        <View style={{ marginTop: 16 }}>
          <ProgressionBanner
            status={progressionStatus}
            maxTargetReps={maxReps}
            progressionMode={progressionMode}
            totalRepsPrevious={session_exercise.total_reps_previous}
            totalRepsTarget={session_exercise.total_reps_target}
          />
        </View>
      )}

      {/* Sets */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 10 }}>
        {slots.map(slot => {
          if (slot.kind === 'completed') {
            if (editingLogId === slot.logId) {
              return (
                <SetEditCard
                  key={`edit-${slot.logId}`}
                  setNumber={slot.setNumber}
                  weight={editWeight}
                  reps={editReps}
                  onWeightChange={setEditWeight}
                  onRepsChange={setEditReps}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  allowWeightLogging={allowWeightLogging}
                  weightUnit={weightUnit}
                />
              )
            }
            return (
              <CompletedSetRow
                key={`done-${slot.setNumber}`}
                setNumber={slot.setNumber}
                weight={allowWeightLogging ? slot.weight : null}
                reps={slot.reps}
                allowWeightLogging={allowWeightLogging}
                weightUnit={weightUnit}
                onOpenMenu={() => handleOpenSetMenu(slot.setNumber)}
              />
            )
          }

          // Pending slot
          if (slot.setNumber === firstPendingSetNumber && !editingLogId) {
            return (
              <SetLogCard
                key={`log-${slot.setNumber}`}
                setNumber={slot.setNumber}
                weight={logWeight}
                reps={logReps}
                onWeightChange={onLogWeightChange}
                onRepsChange={onLogRepsChange}
                onLog={handleLog}
                onStartTimer={handleStartTimer}
                defaultWeight={defaultWeight}
                defaultReps={defaultReps}
                allowWeightLogging={allowWeightLogging}
                goalMinReps={minReps}
                goalMaxReps={maxReps}
                goalWeight={session_exercise.target_weight}
                totalRepsPrevious={previous_sets.find(s => s.set_number === slot.setNumber)?.reps ?? null}
                totalRepsTarget={session_exercise.total_reps_target}
                showTimerButton={!isRestRunning && !!session_exercise.rest_seconds}
                weightUnit={weightUnit}
                onOpenMenu={
                  targetSets > 1 ? () => handleOpenSetMenu(slot.setNumber) : undefined
                }
              />
            )
          }

          return (
            <PendingSetRow
              key={`pending-${slot.setNumber}`}
              setNumber={slot.setNumber}
              allowWeightLogging={allowWeightLogging}
              weightUnit={weightUnit}
              onOpenMenu={() => handleOpenSetMenu(slot.setNumber)}
            />
          )
        })}

        {/* Add set button */}
        {!editingLogId && (
          <TouchableOpacity
            onPress={handleAddSet}
            disabled={anyLoading}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: `${colors.primary}50`,
              backgroundColor: `${colors.primary}15`,
              opacity: anyLoading ? 0.5 : 1,
            }}
          >
            {updateSessionExercise.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Plus size={18} color={colors.primary} />
            )}
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
              {updateSessionExercise.isPending ? 'Adding...' : 'Add Set'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Next exercise — tabs are the only other way to move, so the linear
            case gets a button. Filled once this exercise is done. */}
        {onNext && !editingLogId && (
          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isComplete ? colors.success : colors.borderSubtle,
              backgroundColor: isComplete ? colors.success : colors.bgSurface,
            }}
          >
            <Text
              style={{
                color: isComplete ? colors.textButton : colors.textSecondary,
                fontSize: 14,
                fontWeight: '700',
              }}
            >
              Next Exercise
            </Text>
            <ArrowRight size={18} color={isComplete ? colors.textButton : colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Previous session (at bottom for reference) */}
        {previous_sets.length > 0 && (() => {
          const totalVolume = previous_sets.reduce((sum, s) => sum + (s.weight ?? 0) * s.reps, 0)
          return (
            <View
              style={{
                marginTop: 10,
                borderRadius: 14,
                backgroundColor: colors.bgSurface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                overflow: 'hidden',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1,
                  color: colors.textSecondary,
                  paddingHorizontal: 14,
                  paddingTop: 12,
                  paddingBottom: 10,
                }}
              >
                LAST SESSION
              </Text>
              {previous_sets.map((prev, i) => {
                const setVolume = (prev.weight ?? 0) * prev.reps
                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.borderSubtle,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, width: 50 }}>
                      Set {prev.set_number}
                    </Text>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {allowWeightLogging && (
                        <>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }}>{prev.weight}</Text>
                          <Text style={{ fontSize: 14, color: colors.textMuted }}>{weightUnit}</Text>
                          <Text style={{ fontSize: 14, color: colors.textMuted, marginHorizontal: 2 }}>×</Text>
                        </>
                      )}
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }}>{prev.reps}</Text>
                      <Text style={{ fontSize: 14, color: colors.textMuted }}>reps</Text>
                    </View>
                    {allowWeightLogging && (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{setVolume} {weightUnit}</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>volume</Text>
                      </View>
                    )}
                  </View>
                )
              })}
              {allowWeightLogging && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.borderSubtle,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>Volume</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>{totalVolume} {weightUnit}</Text>
                </View>
              )}
            </View>
          )
        })()}
      </View>

      <SetOptionsMenu
        visible={setMenuSetNumber != null}
        onClose={() => setSetMenuSetNumber(null)}
        onEditSet={handleEditFromMenu}
        onRemoveSet={handleRemoveFromMenu}
        canEdit={!!canEditSet}
        canRemove={!!canRemoveSet}
        isRemoveLoading={deleteSet.isPending || updateSessionExercise.isPending}
      />
    </ScrollView>
  )

  // keyboard-controller's KAV on both platforms, deliberately: 341b495 replaced
  // the old `Platform.OS === 'ios' ? KAV : content` split because edge-to-edge
  // (app.json `edgeToEdgeEnabled`) stops adjustResize from resizing the window,
  // so Android has nothing insetting the ScrollView without it.
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      {content}
    </KeyboardAvoidingView>
  )
}
