import { useCallback, useEffect, useRef } from 'react'
import { AppState, AppStateStatus, Text, TextInput, View, TouchableOpacity } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import {
  createAnimatedComponent,
  useAnimatedProps,
  useAnimatedReaction,
  useFrameCallback,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Timer, X } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface RestTimerProps {
  seconds: number
  onComplete: () => void
  onSkip: () => void
  // ±15 s: called with the new remaining seconds so the OS-side alert
  // (lib/restTimerAlert) can be moved to match.
  onAdjust?: (remaining: number) => void
}

const SIZE = 48
const STROKE = 3
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const AnimatedCircle = createAnimatedComponent(Circle)
const AnimatedTextInput = createAnimatedComponent(TextInput)

function formatTime(s: number) {
  'worklet'
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m}:${String(sec).padStart(2, '0')}`
  return `${sec}s`
}

export function RestTimer({ seconds, onComplete, onSkip, onAdjust }: RestTimerProps) {
  const { colors } = useTheme()
  const onAdjustRef = useRef(onAdjust)
  onAdjustRef.current = onAdjust

  // SharedValues — safe to write from both JS thread and UI-thread worklet
  const endTimeSV = useSharedValue(Date.now() + seconds * 1000)
  const remainingSV = useSharedValue(seconds)
  const totalSV = useSharedValue(seconds)
  // Incremented by the worklet to signal completion; picked up by useAnimatedReaction
  const completionCountSV = useSharedValue(0)

  // Reset when the `seconds` prop changes (new timer started)
  useEffect(() => {
    endTimeSV.value = Date.now() + seconds * 1000
    remainingSV.value = seconds
    totalSV.value = seconds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds])

  // AppState: if the app was backgrounded and the timer expired, fire completion directly
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        const rem = Math.ceil((endTimeSV.value - Date.now()) / 1000)
        if (rem <= 0) {
          onComplete()
        } else {
          remainingSV.value = rem
        }
      }
    })
    return () => sub.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // UI-thread frame callback — drives tick with no React setState
  useFrameCallback(() => {
    const rem = Math.ceil((endTimeSV.value - Date.now()) / 1000)
    if (rem <= 0) {
      if (remainingSV.value > 0) {
        remainingSV.value = 0
        completionCountSV.value += 1
      }
    } else {
      remainingSV.value = rem
    }
  })

  // Bridge from UI thread signal → JS onComplete callback.
  // useAnimatedReaction accepts deps and re-captures onComplete whenever it changes.
  useAnimatedReaction(
    () => completionCountSV.value,
    (val, prev) => {
      if (prev !== null && val > prev) {
        runOnJS(onComplete)()
      }
    },
    [onComplete]
  )

  // SVG ring progress
  const circleAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset:
      CIRCUMFERENCE * (1 - (totalSV.value > 0 ? remainingSV.value / totalSV.value : 0)),
  }))

  // Countdown text
  const countdownAnimatedProps = useAnimatedProps(
    () => ({ text: formatTime(remainingSV.value) } as any),
    []
  )

  const notifyAdjust = useCallback(() => {
    onAdjustRef.current?.(Math.max(0, Math.ceil((endTimeSV.value - Date.now()) / 1000)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addTime = useCallback((extra: number) => {
    endTimeSV.value = endTimeSV.value + extra * 1000
    remainingSV.value = remainingSV.value + extra
    totalSV.value = totalSV.value + extra
    notifyAdjust()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subTime = useCallback((extra: number) => {
    endTimeSV.value = endTimeSV.value - extra * 1000
    remainingSV.value = Math.max(1, remainingSV.value - extra)
    notifyAdjust()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        marginHorizontal: 20,
        borderRadius: 18,
        padding: 14,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {/* SVG progress ring */}
          <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <Svg
              width={SIZE}
              height={SIZE}
              style={{ transform: [{ rotate: '-90deg' }], position: 'absolute' }}
            >
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={`${colors.textButton}40`}
                strokeWidth={STROKE}
                fill="none"
              />
              <AnimatedCircle
                animatedProps={circleAnimatedProps}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={colors.textButton}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeLinecap="round"
              />
            </Svg>
            <Timer size={20} color={colors.textButton} />
          </View>

          {/* Label + countdown */}
          <View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: `${colors.textButton}BF`,
                letterSpacing: 1.2,
              }}
            >
              REST TIMER
            </Text>
            <AnimatedTextInput
              animatedProps={countdownAnimatedProps}
              editable={false}
              underlineColorAndroid="transparent"
              defaultValue={formatTime(seconds)}
              style={{
                fontSize: 26,
                fontWeight: '700',
                color: colors.textButton,
                letterSpacing: 1,
                padding: 0,
                margin: 0,
              }}
            />
          </View>
        </View>

        {/* Controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            onPress={() => subTime(15)}
            activeOpacity={0.75}
            style={{
              paddingHorizontal: 10,
              height: 32,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${colors.textButton}2E`,
            }}
          >
            <Text style={{ color: colors.textButton, fontSize: 11, fontWeight: '700' }}>-15s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => addTime(15)}
            activeOpacity={0.75}
            style={{
              paddingHorizontal: 10,
              height: 32,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${colors.textButton}2E`,
            }}
          >
            <Text style={{ color: colors.textButton, fontSize: 11, fontWeight: '700' }}>+15s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSkip}
            activeOpacity={0.75}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${colors.textButton}2E`,
              marginLeft: 4,
            }}
          >
            <X size={16} color={colors.textButton} />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )
}
