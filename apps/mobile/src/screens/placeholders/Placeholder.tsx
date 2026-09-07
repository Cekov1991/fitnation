import { View, Text } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

export function Placeholder({ name }: { name: string }) {
  const { colors } = useTheme()
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
      <Text className="text-white text-xl font-bold">{name}</Text>
      <Text className="text-gray-400 text-sm mt-2">Coming soon</Text>
    </View>
  )
}
