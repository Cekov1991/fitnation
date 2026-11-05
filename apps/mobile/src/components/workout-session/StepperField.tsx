import { useRef } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'

/**
 * The − / + value control on the gradient set cards (SetLogCard, SetEditCard).
 * The centre is a tappable input, so one-tap stepping and keyboard entry write
 * the same draft string; when the draft is empty the suggestion shows as a
 * placeholder.
 */
export const STEPPER_FIELD = { button: 38, buttonRadius: 9, icon: 18, value: 18, unit: 11 } as const

/** Fallback when the API sends no equipment step for the exercise. */
export const DEFAULT_WEIGHT_STEP = 2.5

interface StepperFieldProps {
  /** Draft value as a string; empty means "use the placeholder suggestion". */
  value: string
  onChangeText: (v: string) => void
  /** One tap on − / +; the owner computes the next value and writes the draft. */
  onStep: (dir: 1 | -1) => void
  /** Suffix inside the control: the weight unit, or "reps". */
  unit: string
  keyboardType: 'decimal-pad' | 'number-pad'
  placeholder?: string
}

export function StepperField({ value, onChangeText, onStep, unit, keyboardType, placeholder }: StepperFieldProps) {
  const { colors } = useTheme()
  const inputRef = useRef<TextInput>(null)

  const stepButton = (dir: 1 | -1, Icon: LucideIcon) => (
    <TouchableOpacity
      onPress={() => onStep(dir)}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={{
        width: STEPPER_FIELD.button,
        height: STEPPER_FIELD.button,
        borderRadius: STEPPER_FIELD.buttonRadius,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: withAlpha(colors.textButton, 0.18),
      }}
    >
      <Icon size={STEPPER_FIELD.icon} color={colors.textButton} strokeWidth={3} />
    </TouchableOpacity>
  )

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 5,
        gap: 4,
        backgroundColor: withAlpha(colors.textButton, 0.122),
        borderWidth: 2,
        borderColor: withAlpha(colors.textButton, 0.2),
      }}
    >
      {stepButton(-1, Minus)}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => inputRef.current?.focus()}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={withAlpha(colors.textButton, 0.702)}
          style={{
            color: colors.textButton,
            fontSize: STEPPER_FIELD.value,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
            padding: 0,
            minWidth: 16,
            textAlign: 'center',
          }}
        />
        <Text style={{ color: withAlpha(colors.textButton, 0.851), fontSize: STEPPER_FIELD.unit, fontWeight: '600' }}>
          {unit}
        </Text>
      </TouchableOpacity>
      {stepButton(1, Plus)}
    </View>
  )
}
