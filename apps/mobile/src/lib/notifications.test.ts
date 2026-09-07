import { beforeEach, describe, expect, it, vi } from 'vitest'

// Everything `notifications.ts` touches at module level is native; stub it all
// so the pure `buildRegistration` can run under node.
const constants = vi.hoisted(() => ({ expoConfig: {} as Record<string, unknown> | null }))

vi.mock('expo-constants', () => ({ default: constants }))
vi.mock('expo-device', () => ({ modelName: 'Pixel 8' }))
const notifications = vi.hoisted(() => ({
  setNotificationHandler: vi.fn(),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
}))
vi.mock('expo-notifications', () => notifications)
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }))
const toast = vi.hoisted(() => ({ showToast: vi.fn() }))
vi.mock('./toast', () => toast)
vi.stubGlobal('__DEV__', false)

import { ANDROID_CHANNELS, buildRegistration, configureForegroundHandler } from './notifications'

describe('ANDROID_CHANNELS', () => {
  // Channel ids are the contract with the back-end: the server sends
  // `channelId`, and Android drops a notification whose channel does not exist.
  it('declares exactly the four channels the server may address (0013 R5)', () => {
    expect(Object.keys(ANDROID_CHANNELS).sort()).toEqual(['default', 'progress', 'reminders', 'rest-timer'])
  })

  it('makes the rest timer loud and everything else default importance', () => {
    expect(ANDROID_CHANNELS['rest-timer'].importance).toBe(notifications.AndroidImportance.HIGH)
    expect(ANDROID_CHANNELS['rest-timer'].sound).toBe('default')
    expect(ANDROID_CHANNELS['rest-timer'].vibrationPattern?.length).toBeGreaterThan(0)
    for (const id of ['default', 'reminders', 'progress'] as const) {
      expect(ANDROID_CHANNELS[id].importance).toBe(notifications.AndroidImportance.DEFAULT)
    }
  })
})

describe('configureForegroundHandler', () => {
  type Handler = (n: { request: { content: Record<string, unknown> } }) => Promise<Record<string, boolean>>

  function install(): Handler {
    notifications.setNotificationHandler.mockClear()
    toast.showToast.mockClear()
    configureForegroundHandler()
    return notifications.setNotificationHandler.mock.calls[0][0].handleNotification
  }

  it('turns an ordinary foreground notification into a toast (M4)', async () => {
    const handle = install()
    const result = await handle({ request: { content: { title: 'Still there?', body: 'Come back' } } })
    expect(toast.showToast).toHaveBeenCalledWith('Still there? — Come back', 'info')
    expect(result).toEqual({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    })
  })

  it('fully suppresses a rest-timer alert — the screen is already showing the timer (0013 R9)', async () => {
    const handle = install()
    const result = await handle({
      request: { content: { title: 'Rest over', body: 'Back to Squat', data: { kind: 'rest-timer' } } },
    })
    expect(toast.showToast).not.toHaveBeenCalled()
    expect(result).toEqual({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    })
  })

  it('does not mistake other tagged notifications for the rest timer', async () => {
    const handle = install()
    const result = await handle({ request: { content: { title: 'PR!', body: null, data: { kind: 'progress' } } } })
    expect(toast.showToast).toHaveBeenCalledWith('PR!', 'info')
    expect(result.shouldShowList).toBe(true)
  })
})

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
