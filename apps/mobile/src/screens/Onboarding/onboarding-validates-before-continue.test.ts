import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Structural guard: the onboarding wizard checks a question's ranges before it
 * moves on, in the unit being typed, and shows them under the fields. Without
 * it, an out-of-range height reaches the server and comes back as the
 * full-screen "Build My Plan" error (finding #7, 2026-10-02).
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const screen = readFileSync(join(HERE, '../placeholders/OnboardingScreen.tsx'), 'utf8')

describe('the onboarding wizard validates before Continue', () => {
  it('runs validateSection on the current section in the draft unit', () => {
    expect(screen).toMatch(/validateSection\(section, state, state\.unit_system \?\? 'metric'\)/)
  })

  it('hands the errors to the About section', () => {
    expect(screen).toMatch(/<AboutSection draft=\{state\} onChange=\{set\} errors=\{errors\} \/>/)
  })
})
