import type { FitnessGoal, SplitFocus, TrainingExperience } from '../types/api';

/**
 * The option tables behind the profile and onboarding forms (0031 #2). They
 * existed as a local array in four web files and four mobile files, and had
 * already drifted — "Beginner (0-1 years)" on one screen, "Beginner" on
 * another, "Build Muscle" on one, "Muscle Gain" on five. One table each, in
 * the package both apps already share, next to TRAINING_STYLE_OPTIONS.
 */

export interface FitnessGoalOption {
  value: FitnessGoal;
  label: string;
  description: string;
}

export const FITNESS_GOAL_OPTIONS: readonly FitnessGoalOption[] = [
  { value: 'general_fitness', label: 'General Fitness', description: 'Stay healthy and active' },
  { value: 'fat_loss', label: 'Fat Loss', description: 'Burn fat and lose weight' },
  { value: 'muscle_gain', label: 'Muscle Gain', description: 'Build strength and mass' },
  { value: 'strength', label: 'Strength', description: 'Increase overall strength' },
];

export interface TrainingExperienceOption {
  value: TrainingExperience;
  label: string;
  /** The years range, for the screens that spell it out: "Beginner (0-1 years)". */
  detail: string;
}

export const TRAINING_EXPERIENCE_OPTIONS: readonly TrainingExperienceOption[] = [
  { value: 'beginner', label: 'Beginner', detail: '0-1 years' },
  { value: 'intermediate', label: 'Intermediate', detail: '1-3 years' },
  { value: 'advanced', label: 'Advanced', detail: '3+ years' },
];

export interface SplitFocusOption {
  value: SplitFocus;
  label: string;
  description: string;
}

/**
 * Which curated weekly split the program is built from. The descriptions say
 * "more", not "only", on purpose: at three or more training days every focus
 * still trains the whole body. A member who has never chosen is Balanced —
 * the server reads a null `split_focus` that way (back-end ADR-0013) — so the
 * clients preselect Balanced rather than leaving the question unanswered.
 */
export const SPLIT_FOCUS_OPTIONS: readonly SplitFocusOption[] = [
  { value: 'balanced', label: 'Balanced', description: 'Even split across your whole body' },
  { value: 'upper_focus', label: 'Upper Body', description: 'More chest, back and arm work' },
  { value: 'lower_focus', label: 'Lower Body', description: 'More legs and glutes' },
];

/** What a profile with no stored Split Focus is built from. */
export const DEFAULT_SPLIT_FOCUS: SplitFocus = 'balanced';

/** Label → the value sent to the server: always the higher end of the range. */
export const WORKOUT_DURATION_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 30, label: '20-30 min' },
  { value: 45, label: '30-45 min' },
  { value: 60, label: '45-60 min' },
  { value: 90, label: '60-90 min' },
  { value: 120, label: '90+ min' },
];

export const TRAINING_DAYS_OPTIONS: readonly { value: number; label: string }[] = [1, 2, 3, 4, 5, 6, 7].map(d => ({
  value: d,
  label: `${d} day${d > 1 ? 's' : ''}`,
}));

/** The label for a stored value, or the value itself when it is not in the table. */
export function labelFor<V extends string | number>(options: readonly { value: V; label: string }[], value: V | null | undefined): string {
  return options.find(o => o.value === value)?.label ?? (value == null ? '' : String(value));
}

/** The duration option a stored number falls into: the first at or above it, else the longest. */
export function durationOptionFor(minutes: number | null | undefined) {
  if (minutes == null) return undefined;
  return WORKOUT_DURATION_OPTIONS.find(o => o.value >= minutes) ?? WORKOUT_DURATION_OPTIONS[WORKOUT_DURATION_OPTIONS.length - 1];
}
