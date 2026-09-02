// Gating for the one-time permission explainer (M3). Kept free of native
// imports so it can be unit-tested under node.
import type { PermissionStatus } from './notifications'

// SecureStore key. '1' once the user picked "Not now"; never re-prompted.
export const PUSH_PROMPT_DISMISSED_KEY = 'pushPromptDismissed'

// `granted`: nothing to ask. `denied`: the OS will not re-prompt, so the
// sheet's "Turn on" would lie — the Profile toggle's "Open Settings" is the
// way back. Dismissed: the user already said "Not now".
export function shouldShowPermissionSheet(status: PermissionStatus, dismissed: boolean): boolean {
  return status === 'undetermined' && !dismissed
}
