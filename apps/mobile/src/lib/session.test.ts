import { describe, expect, it, vi } from 'vitest'
import { ApiFailure } from '@fit-nation/shared'
import type { UserResource } from '@fit-nation/shared'
import { restoreSession } from './session'

const fresh = { id: 1, email: 'a@b.c', entitlements: ['app_access'] } as unknown as UserResource
const cached = { id: 1, email: 'a@b.c', entitlements: [] } as unknown as UserResource
const network = () => Promise.reject(new ApiFailure('network', 'Could not reach the server.'))

describe('restoreSession', () => {
  it('no token: signed out, without touching the network or the cache', async () => {
    const fetchUser = vi.fn()
    const readCachedUser = vi.fn()
    expect(await restoreSession({ token: null, fetchUser, readCachedUser })).toEqual({ kind: 'signed-out' })
    expect(fetchUser).not.toHaveBeenCalled()
    expect(readCachedUser).not.toHaveBeenCalled()
  })

  it('online: the fresh user', async () => {
    const out = await restoreSession({ token: 't', fetchUser: async () => fresh, readCachedUser: async () => cached })
    expect(out).toEqual({ kind: 'online', user: fresh })
  })

  it('a rejected token signs out even when a user is cached', async () => {
    const fetchUser = () => Promise.reject(new ApiFailure('unauthorized', 'Unauthenticated.', { status: 401 }))
    expect(await restoreSession({ token: 't', fetchUser, readCachedUser: async () => cached })).toEqual({ kind: 'signed-out' })
  })

  // Finding #4: airplane mode + relaunch used to delete the token and show the
  // sign-in screen.
  it('no network with a cached user: still in, offline', async () => {
    expect(await restoreSession({ token: 't', fetchUser: network, readCachedUser: async () => cached }))
      .toEqual({ kind: 'offline', user: cached })
  })

  it('no network and nothing cached: unreachable, not signed out', async () => {
    expect(await restoreSession({ token: 't', fetchUser: network, readCachedUser: async () => null })).toEqual({ kind: 'unreachable' })
  })

  it('a server error or an unknown throw is not a rejection of the token', async () => {
    const http = () => Promise.reject(new ApiFailure('http', 'Server error', { status: 500 }))
    expect((await restoreSession({ token: 't', fetchUser: http, readCachedUser: async () => cached })).kind).toBe('offline')
    const weird = () => Promise.reject(new Error('boom'))
    expect((await restoreSession({ token: 't', fetchUser: weird, readCachedUser: async () => cached })).kind).toBe('offline')
  })

  it('a broken cache read counts as nothing cached', async () => {
    const readCachedUser = () => Promise.reject(new Error('disk'))
    expect(await restoreSession({ token: 't', fetchUser: network, readCachedUser })).toEqual({ kind: 'unreachable' })
  })
})
