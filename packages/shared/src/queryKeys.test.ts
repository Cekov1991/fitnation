import { describe, it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

const isPrefix = (prefix: readonly unknown[], key: readonly unknown[]) =>
  prefix.length <= key.length && prefix.every((seg, i) => seg === key[i]);

describe('query key registry', () => {
  it('keeps the segment names the hooks have always used', () => {
    expect(queryKeys.sessions.all()).toEqual(['sessions']);
    expect(queryKeys.sessions.today()).toEqual(['sessions', 'today']);
    expect(queryKeys.programs.nextWorkout(7)).toEqual(['programs', 7, 'next-workout']);
    expect(queryKeys.exercises.list()).toEqual(['exercises', '']);
    expect(queryKeys.taxonomy.muscleGroups('upper')).toEqual(['muscle-groups', 'upper']);
  });

  it('derives every narrower key from its list key, so invalidating the list reaches it', () => {
    const sessions = queryKeys.sessions.all();
    for (const key of [
      queryKeys.sessions.detail(3),
      queryKeys.sessions.today(),
      queryKeys.sessions.calendars(),
      queryKeys.sessions.calendar('2026-08-25', '2026-08-31'),
    ]) {
      expect(isPrefix(sessions, key)).toBe(true);
    }
    expect(isPrefix(queryKeys.sessions.calendars(), queryKeys.sessions.calendar('a', 'b'))).toBe(true);
    expect(isPrefix(queryKeys.programs.all(), queryKeys.programs.nextWorkout(7))).toBe(true);
    expect(isPrefix(queryKeys.programs.detail(7), queryKeys.programs.nextWorkout(7))).toBe(true);
  });

  it('reaches every history of an exercise from histories(), whatever the params were', () => {
    const histories = queryKeys.exercises.histories(55);
    expect(isPrefix(histories, queryKeys.exercises.history(55))).toBe(true);
    expect(isPrefix(histories, queryKeys.exercises.history(55, { limit: 10 }))).toBe(true);
    expect(isPrefix(histories, queryKeys.exercises.history(56, { limit: 10 }))).toBe(false);
  });

  it('keeps siblings apart: detail, today and calendar do not cover each other', () => {
    expect(isPrefix(queryKeys.sessions.today(), queryKeys.sessions.detail(3))).toBe(false);
    expect(isPrefix(queryKeys.sessions.detail(3), queryKeys.sessions.today())).toBe(false);
    expect(isPrefix(queryKeys.sessions.calendars(), queryKeys.sessions.today())).toBe(false);
  });
});
