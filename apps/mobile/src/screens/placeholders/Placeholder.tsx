import { View, Text } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

export function Placeholder({ name }: { name: string }) {
  const { colors } = useTheme()
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
      <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>{name}</Text>
      <Text className="text-sm mt-2" style={{ color: colors.textMuted }}>Coming soon</Text>
    </View>
  )
}
