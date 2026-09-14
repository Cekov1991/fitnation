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
 * - primary        brand gradient, the screen's main action ("Start Workout", "Save")
 * - accent         solid secondary colour, an in-progress main action ("Continue Workout")
 * - secondary      surface with a hairline border ("Regenerate", "Repeat this session", modal "Cancel")
 * - ghost          text only ("Skip", "Cancel" under a primary)
 * - destructive    outlined in error colour ("Cancel Workout", "Delete")
 * - dashed         dashed outline in brand colour, the "add one more" tile at the end of a list
 * - onBrand        solid textButton fill with brand text — the main action on a brand-gradient card ("Log Set")
 * - onBrandGhost   translucent textButton fill — the secondary action on a brand-gradient card ("Cancel", "Generate Smart Workout")
 *
 * Sizes: md is the full-width CTA; sm is for a pair of buttons inside a card
 * or a dialog row.
 */
export const BUTTON = {
  md: { paddingVertical: 16, fontSize: 16, radius: RADIUS.row, icon: 20 },
  sm: { paddingVertical: 10, fontSize: 14, radius: RADIUS.control, icon: 16 },
} as const

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'destructive' | 'dashed' | 'onBrand' | 'onBrandGhost'
export type ButtonSize = 'md' | 'sm'

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /** Leading icon, already sized — pass `BUTTON[size].icon` and the colour from `useButtonContentColor`. */
  icon?: ReactNode
  /** Trailing icon (a chevron on a row-like button). Same sizing rule as `icon`. */
  iconRight?: ReactNode
}

/** The colour of text and icons on each variant, for callers rendering an `icon`. */
export function useButtonContentColor(variant: ButtonVariant = 'primary'): string {
  const { colors } = useTheme()
  switch (variant) {
    case 'primary':
    case 'accent':
    case 'onBrandGhost':
      return colors.textButton
    case 'onBrand':
    case 'dashed':
      return colors.primary
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
  iconRight,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const { colors } = useTheme()
  const contentColor = useButtonContentColor(variant)
  const dims = BUTTON[size]

  // The dashed tile is taller than a pill: it reads as a drop zone at the end of a list.
  const paddingVertical = variant === 'dashed' ? 24 : dims.paddingVertical

  const inner = (
    <View style={[styles.inner, { paddingVertical }]}>
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon}
          <Text style={{ color: contentColor, fontSize: dims.fontSize, fontWeight: variant === 'ghost' ? '600' : '700' }}>
            {label}
          </Text>
          {iconRight}
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
    dashed: { borderWidth: 2, borderStyle: 'dashed', borderColor: withAlpha(colors.primary, 0.3) },
    onBrand: { backgroundColor: colors.textButton },
    onBrandGhost: {
      backgroundColor: withAlpha(colors.textButton, 0.15),
      borderWidth: 1,
      borderColor: withAlpha(colors.textButton, 0.25),
    },
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
