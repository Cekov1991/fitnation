export interface AuthStorage {
  getItem(key: string): Promise<string | null> | string | null
  setItem(key: string, value: string): Promise<void> | void
  removeItem(key: string): Promise<void> | void
}

interface AuthConfig {
  storage: AuthStorage
}

let _authStorage: AuthStorage | null = null

export function initAuth(config: AuthConfig) {
  _authStorage = config.storage
}

export function getAuthStorage(): AuthStorage {
  if (!_authStorage) {
    throw new Error('initAuth() must be called before using auth storage')
  }
  return _authStorage
}

export const AUTH_TOKEN_KEY = 'authToken'
export const PARTNER_SLUG_KEY = 'partnerSlug'
