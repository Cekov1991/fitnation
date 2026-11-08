// The Join Prompt's one location read, shared by the post-registration step
// and the foreground re-check. One balanced-accuracy fix is all a "which gym
// is this" question takes; a gym has wifi and walls, so don't wait on GPS
// forever. Rejects on timeout — callers treat any failure as "no prompt".
import * as Location from 'expo-location'

export const LOCATION_FIX_TIMEOUT_MS = 10_000

export async function getLocationFix(timeoutMs: number = LOCATION_FIX_TIMEOUT_MS): Promise<Location.LocationObject> {
  return Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('location fix timed out')), timeoutMs)
    ),
  ])
}
