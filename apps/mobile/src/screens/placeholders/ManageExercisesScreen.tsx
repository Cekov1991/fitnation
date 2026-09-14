import { useState, useMemo, useEffect, useRef } from 'react'
import { View, Text, Modal, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import * as Haptics from 'expo-haptics'
import {
  useTemplate,
  useRemoveTemplateExercise,
  useReorderTemplateExercises,
  useStartSession,
  useUpdateTemplateExercise,
  useWeightUnit,
  formatRepRange,
  sanitizeDecimalText,
  withAlpha,
  formatWeight,
} from '@fit-nation/shared'
import type { TemplateExercise } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { Button, BUTTON, useButtonContentColor } from '../../components/ui/Button'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { SectionLabel } from '../../components/ui/SectionLabel'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { RADIUS, SCREEN, STACK_GAP } from '../../constants/layout'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { SortableHandle, SortableItemSurface, SortableList } from '../../components/ui/SortableList'
import type { SortableListRenderItemInfo } from '../../components/ui/SortableList'
import { SwipeAction } from '../../components/ui/SwipeAction'
import { ExerciseRow, EXERCISE_ROW } from '../../components/exercises/ExerciseRow'
import { ArrowUpDown, Edit2, GripVertical, Play, Plus, Trash2 } from 'lucide-react-native'
import { showToast } from '../../lib/toast'
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
  muscleGroupId: string | null
}

type Props = AppScreenProps<'ManageExercises'>

