import { NavigationContainer, DarkTheme, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View, Image, useColorScheme } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import * as SplashScreen from 'expo-splash-screen'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { AuthNavigator } from './AuthNavigator'
import { AppNavigator } from './AppNavigator'
import { EntitlementWatcher } from './EntitlementWatcher'
import type { AppStackParamList } from './types'

// Keep in sync with the `imageWidth` of the expo-splash-screen plugin in app.json —
// the native splash hands off to this overlay, so at rest they must render identically.
const SPLASH_LOGO_SIZE = 200
const EXIT_DURATION = 300
const EXIT_SCALE = 1.08

export function RootNavigator() {
  const { user, isLoading } = useAuth()
  const { colors } = useTheme()
  const scheme = useColorScheme()
  const navRef = useNavigationContainerRef<AppStackParamList>()

  const [showOverlay, setShowOverlay] = useState(true)
  // 0 = at rest, pixel-identical to the native splash. 1 = fully exited.
  const progress = useSharedValue(0)

  // Tear down the native splash only once the overlay has been laid out. At
  // progress 0 the overlay matches it exactly, so the swap is invisible.
  const onLayout = useCallback(async () => {
    try {
      await SplashScreen.hideAsync()
    } catch {
      // Already hidden, or the module is unavailable — nothing to recover from.
    }
  }, [])

  // Auth has resolved, so the navigator below is mounted and laid out. Grow the
  // logo slightly and fade the overlay out to reveal it.
  useEffect(() => {
    if (isLoading || !showOverlay) return
    progress.value = withTiming(
      1,
      { duration: EXIT_DURATION, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) scheduleOnRN(setShowOverlay, false)
      }
    )
  }, [isLoading, showOverlay, progress])

  const overlayStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }))
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * (EXIT_SCALE - 1) }],
  }))

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      {/* Mounted only once auth resolves — rendering it earlier would flash the
          auth stack at users who turn out to be logged in. */}
      {!isLoading && (
        <NavigationContainer ref={navRef} theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          {user ? (
            <>
              <AppNavigator />
              <EntitlementWatcher navRef={navRef} />
            </>
          ) : (
            <AuthNavigator />
          )}
        </NavigationContainer>
      )}

      {showOverlay && (
        <Animated.View
          onLayout={onLayout}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgBase },
            overlayStyle,
          ]}
        >
          <Animated.View style={logoStyle}>
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: SPLASH_LOGO_SIZE, height: SPLASH_LOGO_SIZE }}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  )
}
