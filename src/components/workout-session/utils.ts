import type { SessionDetailResponse } from '../../types/api';
import type { Exercise, ExerciseCompletionStatus } from './types';

/**
 * Format weight for display - shows whole numbers without decimals,
 * decimals only when needed (e.g., 7.5)
 */
export function formatWeight(weight: number): string {
  if (weight === 0) return '0';
  // Round to 1 decimal place to avoid floating point issues
  const rounded = Math.round(weight * 10) / 10;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
}

export function mapSessionToExercises(sessionData: SessionDetailResponse | undefined): Exercise[] {
  if (!sessionData?.exercises) return [];
  
  return sessionData.exercises.map((exDetail) => {
    const exercise = exDetail.session_exercise.exercise;
    const loggedSets = exDetail.logged_sets || [];
    const targetSets = exDetail.session_exercise.target_sets || 0;
    
    // Create sets array - mix of logged and unlogged
    const sets = [];
    for (let i = 0; i < targetSets; i++) {
      const loggedSet = loggedSets.find(s => s.set_number === i + 1);
      if (loggedSet) {
        sets.push({
          id: `set-${loggedSet.id}`,
          setLogId: loggedSet.id,
          reps: loggedSet.reps,
          weight: loggedSet.weight,
          completed: true
        });
      } else {
        sets.push({
          id: `set-${exDetail.session_exercise.id}-${i}`,
          reps: exDetail.session_exercise.target_reps || 0,
          weight: exDetail.session_exercise.target_weight || 0,
          completed: false
        });
      }
    }

    return {
      id: `ex-${exDetail.session_exercise.id}`,
      exerciseId: exDetail.session_exercise.exercise_id,
      sessionExerciseId: exDetail.session_exercise.id,
      name: exercise?.name || 'Unknown Exercise',
      type: exercise?.category?.type?.toUpperCase() || 'COMPOUND',
      muscleGroup: exercise?.primary_muscle_groups?.[0]?.name?.toUpperCase() || 'UNKNOWN',
      sets,
      targetReps: exDetail.session_exercise.target_reps ? String(exDetail.session_exercise.target_reps) : '0',
      targetSets: exDetail.session_exercise.target_sets || 0,
      suggestedWeight: exDetail.session_exercise.target_weight || 0,
      maxWeightLifted: Math.max(...loggedSets.map(s => s.weight), 0),
      imageUrl: exercise?.image || '',
      history: [] // Leave empty as requested
    };
  });
}

export function getExerciseCompletionStatus(exercise: Exercise): ExerciseCompletionStatus {
  const completed = exercise.sets.filter(s => s.completed).length;
  const total = exercise.sets.length;
  return {
    completed,
    total,
    isComplete: completed === total
  };
}
