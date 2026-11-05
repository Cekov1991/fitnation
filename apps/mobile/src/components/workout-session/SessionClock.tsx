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
      // A TextInput's width is measured once from its initial text and never
      // re-measured when the UI-thread worklet swaps the text in, so a wider
      // time ("05:03", later "1:05:03") gets ellipsized. Tabular digits keep
      // every tick the same width, and the minWidth reserves room up to
      // h:mm:ss so the hour transition cannot truncate either.
      style={{
        color,
        fontSize,
        fontWeight: fontWeight as any,
        padding: 0,
        margin: 0,
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        minWidth: fontSize * 4.3,
      }}
    />
  )
}
