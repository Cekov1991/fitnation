import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useProfile, useUpdateProfile, usePrograms } from '@fit-nation/shared'
import type { UnitSystem, UserResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SCREEN } from '../../constants/layout'
import { Button } from '../../components/ui/Button'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  AboutSection,
  AccountSection,
  GoalSection,
  TrainingSection,
  PROFILE_SECTIONS,
  isSectionDirty,
  pickSection,
  validateSection,
} from '../../components/profile'
import type { ProfileDraft, SectionErrors } from '../../components/profile'
import { showToast } from '../../lib/toast'
import type { AppScreenProps } from '../../navigation/types'

/**
 * The page shell of one profile section ("one body, two shells" in CLAUDE.md): the
 * same section component onboarding renders, under a ScreenHeader, with a
 * prefilled draft and a pinned Save that enables when the section is dirty.
 */
export function EditProfileSectionScreen({ navigation, route }: AppScreenProps<'EditProfileSection'>) {
  const { section } = route.params
  const meta = PROFILE_SECTIONS[section]
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const updateProfile = useUpdateProfile()
  // Cached by the dashboard already, so asking here costs no extra request
  // once the app has been on the home tab.
  const { data: programs = [] } = usePrograms()
  const hasActivePlan = programs.some((p) => p.is_active)

  const [draft, setDraft] = useState<ProfileDraft>(() => seedDraft(profile))
  const [saved, setSaved] = useState<ProfileDraft>(() => seedDraft(profile))
  const [errors, setErrors] = useState<SectionErrors>({})
  const [adjustVisible, setAdjustVisible] = useState(false)
  const adjustChosenRef = useRef(false)

  // The ['profile'] cache is the source of truth. When it changes and the
  // person has not started editing this section, both drafts follow it; edits
  // in progress are kept.
  const savedRef = useRef(saved)
  savedRef.current = saved
  useEffect(() => {
    if (!profile) return
    const seed = seedDraft(profile)
    setDraft((prev) => (isSectionDirty(section, savedRef.current, prev) ? prev : seed))
    setSaved(seed)
  }, [profile, section])

  function reseedFrom(user: UserResource) {
    const seed = seedDraft(user)
    setDraft(seed)
    setSaved(seed)
    setErrors({})
  }

  // Sent on its own so the server re-formats the stored height/weight into the
  // new unit; the response re-seeds both drafts. Known (and matching web and
  // the old one-page profile): this discards unsaved height/weight edits,
  // hence the isPending guard only. Onboarding sends the unit with the numbers.
  async function handleUnitToggle(unit_system: UnitSystem) {
    if (unit_system === (draft.unit_system ?? 'metric') || updateProfile.isPending) return
    try {
      const response = await updateProfile.mutateAsync({ unit_system })
      reseedFrom(response.user)
    } catch (e) {
      showToast('Failed to update units. Please try again.', 'error')
    }
  }

  function handleChange(patch: ProfileDraft) {
    const { unit_system, ...rest } = patch
    if (Object.keys(rest).length > 0) {
      setDraft((prev) => ({ ...prev, ...rest }))
      // A field being retyped drops its error until the next Save.
      setErrors((prev) => {
        const next = { ...prev }
        for (const key of Object.keys(rest) as Array<keyof ProfileDraft>) delete next[key]
        return next
      })
    }
    if (unit_system !== undefined) void handleUnitToggle(unit_system)
  }

  async function handleSave() {
    const unitSystem: UnitSystem = draft.unit_system ?? 'metric'
    const nextErrors = validateSection(section, draft, unitSystem)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    try {
      await updateProfile.mutateAsync(pickSection(section, draft))
      showToast('Your profile has been updated.', 'success')
      // Goal and training shape the generated plan; offer to rebuild it.
      if ((section === 'goal' || section === 'training') && hasActivePlan) {
        adjustChosenRef.current = false
        setAdjustVisible(true)
        return
      }
      navigation.goBack()
    } catch (e) {
      showToast('Failed to save profile. Please try again.', 'error')
    }
  }

  // ConfirmDialog runs onConfirm then onClose, so the choice is recorded first
  // and acted on once, when the dialog closes.
  function handleAdjustClosed() {
    setAdjustVisible(false)
    if (adjustChosenRef.current) {
      // TODO(adjust-plan): open AdjustPlanSheet from a route param. The sheet
      // is state inside DashboardScreen today, so this lands on the tab that
      // owns it rather than duplicating the sheet here.
      navigation.navigate('Tabs', { screen: 'Dashboard' })
    } else {
      navigation.goBack()
    }
  }

  const header = <ScreenHeader title={meta.title} subtitle={meta.question} onBack={() => navigation.goBack()} />

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bgBase }]}>
        <View style={styles.content}>
          {header}
          <SkeletonBox height={16} width="70%" style={{ marginBottom: 24 }} />
          <SkeletonBox height={52} style={{ marginBottom: 16 }} />
          <SkeletonBox height={52} style={{ marginBottom: 16 }} />
          <SkeletonBox height={52} />
        </View>
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bgBase }]}>
        <View style={[styles.content, styles.screen]}>
          {header}
          <ErrorState message="Failed to load profile" onRetry={refetch} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bgBase }]}>
      <KeyboardAvoidingView style={styles.screen} behavior="padding">
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {header}
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{meta.hint}</Text>

          {section === 'account' && <AccountSection draft={draft} onChange={handleChange} errors={errors} />}
          {section === 'goal' && <GoalSection value={draft.fitness_goal} onChange={(fitness_goal) => handleChange({ fitness_goal })} />}
          {section === 'about' && <AboutSection draft={draft} onChange={handleChange} errors={errors} />}
          {section === 'training' && <TrainingSection draft={draft} onChange={handleChange} />}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.bgBase, paddingBottom: insets.bottom + 12 }]}>
          <Button
            label="Save Changes"
            loading={updateProfile.isPending}
            disabled={!isSectionDirty(section, saved, draft)}
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={adjustVisible}
        onClose={handleAdjustClosed}
        title="Update your plan to match?"
        message="Your current plan was built from your previous settings."
        confirmLabel="Adjust Plan"
        cancelLabel="Not Now"
        onConfirm={() => { adjustChosenRef.current = true }}
      />
    </SafeAreaView>
  )
}

/** The editable profile fields, as the API last returned them. */
function seedDraft(profile: UserResource | undefined): ProfileDraft {
  const p = profile?.profile
  return {
    name: profile?.name ?? undefined,
    email: profile?.email ?? undefined,
    fitness_goal: p?.fitness_goal ?? undefined,
    age: p?.age ?? undefined,
    gender: p?.gender ?? undefined,
    unit_system: p?.unit_system ?? 'metric',
    height: p?.height ?? undefined,
    // No rounding: imperial body weight arrives at the nearest 0.5 lb and
    // metric is stored as decimal(5,2), so rounding here corrupts the value.
    weight: p?.weight ?? undefined,
    training_experience: p?.training_experience ?? undefined,
    training_days_per_week: p?.training_days_per_week ?? undefined,
    workout_duration_minutes: p?.workout_duration_minutes ?? undefined,
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottomWithFooter },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SCREEN.paddingX, paddingTop: 12 },
})
