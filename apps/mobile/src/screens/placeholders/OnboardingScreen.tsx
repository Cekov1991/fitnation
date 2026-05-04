import { useReducer, useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Animated,
  ActivityIndicator, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useMutation } from '@tanstack/react-query'
import { profileApi, onboardingApi, plansApi } from '@fit-nation/shared'
import type { UpdateProfileInput } from '@fit-nation/shared'
import {
  Dumbbell, ArrowRight, ArrowLeft,
  HeartPulse, TrendingDown, Target,
  CheckCircle, AlertCircle,
} from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../../components/ui/Input'
import { onboardingReducer } from '../Onboarding/onboardingReducer'
import type { AppScreenProps } from '../../navigation/types'

const localLogo = require('../../../assets/logo.png')

// Steps 1-3 are data-collection steps (shown in progress bar)
const TOTAL_DATA_STEPS = 3

const FITNESS_GOALS = [
  { value: 'general_fitness' as const, label: 'General Fitness', description: 'Stay healthy and active', Icon: HeartPulse },
  { value: 'fat_loss' as const, label: 'Fat Loss', description: 'Burn fat and lose weight', Icon: TrendingDown },
  { value: 'muscle_gain' as const, label: 'Build Muscle', description: 'Gain size and strength', Icon: Dumbbell },
  { value: 'strength' as const, label: 'Strength', description: 'Increase overall strength', Icon: Target },
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner' as const, label: 'Beginner' },
  { value: 'intermediate' as const, label: 'Intermediate' },
  { value: 'advanced' as const, label: 'Advanced' },
]

const DURATION_OPTIONS = [
  { label: '20-30 min', value: 30 },
  { label: '30-45 min', value: 45 },
  { label: '45-60 min', value: 60 },
  { label: '60-90 min', value: 90 },
  { label: '90+ min', value: 120 },
]

const GOAL_LABELS: Record<string, string> = {
  general_fitness: 'General Fitness',
  fat_loss: 'Fat Loss',
  muscle_gain: 'Build Muscle',
  strength: 'Strength',
}

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

type Phase = 'saving-profile' | 'generating-plan' | 'plan-success' | 'error'

export function OnboardingScreen({ navigation }: AppScreenProps<'Onboarding'>) {
  const { colors } = useTheme()
  const { user, refreshUser } = useAuth()

  const partnerName = user?.partner?.name ?? 'Fit Nation'
  const partnerLogoUrl = user?.partner?.visual_identity?.logo ?? null

  // Pre-fill from existing profile so re-entrant users see their saved data
  const [state, dispatch] = useReducer(onboardingReducer, {
    currentStep: 0,
    fitness_goal: user?.profile?.fitness_goal ?? undefined,
    age: user?.profile?.age ?? undefined,
    gender: user?.profile?.gender ?? undefined,
    height: user?.profile?.height ?? undefined,
    weight: user?.profile?.weight != null ? Math.round(user.profile.weight) : undefined,
    training_experience: user?.profile?.training_experience ?? undefined,
    training_days_per_week: user?.profile?.training_days_per_week ?? undefined,
    workout_duration_minutes: user?.profile?.workout_duration_minutes ?? undefined,
  })
  const [phase, setPhase] = useState<Phase>('saving-profile')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const step = state.currentStep
  const isDataStep = step >= 1 && step <= 3
  const isComplete = step === 4

  useEffect(() => {
    fadeAnim.setValue(0)
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start()
  }, [step])

  const submitMutation = useMutation({
    mutationFn: async () => {
      setPhase('saving-profile')
      setErrorMsg(null)
      const { currentStep: _, ...profileData } = state
      await profileApi.updateProfile(profileData)
      setPhase('generating-plan')
      // First-time users complete onboarding (one-shot); returning users regenerate
      if (user?.onboarding_completed_at) {
        await plansApi.regeneratePlan()
      } else {
        await onboardingApi.completeOnboarding()
      }
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
      case 1: return !!(state.gender && state.age && state.height && state.weight)
      case 2: return !!state.fitness_goal
      case 3: return !!(state.training_experience && state.training_days_per_week && state.workout_duration_minutes)
      default: return true
    }
  }

  async function handleGoToDashboard() {
    try { await refreshUser() } catch { /* proceed anyway */ }
    navigation.replace('Tabs')
  }

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
                <View className="p-3 rounded-full" style={{ backgroundColor: `${colors.success}33` }}>
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
                      {GOAL_LABELS[state.fitness_goal]}
                    </Text>
                  </View>
                )}
                {state.training_experience && (
                  <View className="flex-row justify-between mb-2">
                    <Text style={{ color: colors.textSecondary }}>Experience</Text>
                    <Text className="font-medium" style={{ color: colors.textPrimary }}>
                      {EXPERIENCE_LABELS[state.training_experience]}
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
                <Text className="text-base font-bold" style={{ color: '#fff' }}>
                  Go to Dashboard
                </Text>
                <ArrowRight size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Phases */}
        {phase === 'saving-profile' && (
          <View className="items-center gap-4">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Setting up your profile...
            </Text>
          </View>
        )}

        {(phase === 'generating-plan' || phase === 'plan-success') && (
          <View className="items-center gap-4">
            <Image
              source={partnerLogoUrl ?? localLogo}
              style={{ width: 100, height: 100, borderRadius: 16 }}
              contentFit="contain"
            />
            <Text className="text-xl font-bold text-center" style={{ color: colors.textPrimary }}>
              Building your plan...
            </Text>
            <Text className="text-center" style={{ color: colors.textSecondary }}>
              This takes a few seconds
            </Text>
            <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
          </View>
        )}

        {phase === 'error' && (
          <View className="items-center gap-4 w-full">
            <View className="p-4 rounded-full" style={{ backgroundColor: `${colors.error}1A` }}>
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
              <Text className="text-base font-semibold" style={{ color: '#fff' }}>Try Again</Text>
              <ArrowRight size={18} color="#fff" />
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
                <Text className="text-lg font-bold" style={{ color: '#fff' }}>Get Started</Text>
                <ArrowRight size={20} color="#fff" />
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

              {/* Read-only name */}
              <View
                className="mb-4 p-4 rounded-xl"
                style={{ backgroundColor: colors.bgSurface, opacity: 0.75 }}
              >
                <Text className="text-xs mb-0.5" style={{ color: colors.textMuted }}>Full Name</Text>
                <Text className="text-base font-medium" style={{ color: colors.textPrimary }}>
                  {user?.name || '—'}
                </Text>
              </View>

              {/* Read-only email */}
              <View
                className="mb-5 p-4 rounded-xl"
                style={{ backgroundColor: colors.bgSurface, opacity: 0.75 }}
              >
                <Text className="text-xs mb-0.5" style={{ color: colors.textMuted }}>Email Address</Text>
                <Text className="text-base font-medium" style={{ color: colors.textPrimary }}>
                  {user?.email || '—'}
                </Text>
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

              {/* Height + Weight row */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Input
                    label="Height (cm)"
                    keyboardType="numeric"
                    value={state.height?.toString() ?? ''}
                    onChangeText={v => set({ height: parseInt(v) || undefined })}
                    placeholder="175"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Weight (kg)"
                    keyboardType="numeric"
                    value={state.weight?.toString() ?? ''}
                    onChangeText={v => set({ weight: parseInt(v) || undefined })}
                    placeholder="70"
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
                        backgroundColor: isSelected ? `${colors.primary}1A` : colors.bgSurface,
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
                {[1, 2, 3, 4, 5, 6, 7].map(day => {
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
                          backgroundColor: isSelected ? `${colors.primary}33` : colors.bgSurface,
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
