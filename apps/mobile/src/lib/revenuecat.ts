import Purchases, { LOG_LEVEL } from 'react-native-purchases'
import { Platform } from 'react-native'
import { Entitlement } from './entitlements'

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

/**
 * RevenueCat's identity, as the purchase flow reads it. Unlike
 * identifyRevenueCatUser, a failed log-in throws: the flow must know.
 */
export const revenueCatIdentity = {
  currentUserId: () => Purchases.getAppUserID(),
  logIn: async (userId: string) => {
    await Purchases.logIn(userId)
  },
}

/** Whether RevenueCat's customerInfo grants `app_access`. Throws when it can't be read. */
export const revenueCatGrantsAppAccess = async (): Promise<boolean> => {
  if (!configured) return false
  const info = await Purchases.getCustomerInfo()
  return Entitlement.AppAccess in info.entitlements.active
}
