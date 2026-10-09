import type { UserResource } from '@fit-nation/shared'
import { Entitlement } from './entitlements'

export interface SubscriptionRecoveryDeps {
  /** Whether RevenueCat's customerInfo reports `app_access` right now. */
  storeGrantsAccess: () => Promise<boolean>
  /** Subscription Sync: `POST /api/subscription/sync`; answers the same user as `GET /user`. */
  sync: () => Promise<{ user: UserResource }>
  /** The backend agrees again: take the fresh user and refetch what 403'd. */
  onRecovered: (user: UserResource) => void
  /** Today's behaviour: refresh both entitlement sources and let the gate route to the paywall. */
  onPaywall: () => void
  now?: () => number
  log?: (message: string, error?: unknown) => void
}

/** After a sync, further 403s take the paywall path without syncing for this long. */
export const SYNC_COOLDOWN_MS = 60_000

export type RecoveryOutcome = 'recovered' | 'paywall'

/**
 * Recovery from a 403 `subscription_required`. Spec 026, ticket 08.
 *
 * If RevenueCat says the user has paid, the backend is behind (late or failed
 * webhook): sync once and, when the synced user carries `app_access`, hand it
 * over. Anything else — RevenueCat says no, RevenueCat or the sync fails, the
 * backend still disagrees — falls back to the paywall path.
 *
 * No loop: concurrent 403s join the recovery in flight, and for
 * SYNC_COOLDOWN_MS after a sync a 403 takes the paywall path without syncing.
 */
export function createSubscriptionRecovery(deps: SubscriptionRecoveryDeps): () => Promise<RecoveryOutcome> {
  const now = deps.now ?? Date.now
  let inFlight: Promise<RecoveryOutcome> | null = null
  let lastSyncAt: number | null = null

  async function trySync(): Promise<UserResource | null> {
    if (lastSyncAt !== null && now() - lastSyncAt < SYNC_COOLDOWN_MS) return null
    try {
      if (!(await deps.storeGrantsAccess())) return null
      lastSyncAt = now()
      const { user } = await deps.sync()
      return user.entitlements?.includes(Entitlement.AppAccess) ? user : null
    } catch (e) {
      deps.log?.('[subscription] recovery sync failed', e)
      return null
    }
  }

  async function run(): Promise<RecoveryOutcome> {
    const user = await trySync()
    if (user) {
      deps.onRecovered(user)
      return 'recovered'
    }
    deps.onPaywall()
    return 'paywall'
  }

  return () => {
    inFlight ??= run().finally(() => { inFlight = null })
    return inFlight
  }
}
