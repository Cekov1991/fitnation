import type { ReactNode } from 'react'
import { View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import Animated, { interpolateColor, useAnimatedRef, useAnimatedStyle } from 'react-native-reanimated'
import Sortable, { useItemContext } from 'react-native-sortables'
import type { SortableGridRenderItemInfo } from 'react-native-sortables'

/**
 * The one drag-to-reorder list of the app, built on react-native-sortables.
 *
 * Why this and not a FlatList-based drag list: the library owns every row's
 * position in its own animated values, keyed by item. When the screen commits
 * the reordered data after a drop, React re-renders rows that are already
 * where they belong, so the commit is invisible. A list that reorders React
 * children and then resets per-row translations paints one frame with stale
 * offsets on the New Architecture (the flash we shipped with
 * react-native-draggable-flatlist).
 *
 * The rows are not virtualised. Fine for a workout's exercise list; do not
 * reach for this for hundreds of rows.
 */

export type SortableListRenderItemInfo<T> = SortableGridRenderItemInfo<T>

interface SortableListProps<T> {
  data: T[]
  keyExtractor: (item: T) => string
  renderItem: (info: SortableListRenderItemInfo<T>) => ReactNode
  /** A row was picked up. Close swipeables, pause syncing from the server, etc. */
  onDragStart?: () => void
  /**
   * A row was dropped. Fires on every drop, including a drop back into the
   * same slot; in that case `data` is the very array that was passed in, so
   * callers can compare by reference and skip persisting.
   */
  onDragEnd: (data: T[]) => void
  /** Vertical space between rows. Rows should carry no margin of their own. */
  rowGap?: number
  ListHeaderComponent?: ReactNode
  ListFooterComponent?: ReactNode
  /** Rendered in place of the rows when `data` is empty. */
  ListEmptyComponent?: ReactNode
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  showsVerticalScrollIndicator?: boolean
}

export function SortableList<T>({
  data,
  keyExtractor,
  renderItem,
  onDragStart,
  onDragEnd,
  rowGap = 12,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator,
}: SortableListProps<T>) {
  // The library scrolls this container itself when a row is dragged near an edge.
  const scrollableRef = useAnimatedRef<Animated.ScrollView>()

  return (
    <Animated.ScrollView
      ref={scrollableRef}
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {ListHeaderComponent}
      {data.length === 0 ? (
        ListEmptyComponent
      ) : (
        <Sortable.Grid
          columns={1}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          rowGap={rowGap}
          // Only the grip (SortableHandle) starts a drag; the rest of a row keeps
          // its own gestures — swipe actions, taps.
          customHandle
          scrollableRef={scrollableRef}
          overDrag="vertical"
          activeItemScale={1.02}
          inactiveItemOpacity={1}
          // Medium tap on lift and drop, light tick each time the order changes.
          hapticsEnabled
          onDragStart={onDragStart}
          onDragEnd={({ data: reordered }) => onDragEnd(reordered)}
        />
      )}
      {ListFooterComponent}
    </Animated.ScrollView>
  )
}

interface SortableHandleProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

/** The grip a row is dragged by. Must be rendered inside a SortableList row. */
export function SortableHandle({ children, style }: SortableHandleProps) {
  return (
    <Sortable.Handle style={style}>
      {/* The icon must not swallow the touch the handle is listening for. */}
      <View pointerEvents="none">{children}</View>
    </Sortable.Handle>
  )
}

interface SortableItemSurfaceProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  backgroundColor: string
  activeBackgroundColor: string
  borderColor: string
  activeBorderColor: string
}

/**
 * A row's background that fades to its "lifted" colours as the row is picked
 * up and back as it is dropped, in step with the library's own lift animation.
 * Must be rendered inside a SortableList row.
 */
export function SortableItemSurface({
  children,
  style,
  backgroundColor,
  activeBackgroundColor,
  borderColor,
  activeBorderColor,
}: SortableItemSurfaceProps) {
  const { activationAnimationProgress } = useItemContext()

  const liftedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      activationAnimationProgress.value,
      [0, 1],
      [backgroundColor, activeBackgroundColor],
    ),
    borderColor: interpolateColor(
      activationAnimationProgress.value,
      [0, 1],
      [borderColor, activeBorderColor],
    ),
  }))

  return <Animated.View style={[style, liftedStyle]}>{children}</Animated.View>
}
