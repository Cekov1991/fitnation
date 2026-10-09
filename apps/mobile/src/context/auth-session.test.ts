import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Structural guard for the session rules in AuthContext (findings #4 and #8,
 * 2026-10-02). The decisions themselves are unit-tested in lib/session and
 * lib/userCache; this pins that the provider actually routes through them.
 */
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'AuthContext.tsx'), 'utf8')

describe('AuthContext session rules', () => {
  it('boots through restoreSession and never deletes the token on a blanket catch', () => {
    expect(src).toMatch(/restoreSession\(\{/)
    expect(src).not.toMatch(/catch\s*\{\s*await SecureStore\.deleteItemAsync\(AUTH_TOKEN_KEY\)/)
  })

  it('caches every user it sets, for the offline boot', () => {
    expect(src).toMatch(/void writeCachedUser\(nextUser\)/)
  })

  it('signs out locally before waiting on the remote clean-up, once at a time', () => {
    const remote = src.indexOf('const remote = Promise.allSettled(')
    const local = src.indexOf('setUser(null)', remote)
    const awaited = src.indexOf('await remote', remote)
    expect(remote).toBeGreaterThan(-1)
    expect(local).toBeGreaterThan(remote)
    expect(awaited).toBeGreaterThan(local)
    expect(src).toMatch(/logoutRef\.current = performLogout\(\)/)
  })

  it('drops the token only if it is still this session\'s', () => {
    expect(src).toMatch(/current === token\) await SecureStore\.deleteItemAsync\(AUTH_TOKEN_KEY\)/)
  })
})
