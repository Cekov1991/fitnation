import { Text, type TextProps, type TextStyle } from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../../context/ThemeContext'

interface GradientTextProps extends TextProps {
  colors?: [string, string, ...string[]]
  /** Direction of the gradient; defaults to horizontal left→right like CSS `to right`. */
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  style?: TextStyle | TextStyle[]
}

/**
 * Renders text filled with a linear gradient — equivalent to the web's
 * `bg-clip-text text-transparent` pattern. Uses MaskedView to clip the
 * gradient to the glyph shapes.
 */
export function GradientText({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  children,
  ...textProps
}: GradientTextProps) {
  const theme = useTheme()
  const gradientColors = (colors ?? [theme.colors.primary, theme.colors.secondary]) as [
    string,
    string,
    ...string[],
  ]

  return (
    <MaskedView
      maskElement={
        <Text {...textProps} style={[style, { backgroundColor: 'transparent' }]}>
          {children}
        </Text>
      }
    >
      <LinearGradient colors={gradientColors} start={start} end={end}>
        <Text {...textProps} style={[style, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  )
}
