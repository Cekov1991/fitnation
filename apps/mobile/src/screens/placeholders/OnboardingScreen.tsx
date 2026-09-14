import { useReducer, useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, Animated, StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation } from '@tanstack/react-query'
import { profileApi, onboardingApi, plansApi, submitOnboarding, withAlpha, FITNESS_GOAL_OPTIONS, labelFor } from '@fit-nation/shared'
import type { UpdateProfileInput } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { onboardingReducer, FIRST_STEP } from '../Onboarding/onboardingReducer'
import { PlanBuildingContent, PLAN_BUILD_BG } from '../../components/ui/PlanGeneratingOverlay'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import {
  AboutSection,
  GoalSection,
  TrainingSection,
  ONBOARDING_SECTIONS,
  PROFILE_SECTIONS,
  isSectionComplete,
} from '../../components/profile'
import { SCREEN } from '../../constants/layout'
import { NotificationPermissionSheet } from '../../components/ui/NotificationPermissionSheet'
import { isOnline } from '../../lib/connectivity'
import { getPermissionStatus } from '../../lib/notifications'
import { readPushPromptLastShownAt, shouldShowPermissionSheet } from '../../lib/pushPrompt'
import type { AppScreenProps } from '../../navigation/types'

// Steps 1-3 are the questions; step 4 builds the plan.
const TOTAL_DATA_STEPS = 3

type Phase = 'saving-profile' | 'generating-plan' | 'done' | 'error'

export function OnboardingScreen({ navigation }: AppScreenProps<'Onboarding'>) {
  const { colors } = useTheme()
  const { user, refreshUser } = useAuth()
  const insets = useSafeAreaInsets()

  // Pre-fill from existing profile so re-entrant users see their saved data
  const [state, dispatch] = useReducer(onboardingReducer, {
    currentStep: FIRST_STEP,
    fitness_goal: user?.profile?.fitness_goal ?? undefined,
    age: user?.profile?.age ?? undefined,
    gender: user?.profile?.gender ?? undefined,
    height: user?.profile?.height ?? undefined,
    // No rounding: imperial body weight arrives at the nearest 0.5 lb.
    weight: user?.profile?.weight ?? undefined,
    unit_system: user?.profile?.unit_system ?? 'metric',
    training_experience: user?.profile?.training_experience ?? undefined,
    training_days_per_week: user?.profile?.training_days_per_week ?? undefined,
    workout_duration_minutes: user?.profile?.workout_duration_minutes ?? undefined,
  })
  const [phase, setPhase] = useState<Phase>('saving-profile')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const step = state.currentStep
  const isBuilding = step === 4
  // Steps 1–3 are the shared profile sections; the wizard only adds the chrome.
  const section = isBuilding ? null : ONBOARDING_SECTIONS[step - 1]

  useEffect(() => {
    fadeAnim.setValue(0)
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start()
  }, [step])

  // The profile save and the finish are one named action (0026): a retry after
  // a failed finish re-runs only the finish, not the profile PUT.
  const profileSavedRef = useRef(false)
  const submitMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null)
      // Offline is worth saying at once rather than after a request that would
      // sit on the build screen until it timed out.
      if (!(await isOnline())) {
        throw new Error('No internet connection. Reconnect and try again.')
      }
      const { currentStep: _, ...profileData } = state
      const outcome = await submitOnboarding(
        {
          saveProfile: profile => profileApi.updateProfile(profile),
          // First-time users complete onboarding (one-shot); returning users regenerate
          finish: () => (user?.onboarding_completed_at ? plansApi.regeneratePlan() : onboardingApi.completeOnboarding()),
          onStep: s => setPhase(s === 'profile' ? 'saving-profile' : 'generating-plan'),
        },
        { profile: profileData, profileSaved: profileSavedRef.current }
      )
      if (!outcome.ok) {
        profileSavedRef.current = outcome.failed === 'finish'
        throw outcome.error instanceof Error ? outcome.error : new Error('Something went wrong. Please try again.')
      }
      profileSavedRef.current = false
    },
    onSuccess: () => setPhase('done'),
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setPhase('error')
    },
  })

  // Auto-start submission when reaching the build step
  useEffect(() => {
    if (isBuilding) submitMutation.mutate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuilding])

  function next() { dispatch({ type: 'NEXT' }) }
  function back() { dispatch({ type: 'BACK' }) }
  function set(payload: Partial<UpdateProfileInput>) { dispatch({ type: 'SET', payload }) }

  function canProceed() {
    return section ? isSectionComplete(section, state) : true
  }

  // Ask for push permission here, behind an explainer — the contextual moment
  // (0012 M3, cadence per 0013 R10–R12: not if granted, nor within 7 days of
  // the sheet last showing). Onboarding always uses the 'ask' variant.
  async function leaveOnboarding() {
    try { await refreshUser() } catch { /* proceed anyway */ }
    if (await shouldAskForPush()) {
      setSheetVisible(true)
      return
    }
    navigation.replace('Tabs')
  }

  async function shouldAskForPush(): Promise<boolean> {
    // `user` here is the render-time value, i.e. from before refreshUser():
    // set ⇒ a returning user regenerating a plan, who was already asked once.
    if (user?.onboarding_completed_at) return false
    try {
      const [status, lastShownAt] = await Promise.all([
        getPermissionStatus(),
        readPushPromptLastShownAt(),
      ])
      return shouldShowPermissionSheet(status, lastShownAt, Date.now())
    } catch {
      return false
    }
  }

  const [sheetVisible, setSheetVisible] = useState(false)

  // A failed build must not be a dead end: stepping back re-opens the last
  // question. The profile is re-sent on the next attempt (rather than skipped
  // as a retry would) because the answers may have changed in between.
  function backToQuestions() {
    profileSavedRef.current = false
    setErrorMsg(null)
    setPhase('saving-profile')
    back()
  }

  if (isBuilding) {
    return (
      <BuildStep
        colors={colors}
        phase={phase}
        errorMsg={errorMsg}
        firstName={user?.name?.trim().split(' ')[0] ?? null}
        goalLabel={labelFor(FITNESS_GOAL_OPTIONS, state.fitness_goal)}
        days={state.training_days_per_week ?? 0}
        onRetry={() => submitMutation.mutate()}
        onBack={backToQuestions}
        onFinished={leaveOnboarding}
        sheetVisible={sheetVisible}
        onSheetClose={() => navigation.replace('Tabs')}
      />
    )
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bgBase }]}>

      {/* Back arrow + one segment per question */}
      <View style={styles.header}>
        {step > FIRST_STEP ? (
          <Button label="Back" variant="ghost" size="sm" onPress={back} style={styles.backButton} />
        ) : null}
        <View style={styles.segments}>
          {Array.from({ length: TOTAL_DATA_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i < step ? colors.primary : withAlpha(colors.textMuted, 0.25) },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {section && (
            <>
              <Text style={[styles.headline, { color: colors.textPrimary }]}>{PROFILE_SECTIONS[section].question}</Text>
              <Text style={[styles.subhead, { color: colors.textSecondary }]}>
                {section === 'training' ? 'Last step — then we build your plan.' : PROFILE_SECTIONS[section].hint}
              </Text>
            </>
          )}
          {section === 'goal' && <GoalSection value={state.fitness_goal} onChange={v => set({ fitness_goal: v })} />}
          {section === 'about' && <AboutSection draft={state} onChange={set} />}
          {section === 'training' && <TrainingSection draft={state} onChange={set} />}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={step === 3 ? 'Build My Plan' : 'Continue'}
          disabled={!canProceed()}
          onPress={next}
        />
      </View>

    </SafeAreaView>
  )
}

