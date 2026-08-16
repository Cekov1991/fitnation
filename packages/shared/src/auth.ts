export interface AuthStorage {
  getItem(key: string): Promise<string | null> | string | null
  setItem(key: string, value: string): Promise<void> | void
  removeItem(key: string): Promise<void> | void
}

interface AuthConfig {
  storage: AuthStorage
  onUnauthorized?: () => void | Promise<void>
}

let _authStorage: AuthStorage | null = null
let _onUnauthorized: (() => void | Promise<void>) | null = null

export function initAuth(config: AuthConfig) {
  _authStorage = config.storage
  _onUnauthorized = config.onUnauthorized ?? null
}

export function getAuthStorage(): AuthStorage {
  if (!_authStorage) {
    throw new Error('initAuth() must be called before using auth storage')
  }
  return _authStorage
}

export function setOnUnauthorized(handler: (() => void | Promise<void>) | null) {
  _onUnauthorized = handler
}

export async function notifyUnauthorized() {
  if (!_onUnauthorized) return
  try {
    await _onUnauthorized()
  } catch {
    // swallow — handler must be best-effort
  }
}

export const AUTH_TOKEN_KEY = 'authToken'
export const PARTNER_SLUG_KEY = 'partnerSlug'
