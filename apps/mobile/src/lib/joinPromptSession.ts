/**
 * The "already asked" input to the Join Prompt decision (lib/joinPrompt.ts):
 * in-memory, per user id, for this app session only. It gates exactly one
 * thing — the post-registration *step route*, so no session ever lands on the
 * JoinPrompt screen twice. It does not gate checks: the foreground re-check
 * (#95) runs for the same user again and is throttled by the persisted
 * per-user clock in joinPromptThrottle.ts instead, which the step's own check
 * also stamps. Dismissals live on the server (`POST /join-prompt/dismissals`),
 * which filters `/partners/nearby` accordingly.
 */
import { offersJoinPromptStep } from './joinPrompt'

const askedUserIds = new Set<number>()

/**
 * The routing question both navigation callers ask, in one place: should this
 * user's next Onboarding entry be the Join Prompt step instead?
 */
export function offersJoinPromptStepFor(
  user: { id: number; partner: { id: number } | null } | null | undefined
): boolean {
  return offersJoinPromptStep({
    userPartnerId: user?.partner?.id ?? null,
    alreadyAsked: wasJoinPromptAsked(user?.id),
  })
}

export function wasJoinPromptAsked(userId: number | null | undefined): boolean {
  if (userId == null) return true
  return askedUserIds.has(userId)
}

export function markJoinPromptAsked(userId: number): void {
  askedUserIds.add(userId)
}

/** Test seam. */
export function resetJoinPromptSession(): void {
  askedUserIds.clear()
}
