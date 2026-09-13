import { useReducer, useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Animated, StyleSheet,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation } from '@tanstack/react-query'
// unitSystem here is form state, not the saved profile, so the pure label
// helpers are used rather than the useWeightUnit()/useHeightUnit() hooks.
import { profileApi, onboardingApi, plansApi, weightUnitLabel, heightUnitLabel, sanitizeDecimalText, parseDecimalText, UNIT_OPTIONS, submitOnboarding, withAlpha, FITNESS_GOAL_OPTIONS, TRAINING_EXPERIENCE_OPTIONS, WORKOUT_DURATION_OPTIONS, TRAINING_DAYS_OPTIONS, labelFor } from '@fit-nation/shared'
import type { UpdateProfileInput, UnitSystem } from '@fit-nation/shared'
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { onboardingReducer, FIRST_STEP } from '../Onboarding/onboardingReducer'
import { PlanBuildingContent, PLAN_BUILD_BG } from '../../components/ui/PlanGeneratingOverlay'
import { NotificationPermissionSheet } from '../../components/ui/NotificationPermissionSheet'
import { getPermissionStatus } from '../../lib/notifications'
import { readPushPromptLastShownAt, shouldShowPermissionSheet } from '../../lib/pushPrompt'
import type { AppScreenProps } from '../../navigation/types'

// Steps 1-3 are the questions; step 4 builds the plan.
const TOTAL_DATA_STEPS = 3

