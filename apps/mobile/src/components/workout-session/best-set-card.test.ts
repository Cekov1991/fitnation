import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The exercise page shows the exercise's best set ever through BestSetCard, drawn on theme tokens. */
const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(HERE, rel), 'utf8')

describe('BestSetCard', () => {
  it('is what the exercise page renders for the API best_set', () => {
    expect(read('ExercisePage.tsx')).toMatch(/<BestSetCard best=\{exerciseDetail\.best_set\}/)
  })

  it('names itself All-time best, dates the set, and uses no literal colours', () => {
    const card = read('BestSetCard.tsx')
    expect(card).toMatch(/All-time best/)
    expect(card).toMatch(/formatDate\(best\.performed_at, 'short'\)/)
    expect(card).not.toMatch(/#[0-9a-fA-F]{3,8}\b|className=/)
  })
})
