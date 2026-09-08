import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The structural guard for spec 0029 on mobile: the visual identity is derived
 * from auth state, never pushed into the theme. AuthContext must not know the
 * theme exists, ThemeProvider must read auth, and App.tsx must nest them that
 * way round — the one ordering rule that remains, stated where it is enforced.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(HERE, rel), 'utf8')

describe('the visual identity derives from auth', () => {
  it('AuthContext does not import the theme', () => {
    expect(read('AuthContext.tsx')).not.toMatch(/ThemeContext|useTheme|setColors|resetColors|partnerColorOverrides/)
  })

  it('ThemeProvider reads auth', () => {
    expect(read('ThemeContext.tsx')).toMatch(/useAuth\(\)/)
  })

  it('App.tsx puts ThemeProvider inside AuthProvider', () => {
    const app = read('../../App.tsx')
    expect(app.indexOf('<AuthProvider>')).toBeGreaterThan(-1)
    expect(app.indexOf('<AuthProvider>')).toBeLessThan(app.indexOf('<ThemeProvider>'))
  })
})