// Content colours for the error state, which sits on the same navy as the
// build screen it replaces (PLAN_BUILD_BG).
const BUILD_TEXT = '#FFFFFF'
const BUILD_TEXT_DIM = '#8C9BB3'

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
  const isBuilding = step === 4

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
    switch (step) {
      case 1: return !!state.fitness_goal
      case 2: return !!(state.gender && state.age && state.height && state.weight && state.unit_system)
      case 3: return !!(state.training_experience && state.training_days_per_week && state.workout_duration_minutes)
      default: return true
    }
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
          <TouchableOpacity onPress={back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={20} color={colors.textSecondary} />
          </TouchableOpacity>
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
          {step === 1 && <GoalStep colors={colors} value={state.fitness_goal} onChange={v => set({ fitness_goal: v })} />}
          {step === 2 && (
            <AboutStep
              colors={colors}
              state={state}
              unitSystem={unitSystem}
              heightLabel={heightLabel}
              weightLabel={weightLabel}
              weightText={weightText}
              onWeightChange={handleWeightChange}
              set={set}
            />
          )}
          {step === 3 && <TrainStep colors={colors} state={state} set={set} />}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={next}
          disabled={!canProceed()}
          accessibilityRole="button"
          style={[styles.cta, { backgroundColor: canProceed() ? colors.primary : withAlpha(colors.textMuted, 0.25) }]}
        >
          <Text style={[styles.ctaText, { color: canProceed() ? colors.textButton : colors.textMuted }]}>
            {step === 3 ? 'Build my plan' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

// ─── Step 1: What do you want to train for? ──────────────────────────────────

function GoalStep({ colors, value, onChange }: {
  colors: ReturnType<typeof useTheme>['colors']
  value: UpdateProfileInput['fitness_goal']
  onChange: (v: NonNullable<UpdateProfileInput['fitness_goal']>) => void
}) {
  return (
    <View>
      <Text style={[styles.headline, { color: colors.textPrimary }]}>What do you want to train for?</Text>
      <Text style={[styles.subhead, { color: colors.textSecondary }]}>
        This shapes your whole program. You can change it later.
      </Text>

      <View style={styles.cardList}>
        {FITNESS_GOAL_OPTIONS.map(option => {
          const selected = value === option.value
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.goalCard,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: selected ? colors.primary : 'transparent',
                },
              ]}
            >
              <View style={styles.goalText}>
                <Text style={[styles.goalLabel, { color: colors.textPrimary }]}>{option.label}</Text>
                <Text style={[styles.goalDesc, { color: selected ? colors.primary : colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              {selected && (
                <View style={[styles.goalTick, { backgroundColor: colors.primary }]}>
                  <Check size={14} color={colors.textButton} strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

// ─── Step 2: A bit about you ─────────────────────────────────────────────────

function AboutStep({ colors, state, unitSystem, heightLabel, weightLabel, weightText, onWeightChange, set }: {
  colors: ReturnType<typeof useTheme>['colors']
  state: Partial<UpdateProfileInput>
  unitSystem: UnitSystem
  heightLabel: string
  weightLabel: string
  weightText: string
  onWeightChange: (raw: string) => void
  set: (payload: Partial<UpdateProfileInput>) => void
}) {
  return (
    <View>
      <Text style={[styles.headline, { color: colors.textPrimary }]}>A bit about you</Text>
      <Text style={[styles.subhead, { color: colors.textSecondary }]}>Used to set your starting weights.</Text>

      {/* Units — must be chosen before height/weight, since it decides how the
          API interprets them (same request, see submit). */}
      <View style={styles.unitsRow}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Units</Text>
        <View style={[styles.unitTrack, { backgroundColor: withAlpha(colors.textMuted, 0.18) }]}>
          {UNIT_OPTIONS.map(option => {
            const selected = unitSystem === option.value
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => set({ unit_system: option.value })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.unitSeg, selected && { backgroundColor: colors.bgSurface }]}
              >
                <Text style={[styles.unitSegText, { color: selected ? colors.textPrimary : colors.textMuted }]}>
                  {option.hint}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={styles.numberRow}>
        <NumberField
          colors={colors}
          label="Age"
          value={state.age?.toString() ?? ''}
          onChangeText={v => set({ age: parseInt(v) || undefined })}
          placeholder="25"
          keyboardType="numeric"
        />
        <NumberField
          colors={colors}
          label="Height"
          suffix={heightLabel}
          value={state.height?.toString() ?? ''}
          onChangeText={v => set({ height: parseInt(v) || undefined })}
          placeholder={unitSystem === 'imperial' ? '69' : '175'}
          keyboardType="numeric"
        />
        <NumberField
          colors={colors}
          label="Weight"
          suffix={weightLabel}
          value={weightText}
          onChangeText={onWeightChange}
          placeholder={unitSystem === 'imperial' ? '154' : '70'}
          keyboardType="decimal-pad"
        />
      </View>

      <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Gender</Text>
      <View style={styles.chipRow}>
        {(['male', 'female', 'other'] as const).map(g => (
          <Chip
            key={g}
            colors={colors}
            label={g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other'}
            selected={state.gender === g}
            onPress={() => set({ gender: g })}
            size="lg"
          />
        ))}
      </View>
    </View>
  )
}

function NumberField({ colors, label, suffix, ...input }: {
  colors: ReturnType<typeof useTheme>['colors']
  label: string
  suffix?: string
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.numberField}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 8 }]}>{label}</Text>
      <View style={[styles.numberBox, { backgroundColor: colors.bgSurface }]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={[styles.numberInput, { color: colors.textPrimary }]}
        />
        {suffix && <Text style={[styles.numberSuffix, { color: colors.textMuted }]}>{suffix}</Text>}
      </View>
    </View>
  )
}

// ─── Step 3: How do you train? ───────────────────────────────────────────────

function TrainStep({ colors, state, set }: {
  colors: ReturnType<typeof useTheme>['colors']
  state: Partial<UpdateProfileInput>
  set: (payload: Partial<UpdateProfileInput>) => void
}) {
  const { training_experience: experience, training_days_per_week: days, workout_duration_minutes: duration } = state
  const complete = !!(experience && days && duration)

  return (
    <View>
      <Text style={[styles.headline, { color: colors.textPrimary }]}>How do you train?</Text>
      <Text style={[styles.subhead, { color: colors.textSecondary }]}>Last step — then we build your plan.</Text>

      <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Experience</Text>
      <View style={[styles.chipRow, { marginBottom: 20 }]}>
        {TRAINING_EXPERIENCE_OPTIONS.map(level => (
          <Chip
            key={level.value}
            colors={colors}
            label={level.label}
            selected={experience === level.value}
            onPress={() => set({ training_experience: level.value })}
            size="lg"
          />
        ))}
      </View>

      <FieldHeader colors={colors} label="Days per week" value={days ? labelFor(TRAINING_DAYS_OPTIONS, days) : null} />
      <View style={[styles.chipRow, { marginBottom: 20, gap: 6 }]}>
        {TRAINING_DAYS_OPTIONS.map(({ value }) => (
          <Chip
            key={value}
            colors={colors}
            label={String(value)}
            selected={days === value}
            onPress={() => set({ training_days_per_week: value })}
            size="sq"
          />
        ))}
      </View>

      <FieldHeader colors={colors} label="Session length" value={duration ? labelFor(WORKOUT_DURATION_OPTIONS, duration) : null} />
      <View style={[styles.chipRow, { gap: 6 }]}>
        {WORKOUT_DURATION_OPTIONS.map(option => (
          <Chip
            key={option.value}
            colors={colors}
            // The row already says "min" on the right, so the chips drop it.
            label={option.label.replace(' min', '')}
            selected={duration === option.value}
            onPress={() => set({ workout_duration_minutes: option.value })}
            size="sm"
          />
        ))}
      </View>

      {complete && (
        <View style={[styles.summary, { backgroundColor: colors.bgSurface }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Your plan will be</Text>
          <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
            {labelFor(FITNESS_GOAL_OPTIONS, state.fitness_goal)}
            {` · ${labelFor(TRAINING_DAYS_OPTIONS, days)} a week`}
            {` · ${labelFor(WORKOUT_DURATION_OPTIONS, duration)} sessions`}
            {` · ${labelFor(TRAINING_EXPERIENCE_OPTIONS, experience).toLowerCase()} loads`}
          </Text>
        </View>
      )}
    </View>
  )
}

function FieldHeader({ colors, label, value }: {
  colors: ReturnType<typeof useTheme>['colors']
  label: string
  value: string | null
}) {
  return (
    <View style={styles.fieldHeader}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {value && <Text style={[styles.fieldValue, { color: colors.primary }]}>{value}</Text>}
    </View>
  )
}

function Chip({ colors, label, selected, onPress, size }: {
  colors: ReturnType<typeof useTheme>['colors']
  label: string
  selected: boolean
  onPress: () => void
  size: 'sm' | 'lg' | 'sq'
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        size === 'sq' && styles.chipSquare,
        { backgroundColor: selected ? colors.primary : colors.bgSurface },
      ]}
    >
      <Text
        style={[
          size === 'sm' ? styles.chipTextSm : styles.chipText,
          { color: selected ? colors.textButton : colors.textPrimary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
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

  if (phase === 'error') {
    return (
      <SafeAreaView edges={['top']} style={[styles.buildScreen, { backgroundColor: PLAN_BUILD_BG }]}>
        <View style={styles.buildError}>
          <AlertCircle size={40} color={colors.error} />
          <Text style={[styles.headline, { color: BUILD_TEXT, textAlign: 'center' }]}>Something went wrong</Text>
          <Text style={[styles.subhead, { color: BUILD_TEXT_DIM, textAlign: 'center' }]}>{errorMsg}</Text>
          <TouchableOpacity
            onPress={onRetry}
            accessibilityRole="button"
            style={[styles.cta, { backgroundColor: colors.primary, alignSelf: 'stretch' }]}
          >
            <Text style={[styles.ctaText, { color: colors.textButton }]}>Try again</Text>
            <ArrowRight size={18} color={colors.textButton} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack} accessibilityRole="button" style={styles.buildBackBtn}>
            <Text style={[styles.buildBackText, { color: BUILD_TEXT_DIM }]}>Back to questions</Text>
          </TouchableOpacity>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  segments: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 3, borderRadius: 999 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  headline: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  subhead: { fontSize: 15, marginTop: 8, marginBottom: 24, lineHeight: 21 },

  footer: { paddingHorizontal: 16, paddingTop: 8 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 16 },
  ctaText: { fontSize: 16, fontWeight: '700' },

  cardList: { gap: 10 },
  goalCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 2 },
  goalText: { flex: 1, minWidth: 0 },
  goalLabel: { fontSize: 17, fontWeight: '700' },
  goalDesc: { fontSize: 14, marginTop: 3 },
  goalTick: { width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  fieldLabel: { fontSize: 13, fontWeight: '600' },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  fieldValue: { fontSize: 13, fontWeight: '700' },

  unitsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  unitTrack: { flexDirection: 'row', padding: 3, borderRadius: 12 },
  unitSeg: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9 },
  unitSegText: { fontSize: 13, fontWeight: '700' },

  numberRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  numberField: { flex: 1, minWidth: 0 },
  numberBox: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 52, paddingHorizontal: 14, borderRadius: 14 },
  numberInput: { flex: 1, minWidth: 0, fontSize: 18, fontWeight: '700', padding: 0 },
  numberSuffix: { fontSize: 13 },

  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 14 },
  chipSquare: { height: 44, borderRadius: 12 },
  chipText: { fontSize: 15, fontWeight: '600' },
  chipTextSm: { fontSize: 13, fontWeight: '600' },

  summary: { marginTop: 24, padding: 16, borderRadius: 16 },
  summaryLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  summaryText: { fontSize: 16, fontWeight: '700', lineHeight: 23 },

  buildScreen: { flex: 1 },

  buildError: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  buildBackBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  buildBackText: { fontSize: 15, fontWeight: '600' },
})
