import { createProfileSchema } from '@fit-nation/shared'
import type { UnitSystem, UpdateProfileInput } from '@fit-nation/shared'

/**
 * The profile, cut into the sections a person edits together. Onboarding
 * walks goal → about → training as a wizard; the Profile tab opens each one
 * as its own page. Both render the same section components from this folder,
 * so a question is asked the same way everywhere.
 */
export type ProfileSectionKey = 'account' | 'goal' | 'about' | 'training'
export type ProfileDraft = Partial<UpdateProfileInput>
export type ProfileField = keyof UpdateProfileInput
export type SectionErrors = Partial<Record<ProfileField, string>>

export interface ProfileSectionMeta {
  /** Row label on the Profile tab and the page's header title. */
  title: string
  /** The question, as onboarding asks it; the page's subtitle. */
  question: string
  /** One line under the question. */
  hint: string
  fields: readonly ProfileField[]
  /** Fields that must be set before onboarding lets the person continue. */
  required: readonly ProfileField[]
}

export const PROFILE_SECTIONS: Record<ProfileSectionKey, ProfileSectionMeta> = {
  account: {
    title: 'Account',
    question: 'Your account',
    hint: 'The name we greet you by and the email you sign in with.',
    fields: ['name', 'email'],
    required: ['name', 'email'],
  },
  goal: {
    title: 'Goal',
    question: 'What do you want to train for?',
    hint: 'This shapes your whole program. You can change it later.',
    fields: ['fitness_goal'],
    required: ['fitness_goal'],
  },
  about: {
    title: 'Personal Info',
    question: 'A bit about you',
    hint: 'Used to set your starting weights.',
    fields: ['unit_system', 'age', 'height', 'weight', 'gender'],
    required: ['unit_system', 'age', 'height', 'weight', 'gender'],
  },
  training: {
    title: 'Training',
    question: 'How do you train?',
    hint: 'How experienced you are, how often, and for how long.',
    fields: ['training_experience', 'training_days_per_week', 'workout_duration_minutes'],
    required: ['training_experience', 'training_days_per_week', 'workout_duration_minutes'],
  },
}

/** The wizard order. Account is collected at sign-up, not here. */
export const ONBOARDING_SECTIONS: readonly ProfileSectionKey[] = ['goal', 'about', 'training']

export function isSectionComplete(key: ProfileSectionKey, draft: ProfileDraft): boolean {
  return PROFILE_SECTIONS[key].required.every((f) => draft[f] != null && draft[f] !== '')
}

/** Only this section's fields, for a PUT that should not resend the rest. */
export function pickSection(key: ProfileSectionKey, draft: ProfileDraft): ProfileDraft {
  const out: ProfileDraft = {}
  for (const f of PROFILE_SECTIONS[key].fields) {
    if (draft[f] !== undefined) (out as Record<string, unknown>)[f] = draft[f]
  }
  return out
}

/** True when any field of the section differs between two drafts. */
export function isSectionDirty(key: ProfileSectionKey, a: ProfileDraft, b: ProfileDraft): boolean {
  return PROFILE_SECTIONS[key].fields.some((f) => (a[f] ?? null) !== (b[f] ?? null))
}

/**
 * Range and format errors for one section, in the unit the person is typing
 * in. Reuses the shared profile schema so web, onboarding and the profile
 * pages agree on the bounds. Missing values are not errors here — use
 * isSectionComplete for that.
 */
export function validateSection(key: ProfileSectionKey, draft: ProfileDraft, unitSystem: UnitSystem): SectionErrors {
  const schema = createProfileSchema(unitSystem)
  const errors: SectionErrors = {}
  for (const f of PROFILE_SECTIONS[key].fields) {
    if (f === 'unit_system' || f === 'profile_photo') continue
    const value = draft[f]
    if (value == null || value === '') continue
    const field = (schema.shape as Record<string, { safeParse: (v: unknown) => { success: boolean; error?: { issues: { message: string }[] } } }>)[f]
    if (!field) continue
    const result = field.safeParse(value)
    if (!result.success) errors[f] = result.error?.issues[0]?.message ?? 'Invalid value'
  }
  return errors
}
