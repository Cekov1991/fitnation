import { fetch as netInfoFetch } from '@react-native-community/netinfo'

/**
 * Whether a request is worth starting.
 *
 * Read at the moment of asking rather than from the useNetInfo() hook, which
 * reports the last broadcast state and can be a beat stale right after the
 * radio drops. `isInternetReachable` is null while it is still being probed —
 * only an explicit false is treated as offline, so an unknown state still lets
 * the request through and fails the normal way.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await netInfoFetch()
    return state.isConnected !== false && state.isInternetReachable !== false
  } catch {
    // No answer from the module is not evidence of being offline.
    return true
  }
}
