import { useRef } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Minus, Plus } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface StepperProps {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}

export function Stepper({ label, value, onChange, min = 0, max = 999, step = 1 }: StepperProps) {
  const { colors } = useTheme()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clamp(v: number) {
    return Math.min(max, Math.max(min, v))
  }

  function stopRepeating() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function startRepeating(direction: 1 | -1) {
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        onChange(clamp(value + direction * step))
        Haptics.selectionAsync()
      }, 80)
    }, 400)
  }

  function handlePress(direction: 1 | -1) {
    const next = clamp(value + direction * step)
    onChange(next)
    Haptics.selectionAsync()
  }

  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{ fontSize: 11, fontWeight: '600', marginBottom: 8, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 14,
          paddingHorizontal: 4,
          paddingVertical: 10,
          backgroundColor: colors.bgElevated,
        }}
      >
        <TouchableOpacity
          onPress={() => handlePress(-1)}
          onPressIn={() => startRepeating(-1)}
          onPressOut={stopRepeating}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
          style={{ padding: 6 }}
        >
          <Minus size={16} color={value <= min ? colors.textMuted : colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, minWidth: 36, textAlign: 'center' }}>
          {step < 1 && !Number.isInteger(value) ? value.toFixed(1) : String(value)}
        </Text>
        <TouchableOpacity
          onPress={() => handlePress(1)}
          onPressIn={() => startRepeating(1)}
          onPressOut={stopRepeating}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          style={{ padding: 6 }}
        >
          <Plus size={16} color={value >= max ? colors.textMuted : colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
