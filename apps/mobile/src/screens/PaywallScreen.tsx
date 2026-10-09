import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Purchases, { type CustomerInfo, type PurchasesPackage, INTRO_ELIGIBILITY_STATUS, PURCHASES_ERROR_CODE } from 'react-native-purchases'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Zap } from 'lucide-react-native'
import { privacyPolicy, termsOfService } from '@fit-nation/legal'
import { authApi, queryKeys, withAlpha } from '@fit-nation/shared'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { SectionLabel } from '../components/ui/SectionLabel'
import { RADIUS, SCREEN, STACK_GAP } from '../constants/layout'
import { Entitlement, useEntitlements } from '../hooks/useEntitlements'
import { paywallHero } from './paywallCopy'
import { runPurchaseFlow, type PurchaseFlowResult } from '../lib/purchaseFlow'
import { revenueCatIdentity } from '../lib/revenuecat'
import { showToast } from '../lib/toast'
import type { AppScreenProps } from '../navigation/types'

/**
 * The subscription gate. Mounted as the stack's initial route when the signed-in
 * user has no `app_access` entitlement (AppNavigator), and re-entered by
 * EntitlementWatcher when access lapses at runtime. Nothing behind it is
 * reachable, so it carries its own Sign Out.
 */
const FEATURES = [
  'Personalized workout plans',
  'Full exercise library & guided sessions',
  'Progress tracking & performance analytics',
  'Unlimited workout sessions',
]

const hasAppAccess = (info: CustomerInfo) => !!info.entitlements.active[Entitlement.AppAccess]

/** Sizes this screen owns; everything else comes from the primitives. */
const PAYWALL = { heroTile: 64, heroIcon: 30, featureIcon: 20, planBorder: 2 } as const

export function PaywallScreen({ navigation }: AppScreenProps<'Paywall'>) {
  const { colors } = useTheme()
  const { user, logout, setUser } = useAuth()
  const { subscription } = useEntitlements()
  const queryClient = useQueryClient()

  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null)
  const [trialEligibility, setTrialEligibility] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOfferings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const offerings = await Purchases.getOfferings()
      const current = offerings.current
      if (!current || current.availablePackages.length === 0) {
        setError('No plans are available right now. Please try again later.')
        return
      }
      const pkgs = current.availablePackages
      setPackages(pkgs)
      setSelectedPkg(pkgs.find(p => p.packageType === 'ANNUAL') ?? pkgs[0])
    } catch {
      setError('Unable to load plans. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOfferings()
  }, [loadOfferings])

  useEffect(() => {
    // iOS only — on Android this API always returns UNKNOWN; trial presence
    // there is read from the product's default option instead (see below).
    if (Platform.OS !== 'ios' || packages.length === 0) return
    const ids = packages.map(p => p.product.identifier)
    Purchases.checkTrialOrIntroductoryPriceEligibility(ids)
      .then(result => {
        const map: Record<string, boolean> = {}
        for (const [id, info] of Object.entries(result)) {
          map[id] = info.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
        }
        setTrialEligibility(map)
      })
      .catch(() => {})
  }, [packages])

  // Both entitlement sources, then straight to Tabs. EntitlementWatcher would
  // get there too once the user query lands; the reset just makes it instant.
  async function enterApp() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.revenueCat.customerInfo() }),
    ])
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
  }

  /**
   * Purchase or restore through the purchase flow (ticket 026/07): RevenueCat
   * must hold this user, then the backend syncs and we wait (~10 s at most) for
   * /user to agree before entering. Toasts the "try again" case itself.
   */
  async function runFlow(transact: () => Promise<boolean>): Promise<PurchaseFlowResult['kind']> {
    const result: PurchaseFlowResult = user
      ? await runPurchaseFlow({
          userId: user.id,
          revenueCat: revenueCatIdentity,
          transact,
          sync: () => authApi.syncSubscription(),
          fetchUser: () => authApi.getCurrentUser().then(r => r.user),
          log: (message, error) => console.warn(message, error),
        })
      : { kind: 'identity-mismatch' }
    if (result.kind === 'identity-mismatch') {
      showToast("We couldn't confirm your account. Please try again.", 'error')
    } else if (result.kind === 'entered') {
      if (result.user) setUser(result.user)
      await enterApp()
    }
    return result.kind
  }

  async function handlePurchase() {
    if (!selectedPkg) return
    try {
      setPurchasing(true)
      await runFlow(async () => hasAppAccess((await Purchases.purchasePackage(selectedPkg)).customerInfo))
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
      const outcome = await runFlow(async () => hasAppAccess(await Purchases.restorePurchases()))
      if (outcome === 'not-granted') showToast('No active subscription was found for this account.', 'error')
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

  // iOS: introPrice + the eligibility API (reliable there). Android: the
  // eligibility API is useless (UNKNOWN), but Play already tailors returned
  // offers to the current user — a free phase on the default option means a
  // trial is genuinely on offer.
  const selectedHasTrial = selectedPkg
    ? Platform.OS === 'android'
      ? selectedPkg.product.defaultOption?.freePhase != null
      : !!selectedPkg.product.introPrice && trialEligibility[selectedPkg.product.identifier] === true
    : false

  const { headline, subheadline, ctaLabel } = paywallHero(selectedHasTrial, subscription)

  const signOut = <Button variant="ghost" label="Sign Out" onPress={() => logout()} />

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={[styles.centered, { backgroundColor: colors.bgBase }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={[styles.fill, { backgroundColor: colors.bgBase }]}>
        <ErrorState message={error} onRetry={loadOfferings} />
        <View style={{ paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottom }}>{signOut}</View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.fill, { backgroundColor: colors.bgBase }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SCREEN.paddingX, paddingTop: SCREEN.paddingTop, paddingBottom: SCREEN.paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
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
              period="per month"
              selected={selectedPkg?.identifier === monthlyPkg.identifier}
              onPress={() => setSelectedPkg(monthlyPkg)}
            />
          )}
          {annualPkg && (
            <PlanTile
              caption="Yearly"
              price={annualPkg.product.priceString}
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
              badge={savings > 0 ? `Save ${savings}%` : undefined}
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
  period?: string
  /** A second line under the price, e.g. the yearly plan's monthly equivalent. */
  note?: string
  /** A corner pill, e.g. "Save 33%". */
  badge?: string
  selected: boolean
  onPress: () => void
  style?: object
}

/** A selectable plan: a Card with a brand border when chosen. Not a Button — it holds several lines. */
function PlanTile({ caption, price, period, note, badge, selected, onPress, style }: PlanTileProps) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${caption}, ${price}${period ? ` ${period}` : ''}`}
      style={[styles.plan, style]}
    >
      <Card style={[styles.planCard, { borderColor: selected ? colors.primary : colors.border }]}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.textButton }]}>{badge}</Text>
          </View>
        )}
        <SectionLabel tone="muted" style={{ marginBottom: 8 }}>{caption}</SectionLabel>
        <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>{price}</Text>
        {!!period && <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>{period}</Text>}
        {!!note && <Text className="text-xs mt-1" style={{ color: colors.primary }}>{note}</Text>}
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 32 },
  heroTile: {
    width: PAYWALL.heroTile,
    height: PAYWALL.heroTile,
    borderRadius: RADIUS.row,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
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
