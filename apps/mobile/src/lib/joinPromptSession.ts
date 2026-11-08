/**
 * The "already asked" input to the Join Prompt decision (lib/joinPrompt.ts):
 * in-memory, per user id, for this app session only. Deliberately not
 * persisted — remembering a dismissal across sessions is ticket #95's
 * `POST /join-prompt/dismissals`, where the server keeps the state.
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
