import { describe, expect, it } from 'vitest'
import {
  canPresentJoinPromptOver,
  dismissalKindOf,
  HOUSE_PARTNER_ID,
  offersJoinPromptStep,
  JOIN_PROMPT_RECHECK_INTERVAL_MS,
  pickNearestPartner,
  shouldCheckOnForeground,
  shouldRunJoinPrompt,
  showsChangeGymLine,
} from './joinPrompt'

/**
 * The Join Prompt decision (ticket #94): a House Partner customer standing in
 * a Join-Prompt-enabled gym is offered that Partner between registration and
 * Onboarding. This module owns the two choices with no React and no IO:
 * whether the step runs at all, and which nearby Partner to offer. The server
 * is the real eligibility gate (`/partners/nearby` answers `[]` for anyone
 * ineligible); these rules only keep the step invisible when asking would be
 * pointless or rude.
 */
describe('shouldRunJoinPrompt', () => {
  it('runs for a House Partner customer who has not been asked and can still be asked', () => {
    expect(
      shouldRunJoinPrompt({
        userPartnerId: HOUSE_PARTNER_ID,
        alreadyAsked: false,
        permissionStatus: 'undetermined',
      })
    ).toBe(true)
  })

  it('skips a customer already on a Partner — a Gym Join is one-way and only starts from the House Partner', () => {
    expect(
      shouldRunJoinPrompt({ userPartnerId: 42, alreadyAsked: false, permissionStatus: 'undetermined' })
    ).toBe(false)
  })

  it('skips a user without a partner — nothing to move from, and the shape is unexpected', () => {
    expect(
      shouldRunJoinPrompt({ userPartnerId: null, alreadyAsked: false, permissionStatus: 'undetermined' })
    ).toBe(false)
  })

  it('asks once per session: already asked means skip', () => {
    expect(
      shouldRunJoinPrompt({ userPartnerId: HOUSE_PARTNER_ID, alreadyAsked: true, permissionStatus: 'granted' })
    ).toBe(false)
  })

  it('skips when location permission is denied — the person already said no, and the step stays invisible', () => {
    expect(
      shouldRunJoinPrompt({ userPartnerId: HOUSE_PARTNER_ID, alreadyAsked: false, permissionStatus: 'denied' })
    ).toBe(false)
  })

  it('runs when permission is already granted — no OS prompt needed, straight to the location fix', () => {
    expect(
      shouldRunJoinPrompt({ userPartnerId: HOUSE_PARTNER_ID, alreadyAsked: false, permissionStatus: 'granted' })
    ).toBe(true)
  })
})

/**
 * The navigator decides the launch route synchronously, before the (async)
 * permission state can be read, so routing uses the permission-free subset:
 * offer the step to an unasked House customer and let the screen itself skip
 * on a denied permission.
 */
describe('offersJoinPromptStep', () => {
  it('offers the step to an unasked House Partner customer', () => {
    expect(offersJoinPromptStep({ userPartnerId: HOUSE_PARTNER_ID, alreadyAsked: false })).toBe(true)
  })

  it('does not offer it to a Gym Signup, or twice in a session', () => {
    expect(offersJoinPromptStep({ userPartnerId: 42, alreadyAsked: false })).toBe(false)
    expect(offersJoinPromptStep({ userPartnerId: HOUSE_PARTNER_ID, alreadyAsked: true })).toBe(false)
  })
})

/**
 * The foreground re-check (ticket #95): whenever the app comes to the
 * foreground, an eligible House customer whose location permission is already
 * granted gets a location fix + nearby call — never an OS permission prompt,
 * and at most once per hour.
 */
