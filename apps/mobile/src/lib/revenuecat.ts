import Purchases, { LOG_LEVEL } from 'react-native-purchases'
import { Platform } from 'react-native'

let configured = false

export const configureRevenueCat = () => {
  const apiKey = Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_RC_API_KEY_IOS
    : process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID

  if (!apiKey) {
    // A build without RC keys (e.g. local dev before the dashboard keys are
    // wired into EAS) must degrade to a build without purchases — never crash
    // at boot. The paywall shows its error state; access still comes from the
    // backend entitlements.
    console.warn('[RC] No RevenueCat API key for this platform — purchases disabled')
    return
  }

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN)
    Purchases.configure({ apiKey })
    configured = true
  } catch (e) {
    console.warn('[RC] configure failed — purchases disabled', e)
  }
}

export const isRevenueCatConfigured = () => configured

export const identifyRevenueCatUser = async (userId: string) => {
  if (!configured) return
  try {
    await Purchases.logIn(userId)
  } catch (e) {
    console.warn('[RC] identifyUser failed', e)
  }
}

export const logOutRevenueCat = async () => {
  if (!configured) return
  try {
    await Purchases.logOut()
  } catch (e) {
    console.warn('[RC] logOut failed', e)
  }
}
