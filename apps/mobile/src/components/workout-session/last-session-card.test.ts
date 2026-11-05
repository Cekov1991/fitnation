import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The exercise page shows last time through LastSessionCard, which draws lastSessionSummary() on theme tokens. */
const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(HERE, rel), 'utf8')

describe('LastSessionCard', () => {
  it('is what the info sheet renders for the previous sets', () => {
    // PROTOTYPE (variant D): the card moved from the exercise scroll into the ⓘ sheet.
    const sheet = read('ExerciseInfoSheet.tsx')
    expect(sheet).toMatch(/<LastSessionCard/)
    expect(sheet).not.toMatch(/LAST SESSION/)
    expect(read('ExercisePage.tsx')).not.toMatch(/LAST SESSION/)
  })

  it('takes its numbers from lastSessionSummary and uses no literal colours', () => {
    const card = read('LastSessionCard.tsx')
    expect(card).toMatch(/lastSessionSummary\(sets, targets\)/)
    expect(card).not.toMatch(/#[0-9a-fA-F]{3,8}\b|className=/)
  })
})
