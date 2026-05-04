import { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { ChevronDown, type LucideIcon } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { ActionSheet } from './ActionSheet'

export interface FilterChipOption<T> {
  label: string
  value: T
}

interface FilterChipProps<T> {
  /** Optional icon, rendered on the left of the label. */
  icon?: LucideIcon
  /** The label shown inside the chip. */
  label?: string
  /** Options shown in the action sheet. Omit for an icon-only button. */
  options?: Array<FilterChipOption<T>>
  onSelect?: (value: T) => void
  /** Handler used when the chip has no options (icon-only mode). */
  onPress?: () => void
  disabled?: boolean
  /** Title shown above the action sheet. */
  placeholder?: string
}

/**
 * Pill-shaped dropdown trigger that mirrors the web `<select>` controls on
 * the dashboard (rounded-xl, surface bg, border, chevron). Opens our themed
 * ActionSheet so behaviour and design match across iOS and Android.
 */
export function FilterChip<T extends string | number>({
  icon: Icon,
  label,
  options,
  onSelect,
  onPress,
  disabled,
  placeholder,
}: FilterChipProps<T>) {
  const { colors } = useTheme()
  const [sheetVisible, setSheetVisible] = useState(false)

  const handlePress = () => {
    if (disabled) return
    if (!options || options.length === 0) {
      onPress?.()
      return
    }
    setSheetVisible(true)
  }

  const sheetActions =
    options?.map((o) => ({
      label: o.label,
      onPress: () => onSelect?.(o.value),
    })) ?? []

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: colors.bgSurface,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {Icon && <Icon size={15} color={colors.textPrimary} />}
        {label !== undefined && (
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
            {label}
          </Text>
        )}
        {options && options.length > 0 && (
          <View style={{ marginLeft: 2 }}>
            <ChevronDown size={14} color={colors.textSecondary} />
          </View>
        )}
      </TouchableOpacity>

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={placeholder}
        actions={sheetActions}
      />
    </>
  )
}
