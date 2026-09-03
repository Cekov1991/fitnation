import { beforeEach, describe, expect, it, vi } from 'vitest'

// Everything `notifications.ts` touches at module level is native; stub it all
// so the pure `buildRegistration` can run under node.
const constants = vi.hoisted(() => ({ expoConfig: {} as Record<string, unknown> | null }))

vi.mock('expo-constants', () => ({ default: constants }))
vi.mock('expo-device', () => ({ modelName: 'Pixel 8' }))
vi.mock('expo-notifications', () => ({}))
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }))
vi.stubGlobal('__DEV__', false)

import { buildRegistration } from './notifications'

const TOKEN = 'ExponentPushToken[abc123]'

describe('buildRegistration', () => {
  beforeEach(() => {
    constants.expoConfig = {
      version: '1.0.6',
      extra: { eas: { projectId: 'proj', buildProfile: 'preview' } },
    }
    vi.stubGlobal('__DEV__', false)
  })

  it('produces the PUT /devices contract shape', () => {
    expect(buildRegistration(TOKEN)).toEqual({
      push_token: TOKEN,
      platform: 'android',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      app_version: '1.0.6',
      build_profile: 'preview',
      device_name: 'Pixel 8',
    })
  })

  it('sends an IANA timezone', () => {
    const { timezone } = buildRegistration(TOKEN)
    expect(timezone).toMatch(/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$|^UTC$/)
  })

  it('falls back to development when EAS did not inject buildProfile and __DEV__ is on', () => {
    constants.expoConfig = { version: '1.0.6', extra: { eas: { projectId: 'proj' } } }
    vi.stubGlobal('__DEV__', true)
    expect(buildRegistration(TOKEN).build_profile).toBe('development')
  })

  it('falls back to production when EAS did not inject buildProfile and __DEV__ is off', () => {
    constants.expoConfig = { version: '1.0.6', extra: { eas: { projectId: 'proj' } } }
    vi.stubGlobal('__DEV__', false)
    expect(buildRegistration(TOKEN).build_profile).toBe('production')
  })

  it('tolerates a missing expoConfig entirely', () => {
    constants.expoConfig = null
    const reg = buildRegistration(TOKEN)
    expect(reg.app_version).toBeNull()
    expect(reg.build_profile).toBe('production')
  })
})
