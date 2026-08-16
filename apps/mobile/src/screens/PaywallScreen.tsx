import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Purchases, { type PurchasesPackage, INTRO_ELIGIBILITY_STATUS } from 'react-native-purchases'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Zap } from 'lucide-react-native'
import { useTheme } from '../context/ThemeContext'
import type { AppScreenProps } from '../navigation/types'

const FEATURES = [
  'Personalized AI workout plans',
  'Full exercise library & guided sessions',
  'Progress tracking & performance analytics',
  'Unlimited workout sessions',
]

const TERMS_URL = 'https://fitnation.mk/terms'
const PRIVACY_URL = 'https://fitnation.mk/privacy-policy'

export function PaywallScreen({ navigation }: AppScreenProps<'Paywall'>) {
  const { colors } = useTheme()
  const queryClient = useQueryClient()

  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null)
  const [trialEligibility, setTrialEligibility] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOfferings()
  }, [])

  useEffect(() => {
    if (packages.length === 0) return
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

  async function loadOfferings() {
    try {
      setLoading(true)
      setError(null)
      const offerings = await Purchases.getOfferings()
      const current = offerings.current
      if (!current || current.availablePackages.length === 0) {
        setError('No plans available. Please try again later.')
        return
      }
      const pkgs = current.availablePackages
      setPackages(pkgs)
      const annual = pkgs.find(p => p.packageType === 'ANNUAL')
      setSelectedPkg(annual ?? pkgs[0])
    } catch {
      setError('Unable to load plans. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase() {
    if (!selectedPkg) return
    try {
      setPurchasing(true)
      const { customerInfo } = await Purchases.purchasePackage(selectedPkg)
      if (customerInfo.entitlements.active['app_access']) {
        await queryClient.invalidateQueries({ queryKey: ['user'] })
        navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase Failed', e.message ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setPurchasing(false)
    }
  }

  async function handleRestore() {
    try {
      setRestoring(true)
      const customerInfo = await Purchases.restorePurchases()
      if (customerInfo.entitlements.active['app_access']) {
        await queryClient.invalidateQueries({ queryKey: ['user'] })
        navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })
      } else {
        Alert.alert('No Subscription Found', 'No active subscription was found for this account.')
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e.message ?? 'Unable to restore purchases. Please try again.')
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

  const selectedHasTrial = selectedPkg
    ? !!selectedPkg.product.introPrice && trialEligibility[selectedPkg.product.identifier] === true
    : false

  const headline = selectedHasTrial ? 'Start Your 7-Day Free Trial' : 'Unlock Your Full Potential'
  const subheadline = selectedHasTrial
    ? 'Full access to everything, free for 7 days. Cancel anytime before it ends.'
    : 'Full access to personalized training, exercise library, and progress tracking.'
  const ctaLabel = selectedHasTrial ? 'Start 7-Day Free Trial' : 'Subscribe Now'

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase, paddingHorizontal: 24 }}>
        <Text className="text-lg font-semibold text-center mb-2" style={{ color: colors.textPrimary }}>
          Unable to Load Plans
        </Text>
        <Text className="text-sm text-center mb-8" style={{ color: colors.textSecondary }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadOfferings}
          className="px-8 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="font-semibold" style={{ color: colors.textButton }}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-5"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Zap size={30} color={colors.primary} fill={colors.primary} />
          </View>
          <Text className="text-3xl font-bold text-center mb-3" style={{ color: colors.textPrimary }}>
            {headline}
          </Text>
          <Text className="text-base text-center leading-6" style={{ color: colors.textSecondary }}>
            {subheadline}
          </Text>
        </View>

        {/* Feature list */}
        <View className="mb-8" style={{ gap: 12 }}>
          {FEATURES.map(feature => (
            <View key={feature} className="flex-row items-center" style={{ gap: 12 }}>
              <CheckCircle2 size={20} color={colors.primary} />
              <Text className="text-sm flex-1" style={{ color: colors.textPrimary }}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Plan cards */}
        <View className="flex-row mb-6" style={{ gap: 12 }}>
          {monthlyPkg && (
            <TouchableOpacity
              onPress={() => setSelectedPkg(monthlyPkg)}
              className="flex-1 rounded-2xl p-4"
              style={{
                backgroundColor: colors.bgSurface,
                borderWidth: 2,
                borderColor: selectedPkg?.packageType === 'MONTHLY' ? colors.primary : colors.border,
              }}
            >
              <Text
                className="text-xs font-semibold uppercase mb-3"
                style={{ color: colors.textMuted }}
              >
                Monthly
              </Text>
              <Text className="text-xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                {monthlyPkg.product.priceString}
              </Text>
              <Text className="text-xs" style={{ color: colors.textMuted }}>per month</Text>
            </TouchableOpacity>
          )}

          {annualPkg && (
            <TouchableOpacity
              onPress={() => setSelectedPkg(annualPkg)}
              className="flex-1 rounded-2xl p-4 overflow-hidden"
              style={{
                backgroundColor: colors.bgSurface,
                borderWidth: 2,
                borderColor: selectedPkg?.packageType === 'ANNUAL' ? colors.primary : colors.border,
              }}
            >
              {savings > 0 && (
                <View
                  className="absolute top-0 right-0 px-2 py-1 rounded-bl-xl"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.textButton }}>
                    Save {savings}%
                  </Text>
                </View>
              )}
              <Text
                className="text-xs font-semibold uppercase mb-3"
                style={{ color: colors.textMuted }}
              >
                Yearly
              </Text>
              <Text className="text-xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                {annualPkg.product.priceString}
              </Text>
              <Text className="text-xs" style={{ color: colors.textMuted }}>per year</Text>
              {annualPkg.product.price > 0 && (
                <Text className="text-xs mt-1" style={{ color: colors.primary }}>
                  {(annualPkg.product.price / 12).toLocaleString(undefined, {
                    style: 'currency',
                    currency: annualPkg.product.currencyCode ?? 'USD',
                    maximumFractionDigits: 2,
                  })}/mo
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Any non-monthly/annual packages */}
        {otherPkgs.map(pkg => (
          <TouchableOpacity
            key={pkg.identifier}
            onPress={() => setSelectedPkg(pkg)}
            className="rounded-2xl p-4 mb-3"
            style={{
              backgroundColor: colors.bgSurface,
              borderWidth: 2,
              borderColor: selectedPkg?.identifier === pkg.identifier ? colors.primary : colors.border,
            }}
          >
            <Text className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
              {pkg.product.title}
            </Text>
            <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              {pkg.product.priceString}
            </Text>
          </TouchableOpacity>
        ))}

        {/* CTA button */}
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={purchasing || !selectedPkg}
          className="rounded-2xl py-4 items-center mb-4"
          style={{ backgroundColor: purchasing ? colors.primary + '80' : colors.primary }}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.textButton} />
          ) : (
            <Text className="text-base font-bold" style={{ color: colors.textButton }}>
              {ctaLabel}
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore purchases */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={restoring}
          className="items-center py-2 mb-6"
        >
          {restoring ? (
            <ActivityIndicator color={colors.textSecondary} size="small" />
          ) : (
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>

        {/* Legal links (Apple requires both visible on paywall) */}
        <View className="flex-row justify-center items-center mb-4" style={{ gap: 8 }}>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text className="text-xs" style={{ color: colors.textMuted }}>Terms of Use</Text>
          </TouchableOpacity>
          <Text className="text-xs" style={{ color: colors.textMuted }}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text className="text-xs" style={{ color: colors.textMuted }}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-center" style={{ color: colors.textMuted, lineHeight: 18 }}>
          Subscription auto-renews unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
