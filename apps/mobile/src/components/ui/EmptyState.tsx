import { View, Text, TouchableOpacity } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface EmptyStateAction {
  label: string
  onPress: () => void
}

interface EmptyStateProps {
  title: string
  description: string
  action?: EmptyStateAction
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const { colors } = useTheme()
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 8,
          color: colors.textPrimary,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
          color: colors.textSecondary,
        }}
      >
        {description}
      </Text>
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          style={{
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: colors.primary,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
