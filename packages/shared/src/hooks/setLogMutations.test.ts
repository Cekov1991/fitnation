import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  isProvisionalSetLogId,
  nextProvisionalSetLogId,
  logSetMutationOptions,
  updateSetMutationOptions
} from './setLogMutations';
import type { SetLogResource } from '../types/api';

function setLog(overrides: Partial<SetLogResource> = {}): SetLogResource {
  return {
    id: 1,
    workout_session_id: 10,
    workout_session_exercise_id: 100,
    exercise_id: 55,
    set_number: 1,
    weight: 60,
    reps: 10,
    rest_seconds: 90,
    created_at: '2026-08-27T10:00:00Z',
    updated_at: '2026-08-27T10:00:00Z',
    ...overrides
  };
}

/** The shape `useSession` caches: `response.data`, so `exercises` sits at the top. */
function sessionData() {
  return {
    id: 10,
    exercises: [
      {
        session_exercise: { id: 100, exercise_id: 55, target_sets: 3 },
        logged_sets: [setLog()],
        previous_sets: [],
        is_completed: false
      },
      {
        session_exercise: { id: 101, exercise_id: 77, target_sets: 3 },
        logged_sets: [],
        previous_sets: [],
        is_completed: false
      }
    ]
  };
}

function seeded() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['sessions', 10], sessionData());
  return queryClient;
}

const cachedExercises = (queryClient: QueryClient) =>
  (queryClient.getQueryData(['sessions', 10]) as any).exercises;

const setNumbers = (loggedSets: any[]) => loggedSets.map(l => l.set_number);

describe('isProvisionalSetLogId', () => {
  it('treats the negative sentinel as not-yet-persisted', () => {
    expect(isProvisionalSetLogId(-1756300000000)).toBe(true);
  });

  it('treats a real server id as persisted', () => {
    expect(isProvisionalSetLogId(1)).toBe(false);
  });

  it('is false for a missing id', () => {
    expect(isProvisionalSetLogId(undefined)).toBe(false);
    expect(isProvisionalSetLogId(null)).toBe(false);
  });
});

describe('nextProvisionalSetLogId', () => {
  it('never repeats, even within the same millisecond', () => {
    const ids = Array.from({ length: 50 }, () => nextProvisionalSetLogId());
    expect(new Set(ids).size).toBe(50);
    expect(ids.every(id => isProvisionalSetLogId(id))).toBe(true);
  });
});

describe('logSetMutationOptions onMutate', () => {
  it('appends a provisional set to the matching exercise', async () => {
    const queryClient = seeded();
    const options = logSetMutationOptions(queryClient);

    await options.onMutate({
      sessionId: 10,
      data: { exercise_id: 55, set_number: 2, weight: 65, reps: 8, rest_seconds: 90 }
    });

    const logged = cachedExercises(queryClient)[0].logged_sets;
    expect(logged).toHaveLength(2);
    expect(logged[1]).toMatchObject({
      exercise_id: 55,
      workout_session_id: 10,
      workout_session_exercise_id: 100,
      set_number: 2,
      weight: 65,
      reps: 8,
      rest_seconds: 90
    });
    expect(isProvisionalSetLogId(logged[1].id)).toBe(true);
  });

  it('leaves the other exercises untouched', async () => {
    const queryClient = seeded();
    await logSetMutationOptions(queryClient).onMutate({
      sessionId: 10,
      data: { exercise_id: 55, set_number: 2, weight: 65, reps: 8 }
    });

    expect(cachedExercises(queryClient)[1].logged_sets).toEqual([]);
  });

  it('targets the session-exercise row when the id is supplied', async () => {
    const queryClient = seeded();
    // Same exercise_id on both rows: only workout_session_exercise_id can tell
    // the second occurrence from the first.
    queryClient.setQueryData(['sessions', 10], (old: any) => ({
      ...old,
      exercises: [
        old.exercises[0],
        { ...old.exercises[1], session_exercise: { id: 101, exercise_id: 55, target_sets: 3 } }
      ]
    }));

    await logSetMutationOptions(queryClient).onMutate({
      sessionId: 10,
      data: {
        workout_session_exercise_id: 101,
        exercise_id: 55,
        set_number: 1,
        weight: 40,
        reps: 12
      }
    });

    const exercises = cachedExercises(queryClient);
    expect(exercises[0].logged_sets).toHaveLength(1);
    expect(exercises[1].logged_sets).toHaveLength(1);
    expect(exercises[1].logged_sets[0].workout_session_exercise_id).toBe(101);
  });

  it('defaults rest_seconds to null when the input omits it', async () => {
    const queryClient = seeded();
    await logSetMutationOptions(queryClient).onMutate({
      sessionId: 10,
      data: { exercise_id: 77, set_number: 1, weight: 20, reps: 15 }
    });

    expect(cachedExercises(queryClient)[1].logged_sets[0].rest_seconds).toBeNull();
  });

  it('is a no-op when the session is not cached', async () => {
    const queryClient = new QueryClient();

    await logSetMutationOptions(queryClient).onMutate({
      sessionId: 10,
      data: { exercise_id: 55, set_number: 1, weight: 60, reps: 10 }
    });

    expect(queryClient.getQueryData(['sessions', 10])).toBeUndefined();
  });
});

