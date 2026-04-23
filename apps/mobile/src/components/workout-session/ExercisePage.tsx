import { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import * as Haptics from 'expo-haptics'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { Plus, Trash2 } from 'lucide-react-native'
import {
  useLogSet,
  useUpdateSet,
  useDeleteSet,
  useUpdateSessionExercise,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { ProgressionBanner } from './ProgressionBanner'
import { ExerciseVideoCard } from './ExerciseVideoCard'
import { CompletedSetRow, PendingSetRow } from './SetRow'
import { SetLogCard } from './SetLogCard'
import { SetEditCard } from './SetEditCard'
import { RestTimer } from './RestTimer'
import { SetOptionsMenu } from './SetOptionsMenu'
import { ExerciseOptionsMenu } from './ExerciseOptionsMenu'
import type { SessionExerciseDetail } from '@fit-nation/shared'

const BODYWEIGHT_EQUIPMENT = ['BODYWEIGHT']

interface ExercisePageProps {
  exerciseDetail: SessionExerciseDetail
  sessionId: number
  exerciseCount: number
  onView: () => void
  onSwap: () => void
  onRemoveExercise: () => void
  isRemoveExerciseLoading: boolean
}

type SetSlot =
  | { kind: 'completed'; setNumber: number; logId: number; weight: number; reps: number }
  | { kind: 'pending'; setNumber: number }

export function ExercisePage({
  exerciseDetail,
  sessionId,
  exerciseCount,
  onView,
  onSwap,
  onRemoveExercise,
  isRemoveExerciseLoading,
}: ExercisePageProps) {
  const { colors } = useTheme()
  const logSet = useLogSet()
  const updateSet = useUpdateSet()
  const deleteSet = useDeleteSet()
  const updateSessionExercise = useUpdateSessionExercise()

  const [showRestTimer, setShowRestTimer] = useState(false)
  const [restSeconds, setRestSeconds] = useState(0)

  const [logWeight, setLogWeight] = useState('')
  const [logReps, setLogReps] = useState('')

  const [editingLogId, setEditingLogId] = useState<number | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')

  const [setMenuSetNumber, setSetMenuSetNumber] = useState<number | null>(null)
  const [showExerciseMenu, setShowExerciseMenu] = useState(false)

  const { session_exercise, logged_sets, previous_sets } = exerciseDetail
  const exercise = session_exercise.exercise
  const targetSets = session_exercise.target_sets ?? 0
  const minReps = session_exercise.min_target_reps ?? 0
  const maxReps = session_exercise.max_target_reps ?? 0
  const progressionMode = session_exercise.progression_mode
  const progressionStatus = session_exercise.progression_status ?? 'no_history'
  const allowWeightLogging = !BODYWEIGHT_EQUIPMENT.includes(
    exercise?.equipment_type?.code ?? ''
  )

  const primaryMuscle = useMemo(() => {
    const groups = exercise?.muscle_groups ?? []
    return (groups.find(m => m.is_primary) ?? groups[0])?.name ?? null
  }, [exercise])

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

  const prevSet1 = previous_sets.find(s => s.set_number === 1)
  const defaultWeight = session_exercise.target_weight ?? prevSet1?.weight ?? 0
  const defaultReps = prevSet1?.reps ?? (minReps > 0 ? minReps : 0)

  const anyLoading =
    logSet.isPending ||
    updateSet.isPending ||
    deleteSet.isPending ||
    updateSessionExercise.isPending

  const handleLog = useCallback(async () => {
    if (firstPendingSetNumber == null) return
    const reps = parseInt(logReps || '', 10)
    const weight = allowWeightLogging
      ? parseFloat(logWeight || '') || defaultWeight
      : 0
    const repsToLog = isNaN(reps) || reps <= 0 ? defaultReps : reps
    if (repsToLog <= 0) return

    try {
      await logSet.mutateAsync({
        sessionId,
        data: {
          exercise_id: session_exercise.exercise_id,
          set_number: firstPendingSetNumber,
          weight: weight ?? 0,
          reps: repsToLog,
          rest_seconds: session_exercise.rest_seconds ?? undefined,
        },
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setLogWeight('')
      setLogReps('')
      if (session_exercise.rest_seconds && session_exercise.rest_seconds > 0) {
        setRestSeconds(session_exercise.rest_seconds)
        setShowRestTimer(true)
      }
    } catch (err) {
      console.error('Log set failed:', err)
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
  ])

  const handleStartTimer = () => {
    if (session_exercise.rest_seconds && session_exercise.rest_seconds > 0) {
      setRestSeconds(session_exercise.rest_seconds)
      setShowRestTimer(true)
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
  const canEditSet = activeSlot?.kind === 'completed'
  const isLastSet =
    setMenuSetNumber != null && setMenuSetNumber === slots[slots.length - 1]?.setNumber
  const canRemoveSet = isLastSet && targetSets > 1

  const handleEditFromMenu = () => {
    if (activeSlot?.kind === 'completed') {
      setEditingLogId(activeSlot.logId)
      setEditWeight(activeSlot.weight.toString())
      setEditReps(activeSlot.reps.toString())
    }
    setSetMenuSetNumber(null)
  }

  const handleSaveEdit = useCallback(async () => {
    if (editingLogId == null) return
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
      Alert.alert('Cannot remove', 'Remove the exercise instead of the last set.')
      return
    }
    try {
      if (activeSlot.kind === 'completed') {
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

  const handleSwipeDeleteSet = useCallback(async (logId: number) => {
    if (targetSets <= 1) {
      Alert.alert('Cannot remove', 'Remove the exercise instead of the last set.')
      return
    }
    try {
      await deleteSet.mutateAsync({ sessionId, setLogId: logId })
      await updateSessionExercise.mutateAsync({
        sessionId,
        exerciseId: session_exercise.id,
        data: { target_sets: targetSets - 1 },
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } catch (err) {
      console.error('Swipe delete set failed:', err)
    }
  }, [deleteSet, updateSessionExercise, sessionId, session_exercise.id, targetSets])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgBase }}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero card */}
      <ExerciseVideoCard
        name={exercise?.name ?? 'Exercise'}
        muscleGroup={primaryMuscle}
        imageUrl={exercise?.image}
        videoUrl={exercise?.video}
        onOpenMenu={() => setShowExerciseMenu(true)}
        onView={onView}
      />

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

      {/* Rest timer */}
      {showRestTimer && (
        <View style={{ marginTop: 12 }}>
          <RestTimer
            seconds={restSeconds}
            onComplete={() => setShowRestTimer(false)}
            onSkip={() => setShowRestTimer(false)}
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
                />
              )
            }
            return (
              <Swipeable
                key={`done-${slot.setNumber}`}
                renderRightActions={() => (
                  <TouchableOpacity
                    onPress={() => handleSwipeDeleteSet(slot.logId)}
                    style={{
                      width: 72,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 14,
                      backgroundColor: '#EF4444',
                      marginLeft: 8,
                    }}
                  >
                    <Trash2 size={20} color="#fff" />
                  </TouchableOpacity>
                )}
                overshootRight={false}
              >
                <CompletedSetRow
                  setNumber={slot.setNumber}
                  weight={allowWeightLogging ? slot.weight : null}
                  reps={slot.reps}
                  allowWeightLogging={allowWeightLogging}
                  onOpenMenu={() => handleOpenSetMenu(slot.setNumber)}
                />
              </Swipeable>
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
                onWeightChange={setLogWeight}
                onRepsChange={setLogReps}
                onLog={handleLog}
                onStartTimer={handleStartTimer}
                defaultWeight={defaultWeight}
                defaultReps={defaultReps}
                allowWeightLogging={allowWeightLogging}
                goalMinReps={minReps}
                goalMaxReps={maxReps}
                goalWeight={session_exercise.target_weight}
                totalRepsPrevious={session_exercise.total_reps_previous}
                totalRepsTarget={session_exercise.total_reps_target}
                showTimerButton={!showRestTimer && !!session_exercise.rest_seconds}
              />
            )
          }

          return (
            <PendingSetRow
              key={`pending-${slot.setNumber}`}
              setNumber={slot.setNumber}
              allowWeightLogging={allowWeightLogging}
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

        {/* Previous session (at bottom for reference) */}
        {previous_sets.length > 0 && (
          <View
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 14,
              backgroundColor: colors.bgSurface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              LAST SESSION
            </Text>
            {previous_sets.map((prev, i) => (
              <Text
                key={i}
                style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 2 }}
              >
                Set {prev.set_number}:{' '}
                {allowWeightLogging ? `${prev.weight} kg × ` : ''}
                {prev.reps} reps
              </Text>
            ))}
          </View>
        )}
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

      <ExerciseOptionsMenu
        visible={showExerciseMenu}
        onClose={() => setShowExerciseMenu(false)}
        onView={() => {
          setShowExerciseMenu(false)
          onView()
        }}
        onSwap={() => {
          setShowExerciseMenu(false)
          onSwap()
        }}
        onRemove={() => {
          setShowExerciseMenu(false)
          onRemoveExercise()
        }}
        canRemove={exerciseCount > 1}
        isRemoveLoading={isRemoveExerciseLoading}
      />
    </ScrollView>
    </KeyboardAvoidingView>
  )
}
