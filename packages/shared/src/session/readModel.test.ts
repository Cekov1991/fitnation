import { describe, expect, it } from 'vitest';
import type { SessionExerciseDetail, SetLogResource } from '../types/api';
import {
  DEFAULT_MIN_REPS,
  DEFAULT_TARGET_SETS,
  allowsWeightLogging,
  buildSlots,
  countCompletedSlots,
  exerciseProgress,
  exerciseTargets,
  exerciseTotals,
  isExerciseComplete,
  isSessionComplete,
  nextIncompleteIndex,
  sessionTotals,
  slotCount,
} from './readModel';

function log(setNumber: number, weight = 60, reps = 10): SetLogResource {
  return {
    id: setNumber * 100,
    workout_session_id: 1,
    workout_session_exercise_id: 1,
    exercise_id: 1,
    set_number: setNumber,
    weight,
    reps,
    rest_seconds: null,
    created_at: '2026-08-27T10:00:00Z',
    updated_at: '2026-08-27T10:00:00Z',
  };
}

function detail(
  logged: SetLogResource[],
  target: number | null = 3,
  extra: Partial<SessionExerciseDetail['session_exercise']> = {},
  previous: SetLogResource[] = []
): SessionExerciseDetail {
  return {
    session_exercise: {
      id: 1, workout_session_id: 1, exercise_id: 1, exercise: null, order: 1,
      progression_mode: 'double_progression', target_sets: target, min_target_reps: 8, max_target_reps: 12,
      progression_status: 'working', target_weight: null, total_reps_previous: null, total_reps_target: null,
      rest_seconds: null, created_at: '', updated_at: '', ...extra,
    },
    logged_sets: logged,
    previous_sets: previous,
    is_completed: false,
  };
}

// --- ported from apps/mobile progress.test.ts, unchanged in meaning -----------
describe('countCompletedSlots', () => {
  it('counts nothing when no sets are logged', () => expect(countCompletedSlots([], 3)).toBe(0));
  it('counts nothing when the target is zero', () => expect(countCompletedSlots([log(1)], 0)).toBe(0));
  it('treats missing logged_sets as none logged', () => expect(countCompletedSlots(undefined, 3)).toBe(0));
  it('counts a fully logged exercise', () => expect(countCompletedSlots([log(1), log(2), log(3)], 3)).toBe(3));
  it('counts only the slots that have a matching set_number', () => expect(countCompletedSlots([log(1), log(3)], 3)).toBe(2));
  it('ignores logs whose set_number is above the target', () => expect(countCompletedSlots([log(1), log(4)], 3)).toBe(1));
  it('counts a duplicated set_number once', () => expect(countCompletedSlots([log(2), log(2)], 3)).toBe(1));
});

describe('isExerciseComplete', () => {
  it('is complete when every slot is filled', () => expect(isExerciseComplete(detail([log(1), log(2), log(3)]))).toBe(true));
  it('is incomplete when a slot is empty', () => expect(isExerciseComplete(detail([log(1), log(3)]))).toBe(false));
  it('is incomplete when a log sits above the target and a slot below is empty', () =>
    expect(isExerciseComplete(detail([log(1), log(2), log(4)]))).toBe(false));
  it('is incomplete when the target is zero', () => expect(isExerciseComplete(detail([log(1)], 0))).toBe(false));
  it('is incomplete when the target is null', () => expect(isExerciseComplete(detail([log(1)], null))).toBe(false));
});

// --- 0005: the target is a floor ---------------------------------------------------
describe('slots under the floor model', () => {
  it('renders the target when nothing is logged past it', () => {
    expect(slotCount(detail([log(1)]))).toBe(3);
    expect(buildSlots(detail([log(1)])).map(s => s.kind)).toEqual(['completed', 'pending', 'pending']);
  });

  it('renders past the target when a set was logged there — nothing is hidden', () => {
    const slots = buildSlots(detail([log(1), log(2), log(3), log(4)]));
    expect(slots).toHaveLength(4);
    expect(slots[3]).toMatchObject({ kind: 'completed', setNumber: 4, setLogId: 400, aboveTarget: true });
    expect(slots[2]).toMatchObject({ kind: 'completed', aboveTarget: false });
  });

  it('keeps an orphan visible when the target was lowered beneath it', () => {
    // Log 4, then target drops to 3: set 4 stays a normal completed row.
    const slots = buildSlots(detail([log(1), log(2), log(4)], 3));
    expect(slots.map(s => s.kind)).toEqual(['completed', 'completed', 'pending', 'completed']);
  });

  it('falls back to the default target when the row has none', () => {
    expect(exerciseTargets(detail([], null))).toEqual({ sets: DEFAULT_TARGET_SETS, minReps: 8, maxReps: 12 });
    expect(slotCount(detail([], null))).toBe(DEFAULT_TARGET_SETS);
  });
});