describe('logSetMutationOptions onError', () => {
  // onError logs the failure the way its useUpdateSet/useDeleteSet siblings do;
  // the suite does not need to see it.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('restores the previous logged_sets', async () => {
    const queryClient = seeded();
    const options = logSetMutationOptions(queryClient);
    const before = queryClient.getQueryData(['sessions', 10]);
    const variables = {
      sessionId: 10,
      data: { exercise_id: 55, set_number: 2, weight: 65, reps: 8 }
    };

    const context = await options.onMutate(variables);
    expect(cachedExercises(queryClient)[0].logged_sets).toHaveLength(2);

    options.onError(new Error('offline'), variables, context);

    expect(cachedExercises(queryClient)[0].logged_sets).toEqual([setLog()]);
    expect(queryClient.getQueryData(['sessions', 10])).toEqual(before);
  });

  it('leaves a second in-flight log alone when the first one fails', async () => {
    const queryClient = seeded();
    const options = logSetMutationOptions(queryClient);
    const first = {
      sessionId: 10,
      data: { exercise_id: 55, set_number: 2, weight: 65, reps: 8 }
    };
    const second = {
      sessionId: 10,
      data: { exercise_id: 55, set_number: 3, weight: 65, reps: 6 }
    };

    const firstContext = await options.onMutate(first);
    await options.onMutate(second);
    expect(cachedExercises(queryClient)[0].logged_sets).toHaveLength(3);

    options.onError(new Error('offline'), first, firstContext);

    // Set 2 is gone; set 1 (persisted) and set 3 (still in flight) survive.
    expect(setNumbers(cachedExercises(queryClient)[0].logged_sets)).toEqual([1, 3]);
  });

  it('leaves the cache alone when the session was never cached', async () => {
    const queryClient = new QueryClient();
    const options = logSetMutationOptions(queryClient);
    const variables = {
      sessionId: 10,
      data: { exercise_id: 55, set_number: 1, weight: 60, reps: 10 }
    };
    const context = await options.onMutate(variables);

    options.onError(new Error('offline'), variables, context);

    expect(queryClient.getQueryData(['sessions', 10])).toBeUndefined();
  });
});

describe('updateSetMutationOptions', () => {
  // Spec 0013: editing one set used to read the cached session through the
  // wrong shape (`.data.exercises`), miss every time, and fall back to
  // invalidating the entire exercise catalog.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const variables = { sessionId: 10, setLogId: 1, data: { weight: 70, reps: 6 } };
  const invalidatedKeys = (spy: ReturnType<typeof vi.spyOn>) =>
    spy.mock.calls.map(([filters]: any[]) => filters?.queryKey);

  it('patches the edited set in place and leaves the rest alone', async () => {
    const queryClient = seeded();
    await updateSetMutationOptions(queryClient).onMutate(variables);

    const exercises = cachedExercises(queryClient);
    expect(exercises[0].logged_sets[0]).toMatchObject({ id: 1, weight: 70, reps: 6 });
    expect(exercises[1].logged_sets).toEqual([]);
  });

  it("names the edited set's exercise from the shape useSession caches", async () => {
    const queryClient = seeded();
    const context = await updateSetMutationOptions(queryClient).onMutate(variables);

    expect(context.exerciseId).toBe(55);
  });

  it("invalidates that exercise's history, not the catalog", async () => {
    const queryClient = seeded();
    const options = updateSetMutationOptions(queryClient);
    const context = await options.onMutate(variables);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    options.onSuccess(undefined, variables, context);

    const keys = invalidatedKeys(invalidate);
    expect(keys).toContainEqual(['exercises', 55, 'history']);
    expect(keys).not.toContainEqual(['exercises']);
  });

  it('falls back to the catalog only when the set is not cached', async () => {
    const queryClient = new QueryClient();
    const options = updateSetMutationOptions(queryClient);
    const context = await options.onMutate(variables);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    options.onSuccess(undefined, variables, context);

    expect(invalidatedKeys(invalidate)).toContainEqual(['exercises']);
  });

  it('restores the snapshot on error', async () => {
    const queryClient = seeded();
    const options = updateSetMutationOptions(queryClient);
    const before = queryClient.getQueryData(['sessions', 10]);
    const context = await options.onMutate(variables);

    options.onError(new Error('offline'), variables, context);

    expect(queryClient.getQueryData(['sessions', 10])).toEqual(before);
  });
});
