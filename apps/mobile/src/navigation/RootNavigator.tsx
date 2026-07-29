import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native'
import { View, Image, useColorScheme } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { AuthNavigator } from './AuthNavigator'
import { AppNavigator } from './AppNavigator'

// Keep in sync with the `imageWidth` of the expo-splash-screen plugin in app.json —
// the native splash hands off to this view, so they must render identically.
const SPLASH_LOGO_SIZE = 200

export function RootNavigator() {
  const { user, isLoading } = useAuth()
  const { colors } = useTheme()
  const scheme = useColorScheme()

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgBase }}>
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: SPLASH_LOGO_SIZE, height: SPLASH_LOGO_SIZE }}
          resizeMode="contain"
        />
      </View>
    )
  }

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
