import type { QueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api';
import { queryKeys } from '../queryKeys';
import type { UpdateSessionExerciseInput } from '../types/api';
import {
  patchCachedSession,
  patchSessionExercise,
  removeSessionExercise,
  restoreCachedSession,
  type SessionSnapshot,
} from './sessionCache';

/**
 * The session-exercise row mutations that patch the cache optimistically,
 * as option objects the hooks wrap in one line each (see setLogMutations.ts
 * for the set-log ones). Without the optimistic patch a removed exercise
 * stays in the list for the whole round trip, so a UI that follows the list
 * has to show a stale entry or hold a temporary index and correct it once the
 * refetch lands — which reads as the list flickering.
 */

export interface UpdateSessionExerciseVariables {
  sessionId: number;
  /** The session-exercise row id, not the exercise's. */
  exerciseId: number;
  data: UpdateSessionExerciseInput;
}

export interface RemoveSessionExerciseVariables {
  sessionId: number;
  /** The session-exercise row id, not the exercise's. */
  exerciseId: number;
}

export interface SessionExerciseMutationContext {
  snapshot: SessionSnapshot;
}

export function updateSessionExerciseMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ sessionId, exerciseId, data }: UpdateSessionExerciseVariables) =>
      sessionsApi.updateSessionExercise(sessionId, exerciseId, data),

    onMutate: async (variables: UpdateSessionExerciseVariables): Promise<SessionExerciseMutationContext> => ({
      snapshot: await patchCachedSession(
        queryClient,
        variables.sessionId,
        patchSessionExercise(variables.exerciseId, variables.data)
      ),
    }),

    onError: (error: Error, _variables: UpdateSessionExerciseVariables, context: SessionExerciseMutationContext | undefined) => {
      restoreCachedSession(queryClient, context?.snapshot);
      console.error('Failed to update session exercise:', error);
    },

    onSuccess: (_data: unknown, variables: UpdateSessionExerciseVariables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId)
      });
    }
  };
}

export function removeSessionExerciseMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ sessionId, exerciseId }: RemoveSessionExerciseVariables) =>
      sessionsApi.removeSessionExercise(sessionId, exerciseId),

    onMutate: async (variables: RemoveSessionExerciseVariables): Promise<SessionExerciseMutationContext> => ({
      snapshot: await patchCachedSession(queryClient, variables.sessionId, removeSessionExercise(variables.exerciseId)),
    }),

    onError: (error: Error, _variables: RemoveSessionExerciseVariables, context: SessionExerciseMutationContext | undefined) => {
      restoreCachedSession(queryClient, context?.snapshot);
      console.error('Failed to remove session exercise:', error);
    },

    onSuccess: (_data: unknown, variables: RemoveSessionExerciseVariables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId)
      });
    }
  };
}
