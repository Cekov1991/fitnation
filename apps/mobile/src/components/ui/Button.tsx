import { TouchableOpacity, Text, ActivityIndicator, View, type TouchableOpacityProps } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useTheme } from '../../context/ThemeContext'

interface ButtonProps extends TouchableOpacityProps {
  label: string
  loading?: boolean
  variant?: 'primary' | 'ghost'
}

export function Button({ label, loading, variant = 'primary', style, ...props }: ButtonProps) {
  const { colors } = useTheme()
  const isPrimary = variant === 'primary'

  return (
    <TouchableOpacity
      style={[
        {
          borderRadius: 12,
          overflow: 'hidden',
          opacity: props.disabled ? 0.6 : 1,
          width: '100%',
        },
        style,
      ]}
      {...props}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{label}</Text>
          )}
        </LinearGradient>
      ) : (
        <View style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
            <ActivityIndicator color={colors.textSecondary} />
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
              {label}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}
