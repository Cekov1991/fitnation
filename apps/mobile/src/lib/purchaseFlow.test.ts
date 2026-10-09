import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserResource } from '@fit-nation/shared'
import { runPurchaseFlow, type PurchaseFlowDeps } from './purchaseFlow'

const withAccess = { id: 42, entitlements: ['app_access'] } as unknown as UserResource
const withoutAccess = { id: 42, entitlements: [] } as unknown as UserResource

/** Runs the flow on fake timers, to completion: waits take no real time. */
async function run(d: PurchaseFlowDeps) {
  const out = runPurchaseFlow(d)
  out.catch(() => {}) // the caller awaits it; this only stops an early rejection reading as unhandled
  await vi.runAllTimersAsync()
  return out
}

/** Deps where everything succeeds first time; override per case. */
function deps(overrides: Partial<PurchaseFlowDeps> = {}): PurchaseFlowDeps {
  return {
    userId: 42,
    revenueCat: { currentUserId: async () => '42', logIn: vi.fn(async () => {}) },
    transact: vi.fn(async () => true),
    sync: vi.fn(async () => ({ user: withAccess })),
    fetchUser: vi.fn(async () => withAccess),
    log: () => {},
    ...overrides,
  }
}

describe('runPurchaseFlow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })
  afterEach(() => vi.useRealTimers())

  it('logs RevenueCat in again when it holds another user, then purchases', async () => {
    let rcUser = '$RCAnonymousID:abc'
    const logIn = vi.fn(async (id: string) => { rcUser = id })
    const d = deps({ revenueCat: { currentUserId: async () => rcUser, logIn } })

    const out = await run(d)

    expect(logIn).toHaveBeenCalledTimes(1)
    expect(logIn).toHaveBeenCalledWith('42')
    expect(d.transact).toHaveBeenCalledTimes(1)
    expect(out).toEqual({ kind: 'entered', user: withAccess })
  })

  it('stops with a try-again error and no purchase when RevenueCat still holds another user', async () => {
    const logIn = vi.fn(async () => {})
    const d = deps({ revenueCat: { currentUserId: async () => '$RCAnonymousID:abc', logIn } })

    const out = await run(d)

    expect(logIn).toHaveBeenCalledTimes(1)
    expect(d.transact).not.toHaveBeenCalled()
    expect(d.sync).not.toHaveBeenCalled()
    expect(out).toEqual({ kind: 'identity-mismatch' })
  })

  it('treats a failed log-in like a mismatch', async () => {
    const logIn = vi.fn(async () => { throw new Error('offline') })
    const d = deps({ revenueCat: { currentUserId: async () => '7', logIn } })

    expect(await run(d)).toEqual({ kind: 'identity-mismatch' })
    expect(d.transact).not.toHaveBeenCalled()
  })

  it('a failed sync does not block: it logs, then polls /user until it carries app_access', async () => {
    const log = vi.fn()
    const fetchUser = vi.fn()
      .mockResolvedValueOnce(withoutAccess)
      .mockRejectedValueOnce(new Error('blip'))
      .mockResolvedValueOnce(withAccess)
    const d = deps({ sync: vi.fn(async () => { throw new Error('502') }), fetchUser, log })

    const out = await run(d)

    expect(log).toHaveBeenCalled()
    expect(fetchUser).toHaveBeenCalledTimes(3)
    expect(out).toEqual({ kind: 'entered', user: withAccess })
  })

  it('a sync that already answers with app_access enters without polling', async () => {
    const d = deps()

    expect(await run(d)).toEqual({ kind: 'entered', user: withAccess })
    expect(d.fetchUser).not.toHaveBeenCalled()
  })

  it('gives up polling after about 10 s and enters anyway', async () => {
    const fetchUser = vi.fn(async () => withoutAccess)
    const d = deps({ sync: async () => ({ user: withoutAccess }), fetchUser })

    const out = await run(d)

    expect(out).toEqual({ kind: 'entered', user: withoutAccess })
    expect(Date.now()).toBe(10_000)
    expect(fetchUser.mock.calls.length).toBeGreaterThan(1)
  })

  it('a hung sync counts against the ~10 s wait: it enters at the deadline', async () => {
    const fetchUser = vi.fn(async () => withAccess)
    const d = deps({ sync: () => new Promise<never>(() => {}), fetchUser })

    expect(await run(d)).toEqual({ kind: 'entered', user: null })
    expect(Date.now()).toBe(10_000)
    expect(fetchUser).not.toHaveBeenCalled()
  })

  it('a hung /user poll does not stretch the wait past ~10 s', async () => {
    const fetchUser = vi.fn(() => new Promise<never>(() => {}))
    const d = deps({ sync: async () => ({ user: withoutAccess }), fetchUser })

    expect(await run(d)).toEqual({ kind: 'entered', user: withoutAccess })
    expect(Date.now()).toBe(10_000)
  })

  it('a store that grants no app_access still syncs, but reports it instead of waiting and entering', async () => {
    const d = deps({ transact: vi.fn(async () => false), sync: vi.fn(async () => ({ user: withoutAccess })) })

    expect(await run(d)).toEqual({ kind: 'not-granted' })
    expect(d.sync).toHaveBeenCalledTimes(1)
    expect(d.fetchUser).not.toHaveBeenCalled()
  })

  it('a store that grants no app_access enters when the sync finds it on the backend', async () => {
    const d = deps({ transact: vi.fn(async () => false) })

    expect(await run(d)).toEqual({ kind: 'entered', user: withAccess })
  })

  it('a sync that answers without app_access is followed by polling until /user has it', async () => {
    const fetchUser = vi.fn().mockResolvedValueOnce(withoutAccess).mockResolvedValueOnce(withAccess)
    const d = deps({ sync: async () => ({ user: withoutAccess }), fetchUser })

    expect(await run(d)).toEqual({ kind: 'entered', user: withAccess })
    expect(fetchUser).toHaveBeenCalledTimes(2)
  })

  it('treats an unreadable RevenueCat user id like a mismatch', async () => {
    const d = deps({ revenueCat: { currentUserId: async () => { throw new Error('not configured') }, logIn: vi.fn(async () => {}) } })

    expect(await run(d)).toEqual({ kind: 'identity-mismatch' })
    expect(d.transact).not.toHaveBeenCalled()
  })

  it('lets a store error (cancelled sheet, already purchased) reach the caller unchanged', async () => {
    const storeError = Object.assign(new Error('cancelled'), { userCancelled: true })
    const d = deps({ transact: vi.fn(async () => { throw storeError }) })

    await expect(run(d)).rejects.toBe(storeError)
    expect(d.sync).not.toHaveBeenCalled()
  })
})
