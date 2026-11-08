// The Gym Join request and the Join Prompt dismissal write, shared by the
// post-registration step (JoinPromptScreen) and the foreground re-check
// (ForegroundJoinPrompt) so the 403-as-verdict rule exists once.
import type { QueryClient } from '@tanstack/react-query'
import { failureOf, partnersApi, type JoinPromptDismissalKind, type UserResource } from '@fit-nation/shared'

// 'declined' is the server refusing the Gym Join (one-way rule, inactive,
// disabled — ADR 0006): a verdict, not a user-facing error, so callers
// withdraw the offer quietly. Only 'failed' deserves a toast and a retry.
export type GymJoinOutcome = 'joined' | 'declined' | 'failed'

export async function performGymJoin(
  partnerId: number,
  deps: {
    refreshUser: () => Promise<unknown>
    setUser: (user: UserResource | null) => void
    queryClient: Pick<QueryClient, 'invalidateQueries'>
  }
): Promise<GymJoinOutcome> {
  try {
    const joined = await partnersApi.join(partnerId)
    // The Gym Join switches partner, branding and the program library —
    // refetch the profile so the identity visibly changes. The join already
    // echoed the full user, so a failed refetch falls back to that payload.
    try {
      await deps.refreshUser()
    } catch {
      deps.setUser(joined.user)
    }
    deps.queryClient.invalidateQueries()
    return 'joined'
  } catch (error) {
    return failureOf(error).status === 403 ? 'declined' : 'failed'
  }
}

/**
 * Fire-and-forget (#95): the server's dismissal filter is the source of
 * truth, and `/partners/nearby` simply offers the Partner again next time if
 * this write is lost.
 */
export function postJoinPromptDismissal(partnerId: number, kind: JoinPromptDismissalKind): void {
  void partnersApi.dismissJoinPrompt(partnerId, kind).catch(() => {})
}
