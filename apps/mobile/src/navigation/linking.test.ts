import { beforeEach, describe, expect, it, vi } from 'vitest'

const osUrl = vi.hoisted(() => ({ value: null as string | null }))
const lastResponse = vi.hoisted(() => ({ value: null as unknown }))

vi.mock('react-native', () => ({
  Linking: {
    getInitialURL: vi.fn(async () => osUrl.value),
    addEventListener: vi.fn(() => ({ remove: () => {} })),
  },
}))
vi.mock('expo-notifications', () => ({
  getLastNotificationResponseAsync: vi.fn(async () => lastResponse.value),
  addNotificationResponseReceivedListener: vi.fn(() => ({ remove: () => {} })),
}))

import { linking } from './linking'

function response(data: unknown) {
  return { notification: { request: { content: { data } } } }
}

describe('linking.getInitialURL', () => {
  beforeEach(() => {
    osUrl.value = null
    lastResponse.value = null
  })

  it('prefers the OS launch URL', async () => {
    osUrl.value = 'fitnation://plans'
    lastResponse.value = response({ url: 'fitnation://dashboard' })
    await expect(linking.getInitialURL!()).resolves.toBe('fitnation://plans')
  })

  it('falls back to the tapped notification\'s data.url', async () => {
    lastResponse.value = response({ url: 'fitnation://dashboard' })
    await expect(linking.getInitialURL!()).resolves.toBe('fitnation://dashboard')
  })

  it('returns null when neither exists', async () => {
    await expect(linking.getInitialURL!()).resolves.toBeNull()
  })

  it('ignores a notification whose data.url is not a string', async () => {
    lastResponse.value = response({ url: 42 })
    await expect(linking.getInitialURL!()).resolves.toBeNull()
  })
})

describe('linking.config', () => {
  it('routes the phase-one nudge URL to the Dashboard tab', () => {
    const screens = linking.config!.screens as Record<string, unknown>
    expect(screens.Tabs).toEqual({
      screens: { Dashboard: 'dashboard', Progress: 'progress', Plans: 'plans', Profile: 'profile' },
    })
    expect(linking.prefixes).toEqual(['fitnation://'])
  })
})

describe('linking.config params', () => {
  it('parses programId to a number to match AppStackParamList', () => {
    const screens = linking.config!.screens as Record<string, any>
    expect(screens.ProgramDetail.parse.programId('42')).toBe(42)
    expect(screens.WorkoutSession).toBe('workout-session/:sessionId')
    expect(screens.SessionDetail).toBe('session/:sessionId')
  })
})
