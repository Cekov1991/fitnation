import { Linking, Platform, StyleSheet, Text, View } from 'react-native'
import { CreditCard, ExternalLink, Sparkles } from 'lucide-react-native'
import { formatDate, withAlpha } from '@fit-nation/shared'
import type { SubscriptionResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../ui/Card'
import { Button, BUTTON, useButtonContentColor } from '../ui/Button'
import { RADIUS } from '../../constants/layout'
import { Entitlement, useEntitlements } from '../../hooks/useEntitlements'

/**
 * The Profile hub's subscription block: what grants access today (a plan, a
 * trial, the gym), when it renews or ends, and the one way to act on it —
 * the store's subscription page for a paid plan, the paywall when there is
 * no access. Reads entitlements itself; the screen only says where "See
 * Plans" goes.
 */
export const SUBSCRIPTION_CARD = { tile: 36, icon: 18 } as const

const STATUS_LABELS: Record<NonNullable<SubscriptionResource['status']>, string> = {
  active: 'Active',
  billing_issue: 'Payment failed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  paused: 'Paused',
}

const STORE_SUBSCRIPTIONS_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions'

interface SubscriptionCardProps {
  /** Opens the paywall. Shown only when the user has no app access. */
  onSeePlans?: () => void
}

export function SubscriptionCard({ onSeePlans }: SubscriptionCardProps) {
  const { colors } = useTheme()
  const secondaryContent = useButtonContentColor('secondary')
  const { subscription, has } = useEntitlements()
  const hasAccess = has(Entitlement.AppAccess)
  const isSponsored = subscription?.is_sponsored_by_gym ?? false
  const status = subscription?.status ?? null

  const title = isSponsored
    ? 'Gym-sponsored access'
    : subscription?.is_trial
      ? 'Free trial'
      : status
        ? 'Premium subscription'
        : 'No active plan'

  const summary = isSponsored
    ? 'Provided through your gym.'
    : status
      ? [
          STATUS_LABELS[status],
          subscription?.expires_at
            ? `${status === 'cancelled' || status === 'expired' ? 'Access until' : 'Renews'} ${formatDate(subscription.expires_at, 'long')}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : hasAccess
        ? 'Included for now.'
        : 'Subscribe to unlock workouts, plans and progress tracking.'

  const Icon = isSponsored ? Sparkles : CreditCard

  return (
    <Card style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={[styles.tile, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
          <Icon size={SUBSCRIPTION_CARD.icon} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.summary, { color: colors.textMuted }]}>{summary}</Text>
        </View>
      </View>

      {status && !isSponsored && (
        <Button
          variant="secondary"
          size="sm"
          label="Manage Subscription"
          iconRight={<ExternalLink size={BUTTON.sm.icon} color={secondaryContent} />}
          onPress={() => Linking.openURL(STORE_SUBSCRIPTIONS_URL)}
          style={styles.action}
        />
      )}
      {!hasAccess && onSeePlans && (
        <Button size="sm" label="See Plans" onPress={onSeePlans} style={styles.action} />
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: {
    width: SUBSCRIPTION_CARD.tile,
    height: SUBSCRIPTION_CARD.tile,
    borderRadius: RADIUS.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '500' },
  summary: { fontSize: 12, marginTop: 2 },
  action: { marginTop: 12 },
})
