import './global.css'
import { useEffect } from 'react'
import { Alert } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Updates from 'expo-updates'
import { initApi } from '@fit-nation/shared'
import { ThemeProvider } from './src/context/ThemeContext'
import { AuthProvider } from './src/context/AuthContext'
import { RootNavigator } from './src/navigation/RootNavigator'
import { OfflineBanner } from './src/components/ui/OfflineBanner'
import { ErrorBoundary } from './src/components/ui/error-boundary'

// Initialise API
initApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api',
})

const queryClient = new QueryClient()

function useOTAUpdates() {
  useEffect(() => {
    if (__DEV__) return
    async function check() {
      try {
        const result = await Updates.checkForUpdateAsync()
        if (!result.isAvailable) return
        await Updates.fetchUpdateAsync()
        Alert.alert(
          'Update Ready',
          'A new version of Fit Nation has been downloaded. Restart to apply it.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Restart Now', onPress: () => Updates.reloadAsync() },
          ]
        )
      } catch (e) {
        console.warn('[OTA]', e)
      }
    }
    check()
  }, [])
}

export default function App() {
  useOTAUpdates()

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AuthProvider>
                <OfflineBanner />
                <RootNavigator />
              </AuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
