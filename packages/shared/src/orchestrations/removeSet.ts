import type { PersistedSetLogId } from '../hooks/setLogMutations';
import type { UpdateSessionExerciseInput } from '../types/api';
import { retryOnce, type Outcome } from './outcome';

/**
 * Remove a set from a live Session Exercise (docs/specs/0006 part 2).
 *
 * The server keeps `target_sets` client-owned, so removing a logged set is two
 * writes: DELETE the log, then PATCH the target down by one. If the second
 * fails after the first succeeded, the log is gone but the slot remains — the
 * removed set reappears as an empty pending row and the exercise un-completes.
 * The PATCH is retried once; if it fails again the session is resynced from
 * the server so the screen shows the real state (one log fewer, target
 * unchanged) rather than an optimistic one that no longer matches.
 *
 * A pending (never logged) set is only the PATCH.
 */
export interface RemoveSetDeps {
  deleteSet: (vars: { sessionId: number; setLogId: PersistedSetLogId }) => Promise<unknown>;
  updateSessionExercise: (vars: { sessionId: number; exerciseId: number; data: UpdateSessionExerciseInput }) => Promise<unknown>;
  /** Refetch the session from the server — the compensation when the target write is lost. */
  resyncSession: (sessionId: number) => Promise<unknown> | void;
}

export interface RemoveSetInput {
  sessionId: number;
  sessionExerciseId: number;
  /** The logged set to delete, or null for a pending slot. */
  setLogId: PersistedSetLogId | null;
  /** The target before removal; the PATCH sends the absolute value below it. */
  targetSets: number;
}

export type RemoveSetOutcome = Outcome<'delete' | 'target'>;

export async function removeSet(deps: RemoveSetDeps, input: RemoveSetInput): Promise<RemoveSetOutcome> {
  if (input.setLogId != null) {
    try {
      await deps.deleteSet({ sessionId: input.sessionId, setLogId: input.setLogId });
    } catch (error) {
      // Nothing has changed yet.
      return { ok: false, failed: 'delete', error, compensated: true };
    }
  }

  try {
    await retryOnce(() =>
      deps.updateSessionExercise({
        sessionId: input.sessionId,
        exerciseId: input.sessionExerciseId,
        data: { target_sets: input.targetSets - 1 },
      })
    );
  } catch (error) {
    let compensated = false;
    try {
      await deps.resyncSession(input.sessionId);
      compensated = true;
    } catch {
      // The resync itself failed; the next successful fetch will settle it.
    }
    return { ok: false, failed: 'target', error, compensated };
  }

  return { ok: true };
}
