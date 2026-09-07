import { beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory SecureStore so the storage helpers (and the #55 migration) run under node.
const store = vi.hoisted(() => new Map<string, string>())
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (k: string) => store.get(k) ?? null),
  setItemAsync: vi.fn(async (k: string, v: string) => void store.set(k, v)),
  deleteItemAsync: vi.fn(async (k: string) => void store.delete(k)),
}))

import {
  LEGACY_PUSH_PROMPT_DISMISSED_KEY,
  PUSH_PROMPT_INTERVAL_MS,
  PUSH_PROMPT_LAST_SHOWN_KEY,
  markPushPromptShown,
  parseLastShownAt,
  permissionSheetVariant,
  readPushPromptLastShownAt,
  shouldShowPermissionSheet,
} from './pushPrompt'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_800_000_000_000

describe('shouldShowPermissionSheet', () => {
  it('never shows once granted — nothing to ask', () => {
    expect(shouldShowPermissionSheet('granted', null, NOW)).toBe(false)
    expect(shouldShowPermissionSheet('granted', NOW - 30 * DAY, NOW)).toBe(false)
  })

  it('shows when never shown, whether undetermined or denied', () => {
    expect(shouldShowPermissionSheet('undetermined', null, NOW)).toBe(true)
    expect(shouldShowPermissionSheet('denied', null, NOW)).toBe(true)
  })

  it('stays quiet for a week after "Not now"', () => {
    expect(shouldShowPermissionSheet('undetermined', NOW - 6 * DAY, NOW)).toBe(false)
    expect(shouldShowPermissionSheet('denied', NOW - 6 * DAY, NOW)).toBe(false)
  })

  it('asks again after a week', () => {
    expect(shouldShowPermissionSheet('undetermined', NOW - 8 * DAY, NOW)).toBe(true)
    expect(shouldShowPermissionSheet('denied', NOW - 8 * DAY, NOW)).toBe(true)
  })

  it('the cadence is exactly seven days', () => {
    expect(PUSH_PROMPT_INTERVAL_MS).toBe(7 * DAY)
    expect(shouldShowPermissionSheet('undetermined', NOW - PUSH_PROMPT_INTERVAL_MS, NOW)).toBe(false)
    expect(shouldShowPermissionSheet('undetermined', NOW - PUSH_PROMPT_INTERVAL_MS - 1, NOW)).toBe(true)
  })

  it('treats a clock that went backwards as recently shown, not as never', () => {
    expect(shouldShowPermissionSheet('undetermined', NOW + DAY, NOW)).toBe(false)
  })
})

describe('parseLastShownAt', () => {
  it('reads a stored timestamp', () => {
    expect(parseLastShownAt(String(NOW))).toBe(NOW)
  })

  it('reads the legacy "1" dismissed flag as never shown', () => {
    expect(parseLastShownAt('1')).toBeNull()
  })

  it('reads garbage and null as never shown', () => {
    expect(parseLastShownAt(null)).toBeNull()
    expect(parseLastShownAt('')).toBeNull()
    expect(parseLastShownAt('soon')).toBeNull()
    expect(parseLastShownAt('-5')).toBeNull()
  })
})

describe('permissionSheetVariant', () => {
  it('asks while the OS can still prompt', () => {
    expect(permissionSheetVariant('undetermined')).toBe('ask')
  })

  it('sends a denied user to Settings — the only way back', () => {
    expect(permissionSheetVariant('denied')).toBe('settings')
  })
})

describe('storage helpers', () => {
  beforeEach(() => store.clear())

  it('reads null when nothing was ever stored', async () => {
    expect(await readPushPromptLastShownAt()).toBeNull()
  })

  it('round-trips the timestamp written by markPushPromptShown', async () => {
    await markPushPromptShown(NOW)
    expect(store.get(PUSH_PROMPT_LAST_SHOWN_KEY)).toBe(String(NOW))
    expect(await readPushPromptLastShownAt()).toBe(NOW)
  })

  it('migrates the #55 dismissed flag: reads as never shown and deletes the key', async () => {
    store.set(LEGACY_PUSH_PROMPT_DISMISSED_KEY, '1')
    expect(await readPushPromptLastShownAt()).toBeNull()
    expect(store.has(LEGACY_PUSH_PROMPT_DISMISSED_KEY)).toBe(false)
  })

  it('a stored timestamp wins over a stale legacy flag', async () => {
    store.set(LEGACY_PUSH_PROMPT_DISMISSED_KEY, '1')
    store.set(PUSH_PROMPT_LAST_SHOWN_KEY, String(NOW))
    expect(await readPushPromptLastShownAt()).toBe(NOW)
    expect(store.has(LEGACY_PUSH_PROMPT_DISMISSED_KEY)).toBe(false)
  })

  it('a SecureStore failure reads as never shown rather than throwing', async () => {
    const SecureStore = await import('expo-secure-store')
    vi.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('keychain'))
    expect(await readPushPromptLastShownAt()).toBeNull()
  })
})
