import { useState, useRef, type ReactNode } from 'react'
import { TextInput, View, Text, type TextInputProps } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightElement?: ReactNode
  readOnly?: boolean
  inputRef?: React.RefObject<TextInput>
  onFocusScroll?: () => void
}

export function Input({ label, error, leftIcon, rightElement, readOnly, inputRef, onFocusScroll, ...props }: InputProps) {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const internalRef = useRef<TextInput>(null)
  const ref = inputRef ?? internalRef

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : `${colors.textMuted}40`

  return (
    <View className="mb-5">
      {label && (
        <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
          {label}
        </Text>
      )}
      <View
        style={{
          backgroundColor: colors.bgElevated,
          borderWidth: 1.5,
          borderColor,
          borderRadius: 14,
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
          ref={ref}
          {...props}
          style={[
            {
              flex: 1,
              paddingHorizontal: 14,
              paddingVertical: 15,
              fontSize: 16,
              color: readOnly ? colors.textMuted : colors.textPrimary,
              opacity: readOnly ? 0.75 : 1,
            },
            props.style,
          ]}
          placeholderTextColor={`${colors.textMuted}99`}
          underlineColorAndroid="transparent"
          editable={!readOnly}
          onFocus={(e) => {
            if (!readOnly) {
              setIsFocused(true)
              onFocusScroll?.()
            }
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
        />
        {rightElement && (
          <View style={{ paddingRight: 14 }}>
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
