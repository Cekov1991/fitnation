import type { ExerciseResource, SessionExerciseDetail, SetLogResource } from '../types/api';

/**
 * The Workout Session read model (spec 0023).
 *
 * "What is the user looking at?" used to be answered twice — a `useMemo` inside
 * a 562-line React Native component and a loop inside a 96-line web mapper —
 * with everything downstream duplicated behind it: seven spellings of
 * completion in three rules, four volume totals that disagreed on their base,
 * four owners of the bodyweight rule that disagreed about TRX, and a pending-
 * row prefill that had already diverged. Both apps now render this model.
 *
 * Two decisions are baked in here, on purpose and in one place:
 *
 * - `target_sets` is a **floor** (docs/specs/0005). The slot list runs to
 *   `max(target, highest logged set_number)`, so a set logged above the target
 *   is shown as a normal completed set — nothing the user did is hidden — and
 *   the session screen agrees with the summary.
 * - Whether an exercise takes a logged weight is **the server's** to say
 *   (docs/specs/0015): `equipment_type.supports_added_weight`. No client rule.
 *
 * Nothing here is a component. Design parity between the apps is a rendering
 * concern; this is derivation only.
 */

/** Anything that carries the session's exercises — the cached detail, or a test fixture. */
export interface SessionLike {
  exercises: SessionExerciseDetail[];
}

// The defaults a Session Exercise falls back to when the server row has null
// targets; 0007's background patch persists these same values, so display and
// storage converge.
export const DEFAULT_TARGET_SETS = 3;
export const DEFAULT_MIN_REPS = 8;
export const DEFAULT_MAX_REPS = 12;

export interface ExerciseTargets {
  sets: number;
  minReps: number;
  maxReps: number;
}

export function exerciseTargets(detail: SessionExerciseDetail): ExerciseTargets {
  const row = detail.session_exercise;
  return {
    sets: row.target_sets || DEFAULT_TARGET_SETS,
    minReps: row.min_target_reps || DEFAULT_MIN_REPS,
    maxReps: row.max_target_reps || DEFAULT_MAX_REPS,
  };
}

/**
 * Server-owned (0015): `equipment_types.supports_added_weight`, seeded false for
 * BODYWEIGHT, TRX and BAND. An exercise with no equipment on record allows a
 * weight — refusing one would hide a field the user may need.
 */
export function allowsWeightLogging(
  exercise: Pick<ExerciseResource, 'equipment_type'> | null | undefined
): boolean {
  return exercise?.equipment_type?.supports_added_weight ?? true;
}

export type SetSlot =
  | {
      kind: 'completed';
      setNumber: number;
      setLogId: number;
      weight: number;
      reps: number;
      /** Logged past the target — shown like any other set (0005: floor). */
      aboveTarget: boolean;
    }
  | {
      kind: 'pending';
      setNumber: number;
      /** What the log card opens with. */
      prefill: { weight: number; reps: number };
      /** Last session's reps for this slot, for the "previous" hint. */
      previousReps: number | null;
    };

/** How many rows the exercise renders: the target, or further if the user logged past it. */
export function slotCount(detail: SessionExerciseDetail): number {
  const highest = Math.max(0, ...(detail.logged_sets ?? []).map(log => log.set_number));
  return Math.max(exerciseTargets(detail).sets, highest);
}

/**
 * The rows of one exercise, `1..slotCount`, each filled from the log whose
 * `set_number` matches. Prefill for a pending row: the plan's target weight if
 * it has one (the server derives it from the user's latest completed session),
 * else last time's weight for that set, else 0; reps from last time, else the
 * minimum target — or 0 for a total-reps exercise, where a count is the point.
 */
export function buildSlots(detail: SessionExerciseDetail): SetSlot[] {
  const targets = exerciseTargets(detail);
  const row = detail.session_exercise;
  const logged = detail.logged_sets ?? [];
  const previous = detail.previous_sets ?? [];
  return Array.from({ length: slotCount(detail) }, (_, i) => {
    const setNumber = i + 1;
    const log = logged.find(l => l.set_number === setNumber);
    if (log) {
      return {
        kind: 'completed',
        setNumber,
        setLogId: log.id,
        weight: log.weight,
        reps: log.reps,
        aboveTarget: setNumber > targets.sets,
      };
    }
    const prev = previous.find(p => p.set_number === setNumber);
    return {
      kind: 'pending',
      setNumber,
      prefill: {
        weight: row.target_weight ?? prev?.weight ?? 0,
        reps: prev?.reps ?? (row.progression_mode === 'total_reps' ? 0 : targets.minReps),
      },
      previousReps: prev?.reps ?? null,
    };
  });
}

