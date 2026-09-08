import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import {
  AppState,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native'
import type { NavigationAction } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSharedValue, useFrameCallback } from 'react-native-reanimated'
import { useKeepAwake } from 'expo-keep-awake'
import * as Haptics from 'expo-haptics'
import { usePreventRemove } from '@react-navigation/native'
import { Clock, Check, X } from 'lucide-react-native'
import {
  useSession,
  useCompleteSession,
  useCancelSession,
  useRemoveSessionExercise,
  isExerciseComplete,
  withAlpha,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { ExercisePage } from '../../components/workout-session/ExercisePage'
import { ExerciseNavTabs } from '../../components/workout-session/ExerciseNavTabs'
import { SessionClock } from '../../components/workout-session/SessionClock'
import { RestTimer } from '../../components/workout-session/RestTimer'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ExerciseOptionsMenu } from '../../components/workout-session/ExerciseOptionsMenu'
import { showToast } from '../../lib/toast'
import { startRestAlert, adjustRestAlert, cancelRestAlert } from '../../lib/restTimerAlert'
import type { AppScreenProps } from '../../navigation/types'
import type { CompleteSessionResponse, SessionExerciseDetail } from '@fit-nation/shared'

type Props = AppScreenProps<'WorkoutSession'>

interface SetDraft {
  weight: string
  reps: string
}

const EMPTY_DRAFT: SetDraft = { weight: '', reps: '' }

