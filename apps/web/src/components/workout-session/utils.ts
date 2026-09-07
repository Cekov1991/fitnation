import type { SessionDetailResponse } from '@fit-nation/shared';
import { allowsWeightLogging, buildSlots, exerciseTargets } from '@fit-nation/shared';
import type { Exercise, ExerciseCompletionStatus, Set } from './types';

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

export function mapSessionToExercises(sessionData: SessionDetailResponse['data'] | undefined): Exercise[] {
  if (!sessionData?.exercises) return [];
  
  return sessionData.exercises.map((exDetail) => {
    const exercise = exDetail.session_exercise.exercise;
    const loggedSets = exDetail.logged_sets || [];
    const progressionMode = exDetail.session_exercise.progression_mode;
    const { sets: targetSets, minReps: minTargetReps, maxReps: maxTargetReps } = exerciseTargets(exDetail);
    const targetWeight = exDetail.session_exercise.target_weight || 0;

    // The read model decides the rows (0005: the target is a floor); this only reshapes them.
    const sets: Set[] = buildSlots(exDetail).map((slot, i) =>
      slot.kind === 'completed'
        ? {
            id: `set-${slot.setLogId}`,
            setLogId: slot.setLogId,
            setNumber: slot.setNumber,
            reps: slot.reps,
            weight: slot.weight,
            completed: true,
            aboveTarget: slot.aboveTarget
          }
        : {
            id: `set-${exDetail.session_exercise.id}-${i}`,
            setNumber: slot.setNumber,
            reps: slot.prefill.reps,
            weight: slot.prefill.weight,
            completed: false,
            previousReps: slot.previousReps
          }
    );

    const primaryGroups = exercise?.primary_muscle_groups?.length
      ? exercise.primary_muscle_groups
      : (exercise?.muscle_groups ?? []).filter(g => g.is_primary);

    return {
      id: `ex-${exDetail.session_exercise.id}`,
      exerciseId: exDetail.session_exercise.exercise_id,
      sessionExerciseId: exDetail.session_exercise.id,
      name: exercise?.name || 'Unknown Exercise',
      type: exercise?.category?.type?.toUpperCase() || 'COMPOUND',
      muscleGroup: primaryGroups[0]?.name?.toUpperCase() || 'UNKNOWN',
      primaryMuscleGroupIds: primaryGroups.map(g => g.id),
      sets,
      progressionMode,
      minTargetReps,
      maxTargetReps,
      progressionStatus: exDetail.session_exercise.progression_status ?? 'no_history',
      totalRepsPrevious: exDetail.session_exercise.total_reps_previous,
      totalRepsTarget: exDetail.session_exercise.total_reps_target,
      targetSets,
      suggestedWeight: targetWeight,
      maxWeightLifted: Math.max(...loggedSets.map(s => s.weight), 0),
      imageUrl: exercise?.image || '',
      videoUrl: exercise?.video || null,
      history: [], // Leave empty as requested
      restSeconds: exDetail.session_exercise.rest_seconds ?? exercise?.default_rest_sec ?? null,
      allowWeightLogging: allowsWeightLogging(exercise)
    };
  });
}

/** Slot-based, against the target: a set logged above it shows, but does not count toward completion. */
export function getExerciseCompletionStatus(exercise: Exercise): ExerciseCompletionStatus {
  const completed = exercise.sets.filter(s => s.completed && !s.aboveTarget).length;
  const total = exercise.targetSets;
  return {
    completed,
    total,
    isComplete: total > 0 && completed >= total
  };
}
