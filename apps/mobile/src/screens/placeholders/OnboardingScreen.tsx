import { useReducer, useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Animated,
  ActivityIndicator, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useMutation } from '@tanstack/react-query'
// unitSystem here is form state, not the saved profile, so the pure label
// helpers are used rather than the useWeightUnit()/useHeightUnit() hooks.
import { profileApi, onboardingApi, plansApi, weightUnitLabel, heightUnitLabel, sanitizeDecimalText, parseDecimalText, UNIT_OPTIONS, submitOnboarding, withAlpha, FITNESS_GOAL_OPTIONS, TRAINING_EXPERIENCE_OPTIONS, WORKOUT_DURATION_OPTIONS, TRAINING_DAYS_OPTIONS, labelFor } from '@fit-nation/shared'
import type { UpdateProfileInput, UnitSystem } from '@fit-nation/shared'
import {
  Dumbbell, ArrowRight, ArrowLeft,
  HeartPulse, TrendingDown, Target,
  CheckCircle, AlertCircle,
} from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../../components/ui/Input'
import { onboardingReducer } from '../Onboarding/onboardingReducer'
import { PlanGeneratingContent } from '../../components/ui/PlanGeneratingOverlay'
import { NotificationPermissionSheet } from '../../components/ui/NotificationPermissionSheet'
import { getPermissionStatus } from '../../lib/notifications'
import { readPushPromptLastShownAt, shouldShowPermissionSheet } from '../../lib/pushPrompt'
import type { AppScreenProps } from '../../navigation/types'

const localLogo = require('../../../assets/logo.png')

// Steps 1-3 are data-collection steps (shown in progress bar)
const TOTAL_DATA_STEPS = 3

// Icons are this screen's; the values, labels and descriptions are the shared table's.
const GOAL_ICONS = { general_fitness: HeartPulse, fat_loss: TrendingDown, muscle_gain: Dumbbell, strength: Target } as const
const FITNESS_GOALS = FITNESS_GOAL_OPTIONS.map(o => ({ value: o.value, label: o.label, description: o.description, Icon: GOAL_ICONS[o.value] }))

const EXPERIENCE_LEVELS = TRAINING_EXPERIENCE_OPTIONS

const DURATION_OPTIONS = WORKOUT_DURATION_OPTIONS

type Phase = 'saving-profile' | 'generating-plan' | 'plan-success' | 'push-prompt' | 'error'

