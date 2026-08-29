import { memo, useCallback, useEffect, useRef } from 'react'
import { FlatList, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { Check, MoreVertical, Plus } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { countCompletedSlots, isExerciseComplete } from './progress'
import type { SessionExerciseDetail } from '@fit-nation/shared'

interface ExerciseNavTabsProps {
  exercises: SessionExerciseDetail[]
  currentIndex: number
  onSelect: (index: number) => void
  /** Opens the options menu for that tab's exercise — which need not be the current one. */
  onOpenMenu: (detail: SessionExerciseDetail) => void
  onAddExercise: () => void
}

interface TabItem {
  type: 'exercise'
  detail: SessionExerciseDetail
  index: number
  isActive: boolean
  isComplete: boolean
}

interface AddItem {
  type: 'add'
}

type ListItem = TabItem | AddItem

const THUMB = 64
const TAB_H_PADDING = 20
// Leave a sliver of the next card showing: it makes the strip legibly
// scrollable, which matters now that tapping a tab is the only way to switch
// exercise. Capped so the card does not get absurd on a large screen.
const TAB_PEEK = 44

const TAB_MAX_WIDTH = 330
// Every tab is exactly tabWidth × TAB_HEIGHT, the Add tab included, so the
// strip stays a uniform row and getItemLayout below can be exact. NAME_LINES
// worth of vertical space is reserved whether the name wraps or not —
// otherwise a one-line name would yield a shorter card.
const TAB_HEIGHT = 96
const TAB_GAP = 8
const NAME_LINE_HEIGHT = 19
const NAME_LINES = 2
const MENU_BTN = 28

function ExerciseNavTabsComponent({
  exercises,
  currentIndex,
  onSelect,
  onOpenMenu,
  onAddExercise,
}: ExerciseNavTabsProps) {
  const { colors } = useTheme()
  const flatListRef = useRef<FlatList<ListItem>>(null)

  // Derived from the live viewport rather than read once at module scope, so the
  // strip survives a rotation or a split-screen resize.
  const { width: screenW } = useWindowDimensions()
  const tabWidth = Math.min(TAB_MAX_WIDTH, screenW - TAB_H_PADDING * 2 - TAB_PEEK)

  /** Distance from the start of the strip's content to the start of tab `index`. */
  const tabOffset = useCallback(
    (index: number) => TAB_H_PADDING + (tabWidth + TAB_GAP) * index,
    [tabWidth]
  )

  // Tabs are the only way to switch exercise, so the active one has to be
  // brought into view however the index changed — tap, removal, clamp or
  // auto-advance. Scrolling only from the tab's own onPress would leave the
  // active tab offscreen for every programmatic change.
  //
  // Centred by computing the offset rather than via scrollToIndex +
  // viewPosition. Every tab is a known fixed size, so this is exact and needs
  // no measurement — and it keeps the centring independent of getItemLayout,
  // whose offsets are author-declared and so are only as right as tabOffset.
  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= exercises.length) return

    const centered = tabOffset(currentIndex) - (screenW - tabWidth) / 2

    // Clamp so the first and last tabs settle flush instead of over-scrolling
    // and bouncing back. +1 for the trailing Add tab.
    const itemCount = exercises.length + 1
    const contentWidth =
      TAB_H_PADDING * 2 + itemCount * tabWidth + (itemCount - 1) * TAB_GAP
    const maxOffset = Math.max(0, contentWidth - screenW)

    flatListRef.current?.scrollToOffset({
      offset: Math.min(Math.max(0, centered), maxOffset),
      animated: true,
    })
  }, [currentIndex, exercises.length, screenW, tabWidth, tabOffset])

  const data: ListItem[] = [
    ...exercises.map((detail, index): TabItem => ({
      type: 'exercise',
      detail,
      index,
      isActive: index === currentIndex,
      isComplete: isExerciseComplete(detail),
    })),
    { type: 'add' },
  ]

  const keyExtractor = useCallback((item: ListItem) => {
    if (item.type === 'add') return '__add__'
    return String(item.detail.session_exercise.id)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'add') {
        return (
          <TouchableOpacity
            onPress={onAddExercise}
            activeOpacity={0.75}
            style={{
              width: tabWidth,
              height: TAB_HEIGHT,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingHorizontal: 16,
              borderRadius: 16,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              backgroundColor: colors.bgSurface,
            }}
          >
            <Plus size={18} color={colors.primary} />
            <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
              Add Exercise
            </Text>
          </TouchableOpacity>
        )
      }

      const { detail, index, isActive, isComplete } = item
      const sessionEx = detail.session_exercise
      const target = sessionEx.target_sets ?? 0
      const logged = countCompletedSlots(detail.logged_sets, target)
      const exerciseName = sessionEx.exercise?.name ?? `Exercise ${index + 1}`
      const imageUri = sessionEx.exercise?.image ?? undefined
      const progress = target > 0 ? Math.min(1, logged / target) : 0

      const onSurface = isActive ? colors.textButton : colors.textPrimary
      const onSurfaceMuted = isActive ? `${colors.textButton}D9` : colors.textMuted

      const cardContent = (
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <View
            style={{
              width: THUMB,
              height: THUMB,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: isActive ? `${colors.textButton}26` : colors.bgElevated,
            }}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
              />
            ) : null}
          </View>
          <View style={{ flex: 1, paddingRight: MENU_BTN + 2 }}>
            <Text
              style={{
                color: onSurface,
                fontSize: 15,
                fontWeight: '700',
                lineHeight: NAME_LINE_HEIGHT,
                height: NAME_LINE_HEIGHT * NAME_LINES,
              }}
              numberOfLines={NAME_LINES}
            >
              {exerciseName}
            </Text>
            <View className="flex-row items-center gap-1.5" style={{ marginTop: 4 }}>
              <Text style={{ color: onSurfaceMuted, fontSize: 12, fontWeight: '600' }}>
                {logged}/{target} sets
              </Text>
              {isComplete && (
                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 18,
                    height: 18,
                    backgroundColor: isActive ? `${colors.textButton}40` : `${colors.success}25`,
                  }}
                >
                  <Check size={12} color={isActive ? colors.textButton : colors.success} />
                </View>
              )}
            </View>
            {/* Progress bar */}
            <View
              style={{
                marginTop: 6,
                height: 4,
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: isActive ? `${colors.textButton}40` : colors.borderSubtle,
              }}
            >
              <View
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor: isActive
                    ? colors.textButton
                    : isComplete
                      ? colors.success
                      : colors.primary,
                }}
              />
            </View>
          </View>

          {/* Options — moved here from the exercise header. Acts on this tab's
              exercise, so it does not require selecting the tab first. Nested
              Touchables do not propagate on native, so the card's onPress
              stays unaffected. */}
          <TouchableOpacity
            onPress={() => onOpenMenu(detail)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: MENU_BTN,
              height: MENU_BTN,
              borderRadius: MENU_BTN / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isActive ? `${colors.textButton}33` : colors.bgElevated,
            }}
          >
            <MoreVertical size={16} color={isActive ? colors.textButton : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )

      return (
        <TouchableOpacity
          onPress={() => onSelect(index)}
          activeOpacity={0.85}
          style={{ width: tabWidth, height: TAB_HEIGHT, borderRadius: 16, overflow: 'hidden' }}
        >
          {isActive ? (
            <View style={{ flex: 1, borderRadius: 16, backgroundColor: colors.primary }}>
              {cardContent}
            </View>
          ) : (
            <View
              style={{
                flex: 1,
                borderRadius: 16,
                backgroundColor: isComplete ? `${colors.success}10` : colors.bgSurface,
                borderWidth: 1,
                borderColor: isComplete ? `${colors.success}30` : colors.borderSubtle,
              }}
            >
              {cardContent}
            </View>
          )}
        </TouchableOpacity>
      )
    },
    [colors, onSelect, onOpenMenu, onAddExercise, tabWidth]
  )

  if (exercises.length === 0) return null

  return (
    <View className="pb-3 pt-1">
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: TAB_H_PADDING, gap: TAB_GAP }}
        // Every tab is exactly tabWidth, so windowing can be exact.
        getItemLayout={(_, index) => ({
          length: tabWidth,
          offset: tabOffset(index),
          index,
        })}
        extraData={currentIndex}
      />
    </View>
  )
}

export const ExerciseNavTabs = memo(ExerciseNavTabsComponent)
