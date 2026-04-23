import { useState, useMemo, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist'
import type { RenderItemParams } from 'react-native-draggable-flatlist'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
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
import { ArrowLeft, ArrowUpDown, Edit2, GripVertical, Plus, Trash2 } from 'lucide-react-native'
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
  const updateExercise = useUpdateTemplateExercise()
  const isDraggingRef = useRef(false)
  const pendingOrderRef = useRef<ExerciseItem[] | null>(null)
  const listHandlerRef = useRef(null)

  const [editingItem, setEditingItem] = useState<ExerciseItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editSets, setEditSets] = useState('3')
  const [editMinReps, setEditMinReps] = useState('8')
  const [editMaxReps, setEditMaxReps] = useState('12')
  const [editWeight, setEditWeight] = useState('0')

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

  function handleSwapExercise(item: ExerciseItem) {
    const orderIndex = exercises.findIndex(ex => ex.pivotId === item.pivotId)
    navigation.navigate('ExercisePicker', {
      templateId,
      swapPivotId: item.pivotId,
      swapOrderIndex: orderIndex >= 0 ? orderIndex : 0,
      pivotData: {
        target_sets: item.sets,
        min_target_reps: item.minReps,
        max_target_reps: item.maxReps,
        target_weight: parseFloat(item.weight) || 0,
      },
    })
  }

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

  async function swipeRemove(item: ExerciseItem) {
    try {
      await removeExercise.mutateAsync({ templateId, pivotId: item.pivotId })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to remove exercise')
    }
  }

  function openEditModal(item: ExerciseItem) {
    setEditingItem(item)
    setEditSets(String(item.sets))
    setEditMinReps(String(item.minReps))
    setEditMaxReps(String(item.maxReps))
    setEditWeight(item.weight)
    setShowEditModal(true)
  }

  async function handleSaveEdit() {
    if (!editingItem) return
    try {
      await updateExercise.mutateAsync({
        templateId,
        pivotId: editingItem.pivotId,
        data: {
          target_sets: parseInt(editSets) || 0,
          min_target_reps: parseInt(editMinReps) || 0,
          max_target_reps: parseInt(editMaxReps) || 0,
          target_weight: parseFloat(editWeight) || 0,
        },
      })
      setShowEditModal(false)
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update exercise')
    }
  }

  function renderItem({ item, drag, isActive }: RenderItemParams<ExerciseItem>) {
    return (
      <ScaleDecorator activeScale={1.02}>
        <Swipeable
          simultaneousHandlers={listHandlerRef}
          renderRightActions={() => (
            <View style={{ flexDirection: 'row', marginLeft: 8, marginBottom: 12 }}>
              {/* Swap */}
              <TouchableOpacity
                onPress={() => handleSwapExercise(item)}
                style={{
                  width: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  marginRight: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <ArrowUpDown size={20} color="#fff" />
              </TouchableOpacity>
              {/* Edit */}
              <TouchableOpacity
                onPress={() => openEditModal(item)}
                style={{
                  width: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  marginRight: 8,
                  backgroundColor: colors.primary,
                }}
              >
                <Edit2 size={20} color="#fff" />
              </TouchableOpacity>
              {/* Delete */}
              <TouchableOpacity
                onPress={() => swipeRemove(item)}
                style={{
                  width: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  backgroundColor: colors.error,
                }}
              >
                <Trash2 size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          overshootRight={false}
        >
          <View
            className="flex-row items-center gap-3 p-2 rounded-2xl mb-3"
            style={{
              backgroundColor: isActive ? colors.bgElevated : colors.bgSurface,
              borderWidth: 1,
              borderColor: isActive ? `${colors.primary}40` : 'transparent',
            }}
          >
            {/* Exercise image — tap to open details */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseName: item.name })}
              activeOpacity={0.7}
              className="w-16 h-16 rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.bgElevated }}
            >
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
            </TouchableOpacity>

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

            {/* Drag handle — long-press fires haptic then starts drag */}
            <TouchableOpacity
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                drag()
              }}
              className="p-2"
            >
              <GripVertical size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </Swipeable>
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
        <NativeViewGestureHandler ref={listHandlerRef}>
          <DraggableFlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onDragBegin={() => {
              isDraggingRef.current = true
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            }}
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
        </NativeViewGestureHandler>
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

      {/* Edit Sets/Reps Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, width: '90%', margin: 'auto'}}>
                  <SafeAreaView edges={['bottom']} style={{ padding: 24 }}>
                    <Text className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
                      Edit Exercise
                    </Text>
                    <Text className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                      {editingItem?.name}
                    </Text>
                    <View className="flex-row gap-3 mb-4">
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', marginBottom: 6, color: colors.textSecondary, textTransform: 'uppercase' }}>Sets</Text>
                        <TextInput
                          value={editSets}
                          onChangeText={setEditSets}
                          keyboardType="number-pad"
                          style={{ backgroundColor: colors.bgElevated, borderRadius: 12, padding: 12, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', marginBottom: 6, color: colors.textSecondary, textTransform: 'uppercase' }}>Min Reps</Text>
                        <TextInput
                          value={editMinReps}
                          onChangeText={setEditMinReps}
                          keyboardType="number-pad"
                          style={{ backgroundColor: colors.bgElevated, borderRadius: 12, padding: 12, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', marginBottom: 6, color: colors.textSecondary, textTransform: 'uppercase' }}>Max Reps</Text>
                        <TextInput
                          value={editMaxReps}
                          onChangeText={setEditMaxReps}
                          keyboardType="number-pad"
                          style={{ backgroundColor: colors.bgElevated, borderRadius: 12, padding: 12, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}
                        />
                      </View>
                    </View>
                    <View className="mb-6">
                      <Text style={{ fontSize: 11, fontWeight: '600', marginBottom: 6, color: colors.textSecondary, textTransform: 'uppercase' }}>Weight (kg)</Text>
                      <TextInput
                        value={editWeight}
                        onChangeText={setEditWeight}
                        keyboardType="decimal-pad"
                        style={{ backgroundColor: colors.bgElevated, borderRadius: 12, padding: 12, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}
                      />
                    </View>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => setShowEditModal(false)}
                        className="flex-1 py-4 rounded-xl items-center"
                        style={{ backgroundColor: colors.bgElevated }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSaveEdit}
                        disabled={updateExercise.isPending}
                        className="flex-1 py-4 rounded-xl items-center"
                        style={{ backgroundColor: colors.primary, opacity: updateExercise.isPending ? 0.7 : 1 }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: '#fff', fontWeight: '700' }}>
                          {updateExercise.isPending ? 'Saving...' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </SafeAreaView>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  )
}
