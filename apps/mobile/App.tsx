import './global.css'
import { useEffect } from 'react'
import { Alert, AppState } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { MutationCache, QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import * as Updates from 'expo-updates'
import { initApi } from '@fit-nation/shared'

// Wire React Query's focusManager to AppState so all queries refetch on foreground
AppState.addEventListener('change', (state) => {
  focusManager.setFocused(state === 'active')
})
import { ThemeProvider } from './src/context/ThemeContext'
import { AuthProvider } from './src/context/AuthContext'
import { RootNavigator } from './src/navigation/RootNavigator'
import { OfflineBanner } from './src/components/ui/OfflineBanner'
import { ErrorBoundary } from './src/components/ui/error-boundary'
import { ToastHost } from './src/components/ui/ToastHost'
import { showToast } from './src/lib/toast'

// Initialise API
initApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api',
})

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Something went wrong'
      showToast(msg, 'error')
    },
  }),
})

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
                <ToastHost />
              </AuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
