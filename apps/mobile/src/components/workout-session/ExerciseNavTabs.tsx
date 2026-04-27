import { memo, useCallback, useRef } from 'react'
import { FlatList, View, Text, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Check, Plus } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
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

function ExerciseNavTabsComponent({
  exercises,
  currentIndex,
  onSelect,
  onAddExercise,
}: ExerciseNavTabsProps) {
  const { colors } = useTheme()
  const flatListRef = useRef<FlatList<ListItem>>(null)

  const data: ListItem[] = [
    ...exercises.map((detail, index): TabItem => {
      const logged = detail.logged_sets?.length ?? 0
      const target = detail.session_exercise.target_sets ?? 0
      return {
        type: 'exercise',
        detail,
        index,
        isActive: index === currentIndex,
        isComplete: target > 0 && logged >= target,
      }
    }),
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
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              backgroundColor: colors.bgSurface,
              minWidth: 140,
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
      const logged = detail.logged_sets?.length ?? 0
      const target = sessionEx.target_sets ?? 0
      const exerciseName = sessionEx.exercise?.name ?? `Exercise ${index + 1}`
      const imageUri = sessionEx.exercise?.image ?? undefined

      const cardContent = (
        <View className="flex-row items-center gap-3 px-3 py-2.5">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : colors.bgElevated,
            }}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : null}
          </View>
          <View>
            <Text
              className="text-sm font-bold"
              style={{ color: isActive ? '#fff' : colors.textSecondary, maxWidth: 140 }}
              numberOfLines={1}
            >
              {exerciseName.length > 18 ? `${exerciseName.slice(0, 18)}…` : exerciseName}
            </Text>
            <Text
              className="text-xs"
              style={{ color: isActive ? 'rgba(255,255,255,0.85)' : colors.textMuted }}
            >
              {logged}/{target} sets
            </Text>
          </View>
          {isComplete && (
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: 22,
                height: 22,
                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : `${colors.success}25`,
              }}
            >
              <Check size={14} color={isActive ? '#fff' : colors.success} />
            </View>
          )}
        </View>
      )

      return (
        <TouchableOpacity
          onPress={() => {
            onSelect(index)
            flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 })
          }}
          activeOpacity={0.85}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        >
          {isActive ? (
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 12 }}
            >
              {cardContent}
            </LinearGradient>
          ) : (
            <View
              style={{
                borderRadius: 12,
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
        onScrollToIndexFailed={() => {}}
        extraData={currentIndex}
      />
    </View>
  )
}

export const ExerciseNavTabs = memo(ExerciseNavTabsComponent)
