// Device heartbeat (M2): PUT /devices after auth resolves, on foreground
// (throttled), and immediately after a permission grant. Best-effort: every
// failure is swallowed with a warning and retried on the next trigger. Never
// toasts. Nothing runs on logout — the server ends the Device when the Sanctum
// token is revoked.
//
// Mounted once, inside AuthProvider.
import { useCallback, useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useRegisterDevice, type UserResource } from '@fit-nation/shared'
import {
  buildRegistration,
  currentTimezone,
  ensureAndroidChannels,
  getPermissionStatus,
  getPushToken,
} from '../lib/notifications'
import {
  LAST_DEVICE_REGISTRATION_KEY,
  parseLastRegistration,
  shouldRegister,
  subscribeRegistrationRequested,
  type LastDeviceRegistration,
} from '../lib/deviceRegistration'

export async function clearLastDeviceRegistration(): Promise<void> {
  await SecureStore.deleteItemAsync(LAST_DEVICE_REGISTRATION_KEY).catch(() => {})
}

export function useDeviceRegistration(user: UserResource | null) {
  const { mutateAsync: registerDevice } = useRegisterDevice()
  const inFlight = useRef(false)

  const userId = user?.id ?? null
  const onboarded = !!user?.onboarding_completed_at

  const register = useCallback(
    async (force: boolean) => {
      if (inFlight.current) return
      if (userId === null || !onboarded) return
      inFlight.current = true
      try {
        if ((await getPermissionStatus()) !== 'granted') return
        await ensureAndroidChannels()
        const token = await getPushToken()
        if (!token) return
        const timezone = currentTimezone()

        const raw = await SecureStore.getItemAsync(LAST_DEVICE_REGISTRATION_KEY).catch(() => null)
        if (!force && !shouldRegister(parseLastRegistration(raw), Date.now(), token, timezone)) return

        await registerDevice(buildRegistration(token))
        const sent: LastDeviceRegistration = { token, timezone, sentAt: Date.now() }
        await SecureStore.setItemAsync(LAST_DEVICE_REGISTRATION_KEY, JSON.stringify(sent))
      } catch (e) {
        console.warn('[push]', e)
      } finally {
        inFlight.current = false
      }
    },
    // Keyed on the user fields (not the object) so a foreground `setUser` of
    // the same user does not re-create the callback and re-fire the effects.
    [userId, onboarded, registerDevice],
  )

  // Auth resolved to a user (cold start, login) or onboarding just completed.
  useEffect(() => {
    register(false)
  }, [register])

  // Foreground, throttled by shouldRegister().
  useEffect(() => {
    let prev: AppStateStatus = AppState.currentState
    const sub = AppState.addEventListener('change', (next) => {
      const was = prev
      prev = next
      if (next === 'active' && was !== 'active') register(false)
    })
    return () => sub.remove()
  }, [register])

  // Permission granted from the onboarding sheet or the Profile toggle.
  useEffect(() => subscribeRegistrationRequested(() => register(true)), [register])
}
