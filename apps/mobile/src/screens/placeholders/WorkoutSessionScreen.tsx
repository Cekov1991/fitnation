import { useRef, useState, useEffect, useCallback } from 'react'
import {
  AppState,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import PagerView from 'react-native-pager-view'
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
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { ExercisePage } from '../../components/workout-session/ExercisePage'
import { ExerciseNavTabs } from '../../components/workout-session/ExerciseNavTabs'
import { SessionClock } from '../../components/workout-session/SessionClock'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ErrorState } from '../../components/ui/ErrorState'
import type { AppScreenProps } from '../../navigation/types'
import type { CompleteSessionResponse, SessionExerciseDetail } from '@fit-nation/shared'

type Props = AppScreenProps<'WorkoutSession'>

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

  // Clock driven on the UI thread — no setState every second.
  // SharedValue so both the JS thread and the UI-thread worklet can write to it safely.
  const startTimeSV = useSharedValue(Date.now())
  const elapsedSV = useSharedValue(0)
  useFrameCallback(() => {
    elapsedSV.value = Math.floor((Date.now() - startTimeSV.value) / 1000)
  })

  const pagerRef = useRef<PagerView>(null)

  // Tracks intentional exits so usePreventRemove lets them through
  const isCleanExitRef = useRef(false)

  usePreventRemove(true, ({ data }) => {
    if (isCleanExitRef.current) {
      navigation.dispatch(data.action)
      return
    }
    Alert.alert(
      'Cancel Workout?',
      'Are you sure you want to cancel this workout? Your progress will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSession.mutateAsync(numericSessionId)
              isCleanExitRef.current = true
              navigation.dispatch(data.action)
            } catch (error) {
              console.error('Failed to cancel session:', error)
            }
          },
        },
      ]
    )
  })

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

  // Clamp currentIndex when exercises change (e.g. after removal)
  useEffect(() => {
    if (currentIndex >= exerciseCount && exerciseCount > 0) {
      setCurrentIndex(exerciseCount - 1)
    }
  }, [currentIndex, exerciseCount])

  const goToPage = useCallback((idx: number) => {
    setCurrentIndex(idx)
    pagerRef.current?.setPage(idx)
  }, [])

  // ─── Stable callbacks using refs so memoized ExercisePage never re-renders
  //     just because currentIndex or exercises changed ────────────────────────
  const currentExerciseRef = useRef<SessionExerciseDetail | null>(null)
  const exerciseCountRef = useRef(exerciseCount)
  useEffect(() => {
    currentExerciseRef.current = exercises[currentIndex] ?? null
    exerciseCountRef.current = exerciseCount
  }, [exercises, currentIndex, exerciseCount])

  const removeSessionExerciseRef = useRef(removeSessionExercise)
  useEffect(() => { removeSessionExerciseRef.current = removeSessionExercise }, [removeSessionExercise])

  const handleViewCurrent = useCallback(() => {
    const name = currentExerciseRef.current?.session_exercise.exercise?.name
    if (name) {
      navigation.navigate('WorkoutSessionExerciseDetail', { sessionId, exerciseName: name })
    }
  }, [navigation, sessionId])

  const handleSwapCurrent = useCallback(() => {
    const current = currentExerciseRef.current
    if (!current) return
    navigation.navigate('WorkoutPreviewExercisePicker', {
      sessionId,
      swapExerciseId: current.session_exercise.id,
    })
  }, [navigation, sessionId])

  const handleRemoveCurrent = useCallback(() => {
    const current = currentExerciseRef.current
    if (!current) return
    if (exerciseCountRef.current <= 1) {
      Alert.alert('Cannot remove', 'The workout needs at least one exercise.')
      return
    }
    Alert.alert(
      'Remove Exercise?',
      `Remove "${current.session_exercise.exercise?.name ?? 'this exercise'}" from the workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSessionExerciseRef.current.mutateAsync({
                sessionId: numericSessionId,
                exerciseId: current.session_exercise.id,
              })
            } catch (error) {
              console.error('Failed to remove exercise:', error)
            }
          },
        },
      ]
    )
  }, [numericSessionId])
  // ──────────────────────────────────────────────────────────────────────────

  const handleFinish = useCallback(() => {
    Alert.alert('Finish Workout?', 'Are you sure you want to end this session?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Finish',
        style: 'default',
        onPress: async () => {
          try {
            const result: CompleteSessionResponse = await completeSession.mutateAsync({ sessionId: numericSessionId })
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            isCleanExitRef.current = true
            navigation.replace('WorkoutSummary', {
              sessionId,
              newPrs: result.new_prs ?? [],
            })
          } catch (error) {
            console.error('Failed to complete session:', error)
          }
        },
      },
    ])
  }, [completeSession, numericSessionId, navigation, sessionId])

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Workout?',
      'Are you sure you want to cancel this workout? Your progress will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSession.mutateAsync(numericSessionId)
              isCleanExitRef.current = true
              navigation.goBack()
            } catch (error) {
              console.error('Failed to cancel session:', error)
            }
          },
        },
      ]
    )
  }, [cancelSession, numericSessionId, navigation])

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

  const allDone =
    exerciseCount > 0 &&
    exercises.every(ex => {
      const logged = ex.logged_sets?.length ?? 0
      const target = ex.session_exercise.target_sets ?? 0
      return target > 0 && logged >= target
    })

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6 py-3"
          style={{ borderBottomWidth: 1, borderBottomColor: `${colors.textMuted}20` }}
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
                {currentIndex + 1} / {exerciseCount}
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

        {/* Exercise tabs */}
        <ExerciseNavTabs
          exercises={exercises}
          currentIndex={currentIndex}
          onSelect={goToPage}
          onAddExercise={handleAddExercise}
        />

        {/* Pages */}
        {exerciseCount > 0 ? (
          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={0}
            offscreenPageLimit={1}
            onPageSelected={e => setCurrentIndex(e.nativeEvent.position)}
          >
            {exercises.map((exerciseDetail, index) => (
              <View key={exerciseDetail.session_exercise.id} style={{ flex: 1 }}>
                <ExercisePage
                  exerciseDetail={exerciseDetail}
                  sessionId={numericSessionId}
                  exerciseCount={exerciseCount}
                  isActive={index === currentIndex}
                  onView={handleViewCurrent}
                  onSwap={handleSwapCurrent}
                  onRemoveExercise={handleRemoveCurrent}
                  isRemoveExerciseLoading={removeSessionExercise.isPending}
                />
              </View>
            ))}
          </PagerView>
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
              <Text style={{ color: '#fff', fontWeight: '700' }}>Add Exercise</Text>
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
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
                  FINISH WORKOUT
                </Text>
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        )}
      </SafeAreaView>
    </View>
  )
}
