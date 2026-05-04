import { View, Text } from 'react-native'

export function Placeholder({ name }: { name: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-[#0F0F0F]">
      <Text className="text-white text-xl font-bold">{name}</Text>
      <Text className="text-gray-400 text-sm mt-2">Coming soon</Text>
    </View>
  )
}
