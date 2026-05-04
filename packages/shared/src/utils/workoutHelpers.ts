/**
 * Estimate workout duration in minutes based on exercises, sets, reps, and rest times
 * 
 * @param exercises - Array of exercises with pivot data containing sets and rest times
 * @returns Estimated duration in minutes (rounded)
 */
export function estimateWorkoutDuration(exercises: Array<{
  pivot?: {
    target_sets?: number | null;
    rest_seconds?: number | null;
  } | null;
  default_rest_sec?: number;
}>): number {
  if (!exercises || exercises.length === 0) {
    return 0;
  }

  let totalMinutes = 0;

  for (const exercise of exercises) {
    const sets = exercise.pivot?.target_sets || 0;
    const restSeconds = exercise.pivot?.rest_seconds || exercise.default_rest_sec || 60;

    // Estimate time per set: 30 seconds for the set itself + rest time
    // For the last set, no rest time is needed
    const timePerSet = 0.5 + (restSeconds / 60); // 0.5 min for the set + rest in minutes
    const totalSetTime = sets > 0 ? (sets - 1) * timePerSet + 0.5 : 0; // Last set has no rest

    // Add 1 minute setup time per exercise
    totalMinutes += totalSetTime + 1;
  }

  // If calculation results in 0 or very low, use fallback: 3-4 minutes per exercise
  if (totalMinutes < exercises.length * 2) {
    return Math.round(exercises.length * 3.5);
  }

  return Math.round(totalMinutes);
}
