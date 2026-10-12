import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The privacy policy says the product does not use AI, and it doesn't: the
 * workout generator is rule-based. So no copy may claim otherwise, in any
 * client. This scans every source file of the three front-end packages for
 * the word (code identifiers that merely contain the letters, like
 * `DETAIL`, are not matched).
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const PACKAGES = ['apps/mobile/src', 'apps/web/src', 'packages/shared/src']
const WORD = /\bAI\b|\bAI-|[Aa]rtificial [Ii]ntelligence/g

function files(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...files(path))
    else if (/\.(tsx?|json)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(path)
  }
  return out
}

describe('privacy: the product never claims to use AI', () => {
  it('no front-end source mentions AI', () => {
    const hits: string[] = []
    for (const pkg of PACKAGES) {
      for (const file of files(join(ROOT, pkg))) {
        const source = readFileSync(file, 'utf8')
        for (const match of source.matchAll(WORD)) {
          const line = source.slice(0, match.index ?? 0).split('\n').length
          hits.push(`${relative(ROOT, file)}:${line}`)
        }
      }
    }
    expect(hits).toEqual([])
  })
})