export function ManageExercisesScreen({ route, navigation }: Props) {
  const { templateId } = route.params
  const { colors } = useTheme()
  const primaryColor = useButtonContentColor('primary')
  const secondaryColor = useButtonContentColor('secondary')
  const { data: template, isLoading, isError, refetch } = useTemplate(templateId)
  const removeExercise = useRemoveTemplateExercise()
  const reorderExercises = useReorderTemplateExercises()
  const updateExercise = useUpdateTemplateExercise()
  const startSession = useStartSession()
  const isDraggingRef = useRef(false)
  const pendingOrderRef = useRef<ExerciseItem[] | null>(null)
  const swipeableRefs = useRef<Map<string, { close: () => void }>>(new Map())

  const insets = useSafeAreaInsets()
  const weightUnit = useWeightUnit()
  const [editingItem, setEditingItem] = useState<ExerciseItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editSets, setEditSets] = useState('3')
  const [editMinReps, setEditMinReps] = useState('8')
  const [editMaxReps, setEditMaxReps] = useState('12')
  const [editWeight, setEditWeight] = useState('0')
  const [removeItem, setRemoveItem] = useState<ExerciseItem | null>(null)

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
      muscleGroupId: ex.muscle_groups?.find(m => m.is_primary)?.id.toString() ?? null,
    }))
  }, [template])

  const [exercises, setExercises] = useState<ExerciseItem[]>([])

  useEffect(() => {
    if (!isDraggingRef.current) {
      setExercises(exercisesFromTemplate)
    }
  }, [exercisesFromTemplate])

  function handleSwapExercise(item: ExerciseItem) {
    navigation.navigate('ExercisePicker', {
      templateId,
      swapPivotId: item.pivotId,
      swapMuscleGroupId: item.muscleGroupId ?? undefined,
    })
  }

  async function handleDragEnd(data: ExerciseItem[]) {
    isDraggingRef.current = false
    // Dropped back into its own slot: the list hands back the same array.
    if (data === exercises) return
    setExercises(data)
    const pivotIds = data.map((ex) => ex.pivotId)
    try {
      await reorderExercises.mutateAsync({ templateId, order: pivotIds })
    } catch {
      setExercises(exercisesFromTemplate)
    }
  }

  function confirmRemove(item: ExerciseItem) {
    setRemoveItem(item)
  }

  async function performRemove() {
    if (!removeItem) return
    try {
      await removeExercise.mutateAsync({ templateId, pivotId: removeItem.pivotId })
    } catch (e: any) {
      showToast(e?.message || 'Failed to remove exercise', 'error')
    }
  }

  async function swipeRemove(item: ExerciseItem) {
    try {
      await removeExercise.mutateAsync({ templateId, pivotId: item.pivotId })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } catch (e: any) {
      showToast(e?.message || 'Failed to remove exercise', 'error')
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
      showToast(e?.message || 'Failed to update exercise', 'error')
    }
  }

  async function handleStartWorkout() {
    try {
      const response = await startSession.mutateAsync(templateId)
      const session = (response as any)?.data?.session || (response as any)?.data
      if (session?.id) {
        if (!session.performed_at) {
          navigation.navigate('WorkoutPreview', { sessionId: String(session.id) })
        } else {
          navigation.navigate('WorkoutSession', { sessionId: String(session.id) })
        }
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to start workout', 'error')
    }
  }

  function renderItem({ item }: SortableListRenderItemInfo<ExerciseItem>) {
    return (
      <ReanimatedSwipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref)
          else swipeableRefs.current.delete(item.id)
        }}
        onSwipeableOpen={() => {
          swipeableRefs.current.forEach((ref, k) => {
            if (k !== item.id) ref.close()
          })
        }}
        renderRightActions={() => (
          <View style={{ flexDirection: 'row', marginLeft: 8, gap: 8 }}>
            <SwipeAction
              icon={ArrowUpDown}
              label="Swap"
              onPress={() => {
                swipeableRefs.current.get(item.id)?.close()
                handleSwapExercise(item)
              }}
            />
            <SwipeAction
              icon={Edit2}
              label="Edit"
              onPress={() => {
                swipeableRefs.current.get(item.id)?.close()
                openEditModal(item)
              }}
            />
            <SwipeAction
              icon={Trash2}
              label="Remove"
              tone="destructive"
              onPress={() => {
                swipeableRefs.current.get(item.id)?.close()
                swipeRemove(item)
              }}
            />
          </View>
        )}
        overshootRight={false}
      >
        <SortableItemSurface
          style={{ borderRadius: EXERCISE_ROW.radius, borderWidth: 1 }}
          backgroundColor={colors.bgSurface}
          activeBackgroundColor={colors.bgElevated}
          borderColor={withAlpha(colors.primary, 0)}
          activeBorderColor={withAlpha(colors.primary, 0.251)}
        >
          <ExerciseRow
            surface="plain"
            name={item.name}
            image={item.imageUrl}
            onPressImage={() => navigation.navigate('ExerciseDetail', { exerciseName: item.name })}
            meta={
              <>
                <Text style={{ color: colors.primary }}>{item.sets} sets</Text>
                <Text style={{ color: colors.textMuted }}> × </Text>
                <Text style={{ color: colors.primary }}>{item.reps} reps</Text>
                <Text style={{ color: colors.textMuted }}> × </Text>
                <Text style={{ color: colors.primary }}>{formatWeight(Number(item.weight))} {weightUnit}</Text>
              </>
            }
            right={
              /* Drag handle — hold to lift the row; the list adds the haptics */
              <SortableHandle style={{ padding: 8 }}>
                <GripVertical size={20} color={colors.textMuted} />
              </SortableHandle>
            }
          />
        </SortableItemSurface>
      </ReanimatedSwipeable>
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <View style={{ paddingHorizontal: SCREEN.paddingX }}>
        <ScreenHeader
          title={template?.name || 'Manage Exercises'}
          titleLines={1}
          onBack={() => navigation.goBack()}
        />
      </View>

      {isLoading ? (
        <View className="pt-2" style={{ paddingHorizontal: SCREEN.paddingX }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} height={80} className="mb-3" />
          ))}
        </View>
      ) : isError ? (
        <ErrorState message="Failed to load exercises" onRetry={() => refetch()} />
      ) : (
        <View className="flex-1">
          <SortableList
            style={{ flex: 1 }}
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            rowGap={12}
            onDragStart={() => {
              isDraggingRef.current = true
              swipeableRefs.current.forEach(ref => ref.close())
            }}
            onDragEnd={handleDragEnd}
            contentContainerStyle={{ paddingHorizontal: SCREEN.paddingX, paddingTop: 8, paddingBottom: SCREEN.paddingBottom }}
            ListHeaderComponent={<SectionLabel>Exercises</SectionLabel>}
            ListEmptyComponent={
              <EmptyState
                variant="card"
                title="This workout has no exercises"
                description="Tap the button below to add some."
              />
            }
          />
        </View>
      )}

      {/* Bottom CTA buttons — part of the layout flow, not absolutely positioned */}
      <View
        className="pt-3"
        style={{ gap: STACK_GAP, paddingHorizontal: SCREEN.paddingX, paddingBottom: insets.bottom + 16 }}
      >
        <Button
          label="Add Exercise"
          variant="secondary"
          icon={<Plus size={BUTTON.md.icon} color={secondaryColor} />}
          onPress={() => navigation.navigate('ExercisePicker', { templateId })}
        />
        <Button
          label={startSession.isPending ? 'Starting...' : 'Start Workout'}
          icon={<Play size={BUTTON.md.icon} color={primaryColor} fill={primaryColor} />}
          loading={startSession.isPending}
          disabled={startSession.isPending}
          onPress={handleStartWorkout}
        />
      </View>

      {/* Edit Sets/Reps Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.scrim }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{ backgroundColor: colors.bgSurface, borderRadius: RADIUS.card, width: '90%', alignSelf: 'center' }}>
                  <SafeAreaView edges={['bottom']} style={{ padding: 24 }}>
                    <Text className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
                      Edit Exercise
                    </Text>
                    <Text className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                      {editingItem?.name}
                    </Text>
                    <View className="flex-row gap-3 mb-4">
                      <View style={{ flex: 1 }}>
                        <SectionLabel tone="muted" style={{ marginBottom: 6 }}>Sets</SectionLabel>
                        <TextInput
                          value={editSets}
                          onChangeText={setEditSets}
                          keyboardType="number-pad"
                          style={{ backgroundColor: colors.bgElevated, borderRadius: RADIUS.control, padding: 12, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <SectionLabel tone="muted" style={{ marginBottom: 6 }}>Min Reps</SectionLabel>
                        <TextInput
                          value={editMinReps}
                          onChangeText={setEditMinReps}
                          keyboardType="number-pad"
                          style={{ backgroundColor: colors.bgElevated, borderRadius: RADIUS.control, padding: 12, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <SectionLabel tone="muted" style={{ marginBottom: 6 }}>Max Reps</SectionLabel>
                        <TextInput
                          value={editMaxReps}
                          onChangeText={setEditMaxReps}
                          keyboardType="number-pad"
                          style={{ backgroundColor: colors.bgElevated, borderRadius: RADIUS.control, padding: 12, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}
                        />
                      </View>
                    </View>
                    <View className="mb-6">
                      <SectionLabel tone="muted" style={{ marginBottom: 6 }}>{`Weight (${weightUnit})`}</SectionLabel>
                      <TextInput
                        value={editWeight}
                        onChangeText={(t) => setEditWeight(sanitizeDecimalText(t))}
                        keyboardType="decimal-pad"
                        style={{ backgroundColor: colors.bgElevated, borderRadius: RADIUS.control, padding: 12, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}
                      />
                    </View>
                    <View className="flex-row gap-3">
                      <Button
                        label="Cancel"
                        variant="secondary"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => setShowEditModal(false)}
                      />
                      <Button
                        label={updateExercise.isPending ? 'Saving...' : 'Save'}
                        size="sm"
                        style={{ flex: 1 }}
                        loading={updateExercise.isPending}
                        disabled={updateExercise.isPending}
                        onPress={handleSaveEdit}
                      />
                    </View>
                  </SafeAreaView>
                </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={!!removeItem}
        onClose={() => setRemoveItem(null)}
        title="Remove Exercise"
        message={
          removeItem
            ? `Remove "${removeItem.name}" from this workout?`
            : ''
        }
        confirmLabel="Remove"
        destructive
        onConfirm={performRemove}
      />
    </SafeAreaView>
  )
}
