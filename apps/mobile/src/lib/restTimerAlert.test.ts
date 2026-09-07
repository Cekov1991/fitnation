import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const platform = vi.hoisted(() => ({ OS: 'ios' as string }))
vi.mock('react-native', () => ({ Platform: platform }))

const notifications = vi.hoisted(() => ({
  scheduleNotificationAsync: vi.fn(async (_request: unknown) => 'req-1'),
  cancelScheduledNotificationAsync: vi.fn(async (_id: string) => {}),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}))
vi.mock('expo-notifications', () => notifications)

const perms = vi.hoisted(() => ({
  getPermissionStatus: vi.fn(async () => 'granted' as 'granted' | 'denied' | 'undetermined'),
  grantPushPermission: vi.fn(async () => true),
  ensureAndroidChannels: vi.fn(async () => {}),
  REST_TIMER_KIND: 'rest-timer',
}))
vi.mock('./notifications', () => perms)

const NOW = 1_800_000_000_000

// Module-level state (the scheduled id, "asked this launch") must start fresh
// per test, so the module is re-imported each time.
async function load() {
  vi.resetModules()
  return import('./restTimerAlert')
}

function scheduled(callIndex = 0) {
  return notifications.scheduleNotificationAsync.mock.calls[callIndex][0] as {
    content: { title: string; body: string; sound: string; data: Record<string, unknown> }
    trigger: { type: string; date: number; channelId: string }
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  platform.OS = 'ios'
  notifications.scheduleNotificationAsync.mockClear().mockResolvedValue('req-1')
  notifications.cancelScheduledNotificationAsync.mockClear()
  perms.getPermissionStatus.mockClear().mockResolvedValue('granted')
  perms.grantPushPermission.mockClear().mockResolvedValue(true)
  perms.ensureAndroidChannels.mockClear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('startRestAlert', () => {
  it('schedules one local notification for the end of the rest with the R2 copy', async () => {
    const { startRestAlert } = await load()
    await startRestAlert({ seconds: 90, exerciseName: 'Bench Press' })

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1)
    const req = scheduled()
    expect(req.content.title).toBe('Rest over')
    expect(req.content.body).toBe('Back to Bench Press')
    expect(req.content.sound).toBe('default')
    expect(req.content.data).toEqual({ kind: 'rest-timer' })
    expect(req.trigger).toEqual({ type: 'date', date: NOW + 90_000, channelId: 'rest-timer' })
  })

  it('falls back to a generic body when there is no current exercise', async () => {
    const { startRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: null })
    expect(scheduled().content.body).toBe('Back to your workout')
  })

  it('makes sure the Android channel exists before scheduling on it', async () => {
    const { startRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    expect(perms.ensureAndroidChannels).toHaveBeenCalledTimes(1)
  })

  it('a new rest supersedes the previous alert', async () => {
    notifications.scheduleNotificationAsync.mockResolvedValueOnce('req-1').mockResolvedValueOnce('req-2')
    const { startRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    await startRestAlert({ seconds: 120, exerciseName: 'Deadlift' })
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('req-1')
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2)
    expect(scheduled(1).content.body).toBe('Back to Deadlift')
  })

  it('never rejects when scheduling throws — the in-app timer must not break', async () => {
    notifications.scheduleNotificationAsync.mockRejectedValueOnce(new Error('no scheduler'))
    const { startRestAlert, cancelRestAlert } = await load()
    await expect(startRestAlert({ seconds: 60, exerciseName: 'Squat' })).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalledWith('[rest-timer]', expect.any(Error))
    await cancelRestAlert()
    expect(notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled()
  })
})

describe('permission gating (R3)', () => {
  it('asks when undetermined and schedules on a grant', async () => {
    perms.getPermissionStatus.mockResolvedValue('undetermined')
    perms.grantPushPermission.mockResolvedValue(true)
    const { startRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    expect(perms.grantPushPermission).toHaveBeenCalledTimes(1)
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1)
  })

  it('asks once per launch: a refusal is not re-asked on the next rest', async () => {
    perms.getPermissionStatus.mockResolvedValue('undetermined')
    perms.grantPushPermission.mockResolvedValue(false)
    const { startRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    expect(perms.grantPushPermission).toHaveBeenCalledTimes(1)
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled()
  })

  it('never asks and never schedules when denied', async () => {
    perms.getPermissionStatus.mockResolvedValue('denied')
    const { startRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    expect(perms.grantPushPermission).not.toHaveBeenCalled()
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled()
  })
})

describe('adjustRestAlert', () => {
  it('cancels the previous request and reschedules for the new remaining time', async () => {
    notifications.scheduleNotificationAsync.mockResolvedValueOnce('req-1').mockResolvedValueOnce('req-2')
    const { startRestAlert, adjustRestAlert } = await load()
    await startRestAlert({ seconds: 90, exerciseName: 'Bench Press' })
    vi.setSystemTime(NOW + 10_000)
    await adjustRestAlert(95)

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('req-1')
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2)
    expect(scheduled(1).trigger.date).toBe(NOW + 10_000 + 95_000)
    expect(scheduled(1).content.body).toBe('Back to Bench Press')
  })

  it('does nothing when no alert is scheduled (permission refused, or nothing started)', async () => {
    const { adjustRestAlert } = await load()
    await adjustRestAlert(30)
    expect(notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled()
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled()
  })

  it('only cancels when the adjustment leaves no time — the in-app timer completes on its own', async () => {
    const { startRestAlert, adjustRestAlert } = await load()
    await startRestAlert({ seconds: 10, exerciseName: 'Squat' })
    await adjustRestAlert(0)
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('req-1')
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1)
  })
})

describe('cancelRestAlert', () => {
  it('is a no-op with nothing scheduled', async () => {
    const { cancelRestAlert } = await load()
    await cancelRestAlert()
    expect(notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled()
  })

  it('cancels the scheduled request exactly once', async () => {
    const { startRestAlert, cancelRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    await cancelRestAlert()
    await cancelRestAlert()
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1)
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('req-1')
  })

  it('never rejects when the cancel throws', async () => {
    notifications.cancelScheduledNotificationAsync.mockRejectedValueOnce(new Error('gone'))
    const { startRestAlert, cancelRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    await expect(cancelRestAlert()).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalledWith('[rest-timer]', expect.any(Error))
  })
})
