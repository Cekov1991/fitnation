/**
 * The Join Prompt decision (ticket #94) — pure rules, no React, no IO.
 *
 * A Gym Join starts from the House Partner: the customer registered under
 * Fit Nation itself and may be standing in a Partner's Gym Location. The
 * server is the real eligibility gate (`GET /partners/nearby` answers `[]`
 * for anyone ineligible), so these rules only decide when asking is worth
 * the interruption at all.
 */
import type { JoinPromptDismissalKind } from '@fit-nation/shared'

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

/** The foreground re-check runs at most once per hour — a client courtesy; the server's dismissal filter is the real gate. */
export const JOIN_PROMPT_RECHECK_INTERVAL_MS = 60 * 60 * 1000

export interface ForegroundRecheckInput {
  /** `user.partner?.id ?? null` — a Gym Join is one-way, so only House customers are ever offered one. */
  userPartnerId: number | null
  /** The re-check never asks for permission — that happened (or not) in the post-registration step. */
  permissionStatus: LocationPermissionStatus
  /** Epoch ms of this user's last nearby check (step or foreground, persisted), null if never. */
  lastCheckedAt: number | null
  now: number
}

/**
 * The foreground re-check decision (ticket #95): on every return to the
 * foreground, check again whether an eligible customer is standing in a gym —
 * silently, and at most once per hour.
 */
export function shouldCheckOnForeground(input: ForegroundRecheckInput): boolean {
  if (input.permissionStatus !== 'granted') return false
  if (input.userPartnerId !== HOUSE_PARTNER_ID) return false
  if (input.lastCheckedAt === null) return true
  // A future timestamp (clock moved back) reads as recently checked, not never.
  return input.now - input.lastCheckedAt > JOIN_PROMPT_RECHECK_INTERVAL_MS
}

/**
 * Whether the re-check's sheet may present over the given stack route (the
 * AppNavigator's focused top-level route). Only the main tab container — the
 * sheet is a courtesy and must never cover a blocking flow (Onboarding,
 * Paywall) or a fullScreenModal like an active WorkoutSession.
 */
export function canPresentJoinPromptOver(stackRouteName: string | undefined): boolean {
  return stackRouteName === 'Tabs'
}

/** Every way out of the Join Prompt sheet that is not the Join itself. */
export type JoinPromptDismissalTrigger = 'not-interested' | 'maybe-later' | 'backdrop' | 'back'

/**
 * Dismissal-kind routing (GLOSSARY "Join Prompt"): terminal (`declined`) only
 * ever from the explicit "Not Interested" tap; everything else snoozes.
 */
export function dismissalKindOf(trigger: JoinPromptDismissalTrigger): JoinPromptDismissalKind {
  return trigger === 'not-interested' ? 'declined' : 'snoozed'
}

/**
 * The Partner the sheet offers: `/partners/nearby` orders nearest first, so
 * the first entry is the one — picked here, defensively, so no caller ever
 * reads `[0]` off an empty answer.
 */
export function pickNearestPartner<T>(partners: readonly T[]): T | null {
  return partners[0] ?? null
}

/**
 * The support line (ticket #96, ADR 0006): a Gym Join is one-way, and the only
 * in-app mention of the way out is a low-prominence settings line — "to change
 * gyms, contact support". It shows exactly to the customers it is for: those
 * on a Partner. A House customer has no gym to change (their way onto one is
 * the Join Prompt itself), and the line never appears in the prompt.
 */
export function showsChangeGymLine(userPartnerId: number | null): boolean {
  return userPartnerId !== null && userPartnerId !== HOUSE_PARTNER_ID
}
