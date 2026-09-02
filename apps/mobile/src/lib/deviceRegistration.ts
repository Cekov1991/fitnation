// Pure half of the Device heartbeat (see useDeviceRegistration.ts).

// SecureStore key for the last successful registration.
export const LAST_DEVICE_REGISTRATION_KEY = 'lastDeviceRegistration'

export interface LastDeviceRegistration {
  token: string
  timezone: string | null
  sentAt: number // epoch ms
}

export const REGISTRATION_TTL_MS = 24 * 60 * 60 * 1000

function isLastDeviceRegistration(value: unknown): value is LastDeviceRegistration {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.token === 'string' &&
    (typeof v.timezone === 'string' || v.timezone === null) &&
    typeof v.sentAt === 'number'
  )
}

export function parseLastRegistration(raw: string | null): LastDeviceRegistration | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isLastDeviceRegistration(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Throttle: register when nothing was sent, when the last send is ≥ 24 h old,
// or when what we would send (token, timezone) differs from what was sent.
export function shouldRegister(
  last: LastDeviceRegistration | null,
  now: number,
  token: string,
  timezone: string | null,
): boolean {
  if (!isLastDeviceRegistration(last)) return true
  if (last.token !== token) return true
  if (last.timezone !== timezone) return true
  return now - last.sentAt >= REGISTRATION_TTL_MS
}

// A permission grant happens outside the auth/app-state triggers (the
// onboarding sheet, the Profile toggle). Whoever grants pokes the mounted hook
// through this tiny bus so the Device registers right away.
type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeRegistrationRequested(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function requestDeviceRegistration(): void {
  listeners.forEach((l) => l())
}