describe('pending-row prefill — identical on both platforms', () => {
  it('prefers the plan target weight, then last time, then zero', () => {
    const withTarget = buildSlots(detail([], 3, { target_weight: 62.5 }, [log(1, 60, 9)]))[0];
    const withPrevious = buildSlots(detail([], 3, {}, [log(1, 60, 9)]))[0];
    const withNothing = buildSlots(detail([]))[0];
    expect(withTarget).toMatchObject({ kind: 'pending', prefill: { weight: 62.5, reps: 9 }, previousReps: 9 });
    expect(withPrevious).toMatchObject({ kind: 'pending', prefill: { weight: 60, reps: 9 } });
    expect(withNothing).toMatchObject({ kind: 'pending', prefill: { weight: 0, reps: DEFAULT_MIN_REPS }, previousReps: null });
  });

  it('looks up last time per slot, not once for the active one', () => {
    const slots = buildSlots(detail([], 3, {}, [log(1, 50, 12), log(3, 40, 15)]));
    expect(slots.map(s => (s.kind === 'pending' ? s.previousReps : null))).toEqual([12, null, 15]);
  });

  it('starts a total-reps exercise at zero reps when there is no history', () => {
    const slot = buildSlots(detail([], 3, { progression_mode: 'total_reps', min_target_reps: null }))[0];
    expect(slot).toMatchObject({ kind: 'pending', prefill: { reps: 0 } });
  });
});

describe('progress and session completion', () => {
  it('reports completed slots against the target', () => {
    expect(exerciseProgress(detail([log(1), log(4)]))).toEqual({ completed: 1, target: 3, ratio: 1 / 3 });
    expect(exerciseProgress(detail([], 0))).toEqual({ completed: 0, target: 0, ratio: 0 });
  });

  it('finds the next exercise to do, and knows when there is none', () => {
    const done = detail([log(1), log(2), log(3)]);
    const open = detail([log(1)]);
    expect(nextIncompleteIndex([done, open, done])).toBe(1);
    expect(nextIncompleteIndex([done, done])).toBeNull();
    expect(isSessionComplete([done, done])).toBe(true);
    expect(isSessionComplete([done, open])).toBe(false);
    expect(isSessionComplete([])).toBe(false);
  });
});

describe('totals — one base, logs are the truth', () => {
  const weighted = detail([log(1, 60, 10), log(2, 60, 10), log(3, 60, 10), log(4, 60, 10)]); // one set above target
  const bodyweight = detail([log(1, 0, 15), log(2, 0, 12)], 2, { progression_mode: 'total_reps' });

  it('counts a set logged above the target in the exercise totals', () => {
    expect(exerciseTotals(weighted)).toEqual({ sets: 4, volume: 2400, reps: 40, bestSet: { weight: 60, reps: 10 } });
  });

  it('gives the summary and the detail screen the same numbers', () => {
    expect(sessionTotals({ exercises: [weighted, bodyweight] })).toEqual({
      exercisesCount: 2,
      totalSets: 6,
      weightedVolume: 2400,
      bodyweightReps: 27,
      hasWeighted: true,
      hasBodyweight: true,
    });
    expect(sessionTotals(undefined).totalSets).toBe(0);
  });

  it('picks the best set by volume', () => {
    expect(exerciseTotals(detail([log(1, 100, 3), log(2, 60, 10)])).bestSet).toEqual({ weight: 60, reps: 10 });
    expect(exerciseTotals(detail([])).bestSet).toBeNull();
  });
});

describe('allowsWeightLogging — the server decides (0015)', () => {
  const withEquipment = (code: string, supports_added_weight: boolean) =>
    ({ equipment_type: { id: 1, code, name: code, display_order: 1, supports_added_weight } });

  it('follows the equipment flag, TRX included', () => {
    expect(allowsWeightLogging(withEquipment('TRX', false))).toBe(false);
    expect(allowsWeightLogging(withEquipment('BODYWEIGHT', false))).toBe(false);
    expect(allowsWeightLogging(withEquipment('BAND', false))).toBe(false);
    expect(allowsWeightLogging(withEquipment('BARBELL', true))).toBe(true);
  });

  it('allows a weight when the equipment is unknown', () => {
    expect(allowsWeightLogging({ equipment_type: null })).toBe(true);
    expect(allowsWeightLogging(null)).toBe(true);
    expect(allowsWeightLogging(undefined)).toBe(true);
  });
});
