import type { SessionExerciseDetail, SetLogResource } from '@fit-nation/shared'

/**
 * Completion is measured in *slots*, not in logs.
 *
 * `ExercisePage` renders rows `1..target_sets` and fills each one from the log
 * whose `set_number` matches, so a slot-based count is the only one that agrees
 * with what the user is looking at. A count-based check (`logged.length >=
 * target`) reports complete while a pending row is still on screen as soon as
 * any log sits above the target.
 *
 * Note the server also ships `is_completed` on each exercise, computed
 * count-based (`WorkoutSessionResource.php:41`), so it can disagree with this
 * for the same reason — and it does not move with optimistic cache updates
 * during a live session. Deliberately not used here.
 */
export function countCompletedSlots(
  loggedSets: SetLogResource[] | undefined,
  target: number,
): number {
  if (target <= 0) return 0
  let count = 0
  for (let n = 1; n <= target; n++) {
    if (loggedSets?.some(l => l.set_number === n)) count++
  }
  return count
}

export function isExerciseComplete(detail: SessionExerciseDetail): boolean {
  const target = detail.session_exercise.target_sets ?? 0
  return target > 0 && countCompletedSlots(detail.logged_sets, target) >= target
}
