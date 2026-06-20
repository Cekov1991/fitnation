import Purchases, { LOG_LEVEL } from 'react-native-purchases'
import { Platform } from 'react-native'

export const configureRevenueCat = () => {
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN)
  Purchases.configure({
    apiKey: Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_RC_API_KEY_IOS!
      : process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID!,
  })
}

export const identifyRevenueCatUser = async (userId: string) => {
  try {
    await Purchases.logIn(userId)
  } catch (e) {
    console.warn('[RC] identifyUser failed', e)
  }
}

export const logOutRevenueCat = async () => {
  try {
    await Purchases.logOut()
  } catch (e) {
    console.warn('[RC] logOut failed', e)
  }
}
