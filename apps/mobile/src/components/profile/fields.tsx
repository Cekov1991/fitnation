import type { ComponentProps } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import type { StyleProp, TextStyle } from 'react-native'
import { withAlpha, UNIT_OPTIONS } from '@fit-nation/shared'
import type { UnitSystem } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { RADIUS } from '../../constants/layout'

/**
 * The controls the profile sections are built from. Screens do not use these
 * directly — they render a section (GoalSection, AboutSection, …), which
 * arranges them. Kept in one file so the chip, the number box and the field
 * label are the same size on every page that asks a profile question.
 */

export function FieldLabel({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme()
  return <Text style={[styles.fieldLabel, { color: colors.textSecondary }, style]}>{children}</Text>
}

/** A field label with the chosen value echoed on the right, for chip rows. */
export function FieldHeader({ label, value }: { label: string; value: string | null }) {
  const { colors } = useTheme()
  return (
    <View style={styles.fieldHeader}>
      <FieldLabel>{label}</FieldLabel>
      {value && <Text style={[styles.fieldValue, { color: colors.primary }]}>{value}</Text>}
    </View>
  )
}

export function FieldError({ message }: { message?: string }) {
  const { colors } = useTheme()
  if (!message) return null
  return <Text style={[styles.fieldError, { color: colors.error }]}>{message}</Text>
}

interface NumberFieldProps extends ComponentProps<typeof TextInput> {
  label: string
  suffix?: string
  error?: string
}

/** A short numeric input with a unit suffix; three of these share a row. */
export function NumberField({ label, suffix, error, ...input }: NumberFieldProps) {
  const { colors } = useTheme()
  return (
    <View style={styles.numberField}>
      <FieldLabel style={{ marginBottom: 8 }}>{label}</FieldLabel>
      <View style={[styles.numberBox, { backgroundColor: colors.bgSurface }, !!error && { borderWidth: 1, borderColor: colors.error }]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={[styles.numberInput, { color: colors.textPrimary }]}
        />
        {suffix && <Text style={[styles.numberSuffix, { color: colors.textMuted }]}>{suffix}</Text>}
      </View>
      <FieldError message={error} />
    </View>
  )
}

interface TextFieldProps extends ComponentProps<typeof TextInput> {
  label: string
  error?: string
}

/** A full-width text input (name, email) in the same box as NumberField. */
export function TextField({ label, error, ...input }: TextFieldProps) {
  const { colors } = useTheme()
  return (
    <View style={styles.textField}>
      <FieldLabel style={{ marginBottom: 8 }}>{label}</FieldLabel>
      <View style={[styles.numberBox, { backgroundColor: colors.bgSurface }, !!error && { borderWidth: 1, borderColor: colors.error }]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={[styles.textInput, { color: colors.textPrimary }]}
        />
      </View>
      <FieldError message={error} />
    </View>
  )
}

interface ChipProps {
  label: string
  selected: boolean
  onPress: () => void
  /** lg: one of 2–3 wide options; sm: one of 4–5 with short labels; sq: a single digit. */
  size: 'sm' | 'lg' | 'sq'
}

/** A single-choice chip; a row of them is a radio group. */
export function Chip({ label, selected, onPress, size }: ChipProps) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.chip, size === 'sq' && styles.chipSquare, { backgroundColor: selected ? colors.primary : colors.bgSurface }]}
    >
      <Text style={[size === 'sm' ? styles.chipTextSm : styles.chipText, { color: selected ? colors.textButton : colors.textPrimary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

/** The metric / imperial segment. Sits on one line with its label. */
export function UnitSwitch({ value, onChange }: { value: UnitSystem; onChange: (v: UnitSystem) => void }) {
  const { colors } = useTheme()
  return (
    <View style={styles.unitsRow}>
      <FieldLabel>Units</FieldLabel>
      <View style={[styles.unitTrack, { backgroundColor: withAlpha(colors.textMuted, 0.18) }]}>
        {UNIT_OPTIONS.map((option) => {
          const selected = value === option.value
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.unitSeg, selected && { backgroundColor: colors.bgSurface }]}
            >
              <Text style={[styles.unitSegText, { color: selected ? colors.textPrimary : colors.textMuted }]}>{option.hint}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export const fieldStyles = StyleSheet.create({
  chipRow: { flexDirection: 'row', gap: 10 },
  numberRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
})

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  fieldValue: { fontSize: 13, fontWeight: '700' },
  fieldError: { fontSize: 12, marginTop: 6 },

  numberField: { flex: 1, minWidth: 0 },
  textField: { marginBottom: 16 },
  numberBox: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 52, paddingHorizontal: 14, borderRadius: 14 },
  numberInput: { flex: 1, minWidth: 0, fontSize: 18, fontWeight: '700', padding: 0 },
  textInput: { flex: 1, minWidth: 0, fontSize: 16, padding: 0 },
  numberSuffix: { fontSize: 13 },

  chip: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 14 },
  chipSquare: { height: 44, borderRadius: RADIUS.control },
  chipText: { fontSize: 15, fontWeight: '600' },
  chipTextSm: { fontSize: 13, fontWeight: '600' },

  unitsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  unitTrack: { flexDirection: 'row', padding: 3, borderRadius: RADIUS.control },
  unitSeg: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9 },
  unitSegText: { fontSize: 13, fontWeight: '700' },
})