/**
 * Completion is measured in *slots*, not in logs.
 *
 * The screen renders rows `1..target_sets` and fills each from the log whose
 * `set_number` matches, so a slot-based count is the only one that agrees with
 * what the user is looking at. A count-based check (`logged.length >= target`)
 * reports complete while a pending row is still on screen as soon as any log
 * sits above the target.
 *
 * Note the server also ships `is_completed` on each exercise, computed
 * count-based (`WorkoutSessionResource.php:41`), so it can disagree with this
 * for the same reason — and it does not move with optimistic cache updates
 * during a live session. Deliberately not used here.
 */
export function countCompletedSlots(loggedSets: SetLogResource[] | undefined, target: number): number {
  if (target <= 0) return 0;
  let count = 0;
  for (let n = 1; n <= target; n++) {
    if (loggedSets?.some(l => l.set_number === n)) count++;
  }
  return count;
}

export function isExerciseComplete(detail: SessionExerciseDetail): boolean {
  const target = detail.session_exercise.target_sets ?? 0;
  return target > 0 && countCompletedSlots(detail.logged_sets, target) >= target;
}

export interface ExerciseProgress {
  completed: number;
  target: number;
  /** 0..1, for a progress bar. */
  ratio: number;
}

export function exerciseProgress(detail: SessionExerciseDetail): ExerciseProgress {
  const target = detail.session_exercise.target_sets ?? 0;
  const completed = countCompletedSlots(detail.logged_sets, target);
  return { completed, target, ratio: target > 0 ? Math.min(1, completed / target) : 0 };
}

/** The first exercise still to finish, or null when the session is done. */
export function nextIncompleteIndex(exercises: SessionExerciseDetail[]): number | null {
  const index = exercises.findIndex(detail => !isExerciseComplete(detail));
  return index === -1 ? null : index;
}

export function isSessionComplete(exercises: SessionExerciseDetail[]): boolean {
  return exercises.length > 0 && exercises.every(isExerciseComplete);
}

export interface ExerciseTotals {
  /** Every logged set counts — logs are the truth (0005), so a set above the target is in. */
  sets: number;
  volume: number;
  reps: number;
  bestSet: { weight: number; reps: number } | null;
}

export function exerciseTotals(detail: SessionExerciseDetail): ExerciseTotals {
  const logged = detail.logged_sets ?? [];
  return {
    sets: logged.length,
    volume: logged.reduce((sum, set) => sum + set.weight * set.reps, 0),
    reps: logged.reduce((sum, set) => sum + set.reps, 0),
    bestSet: logged.reduce<{ weight: number; reps: number } | null>(
      (best, set) => (best && best.weight * best.reps >= set.weight * set.reps ? best : { weight: set.weight, reps: set.reps }),
      null
    ),
  };
}

export interface SessionTotals {
  exercisesCount: number;
  totalSets: number;
  /** Σ weight × reps over weighted (double-progression) exercises. */
  weightedVolume: number;
  /** Σ reps over total-reps exercises. */
  bodyweightReps: number;
  hasWeighted: boolean;
  hasBodyweight: boolean;
}

/** Partitioned by progression mode, which is server-owned: double progression is weighted, total reps is bodyweight. */
export function sessionTotals(session: SessionLike | null | undefined): SessionTotals {
  const totals: SessionTotals = {
    exercisesCount: 0,
    totalSets: 0,
    weightedVolume: 0,
    bodyweightReps: 0,
    hasWeighted: false,
    hasBodyweight: false,
  };
  for (const detail of session?.exercises ?? []) {
    const { sets, volume, reps } = exerciseTotals(detail);
    totals.exercisesCount++;
    totals.totalSets += sets;
    if (detail.session_exercise.progression_mode === 'double_progression') {
      totals.hasWeighted = true;
      totals.weightedVolume += volume;
    } else {
      totals.hasBodyweight = true;
      totals.bodyweightReps += reps;
    }
  }
  return totals;
}
