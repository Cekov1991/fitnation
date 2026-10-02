import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import { SCREEN } from '../../constants/layout'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { STORE_NAME, SubscriptionCard } from '../../components/profile/SubscriptionCard'
import { subscriptionCopy, subscriptionIntro } from '../../components/profile'
import { Entitlement, useEntitlements } from '../../hooks/useEntitlements'
import type { AppScreenProps } from '../../navigation/types'

/**
 * Account → Subscription: the plan that grants access today and the one way
 * to change or cancel it, the store's subscription page. Subscribing itself
 * stays one tap away on the Profile tab; this page is where a plan is managed.
 */
export function SubscriptionScreen({ navigation }: AppScreenProps<'Subscription'>) {
  const { colors } = useTheme()
  const { subscription, has } = useEntitlements()
  const intro = subscriptionIntro(subscriptionCopy(subscription, has(Entitlement.AppAccess)), STORE_NAME)

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bgBase }]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Subscription" subtitle="Your plan" onBack={() => navigation.goBack()} />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{intro}</Text>
        <SubscriptionCard onSeePlans={() => navigation.navigate('Paywall')} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottom },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
})
