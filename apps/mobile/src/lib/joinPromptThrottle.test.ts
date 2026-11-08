import { beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory SecureStore so the storage helpers run under node (pushPrompt.test.ts pattern).
const store = vi.hoisted(() => new Map<string, string>())
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (k: string) => store.get(k) ?? null),
  setItemAsync: vi.fn(async (k: string, v: string) => void store.set(k, v)),
}))

import * as SecureStore from 'expo-secure-store'
import { markJoinPromptChecked, parseLastCheckedAt, readJoinPromptLastCheckedAt } from './joinPromptThrottle'

const NOW = 1_800_000_000_000

beforeEach(() => store.clear())

/**
 * The foreground re-check's throttle state (ticket #95): the last-check
 * timestamp, persisted per user so the once-per-hour courtesy survives app
 * restarts and never leaks between accounts on one phone.
 */
describe('joinPromptThrottle', () => {
  it('round-trips the last-check timestamp for a user', async () => {
    await markJoinPromptChecked(7, NOW)
    expect(await readJoinPromptLastCheckedAt(7)).toBe(NOW)
  })

  it('keeps each user’s clock separate and reads null for a user never checked', async () => {
    await markJoinPromptChecked(7, NOW)
    expect(await readJoinPromptLastCheckedAt(8)).toBeNull()
  })

  it('reads garbage as "never checked"', () => {
    expect(parseLastCheckedAt(null)).toBeNull()
    expect(parseLastCheckedAt('')).toBeNull()
    expect(parseLastCheckedAt('not a number')).toBeNull()
    expect(parseLastCheckedAt('-5')).toBeNull()
    expect(parseLastCheckedAt(String(NOW))).toBe(NOW)
  })

  it('rejects on a store read failure — the caller must fall through to "don\'t check", not to "never checked"', async () => {
    vi.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('keychain unavailable'))
    await expect(readJoinPromptLastCheckedAt(7)).rejects.toThrow()
  })

  it('swallows a store write failure — stamping the throttle is best effort', async () => {
    vi.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('keychain unavailable'))
    await expect(markJoinPromptChecked(7, NOW)).resolves.toBeUndefined()
  })
})
