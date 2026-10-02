import { failureOf } from '@fit-nation/shared'
import type { UserResource } from '@fit-nation/shared'

export type BootSession =
  | { kind: 'signed-out' }
  | { kind: 'online'; user: UserResource }
  | { kind: 'offline'; user: UserResource }
  | { kind: 'unreachable' }

interface Deps {
  token: string | null
  fetchUser: () => Promise<UserResource>
  readCachedUser: () => Promise<UserResource | null>
}

/**
 * What the app boots into, given the stored token. Only a rejected token
 * (401) signs the person out; any other failure — no network, a 5xx, a
 * timeout — keeps the token and falls back to the last user payload we saw,
 * so a relaunch in airplane mode is "still in". The entitlement then comes
 * from RevenueCat's disk cache through useEntitlements (finding #4).
 *
 * 'unreachable' is a failure with nothing cached yet: the token stays for the
 * next launch and the person sees the sign-in screen this once.
 */
export async function restoreSession({ token, fetchUser, readCachedUser }: Deps): Promise<BootSession> {
  if (!token) return { kind: 'signed-out' }
  try {
    return { kind: 'online', user: await fetchUser() }
  } catch (e) {
    if (failureOf(e).kind === 'unauthorized') return { kind: 'signed-out' }
    const cached = await readCachedUser().catch(() => null)
    return cached ? { kind: 'offline', user: cached } : { kind: 'unreachable' }
  }
}
