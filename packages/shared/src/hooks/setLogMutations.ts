import type { QueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api';
import { queryKeys } from '../queryKeys';
import type { LogSetInput, SetLogResource, UpdateSetInput } from '../types/api';
import {
  appendSetLog,
  findSetLog,
  patchCachedSession,
  patchSetLog,
  removeSetLog,
  restoreCachedSession,
  updateCachedSession,
  withdrawSetLog,
  type SessionSnapshot,
} from './sessionCache';

/**
 * The set-log mutations — log, update, delete — as plain option objects the
 * hooks in useApi.ts wrap in one line each, so the optimistic patch and its
 * rollback can be driven by a test without React. The cache mechanics live in
 * sessionCache.ts; this file says what each mutation means.
 */

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

declare const persisted: unique symbol;

/**
 * A set-log id the server has acknowledged. Only `persistedSetLogId()` makes
 * one, so a mutation typed to take it cannot be handed a provisional row — the
 * check happens once, where the id enters, instead of at every call site.
 */
export type PersistedSetLogId = number & { readonly [persisted]: true };

/** The id if the server owns it, or null for a provisional or missing one. */
export function persistedSetLogId(id: number | null | undefined): PersistedSetLogId | null {
  return typeof id === 'number' && id > 0 ? (id as PersistedSetLogId) : null;
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
 * The mutation options behind `useLogSet`. The provisional row shows up before
 * the round trip; the server's row replaces it on refetch.
 */
export function logSetMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ sessionId, data }: LogSetVariables) => sessionsApi.logSet(sessionId, data),

    onMutate: async (variables: LogSetVariables): Promise<LogSetContext> => {
      const provisionalId = nextProvisionalSetLogId();
      const now = new Date().toISOString();
      await patchCachedSession(
        queryClient,
        variables.sessionId,
        appendSetLog(
          { workoutSessionExerciseId: variables.data.workout_session_exercise_id, exerciseId: variables.data.exercise_id },
          (exercise): SetLogResource => ({
            id: provisionalId,
            workout_session_id: variables.sessionId,
            workout_session_exercise_id: exercise.session_exercise?.id ?? null,
            exercise_id: variables.data.exercise_id,
            set_number: variables.data.set_number,
            weight: variables.data.weight,
            reps: variables.data.reps,
            rest_seconds: variables.data.rest_seconds ?? null,
            created_at: now,
            updated_at: now,
          })
        )
      );
      return { provisionalId };
    },

    onError: (error: Error, variables: LogSetVariables, context: LogSetContext | undefined) => {
      // Rollback by pulling this one row out, rather than restoring the whole
      // snapshot the way the siblings do. Logging is the one action a user
      // fires back-to-back, so a snapshot taken before *this* request can
      // predate a second log that is still in flight — restoring it would
      // retract a set that is about to succeed.
      if (context) {
        updateCachedSession(queryClient, variables.sessionId, withdrawSetLog(context.provisionalId));
      }
      console.error('Failed to log set:', error);
    },

    onSuccess: (_data: unknown, variables: LogSetVariables) => {
      // Refetch to swap the provisional row for the server's, with its real id
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.exercises.histories(variables.data.exercise_id)
      });
    }
  };
}

export interface UpdateSetVariables {
  sessionId: number;
  setLogId: PersistedSetLogId;
  data: UpdateSetInput;
}

export interface DeleteSetVariables {
  sessionId: number;
  setLogId: PersistedSetLogId;
}

export interface SetLogMutationContext {
  snapshot: SessionSnapshot;
  /**
   * Which exercise the set belongs to, read before the patch so `onSuccess`
   * can invalidate that one history rather than the catalog. `null` when the
   * session or the row is not cached.
   */
  exerciseId: number | null;
}

/** The runtime half of `PersistedSetLogId`, for anything that gets past the type. */
function assertPersisted(setLogId: number): void {
  if (isProvisionalSetLogId(setLogId)) {
    throw new Error(`Set log ${setLogId} is provisional — the server has not acknowledged it yet.`);
  }
}

function invalidateAfterSetChange(queryClient: QueryClient, sessionId: number, exerciseId: number | null, fallbackToCatalog: boolean) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.sessions.detail(sessionId)
  });
  if (exerciseId != null) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.exercises.histories(exerciseId)
    });
  } else if (fallbackToCatalog) {
    // The set was not in the cached session, so no exercise can be named. Not
    // reachable when the session screen is the caller.
    queryClient.invalidateQueries({
      queryKey: queryKeys.exercises.all()
    });
  }
}

export function updateSetMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ sessionId, setLogId, data }: UpdateSetVariables) => {
      assertPersisted(setLogId);
      return sessionsApi.updateSet(sessionId, setLogId, data);
    },

    onMutate: async (variables: UpdateSetVariables): Promise<SetLogMutationContext> => {
      const snapshot = await patchCachedSession(
        queryClient,
        variables.sessionId,
        patchSetLog(variables.setLogId, variables.data)
      );
      return { snapshot, exerciseId: findSetLog(snapshot.previous, variables.setLogId)?.setLog.exercise_id ?? null };
    },

    onError: (error: Error, _variables: UpdateSetVariables, context: SetLogMutationContext | undefined) => {
      restoreCachedSession(queryClient, context?.snapshot);
      console.error('Failed to update set:', error);
    },

    onSuccess: (_data: unknown, variables: UpdateSetVariables, context: SetLogMutationContext | undefined) => {
      invalidateAfterSetChange(queryClient, variables.sessionId, context?.exerciseId ?? null, true);
    }
  };
}

export function deleteSetMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ sessionId, setLogId }: DeleteSetVariables) => {
      assertPersisted(setLogId);
      return sessionsApi.deleteSet(sessionId, setLogId);
    },

    onMutate: async (variables: DeleteSetVariables): Promise<SetLogMutationContext> => {
      const snapshot = await patchCachedSession(queryClient, variables.sessionId, removeSetLog(variables.setLogId));
      return { snapshot, exerciseId: findSetLog(snapshot.previous, variables.setLogId)?.setLog.exercise_id ?? null };
    },

    onError: (error: Error, _variables: DeleteSetVariables, context: SetLogMutationContext | undefined) => {
      restoreCachedSession(queryClient, context?.snapshot);
      console.error('Failed to delete set:', error);
    },

    onSuccess: (_data: unknown, variables: DeleteSetVariables, context: SetLogMutationContext | undefined) => {
      invalidateAfterSetChange(queryClient, variables.sessionId, context?.exerciseId ?? null, false);
    }
  };
}
