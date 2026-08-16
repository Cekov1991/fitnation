import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native'
import { CreditCard, ExternalLink, Sparkles } from 'lucide-react-native'
import { useTheme } from '../context/ThemeContext'
import { useEntitlements, Entitlement } from '../hooks/useEntitlements'
import type { SubscriptionResource } from '@fit-nation/shared'

const STATUS_LABELS: Record<NonNullable<SubscriptionResource['status']>, string> = {
  active: 'Active',
  billing_issue: 'Payment Failed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  paused: 'Paused',
}

const STORE_SUBSCRIPTION_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions'

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return null
  }
}

interface Props {
  onUpgrade?: () => void
}

export function SubscriptionSection({ onUpgrade }: Props) {
  const { colors } = useTheme()
  const { subscription, has } = useEntitlements()
  const hasAccess = has(Entitlement.AppAccess)

  const expiresLabel = subscription
    ? formatDate(subscription.expires_at)
    : null

  const isSponsored = subscription?.is_sponsored_by_gym ?? false

  return (
    <View className="mb-8">
      <Text
        className="text-xs uppercase font-semibold mb-3 tracking-wider"
        style={{ color: colors.textSecondary }}
      >
        Subscription
      </Text>

      <View
        className="rounded-2xl p-4 mb-3"
        style={{ backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border }}
      >
        <View className="flex-row items-center mb-3" style={{ gap: 12 }}>
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            {isSponsored ? (
              <Sparkles size={20} color={colors.primary} />
            ) : (
              <CreditCard size={20} color={colors.primary} />
            )}
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-base" style={{ color: colors.textPrimary }}>
              {isSponsored
                ? 'Gym-Sponsored Access'
                : subscription?.is_trial
                  ? 'Free Trial'
                  : subscription?.status
                    ? 'Premium Subscription'
                    : 'No Active Plan'}
            </Text>
            {!isSponsored && subscription?.status && (
              <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                {STATUS_LABELS[subscription.status]}
                {expiresLabel ? ` · ${subscription.status === 'cancelled' ? 'Access until' : 'Renews'} ${expiresLabel}` : ''}
              </Text>
            )}
            {isSponsored && (
              <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                Provided through your gym
              </Text>
            )}
          </View>
        </View>

        {subscription?.status && !isSponsored && (
          <TouchableOpacity
            onPress={() => Linking.openURL(STORE_SUBSCRIPTION_URL)}
            className="flex-row items-center justify-center py-3 rounded-xl"
            style={{ backgroundColor: colors.bgElevated, gap: 8 }}
          >
            <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              Manage Subscription
            </Text>
            <ExternalLink size={14} color={colors.textPrimary} />
          </TouchableOpacity>
        )}

        {!hasAccess && onUpgrade && (
          <TouchableOpacity
            onPress={onUpgrade}
            className="items-center py-3 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-sm font-bold" style={{ color: colors.textButton }}>
              See Plans
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
