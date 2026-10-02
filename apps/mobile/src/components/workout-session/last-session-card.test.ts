import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The exercise page shows last time through LastSessionCard, which draws lastSessionSummary() on theme tokens. */
const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(HERE, rel), 'utf8')

describe('LastSessionCard', () => {
  it('is what the exercise page renders for the previous sets', () => {
    const page = read('ExercisePage.tsx')
    expect(page).toMatch(/<LastSessionCard/)
    expect(page).not.toMatch(/LAST SESSION/)
  })

  it('takes its numbers from lastSessionSummary and uses no literal colours', () => {
    const card = read('LastSessionCard.tsx')
    expect(card).toMatch(/lastSessionSummary\(sets, targets\)/)
    expect(card).not.toMatch(/#[0-9a-fA-F]{3,8}\b|className=/)
  })
})
