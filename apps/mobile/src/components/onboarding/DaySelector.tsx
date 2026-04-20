import { View, TouchableOpacity, Text } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface DaySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function DaySelector({ value, onChange, min = 1, max = 7 }: DaySelectorProps) {
  const { colors } = useTheme()
  const days = Array.from({ length: max - min + 1 }, (_, i) => i + min)

  return (
    <View className="flex-row gap-2 justify-center flex-wrap">
      {days.map(day => (
        <TouchableOpacity
          key={day}
          onPress={() => onChange(day)}
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{
            backgroundColor: value === day ? colors.primary : colors.bgSurface,
          }}
        >
          <Text
            className="text-base font-bold"
            style={{ color: value === day ? '#fff' : colors.textSecondary }}
          >
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
