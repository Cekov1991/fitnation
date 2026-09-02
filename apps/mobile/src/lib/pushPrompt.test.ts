import { describe, expect, it } from 'vitest'
import { shouldShowPermissionSheet } from './pushPrompt'

describe('shouldShowPermissionSheet', () => {
  it('shows only when the OS has never been asked and the user never dismissed it', () => {
    expect(shouldShowPermissionSheet('undetermined', false)).toBe(true)
  })

  it('never shows once granted — nothing to ask', () => {
    expect(shouldShowPermissionSheet('granted', false)).toBe(false)
    expect(shouldShowPermissionSheet('granted', true)).toBe(false)
  })

  it('never shows once denied — the OS will not re-prompt, the sheet would lie', () => {
    expect(shouldShowPermissionSheet('denied', false)).toBe(false)
    expect(shouldShowPermissionSheet('denied', true)).toBe(false)
  })

  it('respects "Not now"', () => {
    expect(shouldShowPermissionSheet('undetermined', true)).toBe(false)
  })
})
