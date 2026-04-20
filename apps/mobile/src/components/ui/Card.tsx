import { View, type ViewProps } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

export function Card({ children, style, ...props }: ViewProps) {
  const { colors } = useTheme()
  return (
    <View
      className="rounded-2xl p-5 mb-4"
      style={[{ backgroundColor: colors.bgSurface }, style]}
      {...props}
    >
      {children}
    </View>
  )
}
