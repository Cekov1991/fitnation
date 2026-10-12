import { File, Paths } from 'expo-file-system'
import type { UserResource } from '@fit-nation/shared'

/**
 * The last `GET /api/user` payload, kept so the app can boot while the server
 * is unreachable (finding #4). Profile data the person already sees on screen,
 * not a secret like the token — and larger than SecureStore's 2 KB per value —
 * so a JSON file in the app's private document directory. Written on every
 * setUser, deleted on sign-out, read only by restoreSession.
 */
const FILE_NAME = 'session-user.json'

const cacheFile = () => new File(Paths.document, FILE_NAME)

export async function readCachedUser(): Promise<UserResource | null> {
  try {
    const file = cacheFile()
    if (!file.exists) return null
    return JSON.parse(await file.text()) as UserResource
  } catch {
    return null
  }
}

export async function writeCachedUser(user: UserResource | null): Promise<void> {
  try {
    const file = cacheFile()
    if (!user) {
      if (file.exists) file.delete()
      return
    }
    file.write(JSON.stringify(user))
  } catch {
    // Best effort: the next online boot refreshes it anyway.
  }
}
