import { NavigationContainer, DarkTheme, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View, useColorScheme } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import * as SplashScreen from 'expo-splash-screen'
import LottieView from 'lottie-react-native'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { AuthNavigator } from './AuthNavigator'
import { AppNavigator } from './AppNavigator'
import { linking } from './linking'
import { EntitlementWatcher } from './EntitlementWatcher'
import type { AppStackParamList } from './types'

// The native splash is background-colour only (a transparent image in app.json —
// its backgroundColor must stay equal to bgBase in both themes). The Lottie's first
// frame is also blank, so the native→JS handoff swaps two plain surfaces.
// The logo fills the 512px composition edge to edge, so this is the logo's visual
// size. Deliberately larger than the 200px static splash used to be — chosen on
// device. JS-only, so it tunes over OTA without a native build.
const SPLASH_ANIMATION_SIZE = 284
const EXIT_DURATION = 300
const EXIT_SCALE = 1.08
// Lottie is 132 frames @ 60fps ≈ 2.2s. If onAnimationFinish never fires (e.g. the
// view was never driven), this timer marks it done so the exit can't be blocked.
const ANIMATION_FAILSAFE_MS = 3000

export function RootNavigator() {
  const { user, isLoading } = useAuth()
  const { colors } = useTheme()
  const scheme = useColorScheme()
  const navRef = useNavigationContainerRef<AppStackParamList>()

  const [showOverlay, setShowOverlay] = useState(true)
  const [animationDone, setAnimationDone] = useState(false)
  // 0 = at rest (opaque, over the app). 1 = fully exited.
  const progress = useSharedValue(0)

  // Tear down the native splash only once the overlay has been laid out. The
  // overlay's blank background matches the blank native splash, so the swap is
  // invisible, and the Lottie assembles the logo from there.
  const onLayout = useCallback(async () => {
    try {
      await SplashScreen.hideAsync()
    } catch {
      // Already hidden, or the module is unavailable — nothing to recover from.
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setAnimationDone(true), ANIMATION_FAILSAFE_MS)
    return () => clearTimeout(t)
  }, [])

  // Auth has resolved and the assemble animation has finished (the Lottie holds
  // its last frame — the logo at rest), so the navigator below is mounted and
  // laid out. Grow the logo slightly and fade the overlay out to reveal it.
  useEffect(() => {
    if (isLoading || !animationDone || !showOverlay) return
    progress.value = withTiming(
      1,
      { duration: EXIT_DURATION, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) scheduleOnRN(setShowOverlay, false)
      }
    )
  }, [isLoading, animationDone, showOverlay, progress])

  const overlayStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }))
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * (EXIT_SCALE - 1) }],
  }))

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      {/* Mounted only once auth resolves — rendering it earlier would flash the
          auth stack at users who turn out to be logged in. */}
      {!isLoading && (
        <NavigationContainer ref={navRef} linking={linking} theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          {user ? (
            <>
              <AppNavigator launchReady={!showOverlay} />
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
            <LottieView
              source={require('../../assets/splash-staged.json')}
              autoPlay
              loop={false}
              onAnimationFinish={(isCancelled) => {
                if (!isCancelled) setAnimationDone(true)
              }}
              style={{ width: SPLASH_ANIMATION_SIZE, height: SPLASH_ANIMATION_SIZE }}
            />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  )
}
