import { describe, expect, it, vi } from 'vitest'
import type { UserResource } from '@fit-nation/shared'
import { createSubscriptionRecovery, SYNC_COOLDOWN_MS, type SubscriptionRecoveryDeps } from './subscriptionRecovery'

const paid = { id: 7, entitlements: ['app_access'] } as unknown as UserResource
const unpaid = { id: 7, entitlements: [] } as unknown as UserResource

function setup(overrides: Partial<SubscriptionRecoveryDeps> = {}) {
  let clock = 0
  const deps = {
    storeGrantsAccess: vi.fn(async () => true),
    sync: vi.fn(async () => ({ user: paid })),
    onRecovered: vi.fn(),
    onPaywall: vi.fn(),
    now: () => clock,
    ...overrides,
  }
  return { deps, recover: createSubscriptionRecovery(deps), advance: (ms: number) => { clock += ms } }
}

describe('subscription_required recovery', () => {
  it('goes to the paywall without syncing when RevenueCat grants no access', async () => {
    const { deps, recover } = setup({ storeGrantsAccess: vi.fn(async () => false) })
    expect(await recover()).toBe('paywall')
    expect(deps.sync).not.toHaveBeenCalled()
    expect(deps.onPaywall).toHaveBeenCalledTimes(1)
    expect(deps.onRecovered).not.toHaveBeenCalled()
  })

  it('syncs once and hands over the fresh user when RevenueCat grants access', async () => {
    const { deps, recover } = setup()
    expect(await recover()).toBe('recovered')
    expect(deps.sync).toHaveBeenCalledTimes(1)
    expect(deps.onRecovered).toHaveBeenCalledWith(paid)
    expect(deps.onPaywall).not.toHaveBeenCalled()
  })

  it('falls back to the paywall when the sync fails (502, 429, network)', async () => {
    const { deps, recover } = setup({ sync: vi.fn(async () => { throw new Error('502') }) })
    expect(await recover()).toBe('paywall')
    expect(deps.onPaywall).toHaveBeenCalledTimes(1)
    expect(deps.onRecovered).not.toHaveBeenCalled()
  })

  it('falls back to the paywall when the backend still grants nothing after the sync', async () => {
    const { deps, recover } = setup({ sync: vi.fn(async () => ({ user: unpaid })) })
    expect(await recover()).toBe('paywall')
    expect(deps.onPaywall).toHaveBeenCalledTimes(1)
    expect(deps.onRecovered).not.toHaveBeenCalled()
  })

  it('joins concurrent 403s into one recovery with one sync', async () => {
    const { deps, recover } = setup()
    const outcomes = await Promise.all([recover(), recover(), recover()])
    expect(outcomes).toEqual(['recovered', 'recovered', 'recovered'])
    expect(deps.storeGrantsAccess).toHaveBeenCalledTimes(1)
    expect(deps.sync).toHaveBeenCalledTimes(1)
    expect(deps.onRecovered).toHaveBeenCalledTimes(1)
  })

  // No loop: a gated call that keeps answering 403 after a sync must not sync again.
  it('does not sync again right after a sync, whatever that sync answered', async () => {
    const { deps, recover, advance } = setup({ sync: vi.fn(async () => { throw new Error('500') }) })
    await recover()
    advance(5_000)
    expect(await recover()).toBe('paywall')
    expect(deps.sync).toHaveBeenCalledTimes(1)
    expect(deps.onPaywall).toHaveBeenCalledTimes(2)
  })

  it('may sync again once the cooldown has passed', async () => {
    const { deps, recover, advance } = setup()
    await recover()
    advance(SYNC_COOLDOWN_MS)
    expect(await recover()).toBe('recovered')
    expect(deps.sync).toHaveBeenCalledTimes(2)
  })

  it('falls back to the paywall when RevenueCat cannot be read', async () => {
    const { deps, recover } = setup({ storeGrantsAccess: vi.fn(async () => { throw new Error('offline') }) })
    expect(await recover()).toBe('paywall')
    expect(deps.sync).not.toHaveBeenCalled()
    expect(deps.onPaywall).toHaveBeenCalledTimes(1)
  })
})
