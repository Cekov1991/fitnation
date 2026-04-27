import { TextInput } from 'react-native'
import {
  createAnimatedComponent,
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated'

const AnimatedTextInput = createAnimatedComponent(TextInput)

function formatElapsed(seconds: number): string {
  'worklet'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface SessionClockProps {
  elapsedSV: SharedValue<number>
  color: string
  fontSize?: number
  fontWeight?: string
}

export function SessionClock({ elapsedSV, color, fontSize = 14, fontWeight = '500' }: SessionClockProps) {
  const animatedProps = useAnimatedProps(
    () => ({ text: formatElapsed(elapsedSV.value) } as any),
    []
  )

  return (
    <AnimatedTextInput
      animatedProps={animatedProps}
      editable={false}
      underlineColorAndroid="transparent"
      defaultValue={formatElapsed(0)}
      style={{ color, fontSize, fontWeight: fontWeight as any, padding: 0, margin: 0 }}
    />
  )
}
