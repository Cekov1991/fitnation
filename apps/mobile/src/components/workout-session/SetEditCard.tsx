import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { WeightUnit } from '@fit-nation/shared'
import { formatWeight, sanitizeDecimalText, withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../ui/Button'
import { StepperField, DEFAULT_WEIGHT_STEP } from './StepperField'

interface SetEditCardProps {
  setNumber: number
  /** The logged values as strings; editing starts from them, so never empty. */
  weight: string
  reps: string
  onWeightChange: (v: string) => void
  onRepsChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  allowWeightLogging: boolean
  /** One tap on − / + moves the weight by this much (the equipment step). */
  weightStep?: number | null
  /** Required so a missed call site is a compile error. */
  weightUnit: WeightUnit
}

export function SetEditCard({
  setNumber,
  weight,
  reps,
  onWeightChange,
  onRepsChange,
  onSave,
  onCancel,
  allowWeightLogging,
  weightStep,
  weightUnit,
}: SetEditCardProps) {
  const { colors } = useTheme()

  const step = weightStep && weightStep > 0 ? weightStep : DEFAULT_WEIGHT_STEP
  const bumpWeight = (dir: 1 | -1) => {
    const current = parseFloat(weight)
    const base = isNaN(current) ? 0 : current
    onWeightChange(formatWeight(Math.max(0, +(base + dir * step).toFixed(2))))
  }
  const bumpReps = (dir: 1 | -1) => {
    const current = parseInt(reps, 10)
    const base = isNaN(current) ? 0 : current
    onRepsChange(String(Math.max(1, base + dir)))
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 24,
        padding: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: withAlpha(colors.textButton, 0.902),
          marginBottom: 16,
        }}
      >
        Edit Set {setNumber}
      </Text>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        {allowWeightLogging && (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: withAlpha(colors.textButton, 0.902),
                marginBottom: 8,
              }}
            >
              Weight · ±{formatWeight(step)}
            </Text>
            <StepperField
              value={weight}
              onChangeText={(t) => onWeightChange(sanitizeDecimalText(t))}
              onStep={bumpWeight}
              unit={weightUnit}
              keyboardType="decimal-pad"
            />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: withAlpha(colors.textButton, 0.902),
              marginBottom: 8,
            }}
          >
            Reps
          </Text>
          <StepperField
            value={reps}
            onChangeText={onRepsChange}
            onStep={bumpReps}
            unit="reps"
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Button variant="onBrandGhost" label="Cancel" onPress={onCancel} style={{ flex: 1 }} />
        <Button variant="onBrand" label="Save" onPress={onSave} style={{ flex: 1 }} />
      </View>
    </LinearGradient>
  )
}
