import { describe, expect, it } from 'vitest'
import { shouldRegister, type LastDeviceRegistration } from './deviceRegistration'

const HOUR = 60 * 60 * 1000
const now = Date.parse('2026-09-02T12:00:00Z')
const last: LastDeviceRegistration = {
  token: 'ExponentPushToken[a]',
  timezone: 'Europe/Skopje',
  sentAt: now - 2 * HOUR,
}

describe('shouldRegister', () => {
  it('registers when nothing was ever sent', () => {
    expect(shouldRegister(null, now, last.token, last.timezone)).toBe(true)
  })

  it('registers when the last registration is 24h or older', () => {
    expect(shouldRegister({ ...last, sentAt: now - 24 * HOUR }, now, last.token, last.timezone)).toBe(true)
    expect(shouldRegister({ ...last, sentAt: now - 48 * HOUR }, now, last.token, last.timezone)).toBe(true)
  })

  it('registers when the push token changed', () => {
    expect(shouldRegister(last, now, 'ExponentPushToken[b]', last.timezone)).toBe(true)
  })

  it('registers when the timezone changed', () => {
    expect(shouldRegister(last, now, last.token, 'America/New_York')).toBe(true)
  })

  it('skips a fresh, identical registration', () => {
    expect(shouldRegister(last, now, last.token, last.timezone)).toBe(false)
    expect(shouldRegister({ ...last, sentAt: now - 24 * HOUR + 1 }, now, last.token, last.timezone)).toBe(false)
  })

  it('registers when the stored record is malformed', () => {
    expect(shouldRegister({ token: 1 } as unknown as LastDeviceRegistration, now, last.token, last.timezone)).toBe(true)
  })
})
