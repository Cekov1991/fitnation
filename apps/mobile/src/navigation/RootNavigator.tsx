import { NavigationContainer, DarkTheme, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native'
import { View, ActivityIndicator, useColorScheme } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { AuthNavigator } from './AuthNavigator'
import { AppNavigator } from './AppNavigator'
import { EntitlementWatcher } from './EntitlementWatcher'
import type { AppStackParamList } from './types'

export function RootNavigator() {
  const { user, isLoading } = useAuth()
  const scheme = useColorScheme()
  const navRef = useNavigationContainerRef<AppStackParamList>()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F0F0F]">
        <ActivityIndicator color="#3B82F6" />
      </View>
    )
  }

  return (
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
  )
}
