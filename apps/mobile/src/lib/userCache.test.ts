import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserResource } from '@fit-nation/shared'

const disk = vi.hoisted(() => new Map<string, string>())

vi.mock('expo-file-system', () => {
  class File {
    uri: string
    constructor(...parts: unknown[]) {
      this.uri = parts.map(String).join('/')
    }
    get exists() {
      return disk.has(this.uri)
    }
    write(content: string) {
      disk.set(this.uri, content)
    }
    async text() {
      const v = disk.get(this.uri)
      if (v === undefined) throw new Error('ENOENT')
      return v
    }
    delete() {
      disk.delete(this.uri)
    }
  }
  return { File, Paths: { document: 'file:///documents' } }
})

import { readCachedUser, writeCachedUser } from './userCache'

const user = { id: 4, email: 'trainer1@fitnation.gym', entitlements: [] } as unknown as UserResource

describe('userCache', () => {
  beforeEach(() => disk.clear())

  it('round-trips the user through the document directory', async () => {
    await writeCachedUser(user)
    expect([...disk.keys()]).toEqual(['file:///documents/session-user.json'])
    expect(await readCachedUser()).toEqual(user)
  })

  it('reads null when nothing was cached', async () => {
    expect(await readCachedUser()).toBeNull()
  })

  it('a null user deletes the cache', async () => {
    await writeCachedUser(user)
    await writeCachedUser(null)
    expect(disk.size).toBe(0)
    expect(await readCachedUser()).toBeNull()
  })

  it('a corrupt file reads as nothing cached', async () => {
    disk.set('file:///documents/session-user.json', '{not json')
    expect(await readCachedUser()).toBeNull()
  })
})
