import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  appendSetLog,
  findSetLog,
  patchCachedSession,
  patchSessionExercise,
  patchSetLog,
  readCachedSession,
  removeSessionExercise,
  removeSetLog,
  restoreCachedSession,
  updateCachedSession,
  withdrawSetLog,
  type CachedSession,
} from './sessionCache';
import type { SetLogResource } from '../types/api';

function setLog(overrides: Partial<SetLogResource> = {}): SetLogResource {
  return {
    id: 1, workout_session_id: 10, workout_session_exercise_id: 100, exercise_id: 55, set_number: 1,
    weight: 60, reps: 10, rest_seconds: 90, created_at: '2026-08-27T10:00:00Z', updated_at: '2026-08-27T10:00:00Z',
    ...overrides,
  };
}

/** The shape `useSession` caches — `exercises` at the top level. */
function session(): CachedSession {
  return {
    id: 10,
    exercises: [
      {
        session_exercise: { id: 100, exercise_id: 55, target_sets: 3 },
        logged_sets: [setLog({ id: 1, set_number: 1 }), setLog({ id: 2, set_number: 2 }), setLog({ id: 3, set_number: 3 })],
        previous_sets: [],
        is_completed: false,
      },
      { session_exercise: { id: 101, exercise_id: 77, target_sets: 3 }, logged_sets: [], previous_sets: [], is_completed: false },
    ],
  } as unknown as CachedSession;
}

const seeded = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['sessions', 10], session());
  return queryClient;
};

describe('patchCachedSession', () => {
  it('cancels the in-flight fetch, snapshots, then applies the patch', async () => {
    const queryClient = seeded();
    const cancel = vi.spyOn(queryClient, 'cancelQueries');

    const snapshot = await patchCachedSession(queryClient, 10, removeSessionExercise(101));

    expect(cancel).toHaveBeenCalledWith({ queryKey: ['sessions', 10] });
    expect(snapshot.previous).toEqual(session());
    expect(readCachedSession(queryClient, 10)!.exercises).toHaveLength(1);
  });

  it('does nothing to a session that is not cached, and says so in the snapshot', async () => {
    const queryClient = new QueryClient();
    const snapshot = await patchCachedSession(queryClient, 10, removeSessionExercise(101));

    expect(snapshot.previous).toBeUndefined();
    expect(readCachedSession(queryClient, 10)).toBeUndefined();
  });

  it('restoreCachedSession puts the snapshot back, and ignores an empty one', async () => {
    const queryClient = seeded();
    const snapshot = await patchCachedSession(queryClient, 10, removeSessionExercise(101));

    restoreCachedSession(queryClient, snapshot);
    expect(readCachedSession(queryClient, 10)).toEqual(session());

    restoreCachedSession(queryClient, { sessionId: 10, previous: undefined });
    restoreCachedSession(queryClient, undefined);
    expect(readCachedSession(queryClient, 10)).toEqual(session());
  });

  it('updateCachedSession patches the live cache without a snapshot', () => {
    const queryClient = seeded();
    updateCachedSession(queryClient, 10, withdrawSetLog(2));
    expect(readCachedSession(queryClient, 10)!.exercises[0].logged_sets.map(l => l.id)).toEqual([1, 3]);
  });
});

describe('pure patches', () => {
  it('findSetLog names the row and its exercise', () => {
    expect(findSetLog(session(), 2)?.exercise.session_exercise.id).toBe(100);
    expect(findSetLog(session(), 99)).toBeUndefined();
    expect(findSetLog(undefined, 1)).toBeUndefined();
  });

  it('patchSessionExercise merges into one row only — the one writer of target_sets', () => {
    const next = patchSessionExercise(100, { target_sets: 4 })(session());
    expect(next.exercises[0].session_exercise.target_sets).toBe(4);
    expect(next.exercises[1].session_exercise.target_sets).toBe(3);
  });

  it('removeSetLog drops the row, re-sequences later sets, leaves target_sets alone', () => {
    const next = removeSetLog(2)(session());
    const logged = next.exercises[0].logged_sets;
    expect(logged.map(l => l.id)).toEqual([1, 3]);
    expect(logged.map(l => l.set_number)).toEqual([1, 2]);
    expect(next.exercises[0].session_exercise.target_sets).toBe(3);
  });

  it('withdrawSetLog drops the row and nothing else', () => {
    const logged = withdrawSetLog(2)(session()).exercises[0].logged_sets;
    expect(logged.map(l => l.set_number)).toEqual([1, 3]);
  });

  it('patchSetLog edits one row in place', () => {
    const logged = patchSetLog(2, { weight: 70, reps: 6 })(session()).exercises[0].logged_sets;
    expect(logged[1]).toMatchObject({ id: 2, weight: 70, reps: 6 });
    expect(logged[0]).toMatchObject({ id: 1, weight: 60, reps: 10 });
  });

  it('appendSetLog attaches to the explicit row, else the first occurrence of the exercise, once', () => {
    const build = () => setLog({ id: -1, set_number: 4 });
    const explicit = appendSetLog({ workoutSessionExerciseId: 101, exerciseId: 55 }, build)(session());
    expect(explicit.exercises[1].logged_sets).toHaveLength(1);
    expect(explicit.exercises[0].logged_sets).toHaveLength(3);

    const byExercise = appendSetLog({ exerciseId: 55 }, build)(session());
    expect(byExercise.exercises[0].logged_sets).toHaveLength(4);
    expect(byExercise.exercises[1].logged_sets).toHaveLength(0);
  });

  it('never mutates its input', () => {
    const before = session();
    const frozen = JSON.stringify(before);
    removeSetLog(2)(before); patchSetLog(1, { weight: 1, reps: 1 })(before); removeSessionExercise(100)(before);
    expect(JSON.stringify(before)).toBe(frozen);
  });
});
