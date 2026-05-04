import { View, Text, TouchableOpacity } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  const { colors } = useTheme()
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <AlertCircle size={48} color={colors.error} />
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          marginTop: 16,
          textAlign: 'center',
          color: colors.textPrimary,
        }}
      >
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={{
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: colors.primary,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
