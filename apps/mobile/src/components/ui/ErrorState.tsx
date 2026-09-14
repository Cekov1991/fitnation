import { StyleSheet, Text, View } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { Button } from './Button'

/**
 * A load that failed, with the one way to retry. Fills the space below the
 * screen header. Screens do not draw their own "Retry" button;
 * `ui-standards.test.ts` fails on one.
 */
interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  const { colors } = useTheme()
  return (
    <View style={styles.page}>
      <AlertCircle size={40} color={colors.error} />
      <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
      {onRetry && <Button label="Try Again" size="sm" onPress={onRetry} style={styles.action} />}
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  message: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  action: { alignSelf: 'center', marginTop: 16, minWidth: 160 },
})
