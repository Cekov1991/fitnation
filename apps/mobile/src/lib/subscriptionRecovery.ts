import { isApiFailure, type UserResource } from '@fit-nation/shared'
import { hasBackendAppAccess } from '../navigation/gate'

export interface SubscriptionRecoveryDeps {
  /** Whether RevenueCat's customerInfo reports `app_access` right now. */
  storeGrantsAccess: () => Promise<boolean>
  /** Subscription Sync: `POST /api/subscription/sync`; answers the same user as `GET /user`. */
  sync: () => Promise<{ user: UserResource }>
  /** The backend agrees again: take the fresh user and refetch what 403'd. */
  onRecovered: (user: UserResource) => void
  /**
   * A sync answered and the backend still grants nothing: its word beats
   * RevenueCat's cache, so the gate must send the user to the paywall
   * (decision 2026-10-09, ticket 13). Takes the synced user.
   */
  onRefused: (user: UserResource) => void
  /**
   * No backend verdict (RevenueCat says no or can't be read, the sync failed,
   * or a sync ran moments ago): refresh both entitlement sources and let the
   * gate decide. That is the paywall unless RevenueCat still grants access
   * (the gate trusts either source until the backend refuses).
   */
  onUnrecovered: () => void
  now?: () => number
  log?: (message: string, error?: unknown) => void
}

/** After a sync, further 403s take the fallback without syncing for this long. */
export const SYNC_COOLDOWN_MS = 60_000

export type RecoveryOutcome = 'recovered' | 'refused' | 'unrecovered'

/**
 * Recovery from a 403 `subscription_required`. Spec 026, ticket 08.
 *
 * If RevenueCat says the user has paid, the backend is behind (late or failed
 * webhook): sync once and, when the synced user carries `app_access`, hand it
 * over. A sync that answers without it is the backend's refusal, handed over
 * as such (ticket 13). Anything else — RevenueCat says no, RevenueCat or the
 * sync fails (500/502/429/network/timeout) — falls back to today's behaviour.
 *
 * No loop: concurrent 403s join the recovery in flight, and for
 * SYNC_COOLDOWN_MS after a sync a 403 takes that fallback without syncing.
 */
export function createSubscriptionRecovery(deps: SubscriptionRecoveryDeps): () => Promise<RecoveryOutcome> {
  const now = deps.now ?? Date.now
  let inFlight: Promise<RecoveryOutcome> | null = null
  let lastSyncAt: number | null = null

  /** The synced user, or null when no sync answered. */
  async function trySync(): Promise<UserResource | null> {
    if (lastSyncAt !== null && now() - lastSyncAt < SYNC_COOLDOWN_MS) return null
    try {
      if (!(await deps.storeGrantsAccess())) return null
      lastSyncAt = now()
      return (await deps.sync()).user
    } catch (e) {
      deps.log?.('[subscription] recovery sync failed', e)
      return null
    }
  }

  async function run(): Promise<RecoveryOutcome> {
    const user = await trySync()
    if (!user) {
      deps.onUnrecovered()
      return 'unrecovered'
    }
    if (hasBackendAppAccess(user)) {
      deps.onRecovered(user)
      return 'recovered'
    }
    deps.onRefused(user)
    return 'refused'
  }

  return () => {
    inFlight ??= run().finally(() => { inFlight = null })
    return inFlight
  }
}

/**
 * What the global mutation toast says. A mutation the gate answered with
 * `subscription_required` is not retried — recovery runs behind it, and the
 * user may be on their way to the paywall — so it reads as a plain, retryable
 * failure rather than the server's "Subscription required." (decision
 * 2026-10-09, ticket 13).
 */
export function mutationErrorMessage(error: unknown): string {
  if (isApiFailure(error) && error.kind === 'subscription_required') return 'Something went wrong — try again.'
  return error instanceof Error ? error.message : 'Something went wrong'
}
