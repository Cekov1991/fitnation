import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { useToasts, dismissToast, type Toast } from '../../lib/toast'

function ToastItem({ toast }: { toast: Toast }) {
  const { colors } = useTheme()
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [opacity])

  const bgColor =
    toast.kind === 'error'
      ? colors.error
      : toast.kind === 'success'
        ? colors.success
        : colors.warning

  return (
    <Animated.View style={[styles.item, { backgroundColor: bgColor, opacity }]}>
      <Text style={styles.message} numberOfLines={3}>
        {toast.message}
      </Text>
      <TouchableOpacity
        onPress={() => dismissToast(toast.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={16} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  )
}

export function ToastHost() {
  const toasts = useToasts()

  if (toasts.length === 0) return null

  return (
    <SafeAreaView
      edges={['top']}
      pointerEvents="box-none"
      style={styles.container}
    >
      <View pointerEvents="box-none" style={styles.stack}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  stack: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
})
