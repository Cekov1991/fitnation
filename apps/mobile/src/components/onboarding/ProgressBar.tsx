import { View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const { colors } = useTheme()
  const progress = current / total

  return (
    <View className="h-1 w-full rounded-full" style={{ backgroundColor: colors.bgElevated }}>
      <View
        className="h-1 rounded-full"
        style={{
          width: `${progress * 100}%`,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  )
}
