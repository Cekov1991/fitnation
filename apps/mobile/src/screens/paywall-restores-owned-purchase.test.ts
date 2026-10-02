import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Structural guard for the paywall's purchase failures (step 15, 2026-10-02):
 * when the store refuses a purchase because its account already holds the
 * subscription (Play: "already subscribed"), the way in is Restore Purchases,
 * which also runs RevenueCat's transfer to the signed-in user. Toasting the
 * store's raw message leaves the user on the paywall with no way in. A
 * cancelled sheet still says nothing, and every other failure still toasts.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, 'PaywallScreen.tsx'), 'utf8')

/** One `async function <name>()` of the screen, up to the next one. */
function fn(name: string): string {
  const start = src.indexOf(`async function ${name}()`)
  if (start === -1) return ''
  const next = src.indexOf('\n  async function ', start + 1)
  return src.slice(start, next === -1 ? undefined : next)
}

describe('the paywall restores a subscription the store already holds', () => {
  const purchase = fn('handlePurchase')

  it('answers PRODUCT_ALREADY_PURCHASED_ERROR with Restore instead of a toast', () => {
    expect(purchase).not.toBe('')
    expect(purchase).toMatch(/err\.code === PURCHASES_ERROR_CODE\.PRODUCT_ALREADY_PURCHASED_ERROR/)
    expect(purchase).toMatch(/await handleRestore\(\)/)
  })

  it('still keeps quiet on a cancelled sheet and toasts every other failure', () => {
    expect(purchase).toMatch(/else if \(!err\.userCancelled\)/)
    expect(purchase).toMatch(/showToast\(err\.message \?\? 'Purchase failed\. Please try again\.', 'error'\)/)
  })

  it('reads the code from the SDK enum, never a literal', () => {
    expect(src).toMatch(/import Purchases, \{[^}]*\bPURCHASES_ERROR_CODE\b[^}]*\} from 'react-native-purchases'/)
    expect(purchase).not.toMatch(/['"]6['"]/)
  })
})
