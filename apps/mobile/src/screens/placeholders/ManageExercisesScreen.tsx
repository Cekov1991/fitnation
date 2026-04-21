import { useState, useMemo, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist'
import type { RenderItemParams } from 'react-native-draggable-flatlist'
import {
  useTemplate,
  useRemoveTemplateExercise,
  useReorderTemplateExercises,
  useUpdateTemplateExercise,
  formatRepRange,
} from '@fit-nation/shared'
import type { TemplateExercise } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { Image } from 'expo-image'
import { ArrowLeft, GripVertical, Edit2, Plus, Trash2 } from 'lucide-react-native'
import type { AppScreenProps } from '../../navigation/types'

interface ExerciseItem {
  id: string
  pivotId: number
  name: string
  sets: number
  reps: string
  minReps: number
  maxReps: number
  weight: string
  imageUrl: string | null
}

type Props = AppScreenProps<'ManageExercises'>

export function ManageExercisesScreen({ route, navigation }: Props) {
  const { templateId } = route.params
  const { colors } = useTheme()
  const { data: template, isLoading, isError, refetch } = useTemplate(templateId)
  const removeExercise = useRemoveTemplateExercise()
  const reorderExercises = useReorderTemplateExercises()
  const isDraggingRef = useRef(false)
  const pendingOrderRef = useRef<ExerciseItem[] | null>(null)

  const exercisesFromTemplate = useMemo<ExerciseItem[]>(() => {
    if (!template?.exercises) return []
    return template.exercises.map((ex: TemplateExercise) => ({
      id: `pivot-${ex.pivot.id}`,
      pivotId: ex.pivot.id,
      name: ex.name,
      sets: ex.pivot.target_sets ?? 0,
      reps: formatRepRange(ex.pivot.min_target_reps ?? 0, ex.pivot.max_target_reps ?? 0),
      minReps: ex.pivot.min_target_reps ?? 0,
      maxReps: ex.pivot.max_target_reps ?? 0,
      weight: ex.pivot.target_weight != null ? String(ex.pivot.target_weight) : '0',
      imageUrl: ex.image,
    }))
  }, [template])

  const [exercises, setExercises] = useState<ExerciseItem[]>([])

  useEffect(() => {
    if (!isDraggingRef.current) {
      setExercises(exercisesFromTemplate)
    }
  }, [exercisesFromTemplate])

  async function handleDragEnd({ data }: { data: ExerciseItem[] }) {
    isDraggingRef.current = false
    setExercises(data)
    const pivotIds = data.map((ex) => ex.pivotId)
    try {
      await reorderExercises.mutateAsync({ templateId, order: pivotIds })
    } catch {
      setExercises(exercisesFromTemplate)
    }
  }

  function confirmRemove(item: ExerciseItem) {
    Alert.alert(
      'Remove Exercise',
      `Remove "${item.name}" from this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeExercise.mutateAsync({ templateId, pivotId: item.pivotId })
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to remove exercise')
            }
          },
        },
      ]
    )
  }

  function renderItem({ item, drag, isActive }: RenderItemParams<ExerciseItem>) {
    return (
      <ScaleDecorator activeScale={1.02}>
        <View
          className="flex-row items-center gap-3 p-2 rounded-2xl mb-3"
          style={{
            backgroundColor: isActive ? colors.bgElevated : colors.bgSurface,
            borderWidth: 1,
            borderColor: isActive ? `${colors.primary}40` : 'transparent',
          }}
        >
          {/* Exercise image */}
          <View className="w-16 h-16 rounded-xl overflow-hidden" style={{ backgroundColor: colors.bgElevated }}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text style={{ color: colors.textMuted, fontSize: 22 }}>💪</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-bold mb-1" style={{ color: colors.textPrimary }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              <Text style={{ color: colors.primary }}>{item.sets} sets</Text>
              <Text style={{ color: colors.textMuted }}> × </Text>
              <Text style={{ color: colors.primary }}>{item.reps} reps</Text>
              <Text style={{ color: colors.textMuted }}> × </Text>
              <Text style={{ color: colors.primary }}>{item.weight} kg</Text>
            </Text>
          </View>

          {/* Remove button */}
          <TouchableOpacity
            onPress={() => confirmRemove(item)}
            className="p-2"
          >
            <Trash2 size={18} color={colors.error} />
          </TouchableOpacity>

          {/* Drag handle */}
          <TouchableOpacity onLongPress={drag} className="p-2">
            <GripVertical size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View className="flex-row items-center gap-4 px-6 pt-6 pb-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 rounded-full"
          style={{ backgroundColor: colors.bgElevated }}
        >
          <ArrowLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold flex-1" style={{ color: colors.primary }} numberOfLines={1}>
          {template?.name || 'Manage Exercises'}
        </Text>
      </View>

      {isLoading ? (
        <View className="px-6 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} height={80} className="mb-3" />
          ))}
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base mb-4" style={{ color: colors.textSecondary }}>
            Failed to load exercises
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <DraggableFlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragBegin={() => { isDraggingRef.current = true }}
          onDragEnd={handleDragEnd}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}
          ListHeaderComponent={
            <Text className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: colors.textSecondary }}>
              Exercises
            </Text>
          }
          ListEmptyComponent={
            <View
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: colors.bgSurface }}
            >
              <Text className="text-sm text-center" style={{ color: colors.textMuted }}>
                No exercises in this workout yet.{'\n'}Tap the button below to add some.
              </Text>
            </View>
          }
        />
      )}

      {/* Add Exercise FAB */}
      <View
        className="absolute bottom-8 left-6 right-6"
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('ExercisePicker', { templateId })}
          className="flex-row items-center justify-center gap-3 py-5 rounded-2xl"
          style={{
            borderWidth: 2,
            borderColor: `${colors.primary}50`,
            backgroundColor: `${colors.primary}10`,
          }}
        >
          <View
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <Plus size={18} color={colors.primary} />
          </View>
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Add Exercise
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
