import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import * as Haptics from 'expo-haptics'
import { Check, RefreshCw, X, Edit2, ArrowUpDown, GripVertical, Plus, Trash2 } from 'lucide-react-native'
import {
  useSession,
  useConfirmDraftSession,
  useRegenerateDraftSession,
  useCancelSession,
  useRemoveSessionExercise,
  useUpdateSessionExercise,
  useReorderSessionExercises,
  useWeightUnit,
  formatRepRange,
  sanitizeDecimalText,
  withAlpha,
  formatWeight,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { showToast } from '../../lib/toast'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { SortableHandle, SortableItemSurface, SortableList } from '../../components/ui/SortableList'
import type { SortableListRenderItemInfo } from '../../components/ui/SortableList'
import type { AppScreenProps } from '../../navigation/types'
import type { SessionExerciseDetail, RegenerateWorkoutInput } from '@fit-nation/shared'

type Props = AppScreenProps<'WorkoutPreview'>

export function WorkoutPreviewScreen({ route, navigation }: Props) {
  const { sessionId, generationParams } = route.params
  const { colors } = useTheme()
  const numericSessionId = Number(sessionId)
  const weightUnit = useWeightUnit()

  const { data: draftSession, isLoading, isError, refetch } = useSession(numericSessionId)
  const confirmDraft = useConfirmDraftSession()
  const regenerateDraft = useRegenerateDraftSession()
  const cancelSession = useCancelSession()
  const removeExercise = useRemoveSessionExercise()
  const updateExercise = useUpdateSessionExercise()
  const reorderExercises = useReorderSessionExercises()

  const isDraggingRef = useRef(false)
  const swipeableRefs = useRef<Map<string, { close: () => void }>>(new Map())
  const [orderedExercises, setOrderedExercises] = useState<SessionExerciseDetail[]>([])

  const exercisesFromSession: SessionExerciseDetail[] = (draftSession as any)?.exercises ?? []

  useEffect(() => {
    if (!isDraggingRef.current) {
      setOrderedExercises(exercisesFromSession)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSession])

  async function handleDragEnd(data: SessionExerciseDetail[]) {
    isDraggingRef.current = false
    // Dropped back into its own slot: the list hands back the same array.
    if (data === orderedExercises) return
    setOrderedExercises(data)
    const exerciseIds = data.map(e => e.session_exercise.id)
    try {
      await reorderExercises.mutateAsync({ sessionId: numericSessionId, exerciseIds })
    } catch {
      // user-feedback: the list snapping back to the server order is the
      // message; a toast on top of it would say the same thing twice.
      setOrderedExercises(exercisesFromSession)
    }
  }

  const [selectedExercise, setSelectedExercise] = useState<SessionExerciseDetail | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editSets, setEditSets] = useState('3')
  const [editMinReps, setEditMinReps] = useState('8')
  const [editMaxReps, setEditMaxReps] = useState('12')
  const [editWeight, setEditWeight] = useState('0')
  const [cancelVisible, setCancelVisible] = useState(false)
  // Shown inside the edit modal rather than as a toast: the modal is a native
  // Modal, and a toast raised underneath one is invisible.
  const [editError, setEditError] = useState<string | null>(null)

  const handleConfirm = async () => {
    try {
      await confirmDraft.mutateAsync(numericSessionId)
      navigation.replace('WorkoutSession', { sessionId })
    } catch (error) {
      console.error('Failed to confirm workout:', error)
      showToast("Couldn't start the workout.", 'error')
    }
  }

  const handleRegenerate = async () => {
    try {
      const response = await regenerateDraft.mutateAsync({
        sessionId: numericSessionId,
        data: (generationParams as RegenerateWorkoutInput | undefined) ?? {},
      })
      const newSessionId = response.data?.id
      if (newSessionId) {
        navigation.replace('WorkoutPreview', {
          sessionId: newSessionId.toString(),
          generationParams,
        })
      }
    } catch (error) {
      console.error('Failed to regenerate:', error)
      showToast("Couldn't generate a new workout.", 'error')
    }
  }

  const handleCancel = () => {
    setCancelVisible(true)
  }

  const performCancel = async () => {
    try {
      await cancelSession.mutateAsync(numericSessionId)
      navigation.goBack()
    } catch (error) {
      console.error('Failed to cancel session:', error)
      showToast("Couldn't cancel the workout.", 'error')
    }
  }

  const openEditModal = (exerciseDetail: SessionExerciseDetail) => {
    setSelectedExercise(exerciseDetail)
    setEditError(null)
    setEditSets(String(exerciseDetail.session_exercise.target_sets ?? 3))
    setEditMinReps(String(exerciseDetail.session_exercise.min_target_reps ?? 8))
    setEditMaxReps(String(exerciseDetail.session_exercise.max_target_reps ?? 12))
    setEditWeight(String(exerciseDetail.session_exercise.target_weight ?? 0))
    setShowEditModal(true)
  }

  const handleSwipeRemove = async (exerciseDetail: SessionExerciseDetail) => {
    try {
      await removeExercise.mutateAsync({
        sessionId: numericSessionId,
        exerciseId: exerciseDetail.session_exercise.id,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } catch (error) {
      console.error('Failed to remove exercise:', error)
      showToast("Couldn't remove that exercise.", 'error')
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedExercise) return
    setEditError(null)
    try {
      await updateExercise.mutateAsync({
        sessionId: numericSessionId,
        exerciseId: selectedExercise.session_exercise.id,
        data: {
          target_sets: parseInt(editSets) || 0,
          min_target_reps: parseInt(editMinReps) || 0,
          max_target_reps: parseInt(editMaxReps) || 0,
          target_weight: parseFloat(editWeight) || 0,
        },
      })
      setShowEditModal(false)
    } catch (error) {
      console.error('Failed to update exercise:', error)
      // Deliberately leaves the modal open: the targets the user just typed are
      // only held in this modal's state, so closing on a network blip would
      // make them retype the lot. The error goes in the modal beside them.
      setEditError("Couldn't update the exercise.")
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <View className="px-5 pt-6">
          <SkeletonBox height={40} style={{ marginBottom: 16 }} />
          <SkeletonBox height={100} style={{ marginBottom: 12 }} />
          <SkeletonBox height={100} style={{ marginBottom: 12 }} />
          <SkeletonBox height={100} />
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !draftSession) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
        <Text style={{ color: colors.textSecondary }}>Session not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 px-6 py-3 rounded-xl" style={{ backgroundColor: colors.primary }}>
          <Text style={{ color: colors.textButton, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const listHeader = (
    <>
      {/* Header */}
      <View style={{ paddingTop: 24, marginBottom: 24 }}>
        <Text className="text-2xl font-black mb-1" style={{ color: colors.textPrimary }}>
          Preview Workout
        </Text>
        <Text className="text-sm" style={{ color: colors.textSecondary }}>
          Review and adjust your Fit Nation's Engine workout
        </Text>
      </View>

      {/* Rationale */}
      {(draftSession as any).rationale && (
        <View
          className="p-4 rounded-xl border mb-6"
          style={{
            backgroundColor: withAlpha(colors.primary, 0.031),
            borderColor: withAlpha(colors.primary, 0.125),
          }}
        >
          <Text className="text-sm" style={{ color: colors.textPrimary }}>
            {(draftSession as any).rationale}
          </Text>
        </View>
      )}

      <Text className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>
        Exercises ({orderedExercises.length})
      </Text>
    </>
  )

  const listFooter = (
    <>
      {/* Add Exercise Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('WorkoutPreviewExercisePicker', { sessionId })}
        className="w-full py-6 border-2 border-dashed rounded-2xl mt-5 items-center justify-center"
        style={{ borderColor: withAlpha(colors.primary, 0.314) }}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-3">
          <View className="p-2 rounded-lg" style={{ backgroundColor: withAlpha(colors.primary, 0.082) }}>
            <Plus size={20} color={colors.primary} />
          </View>
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Add Exercise
          </Text>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View className="gap-3 mt-6">
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={confirmDraft.isPending}
          style={{ borderRadius: 16, overflow: 'hidden', opacity: confirmDraft.isPending ? 0.7 : 1 }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center' }}
          >
            <View className="flex-row items-center gap-2">
              <Check size={20} color={colors.textButton} />
              <Text style={{ color: colors.textButton, fontSize: 17, fontWeight: '700' }}>
                {confirmDraft.isPending ? 'STARTING...' : 'START WORKOUT'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRegenerate}
          disabled={regenerateDraft.isPending}
          className="w-full py-4 rounded-2xl border-2 flex-row items-center justify-center gap-2"
          style={{
            borderColor: withAlpha(colors.textMuted, 0.251),
            backgroundColor: colors.bgSurface,
            opacity: regenerateDraft.isPending ? 0.7 : 1,
          }}
          activeOpacity={0.8}
        >
          {regenerateDraft.isPending ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <RefreshCw size={20} color={colors.textPrimary} />
          )}
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
            {regenerateDraft.isPending ? 'REGENERATING...' : 'REGENERATE'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCancel}
          disabled={cancelSession.isPending}
          className="w-full py-4 rounded-2xl border-2 flex-row items-center justify-center gap-2"
          style={{
            borderColor: withAlpha(colors.error, 0.251),
            backgroundColor: 'transparent',
            opacity: cancelSession.isPending ? 0.6 : 1,
          }}
          activeOpacity={0.8}
        >
          <X size={20} color={colors.error} />
          <Text style={{ color: colors.error, fontSize: 16, fontWeight: '700' }}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    </>
  )

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
        <SortableList
          data={orderedExercises}
          keyExtractor={(item) => String(item.session_exercise.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          rowGap={12}
          onDragStart={() => {
            isDraggingRef.current = true
            swipeableRefs.current.forEach(ref => ref.close())
          }}
          onDragEnd={handleDragEnd}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          renderItem={({ item: exerciseDetail }: SortableListRenderItemInfo<SessionExerciseDetail>) => {
            const se = exerciseDetail.session_exercise
            const ex = se.exercise
            if (!ex) return null
            return (
              <ReanimatedSwipeable
                ref={(ref) => {
                  const key = String(se.id)
                  if (ref) swipeableRefs.current.set(key, ref)
                  else swipeableRefs.current.delete(key)
                }}
                onSwipeableOpen={() => {
                  const key = String(se.id)
                  swipeableRefs.current.forEach((ref, k) => {
                    if (k !== key) ref.close()
                  })
                }}
                renderRightActions={() => (
                  <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                    {/* Swap */}
                    <TouchableOpacity
                      onPress={() => {
                        swipeableRefs.current.get(String(se.id))?.close()
                        navigation.navigate('WorkoutPreviewExercisePicker', {
                          sessionId,
                          swapExerciseId: se.id,
                          swapMuscleGroupId: ex.muscle_groups?.find(m => m.is_primary)?.id.toString(),
                        })
                      }}
                      style={{
                        width: 64,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 16,
                        marginRight: 8,
                        backgroundColor: colors.secondary,
                      }}
                    >
                      <ArrowUpDown size={20} color={colors.textButton} />
                    </TouchableOpacity>
                    {/* Edit */}
                    <TouchableOpacity
                      onPress={() => {
                        swipeableRefs.current.get(String(se.id))?.close()
                        openEditModal(exerciseDetail)
                      }}
                      style={{
                        width: 64,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 16,
                        marginRight: 8,
                        backgroundColor: colors.primary,
                      }}
                    >
                      <Edit2 size={20} color={colors.textButton} />
                    </TouchableOpacity>
                    {/* Delete */}
                    <TouchableOpacity
                      onPress={() => {
                        swipeableRefs.current.get(String(se.id))?.close()
                        handleSwipeRemove(exerciseDetail)
                      }}
                      style={{
                        width: 64,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 16,
                        backgroundColor: colors.error,
                      }}
                    >
                      <Trash2 size={20} color={colors.textButton} />
                    </TouchableOpacity>
                  </View>
                )}
                overshootRight={false}
              >
                <SortableItemSurface
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 16, borderWidth: 1 }}
                  backgroundColor={colors.bgSurface}
                  activeBackgroundColor={colors.bgElevated}
                  borderColor={withAlpha(colors.primary, 0)}
                  activeBorderColor={withAlpha(colors.primary, 0.251)}
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ExerciseDetail', { exerciseName: ex.name })}
                    activeOpacity={0.7}
                  >
                    {ex.image ? (
                      <Image
                        source={{ uri: ex.image }}
                        style={{ width: 64, height: 64, borderRadius: 12 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: colors.bgElevated }}
                      />
                    )}
                  </TouchableOpacity>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-bold mb-1 leading-tight" style={{ color: colors.textPrimary }} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      <Text style={{ color: colors.primary }}>{se.target_sets} sets</Text>
                      <Text style={{ color: colors.textMuted }}> × </Text>
                      <Text style={{ color: colors.primary }}>
                        {formatRepRange(se.min_target_reps ?? 0, se.max_target_reps ?? 0)} reps
                      </Text>
                      {se.target_weight && se.target_weight > 0 ? (
                        <>
                          <Text style={{ color: colors.textMuted }}> × </Text>
                          <Text style={{ color: colors.primary }}>{formatWeight(se.target_weight)} {weightUnit}</Text>
                        </>
                      ) : null}
                    </Text>
                  </View>
                  {/* Drag handle — hold to lift the row; the list adds the haptics */}
                  <SortableHandle style={{ padding: 8 }}>
                    <GripVertical size={20} color={colors.textMuted} />
                  </SortableHandle>
                </SortableItemSurface>
              </ReanimatedSwipeable>
            )
          }}
        />

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
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{ backgroundColor: colors.bgSurface, borderRadius: 24, width: '90%', alignSelf: 'center'}}>
                  <SafeAreaView edges={['bottom']} style={{ padding: 24 }}>
                    <Text className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
                      Edit Exercise
                    </Text>
                    <Text className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                      {selectedExercise?.session_exercise.exercise?.name}
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
                      <Text style={{ fontSize: 11, fontWeight: '600', marginBottom: 6, color: colors.textSecondary, textTransform: 'uppercase' }}>Weight ({weightUnit})</Text>
                      <TextInput
                        value={editWeight}
                        onChangeText={(t) => setEditWeight(sanitizeDecimalText(t))}
                        keyboardType="decimal-pad"
                        style={{ backgroundColor: colors.bgElevated, borderRadius: 12, padding: 12, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}
                      />
                    </View>
                    {editError && (
                      <Text
                        style={{
                          color: colors.error,
                          fontSize: 13,
                          fontWeight: '600',
                          textAlign: 'center',
                          marginBottom: 12,
                        }}
                      >
                        {editError}
                      </Text>
                    )}
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
                        <Text style={{ color: colors.textButton, fontWeight: '700' }}>
                          {updateExercise.isPending ? 'Saving...' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </SafeAreaView>
                </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={cancelVisible}
        onClose={() => setCancelVisible(false)}
        title="Cancel Workout"
        message="Are you sure you want to cancel this workout?"
        confirmLabel="Cancel Workout"
        cancelLabel="Keep it"
        destructive
        onConfirm={performCancel}
      />
    </SafeAreaView>
  )
}
