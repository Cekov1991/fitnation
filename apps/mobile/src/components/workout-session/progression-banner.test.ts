import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The banner draws progressionCopy() with the shared primitives and offers its choice through Button. */
const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(HERE, rel), 'utf8')

describe('ProgressionBanner', () => {
  const banner = read('ProgressionBanner.tsx')

  it('takes its words from progressionCopy and draws no copy of its own', () => {
    expect(banner).toMatch(/from '\.\/progressionCopy'/)
    expect(banner).not.toMatch(/First time|Last session was tough|Weight increase/)
  })

  it('offers the lighter weight through Button, on theme tokens only', () => {
    expect(banner).toMatch(/<Button[\s\S]*label=\{`Use \$\{formatWeight\(copy\.offer\.use\)\}/)
    expect(banner).toMatch(/variant="secondary"[\s\S]*label=\{`Keep /)
    expect(banner).not.toMatch(/#[0-9a-fA-F]{3,8}\b|className=/)
  })

  it('the exercise page fills the Weight field from the offer', () => {
    const page = read('ExercisePage.tsx')
    expect(page).toMatch(/onUseWeight=\{/)
    expect(page).toMatch(/weightBadge=\{/)
  })
})
