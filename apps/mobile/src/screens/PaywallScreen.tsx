import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import Purchases, { type CustomerInfo, type PurchasesPackage, PURCHASES_ERROR_CODE } from 'react-native-purchases'
import { useQueryClient } from '@tanstack/react-query'
import { BadgePercent, CheckCircle2, Zap } from 'lucide-react-native'
import { privacyPolicy, termsOfService } from '@fit-nation/legal'
import { authApi, queryKeys, withAlpha } from '@fit-nation/shared'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SectionLabel } from '../components/ui/SectionLabel'
import { RADIUS, SCREEN, SECTION_GAP, STACK_GAP } from '../constants/layout'
import { Entitlement, useEntitlements } from '../hooks/useEntitlements'
import {
  PARTNER_DISCOUNT_NOTE,
  partnerDiscountLine,
  paywallHero,
  purchaseOutcomeMessage,
  SUBSCRIBED_MESSAGE,
  yearlyBadge,
  type PurchaseAction,
} from './paywallCopy'
import { packageDiscount, paywallPlans } from './paywallOffering'
import { runPurchaseFlow, type PurchaseFlowResult } from '../lib/purchaseFlow'
import { purchaseLiftsRefusal } from '../navigation/gate'
import { revenueCatIdentity } from '../lib/revenuecat'
import { showToast } from '../lib/toast'
import type { AppScreenProps } from '../navigation/types'

/**
 * The subscription gate. Mounted as the stack's initial route when the signed-in
 * user has no `app_access` entitlement (AppNavigator), and re-entered by
 * EntitlementWatcher when access lapses at runtime. Nothing behind it is
 * reachable, so it carries its own Sign Out.
 *
 * The same screen, as SubscriptionPlans, is the plans opened by choice during
 * the Signup Trial (See Plans on the Profile tab). That one is not the gate: it
 * has a back button instead of Sign Out, and goes back after a purchase.
 *
 * Both sell the default RevenueCat offering, unless the user's partner has a
 * Paywall Discount: then its offering (`partner.paywall_offering_id`), with
 * the standard prices struck through (paywallOffering.ts) and a banner that
 * names the partner giving the discount.
 */
const FEATURES = [
  'Personalized workout plans',
  'Full exercise library & guided sessions',
  'Progress tracking & performance analytics',
  'Unlimited workout sessions',
]

const hasAppAccess = (info: CustomerInfo) => !!info.entitlements.active[Entitlement.AppAccess]

/** Sizes this screen owns; everything else comes from the primitives. */
const PAYWALL = { heroTile: 64, heroIcon: 30, featureIcon: 20, planBorder: 2, discountLogo: 48, discountIcon: 24 } as const

