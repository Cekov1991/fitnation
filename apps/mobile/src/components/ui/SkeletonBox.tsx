import { type ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface SkeletonBoxProps {
  width?: number | string
  height?: number
  style?: ViewStyle
  className?: string
}

export function SkeletonBox({ width = '100%', height = 20, style, className }: SkeletonBoxProps) {
  const { colors } = useTheme()
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      className={`rounded-xl ${className || ''}`}
      style={[{ width, height, backgroundColor: colors.bgElevated }, animatedStyle, style]}
    />
  )
}
