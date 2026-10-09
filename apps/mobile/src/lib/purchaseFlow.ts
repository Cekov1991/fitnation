import type { UserResource } from '@fit-nation/shared'
import { Entitlement } from './entitlements'

const POLL_TIMEOUT_MS = 10_000
const POLL_INTERVAL_MS = 1_000

const hasAccess = (user: UserResource | null) => !!user?.entitlements?.includes(Entitlement.AppAccess)

export interface PurchaseFlowDeps {
  /** The backend user id; RevenueCat's app user id must be its string form. */
  userId: number
  revenueCat: {
    currentUserId: () => Promise<string>
    logIn: (userId: string) => Promise<void>
  }
  /** The purchase, or the restore; resolves whether RevenueCat now grants `app_access`. */
  transact: () => Promise<boolean>
  /** Subscription Sync: `POST /api/subscription/sync`. */
  sync: () => Promise<{ user: UserResource }>
  /** `GET /api/user`. */
  fetchUser: () => Promise<UserResource>
  now?: () => number
  sleep?: (ms: number) => Promise<void>
  log?: (message: string, error?: unknown) => void
}

export type PurchaseFlowResult =
  /** Go in. `user` is the freshest backend user seen, with or without `app_access` (the wait timed out). */
  | { kind: 'entered'; user: UserResource | null }
  /** RevenueCat holds another user even after one more log-in; nothing was bought. Ask to try again. */
  | { kind: 'identity-mismatch' }
  /** The store granted no `app_access` and neither did the sync (e.g. a restore that found nothing). */
  | { kind: 'not-granted' }

/** RevenueCat holds the signed-in user, after at most one more log-in. */
async function ensureIdentity(deps: PurchaseFlowDeps): Promise<boolean> {
  const expected = String(deps.userId)
  try {
    if ((await deps.revenueCat.currentUserId()) === expected) return true
    await deps.revenueCat.logIn(expected)
    return (await deps.revenueCat.currentUserId()) === expected
  } catch (e) {
    deps.log?.('[purchase] RevenueCat identity check failed', e)
    return false
  }
}

/**
 * A store purchase or restore, made so it can't go unattributed and so the user
 * enters only once the backend agrees (or after a short wait). Spec 026, ticket 07.
 *
 * 1. RevenueCat must hold the signed-in user (`String(user.id)`); if not, log in
 *    once more; still not → `identity-mismatch`, nothing bought.
 * 2. `transact`: the purchase, or the restore. Its errors (cancelled sheet,
 *    already purchased) reach the caller unchanged.
 * 3. Subscription Sync. A failure is logged, never blocking: the webhook still
 *    gets there.
 * 4. If the store granted access, poll `GET /user` until it carries
 *    `app_access`, up to ~10 s, then enter regardless (the access gate also
 *    trusts RevenueCat). If it didn't, enter only on the sync's word.
 */
export async function runPurchaseFlow(deps: PurchaseFlowDeps): Promise<PurchaseFlowResult> {
  if (!(await ensureIdentity(deps))) return { kind: 'identity-mismatch' }
  const granted = await deps.transact()

  let user: UserResource | null = null
  try {
    user = (await deps.sync()).user
  } catch (e) {
    deps.log?.('[purchase] subscription sync failed', e)
  }
  if (hasAccess(user)) return { kind: 'entered', user }
  if (!granted) return { kind: 'not-granted' }

  const now = deps.now ?? Date.now
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)))
  const deadline = now() + POLL_TIMEOUT_MS
  while (now() < deadline) {
    try {
      user = await deps.fetchUser()
      if (hasAccess(user)) break
    } catch (e) {
      deps.log?.('[purchase] /user poll failed', e)
    }
    await sleep(Math.min(POLL_INTERVAL_MS, deadline - now()))
  }
  return { kind: 'entered', user }
}