describe('shouldCheckOnForeground', () => {
  const NOW = 1_800_000_000_000

  it('checks a House Partner customer with permission granted and no check on record', () => {
    expect(
      shouldCheckOnForeground({
        userPartnerId: HOUSE_PARTNER_ID,
        permissionStatus: 'granted',
        lastCheckedAt: null,
        now: NOW,
      })
    ).toBe(true)
  })

  it('is throttled to once per hour: a check within the hour skips, an older one runs again', () => {
    const base = { userPartnerId: HOUSE_PARTNER_ID, permissionStatus: 'granted', now: NOW } as const
    expect(shouldCheckOnForeground({ ...base, lastCheckedAt: NOW - 59 * 60 * 1000 })).toBe(false)
    expect(shouldCheckOnForeground({ ...base, lastCheckedAt: NOW - JOIN_PROMPT_RECHECK_INTERVAL_MS })).toBe(false)
    expect(shouldCheckOnForeground({ ...base, lastCheckedAt: NOW - JOIN_PROMPT_RECHECK_INTERVAL_MS - 1 })).toBe(true)
  })

  it('never asks for permission: undetermined and denied both skip — only an already-granted permission checks', () => {
    const base = { userPartnerId: HOUSE_PARTNER_ID, lastCheckedAt: null, now: NOW } as const
    expect(shouldCheckOnForeground({ ...base, permissionStatus: 'undetermined' })).toBe(false)
    expect(shouldCheckOnForeground({ ...base, permissionStatus: 'denied' })).toBe(false)
  })

  it('skips anyone not on the House Partner — a Gym Join is one-way, so there is nothing to offer', () => {
    const base = { permissionStatus: 'granted', lastCheckedAt: null, now: NOW } as const
    expect(shouldCheckOnForeground({ ...base, userPartnerId: 42 })).toBe(false)
    expect(shouldCheckOnForeground({ ...base, userPartnerId: null })).toBe(false)
  })

  it('treats a timestamp in the future (clock moved back) as recently checked, not as never', () => {
    expect(
      shouldCheckOnForeground({
        userPartnerId: HOUSE_PARTNER_ID,
        permissionStatus: 'granted',
        lastCheckedAt: NOW + 60_000,
        now: NOW,
      })
    ).toBe(false)
  })
})

/**
 * Dismissal-kind routing (ticket #95, GLOSSARY "Join Prompt"): a terminal
 * dismissal (`declined`, silencing the Partner permanently) only ever comes
 * from the explicit "Not Interested" tap; every other way out — "Maybe Later",
 * the backdrop, the back gesture — is a 24-hour snooze.
 */
describe('dismissalKindOf', () => {
  it('routes only the explicit "Not Interested" tap to declined', () => {
    expect(dismissalKindOf('not-interested')).toBe('declined')
  })

  it('routes everything else to snoozed', () => {
    expect(dismissalKindOf('maybe-later')).toBe('snoozed')
    expect(dismissalKindOf('backdrop')).toBe('snoozed')
    expect(dismissalKindOf('back')).toBe('snoozed')
  })
})

/**
 * The re-check's sheet is a courtesy, never an interruption: it presents only
 * over the main tab container, so a blocking flow (Onboarding, Paywall) or a
 * fullScreenModal like an active WorkoutSession is never covered.
 */
describe('canPresentJoinPromptOver', () => {
  it('presents over the main tab container', () => {
    expect(canPresentJoinPromptOver('Tabs')).toBe(true)
  })

  it('stays away from every other stack route — WorkoutSession above all — and from an unready navigator', () => {
    expect(canPresentJoinPromptOver('WorkoutSession')).toBe(false)
    expect(canPresentJoinPromptOver('Onboarding')).toBe(false)
    expect(canPresentJoinPromptOver('Paywall')).toBe(false)
    expect(canPresentJoinPromptOver(undefined)).toBe(false)
  })
})

/**
 * The support line (ticket #96, ADR 0006): a Gym Join is one-way, and the only
 * in-app mention of the way out is a low-prominence settings line — "to change
 * gyms, contact support". It shows exactly to the customers it is for: those
 * standing on a Partner. House customers have no gym to change (their path is
 * the Join Prompt itself), and the line must never appear in the prompt.
 */
describe('showsChangeGymLine', () => {
  it('shows for a customer on a Partner — the one who might want to change gyms', () => {
    expect(showsChangeGymLine(42)).toBe(true)
  })

  it('hides for a House customer and for a user without a partner — no gym to change', () => {
    expect(showsChangeGymLine(HOUSE_PARTNER_ID)).toBe(false)
    expect(showsChangeGymLine(null)).toBe(false)
  })
})

describe('pickNearestPartner', () => {
  it('picks the first Partner — `/partners/nearby` answers nearest first, and only [0] is offered', () => {
    const nearest = { id: 7, name: 'Iron Temple' }
    expect(pickNearestPartner([nearest, { id: 8, name: 'Further Gym' }])).toBe(nearest)
  })

  it('answers null for an empty list — ineligible users get [] from the server, and that is "no prompt", not an error', () => {
    expect(pickNearestPartner([])).toBeNull()
  })
})
