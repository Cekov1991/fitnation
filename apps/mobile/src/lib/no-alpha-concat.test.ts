import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The structural guard for 0029's alpha rule on mobile: a colour at an opacity
 * is `withAlpha(colour, alpha)`, never a hex pair appended to a template
 * string — the convention that produced 170 sites in 28 spellings.
 */
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONCAT = /\$\{[\w.]*colors\.[A-Za-z]+\}[0-9A-Fa-f]{2}`/

function files(dir: string): string[] {
  let out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out = out.concat(files(full))
    else if (/\.tsx?$/.test(full) && !/\.test\.tsx?$/.test(full)) out.push(full)
  }
  return out
}

describe('alpha is a function, not a string suffix', () => {
  const sources = files(SRC)

  it('scans the app', () => {
    expect(sources.length).toBeGreaterThan(50)
  })

  it('no file appends a hex alpha pair to a theme colour', () => {
    const offenders = sources.filter(f => CONCAT.test(readFileSync(f, 'utf8'))).map(f => relative(SRC, f))
    expect(offenders).toEqual([])
  })
})
