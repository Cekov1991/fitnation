import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { OptionSheet } from '../ui/OptionSheet'

export interface FilterSelectOption {
  value: string
  label: string
}

interface FilterSelectProps {
  /** Small uppercase caption above the value: "Muscle", "Equipment". */
  label: string
  options: ReadonlyArray<FilterSelectOption>
  /** The chosen option's value, or null for All. */
  value: string | null
  onChange: (value: string | null) => void
  allLabel?: string
}

/** The OptionSheet needs a real value for "All"; no muscle id or equipment code looks like this. */
const ALL = '__all__'

/**
 * One filter as a labelled dropdown: a surface card with the caption, the
 * current value and a chevron. Filled with the brand colour while a value other
 * than All is chosen. Tapping opens an OptionSheet with All plus the options and
 * a check on the current one — the same picker the Customize Plan sheet uses.
 */
export function FilterSelect({ label, options, value, onChange, allLabel = 'All' }: FilterSelectProps) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)

  const active = value != null
  // A preselected value (swap flow) can arrive before the taxonomy has loaded.
  const displayLabel = active ? options.find((o) => o.value === value)?.label ?? '…' : allLabel

  const sheetOptions = [{ value: ALL, label: allLabel }, ...options]

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayLabel}`}
        accessibilityHint="Opens the filter options"
        style={[styles.trigger, { backgroundColor: active ? colors.primary : colors.bgSurface }]}
      >
        <View style={styles.textCol}>
          <Text
            style={[styles.label, { color: active ? withAlpha(colors.textButton, 0.8) : colors.textMuted }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text
            style={[styles.value, { color: active ? colors.textButton : colors.textPrimary }]}
            numberOfLines={1}
          >
            {displayLabel}
          </Text>
        </View>
        <ChevronDown size={16} color={active ? colors.textButton : colors.textSecondary} />
      </TouchableOpacity>

      <OptionSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        options={sheetOptions}
        selected={value ?? ALL}
        onSelect={(picked) => onChange(picked === ALL ? null : picked)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  textCol: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  value: { fontSize: 16, fontWeight: '600' },
})
