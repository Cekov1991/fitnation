import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { WeightUnit } from '@fit-nation/shared'
import { sanitizeDecimalText, withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../ui/Button'

interface SetEditCardProps {
  setNumber: number
  weight: string
  reps: string
  onWeightChange: (v: string) => void
  onRepsChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  allowWeightLogging: boolean
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
  weightUnit,
}: SetEditCardProps) {
  const { colors } = useTheme()

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
              Weight
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: withAlpha(colors.textButton, 0.122),
                borderWidth: 2,
                borderColor: withAlpha(colors.textButton, 0.2),
              }}
            >
              <TextInput
                style={{ flex: 1, color: colors.textButton, fontSize: 18, fontWeight: '700', padding: 0 }}
                value={weight}
                // See SetLogCard: normalise the locale decimal separator.
                onChangeText={(t) => onWeightChange(sanitizeDecimalText(t))}
                keyboardType="decimal-pad"
                placeholderTextColor={withAlpha(colors.textButton, 0.502)}
              />
              <Text
                style={{
                  color: withAlpha(colors.textButton, 0.851),
                  fontSize: 13,
                  fontWeight: '600',
                  marginLeft: 4,
                }}
              >
                {weightUnit}
              </Text>
            </View>
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: withAlpha(colors.textButton, 0.122),
              borderWidth: 2,
              borderColor: withAlpha(colors.textButton, 0.2),
            }}
          >
            <TextInput
              style={{ flex: 1, color: colors.textButton, fontSize: 18, fontWeight: '700', padding: 0 }}
              value={reps}
              onChangeText={onRepsChange}
              keyboardType="number-pad"
              placeholderTextColor={withAlpha(colors.textButton, 0.502)}
            />
            <Text
              style={{
                color: withAlpha(colors.textButton, 0.851),
                fontSize: 13,
                fontWeight: '600',
                marginLeft: 4,
              }}
            >
              reps
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Button variant="onBrandGhost" label="Cancel" onPress={onCancel} style={{ flex: 1 }} />
        <Button variant="onBrand" label="Save" onPress={onSave} style={{ flex: 1 }} />
      </View>
    </LinearGradient>
  )
}
