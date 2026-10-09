import { Linking, Platform, StyleSheet, Text, View } from 'react-native'
import { CreditCard, ExternalLink, Sparkles } from 'lucide-react-native'
import { withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../ui/Card'
import { Button, BUTTON, useButtonContentColor } from '../ui/Button'
import { RADIUS } from '../../constants/layout'
import { Entitlement, useEntitlements } from '../../hooks/useEntitlements'
import { subscriptionCopy } from './subscriptionCopy'

/**
 * The subscription block: what grants access today (a plan, Free Access, the
 * gym), when it renews or ends, and the way to act on it — the paywall when
 * there is no access, the store's subscription page for a paid plan. Reads
 * entitlements itself; the screen says where "See Plans" goes and whether
 * managing belongs here.
 */
export const SUBSCRIPTION_CARD = { tile: 36, icon: 18 } as const

const STORE_SUBSCRIPTIONS_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions'

/** The store that bills a plan on this platform, as a sentence names it. */
export const STORE_NAME = Platform.OS === 'ios' ? 'the App Store' : 'Google Play'

interface SubscriptionCardProps {
  /** Opens the paywall. Shown only when the user has no app access. */
  onSeePlans?: () => void
  /**
   * Offer "Manage Subscription" (the store page, where a plan is changed or
   * cancelled) when a paid plan exists. The Profile tab passes false: there
   * the card is the way in, and managing lives under Account → Subscription.
   */
  manage?: boolean
}

export function SubscriptionCard({ onSeePlans, manage = true }: SubscriptionCardProps) {
  const { colors } = useTheme()
  const secondaryContent = useButtonContentColor('secondary')
  const { subscription, has } = useEntitlements()
  const hasAccess = has(Entitlement.AppAccess)
  const copy = subscriptionCopy(subscription, hasAccess)
  const Icon = copy.isSponsored ? Sparkles : CreditCard
  // No card at all while subscriptions are not enforced (026).
  if (!copy.shown) return null

  return (
    <Card style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={[styles.tile, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
          <Icon size={SUBSCRIPTION_CARD.icon} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{copy.title}</Text>
          <Text style={[styles.summary, { color: colors.textMuted }]}>{copy.summary}</Text>
        </View>
      </View>

      {manage && copy.manageable && (
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
