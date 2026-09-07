// Gating for the notification permission explainer sheet.
// Decisions R10–R12 in docs/specs/0013-rest-timer-notification.md (superseding 0012 M3).
//
// The sheet is shown from onboarding and from the launch check, at most once
// every 7 days, until permission is granted. The pure functions here have no
// native imports; the two SecureStore helpers at the bottom are the only
// place the cadence is persisted.
import * as SecureStore from 'expo-secure-store'
import type { PermissionStatus } from './notifications'

// SecureStore key: epoch ms of the last time the sheet was shown, from anywhere.
export const PUSH_PROMPT_LAST_SHOWN_KEY = 'pushPromptLastShownAt'

// #55 stored '1' here for "Not now, never again". Read once as "never shown"
// and deleted (see readPushPromptLastShownAt).
export const LEGACY_PUSH_PROMPT_DISMISSED_KEY = 'pushPromptDismissed'

export const PUSH_PROMPT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000

// 'ask' → "Turn on" fires the OS prompt. 'settings' → the OS will never prompt
// again, so the primary action opens the app's Settings page instead.
export type PermissionSheetVariant = 'ask' | 'settings'

// `granted`: nothing to ask. Otherwise: never shown, or shown more than a week
// ago. A timestamp in the future (clock moved back) counts as recently shown.
export function shouldShowPermissionSheet(
  status: PermissionStatus,
  lastShownAt: number | null,
  now: number,
): boolean {
  if (status === 'granted') return false
  if (lastShownAt === null) return true
  return now - lastShownAt > PUSH_PROMPT_INTERVAL_MS
}

export function permissionSheetVariant(status: PermissionStatus): PermissionSheetVariant {
  return status === 'denied' ? 'settings' : 'ask'
}

// The legacy '1' flag, garbage and null all read as "never shown".
export function parseLastShownAt(raw: string | null): number | null {
  if (raw === null || raw === '' || raw === '1') return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 1 ? n : null
}

// Best effort: any SecureStore failure reads as "never shown".
export async function readPushPromptLastShownAt(): Promise<number | null> {
  try {
    const [raw, legacy] = await Promise.all([
      SecureStore.getItemAsync(PUSH_PROMPT_LAST_SHOWN_KEY),
      SecureStore.getItemAsync(LEGACY_PUSH_PROMPT_DISMISSED_KEY),
    ])
    // Migration from #55: the boolean carried no date, so it cannot feed the
    // cadence — drop it and let the 7-day clock start from the next showing.
    if (legacy !== null) SecureStore.deleteItemAsync(LEGACY_PUSH_PROMPT_DISMISSED_KEY).catch(() => {})
    return parseLastShownAt(raw)
  } catch {
    return null
  }
}

export async function markPushPromptShown(now: number = Date.now()): Promise<void> {
  await SecureStore.setItemAsync(PUSH_PROMPT_LAST_SHOWN_KEY, String(now)).catch(() => {})
}
