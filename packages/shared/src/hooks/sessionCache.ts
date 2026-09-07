import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import type {
  SessionDetailResponse,
  SessionExerciseDetail,
  SetLogResource,
  UpdateSessionExerciseInput,
  UpdateSetInput,
} from '../types/api';

/**
 * The one owner of optimistic patches to a cached Workout Session (spec 0024).
 *
 * Four mutation hooks used to carry the same five steps by hand — cancel the
 * in-flight fetch, snapshot for rollback, walk `old.exercises`, spread-rebuild,
 * restore on error — typed `(old: any)` every time. The copies drifted: one
 * read the cache through a `.data` that does not exist and invalidated the
 * whole exercise catalog on every set edit (0013). This module holds the
 * mechanics once, against the real payload type, and the pure patches below
 * say only what each mutation means: which row, which field.
 */

/**
 * What `useSession` caches: the response's `data`, so `exercises` sits at the
 * top level. There is no `.data` on the cached value.
 */
export type CachedSession = SessionDetailResponse['data'];

export type SessionPatch = (session: CachedSession) => CachedSession;

export interface SessionSnapshot {
  sessionId: number;
  /** Undefined when the session was not cached; restoring then does nothing. */
  previous: CachedSession | undefined;
}

export function readCachedSession(queryClient: QueryClient, sessionId: number): CachedSession | undefined {
  return queryClient.getQueryData<CachedSession>(queryKeys.sessions.detail(sessionId));
}

/**
 * Cancel any fetch in flight (so a stale response cannot land on top of the
 * patch), snapshot the session, apply `patch` to it. The snapshot is what
 * `restoreCachedSession` puts back on error.
 */
export async function patchCachedSession(
  queryClient: QueryClient,
  sessionId: number,
  patch: SessionPatch
): Promise<SessionSnapshot> {
  await queryClient.cancelQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
  const previous = readCachedSession(queryClient, sessionId);
  if (previous?.exercises) {
    queryClient.setQueryData(queryKeys.sessions.detail(sessionId), patch(previous));
  }
  return { sessionId, previous };
}

/**
 * Apply `patch` to whatever is cached right now, without a snapshot. For a
 * rollback that must leave other in-flight work alone — see the set-log
 * rollback in setLogMutations.ts.
 */
export function updateCachedSession(queryClient: QueryClient, sessionId: number, patch: SessionPatch): void {
  queryClient.setQueryData<CachedSession>(queryKeys.sessions.detail(sessionId), old =>
    old?.exercises ? patch(old) : old
  );
}

export function restoreCachedSession(queryClient: QueryClient, snapshot: SessionSnapshot | undefined): void {
  if (snapshot?.previous) {
    queryClient.setQueryData(queryKeys.sessions.detail(snapshot.sessionId), snapshot.previous);
  }
}

// ---------------------------------------------------------------------------
// Pure patches. Each returns a new session; none reads the QueryClient.
// ---------------------------------------------------------------------------

export function findSetLog(
  session: CachedSession | undefined,
  setLogId: number
): { exercise: SessionExerciseDetail; setLog: SetLogResource } | undefined {
  for (const exercise of session?.exercises ?? []) {
    const setLog = exercise.logged_sets?.find(log => log.id === setLogId);
    if (setLog) return { exercise, setLog };
  }
  return undefined;
}

function mapExercises(
  session: CachedSession,
  fn: (exercise: SessionExerciseDetail) => SessionExerciseDetail
): CachedSession {
  return { ...session, exercises: session.exercises.map(fn) };
}

/** Merge `data` into one session-exercise row. This is the only optimistic writer of `target_sets`. */
export function patchSessionExercise(sessionExerciseId: number, data: UpdateSessionExerciseInput): SessionPatch {
  return session =>
    mapExercises(session, exercise =>
      exercise.session_exercise.id === sessionExerciseId
        ? {
            ...exercise,
            session_exercise: { ...exercise.session_exercise, ...data, updated_at: new Date().toISOString() },
          }
        : exercise
    );
}

export function removeSessionExercise(sessionExerciseId: number): SessionPatch {
  return session => ({
    ...session,
    exercises: session.exercises.filter(exercise => exercise.session_exercise.id !== sessionExerciseId),
  });
}

/** Write an edit into the one logged set that carries `setLogId`. */
export function patchSetLog(setLogId: number, data: UpdateSetInput): SessionPatch {
  return session =>
    mapExercises(session, exercise =>
      exercise.logged_sets?.some(log => log.id === setLogId)
        ? {
            ...exercise,
            logged_sets: exercise.logged_sets.map(log =>
              log.id === setLogId
                ? { ...log, weight: data.weight, reps: data.reps, updated_at: new Date().toISOString() }
                : log
            ),
          }
        : exercise
    );
}

/**
 * Drop one logged set and shift every later set's `set_number` down by one,
 * matching the server's re-sequencing so numbering stays contiguous.
 *
 * `target_sets` is deliberately untouched. DELETE .../sets/{id} does not modify
 * it — the field is client-owned and written by the follow-up
 * PATCH .../exercises/{id}, so `patchSessionExercise` is its one writer
 * (docs/specs/0006 part 1).
 *
 * The re-sequencing is a read-side rule living here because the read model
 * matches logs to slots by `set_number`. If docs/specs/0005 resolves as
 * "target is a floor, logs are truth", this may change shape; ported as-is.
 */
export function removeSetLog(setLogId: number): SessionPatch {
  return session =>
    mapExercises(session, exercise => {
      const deleted = exercise.logged_sets?.find(log => log.id === setLogId);
      if (!deleted) return exercise;
      return {
        ...exercise,
        logged_sets: exercise.logged_sets
          .filter(log => log.id !== setLogId)
          .map(log => (log.set_number > deleted.set_number ? { ...log, set_number: log.set_number - 1 } : log)),
      };
    });
}

/** Drop one row and nothing else — no re-sequencing. For withdrawing a provisional set. */
export function withdrawSetLog(setLogId: number): SessionPatch {
  return session =>
    mapExercises(session, exercise =>
      exercise.logged_sets?.some(log => log.id === setLogId)
        ? { ...exercise, logged_sets: exercise.logged_sets.filter(log => log.id !== setLogId) }
        : exercise
    );
}

/**
 * Append a set to the row the server would attach it to: the explicit
 * session-exercise row when given, otherwise the first occurrence of the
 * exercise in the session. Appends to at most one row.
 */
export function appendSetLog(
  target: { workoutSessionExerciseId?: number | null; exerciseId: number },
  build: (exercise: SessionExerciseDetail) => SetLogResource
): SessionPatch {
  return session => {
    let matched = false;
    return mapExercises(session, exercise => {
      if (matched) return exercise;
      const row = exercise.session_exercise;
      const isMatch =
        target.workoutSessionExerciseId != null
          ? row?.id === target.workoutSessionExerciseId
          : row?.exercise_id === target.exerciseId;
      if (!isMatch) return exercise;
      matched = true;
      return { ...exercise, logged_sets: [...(exercise.logged_sets ?? []), build(exercise)] };
    });
  };
}
