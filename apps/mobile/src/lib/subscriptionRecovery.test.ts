import { describe, expect, it, vi } from 'vitest'
import { ApiFailure, type UserResource } from '@fit-nation/shared'
import { createSubscriptionRecovery, SYNC_COOLDOWN_MS, type SubscriptionRecoveryDeps } from './subscriptionRecovery'

const paid = { id: 7, entitlements: ['app_access'] } as unknown as UserResource
const unpaid = { id: 7, entitlements: [] } as unknown as UserResource

function setup(overrides: Partial<SubscriptionRecoveryDeps> = {}) {
  let clock = 0
  const deps = {
    storeGrantsAccess: vi.fn(async () => true),
    sync: vi.fn(async () => ({ user: paid })),
    onRecovered: vi.fn(),
    onUnrecovered: vi.fn(),
    onRefused: vi.fn(),
    now: () => clock,
    ...overrides,
  }
  return { deps, recover: createSubscriptionRecovery(deps), advance: (ms: number) => { clock += ms } }
}

describe('subscription_required recovery', () => {
  it('goes to the paywall without syncing when RevenueCat grants no access', async () => {
    const { deps, recover } = setup({ storeGrantsAccess: vi.fn(async () => false) })
    expect(await recover()).toBe('unrecovered')
    expect(deps.sync).not.toHaveBeenCalled()
    expect(deps.onUnrecovered).toHaveBeenCalledTimes(1)
    expect(deps.onRecovered).not.toHaveBeenCalled()
  })

  it('syncs once and hands over the fresh user when RevenueCat grants access', async () => {
    const { deps, recover } = setup()
    expect(await recover()).toBe('recovered')
    expect(deps.sync).toHaveBeenCalledTimes(1)
    expect(deps.onRecovered).toHaveBeenCalledWith(paid)
    expect(deps.onUnrecovered).not.toHaveBeenCalled()
  })

  it('falls back to the paywall when the sync fails (502, 429, network)', async () => {
    const { deps, recover } = setup({ sync: vi.fn(async () => { throw new Error('502') }) })
    expect(await recover()).toBe('unrecovered')
    expect(deps.onUnrecovered).toHaveBeenCalledTimes(1)
    expect(deps.onRecovered).not.toHaveBeenCalled()
  })

  // Decision 2026-10-09 (Q1): the backend's answer to a successful sync wins over RevenueCat's cache.
  it('hands over the backend refusal when a successful sync still grants nothing', async () => {
    const { deps, recover } = setup({ sync: vi.fn(async () => ({ user: unpaid })) })
    expect(await recover()).toBe('refused')
    expect(deps.onRefused).toHaveBeenCalledWith(unpaid)
    expect(deps.onUnrecovered).not.toHaveBeenCalled()
    expect(deps.onRecovered).not.toHaveBeenCalled()
  })

  it('keeps the fallback, not a refusal, when the sync times out', async () => {
    const { deps, recover } = setup({ sync: vi.fn(async () => { throw new ApiFailure('timeout', 'Timed out') }) })
    expect(await recover()).toBe('unrecovered')
    expect(deps.onUnrecovered).toHaveBeenCalledTimes(1)
    expect(deps.onRefused).not.toHaveBeenCalled()
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
    expect(await recover()).toBe('unrecovered')
    expect(deps.sync).toHaveBeenCalledTimes(1)
    expect(deps.onUnrecovered).toHaveBeenCalledTimes(2)
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
    expect(await recover()).toBe('unrecovered')
    expect(deps.sync).not.toHaveBeenCalled()
    expect(deps.onUnrecovered).toHaveBeenCalledTimes(1)
  })

  it('treats a synced user without an entitlements list as a refusal', async () => {
    const bare = { id: 7 } as unknown as UserResource
    const { deps, recover } = setup({ sync: vi.fn(async () => ({ user: bare })) })
    expect(await recover()).toBe('refused')
    expect(deps.onRecovered).not.toHaveBeenCalled()
  })
})
