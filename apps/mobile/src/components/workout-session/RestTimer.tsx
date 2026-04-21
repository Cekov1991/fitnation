import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { Timer, X } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface RestTimerProps {
  seconds: number
  onComplete: () => void
  onSkip: () => void
}

const SIZE = 48
const STROKE = 3
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m}:${String(sec).padStart(2, '0')}`
  return `${sec}s`
}

export function RestTimer({ seconds, onComplete, onSkip }: RestTimerProps) {
  const { colors } = useTheme()
  const [remaining, setRemaining] = useState(seconds)
  const [total, setTotal] = useState(seconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setRemaining(seconds)
    setTotal(seconds)
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onComplete()
          return 0
        }
        return r - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds])

  const addTime = (extra: number) => {
    setRemaining(r => r + extra)
    setTotal(t => Math.max(t, remaining + extra))
  }
  const subTime = (extra: number) => {
    setRemaining(r => Math.max(1, r - extra))
  }

  const progress = total > 0 ? remaining / total : 0
  const offset = CIRCUMFERENCE * (1 - progress)

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
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
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={STROKE}
                fill="none"
              />
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke="#fff"
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </Svg>
            <Timer size={20} color="#fff" />
          </View>
          <View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: 'rgba(255,255,255,0.75)',
                letterSpacing: 1.2,
              }}
            >
              REST TIMER
            </Text>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '700',
                color: '#fff',
                letterSpacing: 1,
              }}
            >
              {formatTime(remaining)}
            </Text>
          </View>
        </View>

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
              backgroundColor: 'rgba(255,255,255,0.18)',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>-15s</Text>
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
              backgroundColor: 'rgba(255,255,255,0.18)',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>+15s</Text>
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
              backgroundColor: 'rgba(255,255,255,0.18)',
              marginLeft: 4,
            }}
          >
            <X size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )
}