export function PaywallScreen({ navigation, route }: AppScreenProps<'Paywall' | 'SubscriptionPlans'>) {
  const { colors } = useTheme()
  const { user, logout, setUser, backendRefused, liftBackendRefusal } = useAuth()
  const { subscription, has } = useEntitlements()
  const queryClient = useQueryClient()
  const isGate = route.name === 'Paywall'

  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  // The default offering's packages while a partner's discount offering is on sale.
  const [standardPackages, setStandardPackages] = useState<PurchasesPackage[]>([])
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const discountOfferingId = user?.partner?.paywall_offering_id ?? null

  const loadOfferings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const plans = paywallPlans(await Purchases.getOfferings(), discountOfferingId)
      if (!plans) {
        setError('No plans are available right now. Please try again later.')
        return
      }
      if (discountOfferingId && !plans.discounted) {
        console.warn(`[RC] Offering ${discountOfferingId} is missing or empty; selling the default offering`)
      }
      setPackages(plans.packages)
      setStandardPackages(plans.standardPackages)
      setSelectedPkg(plans.packages.find(p => p.packageType === 'ANNUAL') ?? plans.packages[0])
    } catch {
      setError('Unable to load plans. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [discountOfferingId])

  useEffect(() => {
    loadOfferings()
  }, [loadOfferings])

  // Both entitlement sources, then straight to Tabs. EntitlementWatcher would
  // get there too once the user query lands; the reset just makes it instant.
  // The plans opened during the trial go back to where they were opened.
  async function enterApp() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.revenueCat.customerInfo() }),
    ])
    if (isGate) {
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    } else {
      showToast(SUBSCRIBED_MESSAGE, 'success')
      navigation.goBack()
    }
  }

  /**
   * Purchase or restore through the purchase flow (ticket 026/07): RevenueCat
   * must hold this user, then the backend syncs and we wait (~10 s at most) for
   * /user to agree before entering. Toasts any outcome that doesn't enter.
   */
  async function runFlow(action: PurchaseAction, transact: () => Promise<boolean>): Promise<void> {
    const result: PurchaseFlowResult = user
      ? await runPurchaseFlow({
          userId: user.id,
          revenueCat: revenueCatIdentity,
          transact,
          sync: () => authApi.syncSubscription(),
          fetchUser: () => authApi.getCurrentUser().then(r => r.user),
          hadAccess: has(Entitlement.AppAccess),
          log: (message, error) => console.warn(message, error),
        })
      : { kind: 'identity-mismatch' }
    if (result.kind === 'entered') {
      if (result.user) setUser(result.user)
      // A purchase or restore lifts a backend refusal (ticket 026/13), unless
      // the backend answered it and still grants nothing: then stay here.
      if (!backendRefused || purchaseLiftsRefusal(result.user)) {
        liftBackendRefusal()
        await enterApp()
        return
      }
    }
    const message = purchaseOutcomeMessage(action, result.kind === 'entered' ? 'not-granted' : result.kind)
    if (message) showToast(message, 'error')
  }

  async function handlePurchase() {
    if (!selectedPkg) return
    try {
      setPurchasing(true)
      await runFlow('purchase', async () => hasAppAccess((await Purchases.purchasePackage(selectedPkg)).customerInfo))
    } catch (e: unknown) {
      const err = e as { code?: PURCHASES_ERROR_CODE; userCancelled?: boolean; message?: string }
      if (err.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
        // The store account already holds this subscription (Play: "already
        // subscribed"), so the way in is Restore, which also transfers it to the
        // signed-in user. The store's own message would leave them stuck here.
        await handleRestore()
      } else if (!err.userCancelled) {
        showToast(err.message ?? 'Purchase failed. Please try again.', 'error')
      }
    } finally {
      setPurchasing(false)
    }
  }

  async function handleRestore() {
    try {
      setRestoring(true)
      await runFlow('restore', async () => hasAppAccess(await Purchases.restorePurchases()))
    } catch (e: unknown) {
      showToast((e as { message?: string }).message ?? 'Unable to restore purchases. Please try again.', 'error')
    } finally {
      setRestoring(false)
    }
  }

  const monthlyPkg = packages.find(p => p.packageType === 'MONTHLY')
  const annualPkg = packages.find(p => p.packageType === 'ANNUAL')
  const otherPkgs = packages.filter(p => p.packageType !== 'MONTHLY' && p.packageType !== 'ANNUAL')

  const savings =
    monthlyPkg && annualPkg && monthlyPkg.product.price > 0
      ? Math.round((1 - annualPkg.product.price / 12 / monthlyPkg.product.price) * 100)
      : 0

  // A Paywall Discount: each plan strikes through its standard price, and the
  // banner names the selected plan's saving and the partner giving it.
  const standardPriceOf = (pkg: PurchasesPackage) => packageDiscount(pkg, standardPackages)?.standardPrice
  const selectedDiscount = selectedPkg ? packageDiscount(selectedPkg, standardPackages) : null
  const discountLine =
    selectedDiscount && user?.partner ? partnerDiscountLine(selectedDiscount.percentOff, user.partner.name) : null

  const { headline, subheadline, ctaLabel } = paywallHero(subscription)

  // The gate has nothing behind it, so it signs out; the plans opened by choice go back.
  const signOut = isGate ? <Button variant="ghost" label="Sign Out" onPress={() => logout()} /> : null
  const header = isGate ? null : <ScreenHeader title="Choose a Plan" onBack={() => navigation.goBack()} />

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={[styles.fill, { backgroundColor: colors.bgBase }]}>
        {header && <View style={styles.header}>{header}</View>}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={[styles.fill, { backgroundColor: colors.bgBase }]}>
        {header && <View style={styles.header}>{header}</View>}
        <ErrorState message={error} onRetry={loadOfferings} />
        {signOut && <View style={{ paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottom }}>{signOut}</View>}
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.fill, { backgroundColor: colors.bgBase }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SCREEN.paddingX,
          // ScreenHeader brings its own top padding.
          paddingTop: header ? 0 : SCREEN.paddingTop,
          paddingBottom: SCREEN.paddingBottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {header}

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroTile, { backgroundColor: withAlpha(colors.primary, 0.15) }]}>
            <Zap size={PAYWALL.heroIcon} color={colors.primary} fill={colors.primary} />
          </View>
          <Text className="text-2xl font-bold text-center mb-3" style={{ color: colors.textPrimary }}>
            {headline}
          </Text>
          <Text className="text-base text-center leading-6" style={{ color: colors.textSecondary }}>
            {subheadline}
          </Text>
          {discountLine && <PartnerDiscountBanner title={discountLine} logoUrl={user?.partner?.visual_identity?.logo} />}
        </View>

        {/* What the subscription unlocks */}
        <View style={styles.features}>
          {FEATURES.map(feature => (
            <View key={feature} style={styles.feature}>
              <CheckCircle2 size={PAYWALL.featureIcon} color={colors.primary} />
              <Text className="text-sm flex-1" style={{ color: colors.textPrimary }}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plans}>
          {monthlyPkg && (
            <PlanTile
              caption="Monthly"
              price={monthlyPkg.product.priceString}
              standardPrice={standardPriceOf(monthlyPkg)}
              period="per month"
              selected={selectedPkg?.identifier === monthlyPkg.identifier}
              onPress={() => setSelectedPkg(monthlyPkg)}
            />
          )}
          {annualPkg && (
            <PlanTile
              caption="Yearly"
              price={annualPkg.product.priceString}
              standardPrice={standardPriceOf(annualPkg)}
              period="per year"
              note={
                annualPkg.product.price > 0
                  ? `${(annualPkg.product.price / 12).toLocaleString(undefined, {
                      style: 'currency',
                      currency: annualPkg.product.currencyCode ?? 'USD',
                      maximumFractionDigits: 2,
                    })}/mo`
                  : undefined
              }
              badge={yearlyBadge(savings, !!discountLine)}
              selected={selectedPkg?.identifier === annualPkg.identifier}
              onPress={() => setSelectedPkg(annualPkg)}
            />
          )}
        </View>
        {otherPkgs.map(pkg => (
          <PlanTile
            key={pkg.identifier}
            caption={pkg.product.title}
            price={pkg.product.priceString}
            standardPrice={standardPriceOf(pkg)}
            selected={selectedPkg?.identifier === pkg.identifier}
            onPress={() => setSelectedPkg(pkg)}
            style={{ marginBottom: STACK_GAP }}
          />
        ))}

        <Button
          label={ctaLabel}
          loading={purchasing}
          disabled={purchasing || !selectedPkg}
          onPress={handlePurchase}
          style={{ marginTop: STACK_GAP }}
        />
        <Button variant="ghost" label="Restore Purchases" loading={restoring} disabled={restoring} onPress={handleRestore} />

        {/* Apple requires both documents to be reachable from the paywall. */}
        <View style={styles.legal}>
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            <Text onPress={() => Linking.openURL(termsOfService.canonicalUrl)} style={{ color: colors.primary, textDecorationLine: 'underline' }}>
              Terms of Service
            </Text>
            {'  ·  '}
            <Text onPress={() => Linking.openURL(privacyPolicy.canonicalUrl)} style={{ color: colors.primary, textDecorationLine: 'underline' }}>
              Privacy Policy
            </Text>
          </Text>
          <Text className="text-xs text-center mt-3" style={{ color: colors.textMuted, lineHeight: 18 }}>
            Your subscription renews automatically unless you cancel at least 24 hours before the current period ends.
          </Text>
        </View>

        {signOut}
      </ScrollView>
    </SafeAreaView>
  )
}

