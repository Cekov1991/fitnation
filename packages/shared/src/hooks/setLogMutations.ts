import type { QueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api';
import type { LogSetInput, SetLogResource } from '../types/api';

export interface LogSetVariables {
  sessionId: number;
  data: LogSetInput;
}

export interface LogSetContext {
  /** Identifies the row `onMutate` added, so `onError` can pull exactly it. */
  provisionalId: number;
}

/**
 * A set that is on screen but not yet acknowledged by the server carries a
 * negative `id` — no server row can have one. Anything keyed off a set log's
 * id (edit, delete) has to refuse a provisional row: the request would target
 * a `setLogId` the server has never seen.
 */
export function isProvisionalSetLogId(id: number | null | undefined): boolean {
  return typeof id === 'number' && id < 0;
}

// Strictly decreasing so two sets logged inside the same millisecond — a
// double tap, or a fast user on set 2 while set 1 is still in flight — never
// collide on the id the UI keys rows off.
let lastProvisionalId = 0;

export function nextProvisionalSetLogId(): number {
  const fromClock = -Date.now();
  lastProvisionalId = fromClock < lastProvisionalId ? fromClock : lastProvisionalId - 1;
  return lastProvisionalId;
}

/**
 * Append the set the user just logged to the cached session, so the row shows
 * up before the round trip. `old` is whatever `useSession` cached, i.e.
 * `response.data` — `exercises` sits at the top level, not under `data`.
 */
function appendProvisionalSetLog(
  old: any,
  sessionId: number,
  data: LogSetInput,
  provisionalId: number
): any {
  if (!old?.exercises) return old;

  let matched = false;
  const exercises = old.exercises.map((exDetail: any) => {
    if (matched) return exDetail;

    const sessionExercise = exDetail.session_exercise;
    // Mirror the server's resolution: prefer the explicit session-exercise row,
    // otherwise take the first occurrence of the exercise in the session.
    const isMatch =
      data.workout_session_exercise_id != null
        ? sessionExercise?.id === data.workout_session_exercise_id
        : sessionExercise?.exercise_id === data.exercise_id;
    if (!isMatch) return exDetail;

    matched = true;
    const now = new Date().toISOString();
    const provisional: SetLogResource = {
      id: provisionalId,
      workout_session_id: sessionId,
      workout_session_exercise_id: sessionExercise?.id ?? null,
      exercise_id: data.exercise_id,
      set_number: data.set_number,
      weight: data.weight,
      reps: data.reps,
      rest_seconds: data.rest_seconds ?? null,
      created_at: now,
      updated_at: now
    };

    return {
      ...exDetail,
      logged_sets: [...(exDetail.logged_sets ?? []), provisional]
    };
  });

  return { ...old, exercises };
}

/** Drop one provisional row, leaving every other row — and every other
 * in-flight provisional row — where it is. */
function removeProvisionalSetLog(old: any, provisionalId: number): any {
  if (!old?.exercises) return old;

  return {
    ...old,
    exercises: old.exercises.map((exDetail: any) =>
      exDetail.logged_sets?.some((setLog: any) => setLog.id === provisionalId)
        ? {
            ...exDetail,
            logged_sets: exDetail.logged_sets.filter((setLog: any) => setLog.id !== provisionalId)
          }
        : exDetail
    )
  };
}

/**
 * The mutation options behind `useLogSet`, split out from the hook so the
 * optimistic append and its rollback can be driven by a test without React.
 */
export function logSetMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ sessionId, data }: LogSetVariables) => sessionsApi.logSet(sessionId, data),

    onMutate: async (variables: LogSetVariables): Promise<LogSetContext> => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['sessions', variables.sessionId]
      });

      const provisionalId = nextProvisionalSetLogId();
      queryClient.setQueryData(['sessions', variables.sessionId], (old: any) =>
        appendProvisionalSetLog(old, variables.sessionId, variables.data, provisionalId)
      );

      return { provisionalId };
    },

    onError: (error: Error, variables: LogSetVariables, context: LogSetContext | undefined) => {
      // Rollback by pulling this one row out, rather than restoring the whole
      // `previousData` snapshot the way the siblings do. Logging is the one
      // action a user fires back-to-back, so a snapshot taken before *this*
      // request can predate a second log that is still in flight — restoring it
      // would retract a set that is about to succeed.
      if (context) {
        queryClient.setQueryData(['sessions', variables.sessionId], (old: any) =>
          removeProvisionalSetLog(old, context.provisionalId)
        );
      }
      console.error('Failed to log set:', error);
    },

    onSuccess: (_data: unknown, variables: LogSetVariables) => {
      // Refetch to swap the provisional row for the server's, with its real id
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId]
      });
      queryClient.invalidateQueries({
        queryKey: ['exercises', variables.data.exercise_id, 'history']
      });
    }
  };
}
