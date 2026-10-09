import type { UserResource } from '@fit-nation/shared'
import { Entitlement } from './entitlements'

const POLL_TIMEOUT_MS = 10_000
const POLL_INTERVAL_MS = 1_000

const hasAccess = (user: UserResource | null) => !!user?.entitlements?.includes(Entitlement.AppAccess)

/**
 * A store purchase or restore, made so it can't go unattributed and so the user
 * enters only once the backend agrees (or after a short wait). Spec 026, ticket 07.
 *
 * 1. RevenueCat must hold the signed-in user (`String(user.id)`); if not, log in
 *    once more; still not → `identity-mismatch`, nothing bought.
 * 2. `transact`: the purchase, or the restore. Its errors (cancelled sheet,
 *    already purchased) propagate to the caller unchanged.
 * 3. Subscription Sync (`POST /api/subscription/sync`). A failure is logged,
 *    never blocking: the webhook still gets there.
 * 4. Poll `GET /user` until it carries `app_access`, up to ~10 s, then enter
 *    regardless (the access gate also trusts RevenueCat).
 */
export interface PurchaseFlowDeps {
  /** The backend user id; RevenueCat's app user id must be its string form. */
  userId: number
  revenueCat: {
    currentUserId: () => Promise<string>
    logIn: (userId: string) => Promise<void>
  }
  /** Purchase or restore; resolves whether RevenueCat now grants `app_access`. */
  transact: () => Promise<boolean>
  sync: () => Promise<{ user: UserResource }>
  fetchUser: () => Promise<UserResource>
  now?: () => number
  sleep?: (ms: number) => Promise<void>
  log?: (message: string, error?: unknown) => void
}

export type PurchaseFlowResult =
  | { kind: 'entered'; user: UserResource | null }
  | { kind: 'identity-mismatch' }
  | { kind: 'not-granted' }

/** RevenueCat holds the signed-in user, after at most one more log-in. */
async function ensureIdentity(deps: PurchaseFlowDeps): Promise<boolean> {
  const expected = String(deps.userId)
  if ((await deps.revenueCat.currentUserId()) === expected) return true
  try {
    await deps.revenueCat.logIn(expected)
    return (await deps.revenueCat.currentUserId()) === expected
  } catch (e) {
    deps.log?.('[purchase] RevenueCat log-in failed', e)
    return false
  }
}

export async function runPurchaseFlow(deps: PurchaseFlowDeps): Promise<PurchaseFlowResult> {
  if (!(await ensureIdentity(deps))) return { kind: 'identity-mismatch' }
  if (!(await deps.transact())) return { kind: 'not-granted' }

  let user: UserResource | null = null
  try {
    user = (await deps.sync()).user
  } catch (e) {
    deps.log?.('[purchase] subscription sync failed', e)
  }
  if (hasAccess(user)) return { kind: 'entered', user }

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
    await sleep(POLL_INTERVAL_MS)
  }
  return { kind: 'entered', user }
}