export function OnboardingScreen({ navigation }: AppScreenProps<'Onboarding'>) {
  const { colors } = useTheme()
  const { user, refreshUser } = useAuth()

  const partnerName = user?.partner?.name ?? 'Fit Nation'
  const partnerLogoUrl = user?.partner?.visual_identity?.logo ?? null

  // Pre-fill from existing profile so re-entrant users see their saved data
  const [state, dispatch] = useReducer(onboardingReducer, {
    currentStep: 0,
    name: user?.name ?? undefined,
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

  // Labels only — the API converts height/weight from the unit_system sent in
  // the same request (see the submit payload below).
  const unitSystem: UnitSystem = state.unit_system ?? 'metric'
  const weightLabel = weightUnitLabel(unitSystem)
  const heightLabel = heightUnitLabel(unitSystem)

  // Weight is kept as raw text so a half-pound (e.g. '154.5') can be typed:
  // parsing on every keystroke would erase the decimal point.
  const [weightText, setWeightText] = useState(() =>
    user?.profile?.weight != null ? String(user.profile.weight) : ''
  )

  function handleWeightChange(raw: string) {
    const text = sanitizeDecimalText(raw)
    setWeightText(text)
    set({ weight: parseDecimalText(text) ?? undefined })
  }

  const step = state.currentStep
  const isDataStep = step >= 1 && step <= 3
  const isComplete = step === 4

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
      const { currentStep: _, ...profileData } = state
      const outcome = await submitOnboarding(
        {
          saveProfile: profile => profileApi.updateProfile(profile),
          // First-time users complete onboarding (one-shot); returning users regenerate
          finish: () => (user?.onboarding_completed_at ? plansApi.regeneratePlan() : onboardingApi.completeOnboarding()),
          onStep: step => setPhase(step === 'profile' ? 'saving-profile' : 'generating-plan'),
        },
        { profile: profileData, profileSaved: profileSavedRef.current }
      )
      if (!outcome.ok) {
        profileSavedRef.current = outcome.failed === 'finish'
        throw outcome.error instanceof Error ? outcome.error : new Error('Something went wrong. Please try again.')
      }
      profileSavedRef.current = false
    },
    onSuccess: () => setPhase('plan-success'),
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setPhase('error')
    },
  })

  // Auto-start submission when reaching complete step
  useEffect(() => {
    if (isComplete) submitMutation.mutate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete])

  function next() { dispatch({ type: 'NEXT' }) }
  function back() { dispatch({ type: 'BACK' }) }
  function set(payload: Partial<UpdateProfileInput>) { dispatch({ type: 'SET', payload }) }

  function canProceed() {
    switch (step) {
      case 1: return !!(state.name?.trim() && state.gender && state.age && state.height && state.weight && state.unit_system)
      case 2: return !!state.fitness_goal
      case 3: return !!(state.training_experience && state.training_days_per_week && state.workout_duration_minutes)
      default: return true
    }
  }

  // Ask for push permission here, behind an explainer — the contextual moment
  // (0012 M3, cadence per 0013 R10–R12: not if granted, nor within 7 days of
  // the sheet last showing). Onboarding always uses the 'ask' variant.
  async function handleGoToDashboard() {
    try { await refreshUser() } catch { /* proceed anyway */ }
    if (await shouldAskForPush()) {
      setPhase('push-prompt')
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

  // iOS cannot present a second Modal while the success modal is still
  // dismissing; give it a beat before the sheet fades in.
  const [sheetVisible, setSheetVisible] = useState(false)
  useEffect(() => {
    if (phase !== 'push-prompt') { setSheetVisible(false); return }
    const t = setTimeout(() => setSheetVisible(true), 350)
    return () => clearTimeout(t)
  }, [phase])

  // ─── Complete / Generating screen ──────────────────────────────────────────
  if (isComplete) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bgBase }}>
        {/* Success modal */}
        <Modal transparent animationType="fade" visible={phase === 'plan-success'}>
          <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
            <View className="w-full rounded-2xl p-6" style={{ backgroundColor: colors.bgSurface }}>
              {/* Icon */}
              <View className="items-center mb-4">
                <View className="p-3 rounded-full" style={{ backgroundColor: withAlpha(colors.success, 0.2) }}>
                  <CheckCircle size={32} color={colors.success} />
                </View>
              </View>
              <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.textPrimary }}>
                You're All Set!
              </Text>
              <Text className="text-center mb-5" style={{ color: colors.textSecondary }}>
                Your personalized plan is ready
                {user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </Text>

              {/* Summary card */}
              <View
                className="rounded-xl p-4 mb-5"
                style={{ backgroundColor: colors.bgElevated }}
              >
                <Text
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: colors.textMuted }}
                >
                  Your Profile
                </Text>
                {state.fitness_goal && (
                  <View className="flex-row justify-between mb-2">
                    <Text style={{ color: colors.textSecondary }}>Goal</Text>
                    <Text className="font-medium" style={{ color: colors.textPrimary }}>
                      {labelFor(FITNESS_GOAL_OPTIONS, state.fitness_goal)}
                    </Text>
                  </View>
                )}
                {state.training_experience && (
                  <View className="flex-row justify-between mb-2">
                    <Text style={{ color: colors.textSecondary }}>Experience</Text>
                    <Text className="font-medium" style={{ color: colors.textPrimary }}>
                      {labelFor(TRAINING_EXPERIENCE_OPTIONS, state.training_experience)}
                    </Text>
                  </View>
                )}
                {state.training_days_per_week && (
                  <View className="flex-row justify-between">
                    <Text style={{ color: colors.textSecondary }}>Schedule</Text>
                    <Text className="font-medium" style={{ color: colors.textPrimary }}>
                      {state.training_days_per_week} days/week
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleGoToDashboard}
                className="w-full py-4 rounded-xl flex-row items-center justify-center gap-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-base font-bold" style={{ color: colors.textButton }}>
                  Go to Dashboard
                </Text>
                <ArrowRight size={18} color={colors.textButton} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <NotificationPermissionSheet
          visible={sheetVisible}
          onClose={() => navigation.replace('Tabs')}
        />

        {/* Phases */}
        {phase === 'saving-profile' && (
          <View className="items-center gap-4">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Setting up your profile...
            </Text>
          </View>
        )}

        {(phase === 'generating-plan' || phase === 'plan-success' || phase === 'push-prompt') && (
          <PlanGeneratingContent partnerLogoUrl={partnerLogoUrl} />
        )}

        {phase === 'error' && (
          <View className="items-center gap-4 w-full">
            <View className="p-4 rounded-full" style={{ backgroundColor: withAlpha(colors.error, 0.102) }}>
              <AlertCircle size={40} color={colors.error} />
            </View>
            <Text className="text-xl font-bold text-center" style={{ color: colors.textPrimary }}>
              Something went wrong
            </Text>
            <Text className="text-center mb-2" style={{ color: colors.textSecondary }}>
              {errorMsg}
            </Text>
            <TouchableOpacity
              className="w-full py-4 rounded-xl flex-row items-center justify-center gap-2"
              style={{ backgroundColor: colors.primary }}
              onPress={() => submitMutation.mutate()}
            >
              <Text className="text-base font-semibold" style={{ color: colors.textButton }}>Try Again</Text>
              <ArrowRight size={18} color={colors.textButton} />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    )
  }

  // ─── Steps 0–3 ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>

      {/* Progress bar — steps 1-3 only */}
      {isDataStep && (
        <View className="px-6 pt-6 pb-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: colors.textPrimary }}
            >
              Step {step} of {TOTAL_DATA_STEPS}
            </Text>
            <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
              {Math.round((step / TOTAL_DATA_STEPS) * 100)}%
            </Text>
          </View>
          <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.bgElevated }}>
            <View
              className="h-full rounded-full"
              style={{
                width: `${(step / TOTAL_DATA_STEPS) * 100}%`,
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Step 0: Welcome ──────────────────────────────────────────── */}
          {step === 0 && (
            <View className="items-center pt-16 pb-8">
              <Image
                source={partnerLogoUrl ?? localLogo}
                style={{ width: 120, height: 120, borderRadius: 16, marginBottom: 32 }}
                contentFit="contain"
              />
              <Text
                className="text-3xl font-bold mb-3 text-center"
                style={{ color: colors.textPrimary }}
              >
                Welcome to {partnerName}
              </Text>
              <Text
                className="text-lg text-center leading-relaxed mb-12"
                style={{ color: colors.textSecondary }}
              >
                Let's create your personalized fitness plan. It only takes a minute to get started.
              </Text>
              <TouchableOpacity
                onPress={next}
                className="w-full py-4 rounded-xl flex-row items-center justify-center gap-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-lg font-bold" style={{ color: colors.textButton }}>Get Started</Text>
                <ArrowRight size={20} color={colors.textButton} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 1: Personal Info ─────────────────────────────────────── */}
          {step === 1 && (
            <View className="mt-6">
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                Personal Details
              </Text>
              <Text className="mb-6" style={{ color: colors.textSecondary }}>
                Tell us a bit about yourself so we can tailor your experience.
              </Text>

              {/* Full Name */}
              <View className="mb-4">
                <Input
                  label="Full Name"
                  value={state.name ?? ''}
                  onChangeText={v => set({ name: v })}
                  autoComplete="name"
                  autoCorrect={false}
                  placeholder="John Doe"
                />
              </View>

              {/* Age + Gender row */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Input
                    label="Age"
                    keyboardType="numeric"
                    value={state.age?.toString() ?? ''}
                    onChangeText={v => set({ age: parseInt(v) || undefined })}
                    placeholder="25"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    className="text-sm font-medium mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Gender
                  </Text>
                  <View className="flex-row gap-1.5">
                    {(['male', 'female', 'other'] as const).map(g => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => set({ gender: g })}
                        className="flex-1 py-3 rounded-xl items-center"
                        style={{
                          backgroundColor: state.gender === g ? colors.primary : colors.bgElevated,
                          borderWidth: 1.5,
                          borderColor: state.gender === g ? colors.primary : 'transparent',
                        }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: state.gender === g ? '#fff' : colors.textSecondary }}
                        >
                          {g === 'male' ? 'M' : g === 'female' ? 'F' : 'X'}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: state.gender === g ? '#fff' : colors.textMuted }}
                        >
                          {g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Units — must be chosen before height/weight, since it decides
                  how the API interprets them (same request, see submit). */}
              <View className="mb-4">
                <Text className="text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                  Units
                </Text>
                <View className="flex-row gap-1.5">
                  {UNIT_OPTIONS.map(option => {
                    const selected = unitSystem === option.value
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => set({ unit_system: option.value })}
                        className="flex-1 py-3 rounded-xl items-center"
                        style={{
                          backgroundColor: selected ? colors.primary : colors.bgElevated,
                          borderWidth: 1.5,
                          borderColor: selected ? colors.primary : 'transparent',
                        }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: selected ? '#fff' : colors.textSecondary }}
                        >
                          {option.label}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: selected ? '#fff' : colors.textMuted }}
                        >
                          {option.hint}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              {/* Height + Weight row */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Input
                    label={`Height (${heightLabel})`}
                    keyboardType="numeric"
                    value={state.height?.toString() ?? ''}
                    onChangeText={v => set({ height: parseInt(v) || undefined })}
                    placeholder={unitSystem === 'imperial' ? '69' : '175'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label={`Weight (${weightLabel})`}
                    keyboardType="decimal-pad"
                    value={weightText}
                    onChangeText={handleWeightChange}
                    placeholder={unitSystem === 'imperial' ? '154' : '70'}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ── Step 2: Fitness Goals ─────────────────────────────────────── */}
          {step === 2 && (
            <View className="mt-6">
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                What's your main goal?
              </Text>
              <Text className="mb-6" style={{ color: colors.textSecondary }}>
                Select the primary reason you want to train.
              </Text>
              <View className="gap-3">
                {FITNESS_GOALS.map(({ value, label, description, Icon }) => {
                  const isSelected = state.fitness_goal === value
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => set({ fitness_goal: value })}
                      className="w-full p-4 rounded-xl flex-row items-center gap-4"
                      style={{
                        backgroundColor: isSelected ? withAlpha(colors.primary, 0.102) : colors.bgSurface,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.primary : colors.bgElevated,
                      }}
                    >
                      <View
                        className="p-3 rounded-full"
                        style={{ backgroundColor: isSelected ? colors.primary : colors.bgElevated }}
                      >
                        <Icon size={22} color={isSelected ? '#fff' : colors.textMuted} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {label}
                        </Text>
                        <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                          {description}
                        </Text>
                      </View>
                      <View
                        className="w-5 h-5 rounded-full items-center justify-center"
                        style={{ borderWidth: 2, borderColor: isSelected ? colors.primary : colors.bgElevated }}
                      >
                        {isSelected && (
                          <View
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: colors.primary }}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )}

          {/* ── Step 3: Training Preferences ─────────────────────────────── */}
          {step === 3 && (
            <View className="mt-6">
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                Training Preferences
              </Text>
              <Text className="mb-6" style={{ color: colors.textSecondary }}>
                Help us design the perfect workout schedule for you.
              </Text>

              {/* Experience Level */}
              <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                Experience Level
              </Text>
              <View className="flex-row gap-2 mb-6">
                {EXPERIENCE_LEVELS.map(level => {
                  const isSelected = state.training_experience === level.value
                  return (
                    <TouchableOpacity
                      key={level.value}
                      onPress={() => set({ training_experience: level.value })}
                      className="flex-1 py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: isSelected ? colors.primary : colors.bgSurface,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.primary : colors.bgElevated,
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: isSelected ? '#fff' : colors.textSecondary }}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {/* Training Days */}
              <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                Training Days Per Week
              </Text>
              <View className="flex-row gap-2 mb-1">
                {TRAINING_DAYS_OPTIONS.map(({ value: day }) => {
                  const isSelected = state.training_days_per_week === day
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => set({ training_days_per_week: day })}
                      className="flex-1 aspect-square rounded-xl items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? colors.primary : colors.bgSurface,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.primary : colors.bgElevated,
                      }}
                    >
                      <Text
                        className="text-base font-semibold"
                        style={{ color: isSelected ? '#fff' : colors.textSecondary }}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <Text className="text-xs mb-6" style={{ color: colors.textMuted }}>
                Select how many days you can commit to training.
              </Text>

              {/* Workout Duration */}
              <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                Workout Duration
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                <View className="flex-row gap-2 pb-1">
                  {DURATION_OPTIONS.map(opt => {
                    const isSelected = state.workout_duration_minutes === opt.value
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => set({ workout_duration_minutes: opt.value })}
                        className="px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: isSelected ? withAlpha(colors.primary, 0.2) : colors.bgSurface,
                          borderWidth: 1.5,
                          borderColor: isSelected ? colors.primary : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected ? colors.primary : colors.textSecondary,
                            fontWeight: isSelected ? '600' : '400',
                            fontSize: 13,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </ScrollView>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* Footer nav — steps 1-3 only */}
      {isDataStep && (
        <View className="px-6 pt-2 pb-4 flex-row gap-3">
          <TouchableOpacity
            onPress={back}
            className="items-center justify-center rounded-xl"
            style={{
              width: '33%',
              paddingVertical: 16,
              borderWidth: 2,
              borderColor: colors.bgElevated,
            }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={next}
            disabled={!canProceed()}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl"
            style={{
              paddingVertical: 16,
              backgroundColor: canProceed() ? colors.primary : colors.bgElevated,
            }}
          >
            <Text
              className="text-base font-semibold"
              style={{ color: canProceed() ? '#fff' : colors.textMuted }}
            >
              {step === 3 ? 'Finish Setup' : 'Continue'}
            </Text>
            <ArrowRight size={18} color={canProceed() ? '#fff' : colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  )
}
