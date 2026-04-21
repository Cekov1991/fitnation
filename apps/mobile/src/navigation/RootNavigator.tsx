import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native'
import { View, ActivityIndicator, useColorScheme } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { AuthNavigator } from './AuthNavigator'
import { AppNavigator } from './AppNavigator'

export function RootNavigator() {
  const { user, isLoading } = useAuth()
  const scheme = useColorScheme()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F0F0F]">
        <ActivityIndicator color="#3B82F6" />
      </View>
    )
  }

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
