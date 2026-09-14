import type { ReactNode } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { AccessibilityState, StyleProp, ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { Dumbbell } from 'lucide-react-native'
import { withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'

/**
 * The one exercise list row.
 *
 * Every list that shows an exercise next to its thumbnail renders this:
 * catalog, exercise pickers, workout preview, manage exercises, routine
 * workout detail, session detail, the dashboard workout card. The sizes are
 * pinned in EXERCISE_ROW and nowhere else — a screen that wants a bigger
 * thumbnail or name is asking for a design change to every row, so make it
 * here. `exercise-row-standard.test.ts` fails on a hand-rolled copy.
 */
export const EXERCISE_ROW = {
  /** Thumbnail edge, px. */
  thumb: 56,
  thumbRadius: 12,
  /** Inner padding of the row surface. */
  padding: 8,
  /** Space between thumbnail, text block and trailing slot. */
  gap: 12,
  /** Corner radius of a standalone ('card') row. */
  radius: 16,
  /** Vertical space between consecutive rows in a list. */
  rowGap: 12,
  nameSize: 14,
  metaSize: 12,
  placeholderIcon: 22,
} as const

/** Same blurhash the catalog has always used while a thumbnail loads. */
const THUMB_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'

export type ExerciseRowSurface = 'card' | 'elevated' | 'plain'

export interface ExerciseRowProps {
  name: string
  image?: string | null
  /** Second line. A string, or nested <Text> when segments need their own colour. */
  meta?: ReactNode
  /** Whole-row tap. Omit for a static row. */
  onPress?: () => void
  /**
   * Thumbnail-only tap. For rows whose body belongs to a gesture (drag handle,
   * swipe actions) but whose picture should still open the exercise.
   */
  onPressImage?: () => void
  /** Trailing slot: a chevron, an add button, a drag handle, a figure. */
  right?: ReactNode
  /**
   * 'card' (default) — paints bgSurface with the standard radius; a standalone list item.
   * 'elevated' — paints bgElevated; a row nested inside a card.
   * 'plain' — paints nothing; the parent owns the background (SortableItemSurface, an expandable card).
   */
  surface?: ExerciseRowSurface
  disabled?: boolean
  accessibilityState?: AccessibilityState
  /** Margins, opacity, and the like. Not a way to resize the row. */
  style?: StyleProp<ViewStyle>
}

export function ExerciseRow({
  name,
  image,
  meta,
  onPress,
  onPressImage,
  right,
  surface = 'card',
  disabled,
  accessibilityState,
  style,
}: ExerciseRowProps) {
  const { colors } = useTheme()
  const background =
    surface === 'card' ? colors.bgSurface : surface === 'elevated' ? colors.bgElevated : undefined

  const thumb = image ? (
    <Image
      source={{ uri: image }}
      style={styles.thumb}
      contentFit="cover"
      transition={150}
      placeholder={{ blurhash: THUMB_BLURHASH }}
    />
  ) : (
    <View style={[styles.thumb, styles.thumbEmpty, { backgroundColor: withAlpha(colors.primary, 0.094) }]}>
      <Dumbbell size={EXERCISE_ROW.placeholderIcon} color={colors.primary} />
    </View>
  )

  const content = (
    <>
      {onPressImage ? (
        <TouchableOpacity onPress={onPressImage} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={name}>
          {thumb}
        </TouchableOpacity>
      ) : (
        thumb
      )}
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.textPrimary }]}>
          {name}
        </Text>
        {meta != null && meta !== '' && (
          <Text numberOfLines={1} style={[styles.meta, { color: colors.textSecondary }]}>
            {meta}
          </Text>
        )}
      </View>
      {right}
    </>
  )

  const rowStyle = [styles.row, background != null && { backgroundColor: background }, style]

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        style={rowStyle}
      >
        {content}
      </TouchableOpacity>
    )
  }

  return (
    <View style={rowStyle} accessibilityState={accessibilityState}>
      {content}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: EXERCISE_ROW.gap,
    padding: EXERCISE_ROW.padding,
    borderRadius: EXERCISE_ROW.radius,
  },
  thumb: {
    width: EXERCISE_ROW.thumb,
    height: EXERCISE_ROW.thumb,
    borderRadius: EXERCISE_ROW.thumbRadius,
  },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  name: { fontSize: EXERCISE_ROW.nameSize, fontWeight: '700' },
  meta: { fontSize: EXERCISE_ROW.metaSize, marginTop: 2 },
})
