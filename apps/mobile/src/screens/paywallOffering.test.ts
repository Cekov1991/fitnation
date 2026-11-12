import { describe, expect, it } from 'vitest'
import type { PurchasesOffering, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases'
import { packageDiscount, paywallPlans } from './paywallOffering'

/** A package with only what the paywall reads. */
const pkg = (packageType: string, price: number): PurchasesPackage =>
  ({
    identifier: `$rc_${packageType.toLowerCase()}`,
    packageType,
    product: { price, priceString: `$${price.toFixed(2)}`, currencyCode: 'USD' },
  }) as unknown as PurchasesPackage

const offering = (identifier: string, packages: PurchasesPackage[]): PurchasesOffering =>
  ({ identifier, availablePackages: packages }) as unknown as PurchasesOffering

/** What getOfferings() returns: `default` is the current offering when listed. */
const offerings = (...list: PurchasesOffering[]): PurchasesOfferings => ({
  current: list.find(o => o.identifier === 'default') ?? null,
  all: Object.fromEntries(list.map(o => [o.identifier, o])),
})

const STANDARD = offering('default', [pkg('MONTHLY', 9.99), pkg('ANNUAL', 59.99)])
const DISCOUNT_30 = offering('discount-30', [pkg('MONTHLY', 6.99), pkg('ANNUAL', 41.99)])

describe('paywallPlans', () => {
  it("sells the partner's Paywall Discount offering, against the default offering's prices", () => {
    expect(paywallPlans(offerings(STANDARD, DISCOUNT_30), 'discount-30')).toEqual({
      packages: DISCOUNT_30.availablePackages,
      standardPackages: STANDARD.availablePackages,
      discounted: true,
    })
  })

  it('sells the default offering to everyone else', () => {
    const standard = { packages: STANDARD.availablePackages, standardPackages: [], discounted: false }
    expect(paywallPlans(offerings(STANDARD, DISCOUNT_30), null)).toEqual(standard)
    expect(paywallPlans(offerings(STANDARD, DISCOUNT_30), undefined)).toEqual(standard)
  })

  it('falls back to the default offering while RevenueCat lacks the discount one or its products', () => {
    const standard = { packages: STANDARD.availablePackages, standardPackages: [], discounted: false }
    expect(paywallPlans(offerings(STANDARD), 'discount-30')).toEqual(standard)
    expect(paywallPlans(offerings(STANDARD, offering('discount-30', [])), 'discount-30')).toEqual(standard)
  })

  it('has nothing to sell when no offering has packages', () => {
    expect(paywallPlans(offerings(), null)).toBeNull()
    expect(paywallPlans(offerings(offering('default', [])), 'discount-30')).toBeNull()
  })
})

describe('packageDiscount', () => {
  const [monthly, annual] = DISCOUNT_30.availablePackages

  it("strikes through the same plan's standard price and rounds the saving", () => {
    expect(packageDiscount(monthly, STANDARD.availablePackages)).toEqual({ standardPrice: '$9.99', percentOff: 30 })
    expect(packageDiscount(annual, STANDARD.availablePackages)).toEqual({ standardPrice: '$59.99', percentOff: 30 })
  })

  it('is null when there is nothing cheaper to show', () => {
    // The default offering on sale: nothing to compare against.
    expect(packageDiscount(monthly, [])).toBeNull()
    // No standard plan of that length.
    expect(packageDiscount(pkg('WEEKLY', 1.99), STANDARD.availablePackages)).toBeNull()
    // Not cheaper than the standard plan, or only by a rounding difference.
    expect(packageDiscount(pkg('MONTHLY', 9.99), STANDARD.availablePackages)).toBeNull()
    expect(packageDiscount(pkg('MONTHLY', 9.95), STANDARD.availablePackages)).toBeNull()
  })
})
