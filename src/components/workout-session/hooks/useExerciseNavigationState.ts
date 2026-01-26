import { useMemo } from 'react';
import type { Exercise } from '../types';

/**
 * Custom hook to determine the initial exercise index based on navigation state.
 * 
 * This hook finds an exercise by name from location state and returns its index.
 * Used to preserve the active exercise tab when navigating back from detail pages.
 * 
 * @param exercises - Array of exercises to search through
 * @param initialExerciseName - Optional exercise name from location.state
 * @returns The index of the matching exercise, or 0 as fallback
 * 
 * @example
 * ```tsx
 * const initialIndex = useExerciseNavigationState(exercises, location.state?.exerciseName);
 * const [currentExerciseIndex, setCurrentExerciseIndex] = useState(initialIndex);
 * ```
 */
export function useExerciseNavigationState(
  exercises: Exercise[],
  initialExerciseName?: string | null
): number {
  return useMemo(() => {
    // If no initial exercise name provided, default to first exercise
    if (!initialExerciseName || exercises.length === 0) {
      return 0;
    }

    // Case-insensitive search for matching exercise
    const normalizedSearchName = initialExerciseName.trim().toLowerCase();
    const index = exercises.findIndex(
      (exercise) => exercise.name.toLowerCase() === normalizedSearchName
    );

    // Return found index, or 0 if not found (graceful fallback)
    return index >= 0 ? index : 0;
  }, [exercises, initialExerciseName]);
}
