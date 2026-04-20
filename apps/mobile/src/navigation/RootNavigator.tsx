import { NavigationContainer } from '@react-navigation/native'
import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { AuthNavigator } from './AuthNavigator'
import { AppNavigator } from './AppNavigator'

export function RootNavigator() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F0F0F]">
        <ActivityIndicator color="#3B82F6" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
