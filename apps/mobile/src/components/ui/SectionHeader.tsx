import { View, Text, TouchableOpacity } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface SectionHeaderProps {
  title: string
  action?: { label: string; onPress: () => void }
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const { colors } = useTheme()
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
        {title}
      </Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text className="text-sm font-medium" style={{ color: colors.primary }}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
