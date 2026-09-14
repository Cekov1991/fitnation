import type { ReactNode } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { TouchableOpacityProps } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { RADIUS } from '../../constants/layout'

/**
 * The one button.
 *
 * Every tappable pill of text in the app is this component. Screens do not
 * draw a TouchableOpacity with padding and a coloured background — that is
 * how the app ended up with rounded-xl and rounded-2xl CTAs side by side and
 * three different "Start Workout"s. The sizes are pinned in BUTTON and the
 * looks in `variant`; `ui-standards.test.ts` fails on a hand-rolled copy.
 *
 * Variants
 * - primary      brand gradient, the screen's main action ("Start Workout", "Save")
 * - accent       solid secondary colour, an in-progress main action ("Continue Workout")
 * - secondary    surface with a hairline border ("Regenerate", "Repeat this session", modal "Cancel")
 * - ghost        text only ("Skip", "Cancel" under a primary)
 * - destructive  outlined in error colour ("Cancel Workout", "Delete")
 *
 * Sizes: md is the full-width CTA; sm is for a pair of buttons inside a card
 * or a dialog row.
 */
export const BUTTON = {
  md: { paddingVertical: 16, fontSize: 16, radius: RADIUS.row, icon: 20 },
  sm: { paddingVertical: 10, fontSize: 14, radius: RADIUS.control, icon: 16 },
} as const

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'md' | 'sm'

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /** Leading icon, already sized — pass `BUTTON[size].icon` and the text colour from `buttonContentColor`. */
  icon?: ReactNode
}

/** The colour of text and icons on each variant, for callers rendering an `icon`. */
export function useButtonContentColor(variant: ButtonVariant = 'primary'): string {
  const { colors } = useTheme()
  switch (variant) {
    case 'primary':
    case 'accent':
      return colors.textButton
    case 'destructive':
      return colors.error
    case 'ghost':
      return colors.textSecondary
    default:
      return colors.textPrimary
  }
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const { colors } = useTheme()
  const contentColor = useButtonContentColor(variant)
  const dims = BUTTON[size]

  const inner = (
    <View style={[styles.inner, { paddingVertical: dims.paddingVertical }]}>
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon}
          <Text style={{ color: contentColor, fontSize: dims.fontSize, fontWeight: variant === 'ghost' ? '600' : '700' }}>
            {label}
          </Text>
        </>
      )}
    </View>
  )

  const surface: Record<ButtonVariant, object> = {
    primary: {},
    accent: { backgroundColor: colors.secondary },
    secondary: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border },
    ghost: {},
    destructive: { borderWidth: 1, borderColor: withAlpha(colors.error, 0.35) },
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[styles.base, { borderRadius: dims.radius, opacity: disabled ? 0.6 : 1 }, surface[variant], style]}
      {...props}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: { alignSelf: 'stretch', overflow: 'hidden' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
})