// ─── Step 4: Building your plan ──────────────────────────────────────────────

function BuildStep({ colors, phase, errorMsg, firstName, goalLabel, days, onRetry, onBack, onFinished, sheetVisible, onSheetClose }: {
  colors: ReturnType<typeof useTheme>['colors']
  phase: Phase
  errorMsg: string | null
  firstName: string | null
  goalLabel: string
  days: number
  onRetry: () => void
  onBack: () => void
  onFinished: () => void
  sheetVisible: boolean
  onSheetClose: () => void
}) {
  // A beat on the completed list, so the last tick is seen before we leave.
  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(onFinished, 900)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // A failed build is the app's one error state, on the themed background:
  // <ErrorState> paints its text in textPrimary, which the navy build scene
  // cannot carry in the light theme.
  if (phase === 'error') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={[styles.buildScreen, { backgroundColor: colors.bgBase }]}>
        <ErrorState message={errorMsg ?? 'Something went wrong. Please try again.'} onRetry={onRetry} />
        <View style={styles.footer}>
          <Button label="Back to Questions" variant="ghost" onPress={onBack} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.buildScreen, { backgroundColor: PLAN_BUILD_BG }]}>
      <NotificationPermissionSheet visible={sheetVisible} onClose={onSheetClose} />

      <PlanBuildingContent
        stage={phase === 'saving-profile' ? 'preparing' : phase === 'done' ? 'done' : 'building'}
        title="Building your plan"
        subtitle={`A few seconds. Hang tight${firstName ? `, ${firstName}` : ''}.`}
        goalLabel={goalLabel}
        daysPerWeek={days}
      />

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: SCREEN.paddingX, paddingTop: 12, paddingBottom: 20 },
  backButton: { alignSelf: 'center' },
  segments: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 3, borderRadius: 999 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: SCREEN.paddingX, paddingBottom: 16 },
  headline: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  subhead: { fontSize: 15, marginTop: 8, marginBottom: 24, lineHeight: 21 },

  footer: { paddingHorizontal: SCREEN.paddingX, paddingTop: 8 },

  buildScreen: { flex: 1 },
})
