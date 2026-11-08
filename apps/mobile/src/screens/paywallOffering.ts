import type { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases'

/** What the paywall sells, and the full prices a Paywall Discount is shown against. */
export interface PaywallPlans {
  /** The packages on sale. */
  packages: PurchasesPackage[]
  /** The default offering's packages while a discount offering is on sale; empty otherwise. */
  standardPackages: PurchasesPackage[]
  /** Whether the partner's Paywall Discount offering is the one on sale. */
  discounted: boolean
}

/**
 * The plans the paywall sells. A partner with a Paywall Discount names its
 * RevenueCat offering in /user (`partner.paywall_offering_id`, e.g.
 * "discount-30"), and that offering is sold when RevenueCat has it with
 * packages. Everyone else, and everyone while that offering or its store
 * products are missing, gets the default (current) offering. Null when there
 * is nothing to sell.
 */
export function paywallPlans(
  offerings: PurchasesOfferings,
  discountOfferingId: string | null | undefined,
): PaywallPlans | null {
  const discount = discountOfferingId ? offerings.all[discountOfferingId] : undefined
  const standard = offerings.current?.availablePackages ?? []
  if (discount && discount.availablePackages.length > 0) {
    return { packages: discount.availablePackages, standardPackages: standard, discounted: true }
  }
  return standard.length > 0 ? { packages: standard, standardPackages: [], discounted: false } : null
}

export interface PackageDiscount {
  /** The standard price, shown struck through: "$9.99". */
  standardPrice: string
  /** Whole percent off the standard price, e.g. 30. */
  percentOff: number
}

/**
 * A package's saving against the standard package of the same length (monthly
 * against monthly); null when there is none, or nothing to compare. Worked out
 * from the store prices rather than read off the tier, so a storefront that
 * rounds to its own price points still shows a true number.
 */
export function packageDiscount(pkg: PurchasesPackage, standardPackages: PurchasesPackage[]): PackageDiscount | null {
  const standard = standardPackages.find(p => p.packageType === pkg.packageType)
  if (!standard || standard.product.price <= 0) return null
  const percentOff = Math.round((1 - pkg.product.price / standard.product.price) * 100)
  return percentOff > 0 ? { standardPrice: standard.product.priceString, percentOff } : null
}
