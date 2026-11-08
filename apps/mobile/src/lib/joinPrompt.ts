/**
 * The Join Prompt decision (ticket #94) — pure rules, no React, no IO.
 *
 * A Gym Join starts from the House Partner: the customer registered under
 * Fit Nation itself and may be standing in a Partner's Gym Location. The
 * server is the real eligibility gate (`GET /partners/nearby` answers `[]`
 * for anyone ineligible), so these rules only decide when asking is worth
 * the interruption at all.
 */

/** The House Partner's id — Fit Nation itself, the partner every plain registration lands on. */
export const HOUSE_PARTNER_ID = 1

/** expo-location's foreground statuses, stated here so this module needs no import from it. */
export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined'

export interface JoinPromptInput {
  /** `user.partner?.id ?? null` — null skips: a user without a partner is not a House customer we can move. */
  userPartnerId: number | null
  /** Whether this session already ran the step for this user (see joinPromptSession). */
  alreadyAsked: boolean
  permissionStatus: LocationPermissionStatus
}

export function shouldRunJoinPrompt(input: JoinPromptInput): boolean {
  if (input.alreadyAsked) return false
  if (input.permissionStatus === 'denied') return false
  return input.userPartnerId === HOUSE_PARTNER_ID
}

/**
 * The routing subset of the rule, for callers that must decide synchronously
 * (the navigator's launch route), before the async permission read. The step's
 * own screen re-checks with the real permission and stays invisible on a no.
 */
export function offersJoinPromptStep(input: Omit<JoinPromptInput, 'permissionStatus'>): boolean {
  return shouldRunJoinPrompt({ ...input, permissionStatus: 'undetermined' })
}

/**
 * The Partner the sheet offers: `/partners/nearby` orders nearest first, so
 * the first entry is the one — picked here, defensively, so no caller ever
 * reads `[0]` off an empty answer.
 */
export function pickNearestPartner<T>(partners: readonly T[]): T | null {
  return partners[0] ?? null
}
