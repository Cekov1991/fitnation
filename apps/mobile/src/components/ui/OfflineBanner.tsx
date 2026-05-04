import { Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetInfo } from '@react-native-community/netinfo'
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated'

export function OfflineBanner() {
  const netInfo = useNetInfo()
  const insets = useSafeAreaInsets()

  if (netInfo.isConnected !== false) return null

  return (
    <Animated.View
      entering={SlideInUp}
      exiting={SlideOutUp}
      style={{
        position: 'absolute',
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#EF4444',
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 13, textAlign: 'center', fontWeight: '500' }}>
        No internet connection
      </Text>
    </Animated.View>
  )
}
