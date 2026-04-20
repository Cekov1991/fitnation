import { useState, type ReactNode } from 'react'
import { TextInput, View, Text, type TextInputProps } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightElement?: ReactNode
  readOnly?: boolean
}

export function Input({ label, error, leftIcon, rightElement, readOnly, ...props }: InputProps) {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : 'transparent'

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
          {label}
        </Text>
      )}
      <View
        style={{
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {leftIcon && (
          <View style={{ paddingLeft: 16 }}>
            {leftIcon}
          </View>
        )}
        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            color: readOnly ? colors.textMuted : colors.textPrimary,
            opacity: readOnly ? 0.75 : 1,
          }}
          placeholderTextColor={colors.textMuted}
          editable={!readOnly}
          onFocus={(e) => {
            if (!readOnly) setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />
        {rightElement && (
          <View style={{ paddingRight: 16 }}>
            {rightElement}
          </View>
        )}
      </View>
      {error && (
        <Text className="text-xs mt-1" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
    </View>
  )
}
