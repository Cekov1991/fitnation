import { describe, expect, it, vi } from 'vitest'
import type { UserResource } from '@fit-nation/shared'
import { runPurchaseFlow, type PurchaseFlowDeps } from './purchaseFlow'

const withAccess = { id: 42, entitlements: ['app_access'] } as unknown as UserResource
const withoutAccess = { id: 42, entitlements: [] } as unknown as UserResource

/** A fake clock: `sleep` moves time forward instead of waiting. */
function clock() {
  let t = 0
  return { now: () => t, sleep: async (ms: number) => { t += ms } }
}

/** Deps where everything succeeds first time; override per case. */
function deps(overrides: Partial<PurchaseFlowDeps> = {}): PurchaseFlowDeps {
  const c = clock()
  return {
    userId: 42,
    revenueCat: { currentUserId: async () => '42', logIn: vi.fn(async () => {}) },
    transact: vi.fn(async () => true),
    sync: vi.fn(async () => ({ user: withAccess })),
    fetchUser: vi.fn(async () => withAccess),
    now: c.now,
    sleep: c.sleep,
    log: () => {},
    ...overrides,
  }
}

describe('runPurchaseFlow', () => {
  it('logs RevenueCat in again when it holds another user, then purchases', async () => {
    let rcUser = '$RCAnonymousID:abc'
    const logIn = vi.fn(async (id: string) => { rcUser = id })
    const d = deps({ revenueCat: { currentUserId: async () => rcUser, logIn } })

    const out = await runPurchaseFlow(d)

    expect(logIn).toHaveBeenCalledTimes(1)
    expect(logIn).toHaveBeenCalledWith('42')
    expect(d.transact).toHaveBeenCalledTimes(1)
    expect(out).toEqual({ kind: 'entered', user: withAccess })
  })

  it('stops with a try-again error and no purchase when RevenueCat still holds another user', async () => {
    const logIn = vi.fn(async () => {})
    const d = deps({ revenueCat: { currentUserId: async () => '$RCAnonymousID:abc', logIn } })

    const out = await runPurchaseFlow(d)

    expect(logIn).toHaveBeenCalledTimes(1)
    expect(d.transact).not.toHaveBeenCalled()
    expect(d.sync).not.toHaveBeenCalled()
    expect(out).toEqual({ kind: 'identity-mismatch' })
  })

  it('treats a failed log-in like a mismatch', async () => {
    const logIn = vi.fn(async () => { throw new Error('offline') })
    const d = deps({ revenueCat: { currentUserId: async () => '7', logIn } })

    expect(await runPurchaseFlow(d)).toEqual({ kind: 'identity-mismatch' })
    expect(d.transact).not.toHaveBeenCalled()
  })

  it('a failed sync does not block: it logs, then polls /user until it carries app_access', async () => {
    const log = vi.fn()
    const fetchUser = vi.fn()
      .mockResolvedValueOnce(withoutAccess)
      .mockRejectedValueOnce(new Error('blip'))
      .mockResolvedValueOnce(withAccess)
    const d = deps({ sync: vi.fn(async () => { throw new Error('502') }), fetchUser, log })

    const out = await runPurchaseFlow(d)

    expect(log).toHaveBeenCalled()
    expect(fetchUser).toHaveBeenCalledTimes(3)
    expect(out).toEqual({ kind: 'entered', user: withAccess })
  })

  it('a sync that already answers with app_access enters without polling', async () => {
    const d = deps()

    expect(await runPurchaseFlow(d)).toEqual({ kind: 'entered', user: withAccess })
    expect(d.fetchUser).not.toHaveBeenCalled()
  })

  it('gives up polling after about 10 s and enters anyway', async () => {
    const c = clock()
    const fetchUser = vi.fn(async () => withoutAccess)
    const d = deps({ sync: async () => ({ user: withoutAccess }), fetchUser, now: c.now, sleep: c.sleep })

    const out = await runPurchaseFlow(d)

    expect(out).toEqual({ kind: 'entered', user: withoutAccess })
    expect(c.now()).toBeGreaterThanOrEqual(10_000)
    expect(c.now()).toBeLessThanOrEqual(11_000)
    expect(fetchUser.mock.calls.length).toBeGreaterThan(1)
  })

  it('a restore that finds no app_access reports it, without syncing or entering', async () => {
    const d = deps({ transact: vi.fn(async () => false) })

    expect(await runPurchaseFlow(d)).toEqual({ kind: 'not-granted' })
    expect(d.sync).not.toHaveBeenCalled()
    expect(d.fetchUser).not.toHaveBeenCalled()
  })
})
