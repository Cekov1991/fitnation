// The one place in the app that talks to `expo-notifications`.
// Decisions M1–M9 referenced below are in docs/specs/0012-push-notifications-phase-one.md.
//
// Vocabulary (back-end/CONTEXT.md → Notifications): a Device is this
// installation signed in as this user; a Push Token is the Expo token; the
// Inactivity Nudge is the only notification the server sends in phase one.
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import type { RegisterDeviceInput } from '@fit-nation/shared'
import { showToast } from './toast'
import { requestDeviceRegistration } from './deviceRegistration'

export type PermissionStatus = 'granted' | 'denied' | 'undetermined'

// Android channels (0013 R5). The ids are the contract with the back-end: the
// server sends `channelId`, and Android drops a notification whose channel does
// not exist. `default` must stay in sync with the expo-notifications plugin's
// `defaultChannel` in app.json.
export const ANDROID_CHANNELS = {
  default: { name: 'Notifications', importance: Notifications.AndroidImportance.DEFAULT },
  'rest-timer': {
    name: 'Rest timer',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  },
  reminders: { name: 'Workout reminders', importance: Notifications.AndroidImportance.DEFAULT },
  progress: { name: 'Progress', importance: Notifications.AndroidImportance.DEFAULT },
} as const satisfies Record<string, Notifications.NotificationChannelInput>

export type AndroidChannelId = keyof typeof ANDROID_CHANNELS

export const REST_TIMER_CHANNEL_ID = 'rest-timer' satisfies AndroidChannelId

// Local notifications tagged with this `data.kind` belong to the rest timer.
export const REST_TIMER_KIND = 'rest-timer'

function toStatus(perm: Notifications.NotificationPermissionsStatus): PermissionStatus {
  if (perm.granted) return 'granted'
  // iOS reports `undetermined` with canAskAgain=true; a hard "No" flips
  // canAskAgain to false. Android < 13 grants implicitly.
  if (perm.status === 'undetermined' || perm.canAskAgain) return 'undetermined'
  return 'denied'
}

// Throws when the OS read fails, for callers that must tell "denied" apart
// from "unknown" (the launch check must not show Open Settings on an error).
export async function readPermissionStatus(): Promise<PermissionStatus> {
  return toStatus(await Notifications.getPermissionsAsync())
}

export async function getPermissionStatus(): Promise<PermissionStatus> {
  try {
    return await readPermissionStatus()
  } catch (e) {
    console.warn('[push]', e)
    return 'denied'
  }
}

// M9: an explicit prompt, never iOS provisional authorization.
export async function requestPermission(): Promise<boolean> {
  try {
    const perm = await Notifications.requestPermissionsAsync()
    return toStatus(perm) === 'granted'
  } catch (e) {
    console.warn('[push]', e)
    return false
  }
}

// The prompt + the follow-through: on a grant, poke the heartbeat so the Device
// registers now rather than on the next foreground.
export async function grantPushPermission(): Promise<boolean> {
  const granted = await requestPermission()
  if (granted) requestDeviceRegistration()
  return granted
}

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId
}

// M1: Expo Push Service, never the raw APNs/FCM device token. Null means the
// phone is not reachable right now: no permission, no EAS projectId, or a
// simulator/Expo Go where remote push does not exist.
export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null
  const id = projectId()
  if (!id) return null
  if ((await getPermissionStatus()) !== 'granted') return null
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: id })
    return data
  } catch (e) {
    console.warn('[push]', e)
    return null
  }
}

// Idempotent: Android updates an existing channel in place (importance can
// only be lowered by the user, never raised by us).
export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return
  try {
    await Promise.all(
      Object.entries(ANDROID_CHANNELS).map(([id, channel]) =>
        Notifications.setNotificationChannelAsync(id, channel),
      ),
    )
  } catch (e) {
    console.warn('[push]', e)
  }
}

// M4: a foreground notification becomes the app's own toast instead of the OS
// banner. It still lands in the tray/list. Call once at module load.
//
// 0013 R9: a rest-timer alert arriving in the foreground is dropped entirely —
// the session screen is showing the ring hit zero and fired the haptic.
export function configureForegroundHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const { title, body, data } = notification.request.content
      if (data?.kind === REST_TIMER_KIND) {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }
      }
      const text = [title, body].filter(Boolean).join(' — ')
      if (text) showToast(text, 'info')
      return {
        shouldShowBanner: false,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }
    },
  })
}

export function currentTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null
  } catch {
    return null
  }
}

// EAS injects `extra.eas.buildProfile` at build time; fall back rather than
// fail so a bare `expo start` still registers as a development Device.
function buildProfile(): string {
  const injected = Constants.expoConfig?.extra?.eas?.buildProfile
  if (typeof injected === 'string' && injected) return injected
  return __DEV__ ? 'development' : 'production'
}

export function buildRegistration(pushToken: string): RegisterDeviceInput {
  return {
    push_token: pushToken,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    timezone: currentTimezone(), // M7
    app_version: Constants.expoConfig?.version ?? null,
    build_profile: buildProfile(),
    device_name: Device.modelName ?? null,
  }
}
