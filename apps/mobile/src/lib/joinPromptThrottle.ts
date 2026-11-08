// The foreground re-check's throttle state (ticket #95): epoch ms of this
// user's last nearby check, persisted per user (SecureStore, like
// pushPrompt.ts) so the once-per-hour courtesy survives restarts and never
// leaks between accounts on one phone. Stamped by whichever check runs — the
// post-registration step or the foreground re-check — and read only by
// lib/joinPrompt.shouldCheckOnForeground. The server's dismissal filter is the
// real gate; losing this state only costs one extra silent nearby call.
import * as SecureStore from 'expo-secure-store'

// SecureStore key: 'joinPromptLastCheckedAt.<userId>' (alphanumeric plus '.' is valid).
export const JOIN_PROMPT_LAST_CHECK_KEY_PREFIX = 'joinPromptLastCheckedAt.'

function keyFor(userId: number): string {
  return `${JOIN_PROMPT_LAST_CHECK_KEY_PREFIX}${userId}`
}

/** Garbage and null read as "never checked". */
export function parseLastCheckedAt(raw: string | null): number | null {
  if (raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

// Rejects on a SecureStore failure — deliberately not "never checked", so the
// caller falls through to "don't check" rather than fire on every foreground.
export async function readJoinPromptLastCheckedAt(userId: number): Promise<number | null> {
  return parseLastCheckedAt(await SecureStore.getItemAsync(keyFor(userId)))
}

export async function markJoinPromptChecked(userId: number, now: number = Date.now()): Promise<void> {
  await SecureStore.setItemAsync(keyFor(userId), String(now)).catch(() => {})
}
