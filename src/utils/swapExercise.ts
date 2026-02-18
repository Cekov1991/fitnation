/**
 * Shared swap-exercise strategy used across the app.
 *
 * Rule: "Swap = remove at position P, add new (with same pivot data), then reorder so new is at P."
 *
 * Used by:
 * - Edit Workout (template): ExercisePickerPageWrapper — remove template exercise, add with pivot data, reorder by pivot ids.
 * - In Session: useWorkoutSessionState — remove session exercise, add with order/reorder, keep currentExerciseIndex.
 * - Generator (WorkoutPreviewPage): same as session — remove, add with order, reorder if backend appends.
 *
 * All flows preserve position and pivot data (sets, reps, weight); no duplicates.
 */

export interface SwapExerciseContext {
  pivotId: number;
  orderIndex: number;
  target_sets: number;
  target_reps: number;
  target_weight: number;
}