interface PlanTileProps {
  caption: string
  price: string
  /** The full price, struck through above a discounted `price`. */
  standardPrice?: string
  period?: string
  /** A second line under the price, e.g. the yearly plan's monthly equivalent. */
  note?: string
  /** A corner pill, e.g. "Save 33%" (yearlyBadge). */
  badge?: string
  selected: boolean
  onPress: () => void
  style?: object
}

/** A selectable plan: a Card with a brand border when chosen. Not a Button — it holds several lines. */
function PlanTile({ caption, price, standardPrice, period, note, badge, selected, onPress, style }: PlanTileProps) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${caption}, ${price}${period ? ` ${period}` : ''}${standardPrice ? `, was ${standardPrice}` : ''}`}
      style={[styles.plan, style]}
    >
      <Card style={[styles.planCard, { borderColor: selected ? colors.primary : colors.border }]}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.textButton }]}>{badge}</Text>
          </View>
        )}
        <SectionLabel tone="muted" style={{ marginBottom: 8 }}>{caption}</SectionLabel>
        {!!standardPrice && (
          <Text className="text-xs" style={{ color: colors.textMuted, textDecorationLine: 'line-through' }}>{standardPrice}</Text>
        )}
        <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>{price}</Text>
        {!!period && <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>{period}</Text>}
        {!!note && <Text className="text-xs mt-1" style={{ color: colors.primary }}>{note}</Text>}
      </Card>
    </TouchableOpacity>
  )
}

interface PartnerDiscountBannerProps {
  /** Who gives the discount and how much: "30% off from Synergy Fitness Center" (partnerDiscountLine). */
  title: string
  /** The partner's logo. The discount icon stands in when there is none or it fails to load. */
  logoUrl?: string | null
}

/**
 * A partner's Paywall Discount under the hero: the partner's logo beside who
 * gives the discount and that the prices below already include it. A tinted
 * Card rather than a pill, so the partner reads as the reason for the price.
 */
function PartnerDiscountBanner({ title, logoUrl }: PartnerDiscountBannerProps) {
  const { colors } = useTheme()
  // A logo that fails to load (a missing file on the server) would leave an
  // empty square; the discount icon takes its place.
  const [logoFailed, setLogoFailed] = useState(false)
  return (
    <Card
      accessible
      accessibilityLabel={`${title}. ${PARTNER_DISCOUNT_NOTE}.`}
      style={[styles.discount, { backgroundColor: withAlpha(colors.primary, 0.15), borderColor: withAlpha(colors.primary, 0.3) }]}
    >
      {logoUrl && !logoFailed ? (
        <Image source={logoUrl} onError={() => setLogoFailed(true)} style={styles.discountLogo} contentFit="contain" />
      ) : (
        <View style={[styles.discountLogo, { backgroundColor: withAlpha(colors.primary, 0.15) }]}>
          <BadgePercent size={PAYWALL.discountIcon} color={colors.primary} />
        </View>
      )}
      <View style={styles.discountBody}>
        <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>{title}</Text>
        <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>{PARTNER_DISCOUNT_NOTE}</Text>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: SCREEN.paddingX },
  hero: { alignItems: 'center', marginBottom: 32 },
  heroTile: {
    width: PAYWALL.heroTile,
    height: PAYWALL.heroTile,
    borderRadius: RADIUS.row,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  discount: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: STACK_GAP,
    padding: 16,
    borderWidth: 1,
    marginTop: SECTION_GAP,
    marginBottom: 0,
  },
  discountLogo: {
    width: PAYWALL.discountLogo,
    height: PAYWALL.discountLogo,
    borderRadius: RADIUS.control,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBody: { flex: 1 },
  features: { gap: STACK_GAP, marginBottom: 32 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: STACK_GAP },
  plans: { flexDirection: 'row', gap: STACK_GAP, marginBottom: STACK_GAP },
  plan: { flex: 1 },
  planCard: { marginBottom: 0, padding: 16, borderWidth: PAYWALL.planBorder, overflow: 'hidden' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: RADIUS.control,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  legal: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
})
