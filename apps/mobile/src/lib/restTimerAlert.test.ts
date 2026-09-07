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
  REST_TIMER_CHANNEL_ID: 'rest-timer',
}))
vi.mock('./notifications', () => perms)

// The Android foreground service (modules/rest-timer). Null = iOS/web/old binary.
const native = vi.hoisted(() => ({
  RestTimer: null as null | { start: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> },
}))
vi.mock('../../modules/rest-timer', () => native)

function withService() {
  native.RestTimer = { start: vi.fn(), update: vi.fn(), stop: vi.fn() }
  platform.OS = 'android'
  return native.RestTimer
}

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
  native.RestTimer = null
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

describe('a start that is still waiting on the permission check', () => {
  // A mock whose call is observable (`called`) and whose result the test
  // releases by hand, standing in for the OS prompt / OS scheduler.
  function deferred<T>(mock: { mockImplementation: (fn: () => Promise<T>) => unknown }) {
    let release!: (value: T) => void
    const called = new Promise<void>((markCalled) => {
      mock.mockImplementation(() => {
        markCalled()
        return new Promise<T>((r) => (release = r))
      })
    })
    return { called, release: (value: T) => release(value) }
  }

  it('does not schedule if the rest was skipped while the OS prompt was up', async () => {
    perms.getPermissionStatus.mockResolvedValue('undetermined')
    const prompt = deferred<boolean>(perms.grantPushPermission)
    const { startRestAlert, cancelRestAlert } = await load()
    const start = startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    await prompt.called
    await cancelRestAlert()
    prompt.release(true)
    await start
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled()
  })

  it('schedules the adjusted end when ±15 s arrived meanwhile', async () => {
    perms.getPermissionStatus.mockResolvedValue('undetermined')
    const prompt = deferred<boolean>(perms.grantPushPermission)
    const { startRestAlert, adjustRestAlert } = await load()
    const start = startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    await prompt.called
    vi.setSystemTime(NOW + 5_000)
    await adjustRestAlert(70)
    prompt.release(true)
    await start
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1)
    expect(scheduled().trigger.date).toBe(NOW + 5_000 + 70_000)
  })

  it('a cancel that lands while the OS call itself is in flight cancels the fresh request', async () => {
    const scheduler = deferred<string>(notifications.scheduleNotificationAsync)
    const { startRestAlert, cancelRestAlert } = await load()
    const start = startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    await scheduler.called
    await cancelRestAlert()
    scheduler.release('late-1')
    await start
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('late-1')
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

describe('Android foreground service (R6–R8)', () => {
  it('starts the service at rest start and keeps a later fallback alarm', async () => {
    const service = withService()
    const { startRestAlert, ANDROID_FALLBACK_GRACE_MS } = await load()
    await startRestAlert({ seconds: 90, exerciseName: 'Bench Press' })

    expect(service.start).toHaveBeenCalledWith(NOW + 90_000, 'Bench Press', 'req-1')
    // The service posts the alert on the second and cancels the fallback; the
    // fallback is deliberately a little later so the two never collide.
    expect(scheduled().trigger.date).toBe(NOW + 90_000 + ANDROID_FALLBACK_GRACE_MS)
    expect(ANDROID_FALLBACK_GRACE_MS).toBeGreaterThan(0)
  })

  it('passes an empty label when there is no current exercise', async () => {
    const service = withService()
    const { startRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: null })
    expect(service.start).toHaveBeenCalledWith(NOW + 60_000, '', 'req-1')
  })

  it('moves the service and the fallback together on ±15 s', async () => {
    notifications.scheduleNotificationAsync.mockResolvedValueOnce('req-1').mockResolvedValueOnce('req-2')
    const service = withService()
    const { startRestAlert, adjustRestAlert, ANDROID_FALLBACK_GRACE_MS } = await load()
    await startRestAlert({ seconds: 90, exerciseName: 'Squat' })
    vi.setSystemTime(NOW + 10_000)
    await adjustRestAlert(95)

    expect(service.update).toHaveBeenCalledWith(NOW + 10_000 + 95_000, 'Squat', 'req-2')
    expect(scheduled(1).trigger.date).toBe(NOW + 10_000 + 95_000 + ANDROID_FALLBACK_GRACE_MS)
    expect(service.start).toHaveBeenCalledTimes(1)
  })

  it('stops the service and cancels the fallback on skip / finish / leave', async () => {
    const service = withService()
    const { startRestAlert, cancelRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    await cancelRestAlert()
    expect(service.stop).toHaveBeenCalledTimes(1)
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('req-1')
  })

  it('stops the service even when nothing was scheduled (permission refused mid-way)', async () => {
    const service = withService()
    const { cancelRestAlert } = await load()
    await cancelRestAlert()
    expect(service.stop).toHaveBeenCalledTimes(1)
  })

  it('never starts the service without notification permission', async () => {
    perms.getPermissionStatus.mockResolvedValue('denied')
    const service = withService()
    const { startRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    expect(service.start).not.toHaveBeenCalled()
  })

  it('a refused service start moves the fallback back to the exact second and does not reject', async () => {
    notifications.scheduleNotificationAsync.mockResolvedValueOnce('req-1').mockResolvedValueOnce('req-2')
    const service = withService()
    service.start.mockImplementation(() => {
      throw new Error('ForegroundServiceStartNotAllowed')
    })
    const { startRestAlert, cancelRestAlert } = await load()
    await expect(startRestAlert({ seconds: 60, exerciseName: 'Squat' })).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalledWith('[rest-timer]', expect.any(Error))
    // The +5 s fallback is replaced by one at the exact end: nothing else will fire.
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('req-1')
    expect(scheduled(1).trigger.date).toBe(NOW + 60_000)
    await cancelRestAlert()
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('req-2')
  })

  it('a throwing update or stop does not reject', async () => {
    const service = withService()
    service.update.mockImplementation(() => {
      throw new Error('update')
    })
    service.stop.mockImplementation(() => {
      throw new Error('stop')
    })
    const { startRestAlert, adjustRestAlert, cancelRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    await expect(adjustRestAlert(70)).resolves.toBeUndefined()
    await expect(cancelRestAlert()).resolves.toBeUndefined()
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalled()
  })

  it('±15 s still reaches the service when the fallback alarm failed to schedule', async () => {
    notifications.scheduleNotificationAsync
      .mockRejectedValueOnce(new Error('no scheduler'))
      .mockResolvedValueOnce('req-2')
    const service = withService()
    const { startRestAlert, adjustRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    expect(service.start).toHaveBeenCalledWith(NOW + 60_000, 'Squat', null)
    vi.setSystemTime(NOW + 10_000)
    await adjustRestAlert(65)
    expect(service.update).toHaveBeenCalledWith(NOW + 10_000 + 65_000, 'Squat', 'req-2')
  })

  it('a skip during the permission prompt never starts the service', async () => {
    perms.getPermissionStatus.mockResolvedValue('undetermined')
    let release!: (granted: boolean) => void
    perms.grantPushPermission.mockImplementation(() => new Promise<boolean>((r) => (release = r)))
    const service = withService()
    const { startRestAlert, cancelRestAlert } = await load()
    const start = startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    await vi.waitFor(() => expect(perms.grantPushPermission).toHaveBeenCalled())
    await cancelRestAlert()
    release(true)
    await start
    expect(service.start).not.toHaveBeenCalled()
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled()
  })

  it('on Android without the native module (old binary) behaves like iOS: exact fallback, no service', async () => {
    platform.OS = 'android'
    native.RestTimer = null
    const { startRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    expect(scheduled().trigger.date).toBe(NOW + 60_000)
  })

  // modules/rest-timer/index.ts exports null off Android, so iOS never sees a
  // service; the fallback is then the exact-time alert.
  it('on iOS (module null) the fallback is exact and nothing native is involved', async () => {
    platform.OS = 'ios'
    native.RestTimer = null
    const { startRestAlert, adjustRestAlert, cancelRestAlert } = await load()
    await startRestAlert({ seconds: 60, exerciseName: 'Squat' })
    expect(scheduled().trigger.date).toBe(NOW + 60_000)
    await adjustRestAlert(30)
    expect(scheduled(1).trigger.date).toBe(NOW + 30_000)
    await cancelRestAlert()
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2)
  })
})
