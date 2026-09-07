import type { Outcome } from './outcome';

/**
 * Finish onboarding: save the profile, then complete onboarding (a first-time
 * user) or regenerate the plan (a returning one).
 *
 * If the second write fails, the profile is saved but `onboarding_completed_at`
 * is unset, so the next launch sends the user back to Onboarding — and a retry
 * that re-runs both re-PUTs a profile that already saved. The caller passes
 * `profileSaved: true` on retry to run only the step that failed.
 */
export type OnboardingStep = 'profile' | 'finish';

export interface SubmitOnboardingDeps<Profile> {
  saveProfile: (profile: Profile) => Promise<unknown>;
  /** Complete onboarding or regenerate the plan — the caller knows which user this is. */
  finish: () => Promise<unknown>;
  /** UI phase updates, in step order. */
  onStep?: (step: OnboardingStep) => void;
}

export interface SubmitOnboardingInput<Profile> {
  profile: Profile;
  /** True on a retry after `finish` failed: the profile is already on the server. */
  profileSaved?: boolean;
}

export type SubmitOnboardingOutcome = Outcome<OnboardingStep>;

export async function submitOnboarding<Profile>(deps: SubmitOnboardingDeps<Profile>, input: SubmitOnboardingInput<Profile>): Promise<SubmitOnboardingOutcome> {
  if (!input.profileSaved) {
    deps.onStep?.('profile');
    try {
      await deps.saveProfile(input.profile);
    } catch (error) {
      return { ok: false, failed: 'profile', error, compensated: true };
    }
  }

  deps.onStep?.('finish');
  try {
    await deps.finish();
  } catch (error) {
    // The profile is saved; only this step needs to run again.
    return { ok: false, failed: 'finish', error, compensated: false };
  }

  return { ok: true };
}
