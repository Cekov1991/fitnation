import { TouchableOpacity, Text, View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import type React from 'react'

interface OptionCardProps {
  label: string
  description?: string
  selected: boolean
  onPress: () => void
  icon?: React.ReactNode
}

export function OptionCard({ label, description, selected, onPress, icon }: OptionCardProps) {
  const { colors } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-full p-4 rounded-xl flex-row items-center gap-4"
      style={{
        backgroundColor: selected ? `${colors.primary}1A` : colors.bgSurface,
        borderWidth: 2,
        borderColor: selected ? colors.primary : colors.bgElevated,
      }}
    >
      {icon && <View>{icon}</View>}
      <View className="flex-1">
        <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          {label}
        </Text>
        {description && (
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
            {description}
          </Text>
        )}
      </View>
      {/* Radio indicator */}
      <View
        className="w-5 h-5 rounded-full items-center justify-center"
        style={{ borderWidth: 2, borderColor: selected ? colors.primary : colors.bgElevated }}
      >
        {selected && (
          <View
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
        )}
      </View>
    </TouchableOpacity>
  )
}
