import { describe, expect, it } from 'vitest';
import type { ExerciseHistoryResource } from '../types/api';
import { bestValue, chartPoints, currentValue, progressPercentage, recentSessions } from './historyView';

const point = (date: string, weight: number, reps: number, volume: number) =>
  ({ date, session_id: 1, weight, best_set_reps: reps, reps, volume, sets: 3 });
const history: ExerciseHistoryResource = {
  exercise_id: 1, exercise_name: 'Squat',
  stats: { current_weight: 100, best_weight: 110, current_best_set_reps: 8, best_set_reps: 12, progress_percentage: 0, total_sessions: 3, first_session_date: '2026-08-01', last_session_date: '2026-08-15' },
  performance_data: [point('2026-08-01', 80, 10, 2400), point('2026-08-08', 110, 12, 3300), point('2026-08-15', 100, 8, 2400)],
};
const weighted = { allowWeightLogging: true, chartMode: 'weight' as const };
const volume = { allowWeightLogging: true, chartMode: 'volume' as const };
const bodyweight = { allowWeightLogging: false, chartMode: 'weight' as const };

describe('exercise history view', () => {
  it('charts the metric the mode selects', () => {
    expect(chartPoints(history, weighted).map(p => p.value)).toEqual([80, 110, 100]);
    expect(chartPoints(history, volume).map(p => p.value)).toEqual([2400, 3300, 2400]);
    expect(chartPoints(history, bodyweight).map(p => p.value)).toEqual([10, 12, 8]);
    expect(chartPoints(null, weighted)).toEqual([]);
  });

  it('measures progress first-to-last, and 0 with nothing to grow from', () => {
    expect(progressPercentage(history, weighted)).toBe(25);
    expect(progressPercentage(history, volume)).toBe(0);
    expect(progressPercentage(history, bodyweight)).toBe(-20);
    expect(progressPercentage({ ...history, performance_data: [point('a', 0, 0, 0), point('b', 50, 5, 250)] }, weighted)).toBe(0);
    expect(progressPercentage(undefined, weighted)).toBe(0);
  });

  it('lists recent sessions newest first', () => {
    expect(recentSessions(history).map(p => p.date)).toEqual(['2026-08-15', '2026-08-08', '2026-08-01']);
    expect(recentSessions(history, 1).map(p => p.date)).toEqual(['2026-08-15']);
  });

  it('reports current and best under each mode, and null with no history', () => {
    expect([currentValue(history, weighted), bestValue(history, weighted)]).toEqual([100, 110]);
    expect([currentValue(history, volume), bestValue(history, volume)]).toEqual([2400, 3300]);
    expect([currentValue(history, bodyweight), bestValue(history, bodyweight)]).toEqual([8, 12]);
    expect(currentValue(null, weighted)).toBeNull();
    expect(bestValue({ ...history, performance_data: [] }, weighted)).toBeNull();
  });
});