export function WorkoutSessionScreen({ route, navigation }: Props) {
  useKeepAwake()
  const { sessionId } = route.params
  const { colors } = useTheme()
  const numericSessionId = Number(sessionId)

  const { data: sessionData, isLoading, isError, refetch } = useSession(numericSessionId)
  const completeSession = useCompleteSession()
  const cancelSession = useCancelSession()
  const removeSessionExercise = useRemoveSessionExercise()

  const [currentIndex, setCurrentIndex] = useState(0)

  // Confirmation dialog state
  const [backInterceptAction, setBackInterceptAction] = useState<NavigationAction | null>(null)
  const [cancelVisible, setCancelVisible] = useState(false)
  const [finishVisible, setFinishVisible] = useState(false)
  const [removeExerciseVisible, setRemoveExerciseVisible] = useState(false)
  // The exercise whose options menu is open — not necessarily the current one,
  // since every nav tab carries its own ⋯ button. Held as the exercise itself
  // rather than an index: indices shift under a refetch, and every action needs
  // the detail anyway.
  const [menuExercise, setMenuExercise] = useState<SessionExerciseDetail | null>(null)
  const [removeExerciseName, setRemoveExerciseName] = useState<string>('')
  const removeExerciseRefId = useRef<number | null>(null)
  // Exercise to land on once a removal is reflected in the refetched list.
  const pendingLandingIdRef = useRef<number | null>(null)

  // Rest timer lives here, not in the page, so it survives switching exercise.
  // restRunId is bumped on every start and used as RestTimer's key: restarting
  // a rest of the same duration must reset the countdown, and a prop-keyed
  // effect alone would not notice an unchanged `seconds`.
  const [restSeconds, setRestSeconds] = useState(0)
  const [restRunId, setRestRunId] = useState(0)
  const isRestRunning = restSeconds > 0

  // Draft set input, so a half-typed set survives a glance at another exercise.
  // Keyed by session_exercise id *and* exercise_id: a swap updates the row in
  // place (`$sessionExercise->update(['exercise_id' => …])`), so the id alone
  // would hand a weight typed for Bench Press to the movement that replaced it.
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({})

  // Clock driven on the UI thread — no setState every second.
  // SharedValue so both the JS thread and the UI-thread worklet can write to it safely.
  const startTimeSV = useSharedValue(Date.now())
  const elapsedSV = useSharedValue(0)
  useFrameCallback(() => {
    elapsedSV.value = Math.floor((Date.now() - startTimeSV.value) / 1000)
  })

  // Tracks intentional exits so usePreventRemove lets them through
  const isCleanExitRef = useRef(false)

  usePreventRemove(true, ({ data }) => {
    if (isCleanExitRef.current) {
      navigation.dispatch(data.action)
      return
    }
    setBackInterceptAction(data.action)
  })

  const performCancelFromBackIntercept = async () => {
    const action = backInterceptAction
    if (!action) return
    try {
      await cancelSession.mutateAsync(numericSessionId)
      isCleanExitRef.current = true
      cancelRestAlert()
      navigation.dispatch(action)
    } catch (error) {
      console.error('Failed to cancel session:', error)
      // Nothing else to undo: the dispatch never ran and isCleanExitRef is
      // still false, so the user simply stays in the session. ConfirmDialog
      // closes itself on confirm, so clearing backInterceptAction here would
      // only dismiss a dialog they had since re-opened with another back.
      showToast("Couldn't cancel the workout.", 'error')
    }
  }

  // Sync start time from server and correct clock on app foreground
  useEffect(() => {
    if (sessionData?.performed_at) {
      startTimeSV.value = new Date(sessionData.performed_at).getTime()
    }
  }, [sessionData?.performed_at])

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        elapsedSV.value = Math.floor((Date.now() - startTimeSV.value) / 1000)
      }
    })
    return () => sub.remove()
  }, [elapsedSV])

  const exercises: SessionExerciseDetail[] = (sessionData as any)?.exercises ?? []
  const exerciseCount = exercises.length

  // Clamp during render, not only in the effect below: an effect runs after
  // commit, so a list that shrinks by any other path (focus refetch, another
  // client) would paint the "No exercises in this session." empty state for a
  // frame with an out-of-range index.
  const safeIndex = exerciseCount > 0 ? Math.min(currentIndex, exerciseCount - 1) : 0

  useEffect(() => {
    if (currentIndex >= exerciseCount && exerciseCount > 0) {
      setCurrentIndex(exerciseCount - 1)
    }
  }, [currentIndex, exerciseCount])

  // Move to the landing exercise as soon as the removal shows up in the list,
  // which the hook's optimistic onMutate makes immediate. Deliberately the only
  // place that sets the index for a removal: setting it here *and* eagerly
  // before the request is what made the tab strip animate twice.
  useEffect(() => {
    const landingId = pendingLandingIdRef.current
    if (landingId == null) return
    const removedId = removeExerciseRefId.current
    const removalApplied =
      removedId == null || !exercises.some(ex => ex.session_exercise.id === removedId)
    if (!removalApplied) return
    const idx = exercises.findIndex(ex => ex.session_exercise.id === landingId)
    pendingLandingIdRef.current = null
    if (idx !== -1) setCurrentIndex(idx)
  }, [exercises])

  const currentExercise: SessionExerciseDetail | undefined =
    exerciseCount > 0 ? exercises[safeIndex] : undefined
  const draftKey =
    currentExercise != null
      ? `${currentExercise.session_exercise.id}:${currentExercise.session_exercise.exercise_id}`
      : null

  const goToPage = useCallback((idx: number) => {
    setCurrentIndex(idx)
  }, [])

  // Read through a ref so handleStartRest keeps a stable identity for ExercisePage.
  const currentExerciseNameRef = useRef<string | null>(null)
  currentExerciseNameRef.current = currentExercise?.session_exercise.exercise?.name ?? null

  // 0013 R1: the OS-side alert is scheduled at rest start and cancelled on
  // every way a rest ends, so the phone interrupts the user even when locked.
  const handleStartRest = useCallback((seconds: number) => {
    setRestSeconds(seconds)
    setRestRunId(id => id + 1)
    startRestAlert({ seconds, exerciseName: currentExerciseNameRef.current })
  }, [])

  // Skip: the user is looking at the screen, so the OS alert is unwanted.
  const handleRestSkipped = useCallback(() => {
    setRestSeconds(0)
    cancelRestAlert()
  }, [])

  // Zero: the ring has hit zero and the haptic fires, so in the foreground the
  // OS alert would be a duplicate. In the background the JS clock can still
  // reach zero (Android keeps the process around) — there the alert is the
  // whole point, so leave it to the OS side.
  const handleRestCompleted = useCallback(() => {
    setRestSeconds(0)
    if (AppState.currentState === 'active') cancelRestAlert()
  }, [])

  // Leaving the screen by any path — including an unmount we did not
  // orchestrate — must not leave an alert armed.
  useEffect(() => () => {
    cancelRestAlert()
  }, [])

  const draft = (draftKey != null && drafts[draftKey]) || EMPTY_DRAFT

  const handleLogWeightChange = useCallback(
    (value: string) => {
      if (draftKey == null) return
      setDrafts(prev => ({
        ...prev,
        [draftKey]: { ...(prev[draftKey] ?? EMPTY_DRAFT), weight: value },
      }))
    },
    [draftKey]
  )

  const handleLogRepsChange = useCallback(
    (value: string) => {
      if (draftKey == null) return
      setDrafts(prev => ({
        ...prev,
        [draftKey]: { ...(prev[draftKey] ?? EMPTY_DRAFT), reps: value },
      }))
    },
    [draftKey]
  )

  // Strictly forward — the button says "Next Exercise" and carries a right
  // arrow. Wrapping back to an earlier incomplete exercise would contradict
  // that, and would trap the user on any exercise that can never read complete
  // (null/0 target_sets, or a log orphaned above target — specs 0005 / 0007).
  const nextIndex = useMemo<number | null>(() => {
    for (let i = safeIndex + 1; i < exerciseCount; i++) {
      if (!isExerciseComplete(exercises[i])) return i
    }
    return safeIndex + 1 < exerciseCount ? safeIndex + 1 : null
  }, [exercises, safeIndex, exerciseCount])

  const handleNext = useCallback(() => {
    if (nextIndex != null) setCurrentIndex(nextIndex)
  }, [nextIndex])

  const handleView = useCallback(
    (detail: SessionExerciseDetail | undefined) => {
      const exerciseId = detail?.session_exercise.exercise_id
      if (exerciseId != null) {
        navigation.navigate('WorkoutSessionExerciseDetail', { sessionId, exerciseId })
      }
    },
    [navigation, sessionId]
  )

  const handleSwap = useCallback(
    (detail: SessionExerciseDetail | undefined) => {
      if (!detail) return
      navigation.navigate('WorkoutPreviewExercisePicker', {
        sessionId,
        swapExerciseId: detail.session_exercise.id,
        swapMuscleGroupId: detail.session_exercise.exercise?.muscle_groups?.find(m => m.is_primary)?.id.toString(),
      })
    },
    [navigation, sessionId]
  )

  const handleRemove = useCallback(
    (detail: SessionExerciseDetail | undefined) => {
      if (!detail) return
      if (exerciseCount <= 1) {
        showToast('The workout needs at least one exercise.', 'error')
        return
      }
      removeExerciseRefId.current = detail.session_exercise.id
      setRemoveExerciseName(detail.session_exercise.exercise?.name ?? 'this exercise')
      setRemoveExerciseVisible(true)
    },
    [exerciseCount]
  )

  const performRemoveExercise = async () => {
    const exerciseId = removeExerciseRefId.current
    if (exerciseId == null) return

    // Name the destination by id, not index: the optimistic removal reshuffles
    // indices the moment the mutation fires. Removing the exercise on screen
    // lands on the one after it, falling back to the one before when it was
    // last; removing any other exercise (reachable from every tab's menu) must
    // not drag the user off the one they are logging, so they stay put.
    const removingIdx = exercises.findIndex(ex => ex.session_exercise.id === exerciseId)
    if (removingIdx !== -1) {
      const landing =
        removingIdx === safeIndex
          ? exercises[removingIdx + 1] ?? exercises[removingIdx - 1]
          : currentExercise
      pendingLandingIdRef.current = landing?.session_exercise.id ?? null
    }

    try {
      await removeSessionExercise.mutateAsync({
        sessionId: numericSessionId,
        exerciseId,
      })
    } catch (error) {
      console.error('Failed to remove exercise:', error)
      showToast("Couldn't remove that exercise.", 'error')
    }
  }

  const handleFinish = useCallback(() => {
    setFinishVisible(true)
  }, [])

  const performFinish = async () => {
    try {
      const result: CompleteSessionResponse = await completeSession.mutateAsync({ sessionId: numericSessionId })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      isCleanExitRef.current = true
      cancelRestAlert()
      navigation.replace('WorkoutSummary', {
        sessionId,
        newPrs: result.new_prs ?? [],
      })
    } catch (error) {
      console.error('Failed to complete session:', error)
      // isCleanExitRef stays false and no navigation fires, so the user is left
      // on the session with Finish tappable again. Their sets are already
      // persisted one by one — say so, or a failed finish reads as a lost workout.
      showToast("Couldn't finish the workout. Your sets are saved — try again.", 'error')
    }
  }

  const handleCancel = useCallback(() => {
    setCancelVisible(true)
  }, [])

  const performCancel = async () => {
    try {
      await cancelSession.mutateAsync(numericSessionId)
      isCleanExitRef.current = true
      cancelRestAlert()
      navigation.goBack()
    } catch (error) {
      console.error('Failed to cancel session:', error)
      showToast("Couldn't cancel the workout.", 'error')
    }
  }

  // The menu's three actions differ only in which handler they call; all three
  // close the sheet first so it is never left open over a navigation.
  const runOnMenuExercise = useCallback(
    (fn: (detail: SessionExerciseDetail | undefined) => void) => {
      const target = menuExercise ?? undefined
      setMenuExercise(null)
      fn(target)
    },
    [menuExercise]
  )

  const handleAddExercise = useCallback(() => {
    navigation.navigate('WorkoutPreviewExercisePicker', { sessionId })
  }, [navigation, sessionId])

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View className="px-5 pt-4">
          <SkeletonBox height={50} style={{ marginBottom: 16 }} />
          <SkeletonBox height={60} style={{ marginBottom: 16 }} />
          <SkeletonBox height={240} style={{ marginBottom: 12 }} />
          <SkeletonBox height={80} style={{ marginBottom: 12 }} />
          <SkeletonBox height={80} />
        </View>
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <ErrorState message="Failed to load workout session" onRetry={refetch} />
      </SafeAreaView>
    )
  }

  const allDone = exerciseCount > 0 && exercises.every(isExerciseComplete)

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6 py-3"
          style={{ borderBottomWidth: 1, borderBottomColor: withAlpha(colors.textMuted, 0.125) }}
        >
          <TouchableOpacity
            onPress={handleCancel}
            disabled={cancelSession.isPending}
            className="flex-row items-center gap-1.5"
          >
            <X size={16} color={colors.error} />
            <Text style={{ color: colors.error, fontWeight: '600', fontSize: 14 }}>
              {cancelSession.isPending ? 'Cancelling...' : 'Cancel'}
            </Text>
          </TouchableOpacity>

          <View className="items-center gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <Clock size={14} color={colors.textMuted} />
              <SessionClock
                elapsedSV={elapsedSV}
                color={colors.textPrimary}
                fontSize={14}
                fontWeight="500"
              />
            </View>
            {exerciseCount > 0 && (
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {safeIndex + 1} / {exerciseCount}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleFinish}
            disabled={completeSession.isPending}
            className="flex-row items-center gap-1.5"
          >
            <Check size={16} color={colors.success} />
            <Text style={{ color: colors.success, fontWeight: '600', fontSize: 14 }}>
              {completeSession.isPending ? 'Finishing...' : 'Finish'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Exercise tabs — the only way to switch exercise */}
        <ExerciseNavTabs
          exercises={exercises}
          currentIndex={safeIndex}
          onSelect={goToPage}
          onOpenMenu={setMenuExercise}
          onAddExercise={handleAddExercise}
        />

        {/* Rest timer — above the page so it outlives an exercise switch and
            stays put while the set list scrolls */}
        {isRestRunning && (
          <View style={{ marginBottom: 12 }}>
            <RestTimer
              key={restRunId}
              seconds={restSeconds}
              onComplete={handleRestCompleted}
              onSkip={handleRestSkipped}
              onAdjust={adjustRestAlert}
            />
          </View>
        )}

        {/* Current exercise */}
        {currentExercise ? (
          <ExercisePage
            key={`${currentExercise.session_exercise.id}:${currentExercise.session_exercise.exercise_id}`}
            exerciseDetail={currentExercise}
            sessionId={numericSessionId}
            logWeight={draft.weight}
            logReps={draft.reps}
            onLogWeightChange={handleLogWeightChange}
            onLogRepsChange={handleLogRepsChange}
            isRestRunning={isRestRunning}
            onStartRest={handleStartRest}
            onNext={nextIndex != null ? handleNext : undefined}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              No exercises in this session.
            </Text>
            <TouchableOpacity
              onPress={handleAddExercise}
              activeOpacity={0.85}
              style={{
                marginTop: 16,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.textButton, fontWeight: '700' }}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Finish footer when all sets are done */}
        {allDone && (
          <SafeAreaView edges={['bottom']}>
            <TouchableOpacity
              onPress={handleFinish}
              style={{ margin: 16, borderRadius: 16, overflow: 'hidden' }}
              activeOpacity={0.85}
            >
              <View
                style={{
                  paddingVertical: 18,
                  alignItems: 'center',
                  backgroundColor: colors.success,
                }}
              >
                <Text style={{ color: colors.textButton, fontSize: 17, fontWeight: '700' }}>
                  FINISH WORKOUT
                </Text>
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        )}
      </SafeAreaView>

      <ExerciseOptionsMenu
        visible={menuExercise != null}
        onClose={() => setMenuExercise(null)}
        onView={() => runOnMenuExercise(handleView)}
        onSwap={() => runOnMenuExercise(handleSwap)}
        onRemove={() => runOnMenuExercise(handleRemove)}
        canRemove={exerciseCount > 1}
        isRemoveLoading={removeSessionExercise.isPending}
      />

      <ConfirmDialog
        visible={!!backInterceptAction}
        onClose={() => setBackInterceptAction(null)}
        title="Cancel Workout?"
        message="Are you sure you want to cancel this workout? Your progress will be lost."
        confirmLabel="Cancel Workout"
        cancelLabel="Keep Going"
        destructive
        onConfirm={performCancelFromBackIntercept}
      />

      <ConfirmDialog
        visible={cancelVisible}
        onClose={() => setCancelVisible(false)}
        title="Cancel Workout?"
        message="Are you sure you want to cancel this workout? Your progress will be lost."
        confirmLabel="Cancel Workout"
        cancelLabel="Keep Going"
        destructive
        onConfirm={performCancel}
      />

      <ConfirmDialog
        visible={finishVisible}
        onClose={() => setFinishVisible(false)}
        title="Finish Workout?"
        message="Are you sure you want to end this session?"
        confirmLabel="Finish"
        cancelLabel="Keep Going"
        onConfirm={performFinish}
      />

      <ConfirmDialog
        visible={removeExerciseVisible}
        onClose={() => setRemoveExerciseVisible(false)}
        title="Remove Exercise?"
        message={`Remove "${removeExerciseName}" from the workout?`}
        confirmLabel="Remove"
        destructive
        onConfirm={performRemoveExercise}
      />
    </View>
  )
}
