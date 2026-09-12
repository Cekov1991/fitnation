import { describe, expect, it } from 'vitest';
import type { SessionExerciseDetail, SetLogResource } from '../types/api';
import {
  sessionShareText,
  summarizeSets,
  volumeComparison,
  volumeComparisonParts,
} from './detailView';

function log(setNumber: number, weight: number, reps: number, createdAt = '2026-09-12T18:45:00Z'): SetLogResource {
  return {
    id: setNumber * 100 + weight,
    workout_session_id: 1,
    workout_session_exercise_id: 1,
    exercise_id: 1,
    set_number: setNumber,
    weight,
    reps,
    rest_seconds: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function detail(
  logged: SetLogResource[],
  previous: SetLogResource[] = [],
  extra: Partial<SessionExerciseDetail['session_exercise']> = {}
): SessionExerciseDetail {
  return {
    session_exercise: {
      id: 1, workout_session_id: 1, exercise_id: 1, exercise: null, order: 1,
      progression_mode: 'double_progression', target_sets: 4, min_target_reps: 8, max_target_reps: 12,
      progression_status: 'working', target_weight: null, total_reps_previous: null, total_reps_target: null,
      rest_seconds: null, created_at: '', updated_at: '', ...extra,
    },
    logged_sets: logged,
    previous_sets: previous,
    is_completed: true,
  };
}

const kg = { weighted: true, unit: 'kg' };
const STARTED = '2026-09-12T18:40:00Z';
const EARLIER = '2026-09-05T18:40:00Z';
const LATER = '2026-09-19T18:40:00Z';

describe('summarizeSets', () => {
  it('states identical sets once', () => {
    const sets = [log(1, 107.5, 8), log(2, 107.5, 8), log(3, 107.5, 8), log(4, 107.5, 8)];
    expect(summarizeSets(sets, kg)).toBe('4 × 8 @ 107.5 kg');
  });

  it('collapses varying sets to ranges', () => {
    expect(summarizeSets([log(1, 60, 10), log(2, 70, 9), log(3, 80, 8)], kg)).toBe('3 × 8–10 @ 60–80 kg');
    expect(summarizeSets([log(1, 80, 10), log(2, 80, 8)], kg)).toBe('2 × 8–10 @ 80 kg');
  });

  it('reads reps only for bodyweight work', () => {
    expect(summarizeSets([log(1, 0, 12), log(2, 0, 12)], { weighted: false, unit: 'kg' })).toBe('2 × 12 reps');
  });

  it('says so when nothing was logged', () => {
    expect(summarizeSets([], kg)).toBe('No sets logged');
  });
});

describe('volumeComparison', () => {
  it('compares this session with the same exercises last time', () => {
    const exercises = [
      detail([log(1, 100, 8), log(2, 100, 8)], [log(1, 100, 8, EARLIER), log(2, 90, 8, EARLIER)]),
    ];
    const result = volumeComparison(exercises, STARTED);
    expect(result).toEqual({ current: 1600, previous: 1520, percent: 5, exercises: 1 });
  });

  it('leaves out exercises without a previous performance, on both sides', () => {
    const exercises = [
      detail([log(1, 100, 8)], [log(1, 100, 8, EARLIER)]),
      detail([log(1, 50, 10)]), // new this session
    ];
    expect(volumeComparison(exercises, STARTED)).toEqual({ current: 800, previous: 800, percent: 0, exercises: 1 });
  });

  it('ignores "previous" sets the server took from a later session', () => {
    const exercises = [detail([log(1, 100, 8)], [log(1, 120, 8, LATER)])];
    expect(volumeComparison(exercises, STARTED)).toBeNull();
  });

  it('skips bodyweight exercises and sessions with nothing comparable', () => {
    const bodyweight = detail([log(1, 0, 12)], [log(1, 0, 10, EARLIER)], { progression_mode: 'total_reps' });
    expect(volumeComparison([bodyweight], STARTED)).toBeNull();
    expect(volumeComparison([detail([log(1, 100, 8)])], STARTED)).toBeNull();
    expect(volumeComparison([], STARTED)).toBeNull();
    expect(volumeComparison([detail([log(1, 100, 8)], [log(1, 100, 8, EARLIER)])], null)).toBeNull();
  });

  it('is null when the previous volume is zero', () => {
    expect(volumeComparison([detail([log(1, 100, 8)], [log(1, 0, 8, EARLIER)])], STARTED)).toBeNull();
  });
});

describe('volumeComparisonParts', () => {
  it('words a gain, a loss and a flat session', () => {
    expect(volumeComparisonParts({ current: 1, previous: 1, percent: 4, exercises: 1 })).toEqual({
      direction: 'up', percent: '4%', text: 'more volume than last time',
    });
    expect(volumeComparisonParts({ current: 1, previous: 1, percent: -3, exercises: 1 })).toEqual({
      direction: 'down', percent: '3%', text: 'less volume than last time',
    });
    expect(volumeComparisonParts({ current: 1, previous: 1, percent: 0, exercises: 1 })).toEqual({
      direction: 'flat', percent: '', text: 'Same volume as last time',
    });
  });
});

describe('sessionShareText', () => {
  it('writes the headline, the totals and one line per exercise', () => {
    const exercises = [
      detail([log(1, 100, 8), log(2, 100, 8)], [], { exercise: { name: 'Deadlift' } as any }),
      detail([log(1, 0, 12)], [], { progression_mode: 'total_reps', exercise: { name: 'Plank' } as any }),
    ];
    const text = sessionShareText({ name: 'Push Day', dateLine: 'Thursday, Sep 12 · 18:40', unit: 'kg', exercises });
    expect(text.split('\n')).toEqual([
      'Push Day · Thursday, Sep 12 · 18:40',
      '1,600 kg total volume · 2 exercises · 3 sets',
      '',
      '• Deadlift — 2 × 8 @ 100 kg',
      '• Plank — 1 × 12 reps',
    ]);
  });

  it('counts reps when nothing was weighted and names a missing exercise plainly', () => {
    const text = sessionShareText({
      name: 'Workout session', dateLine: 'Monday, Sep 7 · 07:10', unit: 'lbs',
      exercises: [detail([log(1, 0, 15)], [], { progression_mode: 'total_reps' })],
    });
    expect(text).toContain('15 reps in total · 1 exercise · 1 set');
    expect(text).toContain('• Exercise — 1 × 15 reps');
  });
});
