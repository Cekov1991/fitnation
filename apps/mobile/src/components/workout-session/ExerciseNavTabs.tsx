import { memo, useCallback, useEffect, useRef } from 'react'
import { FlatList, View, Text, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Check, Plus } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { countCompletedSlots, isExerciseComplete } from './progress'
import type { SessionExerciseDetail } from '@fit-nation/shared'

interface ExerciseNavTabsProps {
  exercises: SessionExerciseDetail[]
  currentIndex: number
  onSelect: (index: number) => void
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

const THUMB = 56

function ExerciseNavTabsComponent({
  exercises,
  currentIndex,
  onSelect,
  onAddExercise,
}: ExerciseNavTabsProps) {
  const { colors } = useTheme()
  const flatListRef = useRef<FlatList<ListItem>>(null)

  // Tabs are the only way to switch exercise, so the active one has to be
  // brought into view however the index changed — tap, removal, clamp or
  // auto-advance. Scrolling only from the tab's own onPress would leave the
  // active tab offscreen for every programmatic change.
  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= exercises.length) return
    flatListRef.current?.scrollToIndex({
      index: currentIndex,
      animated: true,
      viewPosition: 0.5,
    })
  }, [currentIndex, exercises.length])

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
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingHorizontal: 16,
              borderRadius: 14,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              backgroundColor: colors.bgSurface,
              minWidth: 150,
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

      const onSurface = isActive ? '#fff' : colors.textPrimary
      const onSurfaceMuted = isActive ? 'rgba(255,255,255,0.85)' : colors.textMuted

      const cardContent = (
        <View className="flex-row items-center gap-3 px-3.5 py-3">
          <View
            style={{
              width: THUMB,
              height: THUMB,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : colors.bgElevated,
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
          <View style={{ width: 150 }}>
            <Text
              style={{ color: onSurface, fontSize: 14, fontWeight: '700', lineHeight: 18 }}
              numberOfLines={2}
            >
              {exerciseName}
            </Text>
            <View className="flex-row items-center gap-1.5" style={{ marginTop: 6 }}>
              <Text style={{ color: onSurfaceMuted, fontSize: 12, fontWeight: '600' }}>
                {logged}/{target} sets
              </Text>
              {isComplete && (
                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 18,
                    height: 18,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : `${colors.success}25`,
                  }}
                >
                  <Check size={12} color={isActive ? '#fff' : colors.success} />
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
                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.borderSubtle,
              }}
            >
              <View
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor: isActive
                    ? '#fff'
                    : isComplete
                      ? colors.success
                      : colors.primary,
                }}
              />
            </View>
          </View>
        </View>
      )

      return (
        <TouchableOpacity
          onPress={() => onSelect(index)}
          activeOpacity={0.85}
          style={{ borderRadius: 14, overflow: 'hidden' }}
        >
          {isActive ? (
            <View style={{ borderRadius: 14, backgroundColor: colors.primary }}>
              {cardContent}
            </View>
          ) : (
            <View
              style={{
                borderRadius: 14,
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
    [colors, onSelect, onAddExercise]
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
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        // A tab past the highest measured frame cannot be scrolled to directly.
        // Swallowing that would leave the active tab offscreen with no selected
        // tab visible — and tabs are the only navigation. Jump to the estimated
        // offset to force measurement, then land the real scroll.
        onScrollToIndexFailed={info => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          })
          setTimeout(() => {
            if (info.index < 0 || info.index >= exercises.length) return
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.5,
            })
          }, 80)
        }}
        extraData={currentIndex}
      />
    </View>
  )
}

export const ExerciseNavTabs = memo(ExerciseNavTabsComponent)
