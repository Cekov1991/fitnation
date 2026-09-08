/**
 * Where the session screen is standing in the exercise list, as pure rules
 * (0030). The hook that used to own this carried three effects and two refs
 * to answer the same questions; these are the answers, testable without React.
 */

/** The exercise a returning visitor should land on: the one named in navigation state, else the first. */
export function initialExerciseIndex(exercises: { name: string }[], initialExerciseName?: string | null): number {
  if (!initialExerciseName || exercises.length === 0) return 0;
  const wanted = initialExerciseName.trim().toLowerCase();
  const index = exercises.findIndex(exercise => exercise.name.toLowerCase() === wanted);
  return index >= 0 ? index : 0;
}

export interface ExercisesChange {
  current: number;
  previousLength: number;
  nextLength: number;
  /** An add was just requested, so a longer list means "go to the new one". */
  expectingAddition: boolean;
}

/** The index after the list changed: jump to a just-added exercise, stay put otherwise, never past the end. */
export function indexAfterExercisesChange({ current, previousLength, nextLength, expectingAddition }: ExercisesChange): number {
  if (nextLength === 0) return 0;
  if (expectingAddition && nextLength > previousLength) return nextLength - 1;
  return Math.min(current, nextLength - 1);
}
