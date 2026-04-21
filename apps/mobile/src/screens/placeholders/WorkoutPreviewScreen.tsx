import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Check, RefreshCw, X, Edit2, Plus } from 'lucide-react-native'
import {
  useSession,
  useConfirmDraftSession,
  useRegenerateDraftSession,
  useCancelSession,
  useRemoveSessionExercise,
  useUpdateSessionExercise,
  formatRepRange,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { ActionSheet } from '../../components/ui/ActionSheet'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { AppScreenProps } from '../../navigation/types'
import type { SessionExerciseDetail } from '@fit-nation/shared'

type Props = AppScreenProps<'WorkoutPreview'>

export function WorkoutPreviewScreen({ route, navigation }: Props) {
  const { sessionId } = route.params
  const { colors } = useTheme()
  const numericSessionId = Number(sessionId)

  const { data: draftSession, isLoading, isError, refetch } = useSession(numericSessionId)
  const confirmDraft = useConfirmDraftSession()
  const regenerateDraft = useRegenerateDraftSession()
  const cancelSession = useCancelSession()
  const removeExercise = useRemoveSessionExercise()
  const updateExercise = useUpdateSessionExercise()

  const [selectedExercise, setSelectedExercise] = useState<SessionExerciseDetail | null>(null)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editSets, setEditSets] = useState('3')
  const [editMinReps, setEditMinReps] = useState('8')
  const [editMaxReps, setEditMaxReps] = useState('12')
  const [editWeight, setEditWeight] = useState('0')

  const handleConfirm = async () => {
    try {
      await confirmDraft.mutateAsync(numericSessionId)
      navigation.replace('WorkoutSession', { sessionId })
    } catch (error) {
      console.error('Failed to confirm workout:', error)
    }
  }

  const handleRegenerate = async () => {
    try {
      const response = await regenerateDraft.mutateAsync({
        sessionId: numericSessionId,
        data: {},
      })
      const newSessionId = response.data?.id
      if (newSessionId) {
        navigation.replace('WorkoutPreview', { sessionId: newSessionId.toString() })
      }
    } catch (error) {
      console.error('Failed to regenerate:', error)
    }
  }

  const handleCancel = async () => {
    Alert.alert('Cancel Workout', 'Are you sure you want to cancel this workout?', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelSession.mutateAsync(numericSessionId)
            navigation.goBack()
          } catch (error) {
            console.error('Failed to cancel session:', error)
          }
        },
      },
    ])
  }

  const openEditMenu = (exerciseDetail: SessionExerciseDetail) => {
    setSelectedExercise(exerciseDetail)
    setEditSets(String(exerciseDetail.session_exercise.target_sets ?? 3))
    setEditMinReps(String(exerciseDetail.session_exercise.min_target_reps ?? 8))
    setEditMaxReps(String(exerciseDetail.session_exercise.max_target_reps ?? 12))
    setEditWeight(String(exerciseDetail.session_exercise.target_weight ?? 0))
    setShowActionSheet(true)
  }

  const handleRemove = async () => {
    if (!selectedExercise) return
    try {
      await removeExercise.mutateAsync({
        sessionId: numericSessionId,
        exerciseId: selectedExercise.session_exercise.id,
      })
    } catch (error) {
      console.error('Failed to remove exercise:', error)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedExercise) return
    try {
      await updateExercise.mutateAsync({
        sessionId: numericSessionId,
        exerciseId: selectedExercise.session_exercise.id,
        data: {
          target_sets: parseInt(editSets, 10),
          min_target_reps: parseInt(editMinReps, 10),
          max_target_reps: parseInt(editMaxReps, 10),
          target_weight: parseFloat(editWeight) || 0,
        },
      })
      setShowEditModal(false)
    } catch (error) {
      console.error('Failed to update exercise:', error)
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
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const exercises: SessionExerciseDetail[] = (draftSession as any).exercises ?? []

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-6 mb-6">
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
              backgroundColor: `${colors.primary}08`,
              borderColor: `${colors.primary}20`,
            }}
          >
            <Text className="text-sm" style={{ color: colors.textPrimary }}>
              {(draftSession as any).rationale}
            </Text>
          </View>
        )}

        {/* Exercises */}
        <View className="mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>
            Exercises ({exercises.length})
          </Text>
          <View className="gap-3">
            {exercises.map((exerciseDetail: SessionExerciseDetail) => {
              const se = exerciseDetail.session_exercise
              const ex = se.exercise
              if (!ex) return null
              return (
                <TouchableOpacity
                  key={se.id}
                  onPress={() => navigation.navigate('ExerciseDetail', { exerciseName: ex.name })}
                  className="flex-row items-center gap-4 p-1 border rounded-2xl"
                  style={{ backgroundColor: colors.bgSurface, borderColor: `${colors.textMuted}20` }}
                  activeOpacity={0.8}
                >
                  {ex.image ? (
                    <Image
                      source={{ uri: ex.image }}
                      style={{ width: 80, height: 80, borderRadius: 12 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: colors.bgElevated }}
                    />
                  )}
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-bold mb-1 leading-tight" style={{ color: colors.textPrimary }}>
                      {ex.name}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.textMuted }}>
                      <Text style={{ color: colors.primary }}>{se.target_sets} sets</Text>
                      <Text style={{ color: `${colors.textMuted}80` }}> × </Text>
                      <Text style={{ color: colors.primary }}>
                        {formatRepRange(se.min_target_reps ?? 0, se.max_target_reps ?? 0)} reps
                      </Text>
                      {se.target_weight && se.target_weight > 0 ? (
                        <>
                          <Text style={{ color: `${colors.textMuted}80` }}> × </Text>
                          <Text style={{ color: colors.primary }}>{se.target_weight} kg</Text>
                        </>
                      ) : null}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation()
                      openEditMenu(exerciseDetail)
                    }}
                    className="p-3"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Edit2 size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Add Exercise Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('WorkoutPreviewExercisePicker', { sessionId })}
            className="w-full py-6 border-2 border-dashed rounded-2xl mt-4 items-center justify-center"
            style={{ borderColor: `${colors.primary}50` }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Plus size={20} color={colors.primary} />
              </View>
              <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                Add Exercise
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="gap-3 mt-4">
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
                <Check size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
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
              borderColor: `${colors.textMuted}40`,
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
              borderColor: `${colors.error}40`,
              backgroundColor: 'transparent',
              opacity: cancelSession.isPending ? 0.6 : 1,
            }}
            activeOpacity={0.8}
          >
            <X size={20} color={colors.error} />
            <Text style={{ color: colors.error, fontSize: 16, fontWeight: '700' }}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Sheet */}
      <ActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title={selectedExercise?.session_exercise.exercise?.name}
        actions={[
          {
            label: 'Edit Sets & Reps',
            onPress: () => {
              setShowActionSheet(false)
              setShowEditModal(true)
            },
          },
          {
            label: 'Remove Exercise',
            destructive: true,
            onPress: handleRemove,
          },
        ]}
      />

      {/* Edit Sets/Reps Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <View
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.bgSurface }}
          >
            <Text className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
              Edit Exercise
            </Text>
            <Text className="text-sm mb-6" style={{ color: colors.textSecondary }}>
              {selectedExercise?.session_exercise.exercise?.name}
            </Text>
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>Sets</Text>
                <TextInput
                  value={editSets}
                  onChangeText={setEditSets}
                  keyboardType="number-pad"
                  className="p-3 rounded-xl text-center text-lg font-bold"
                  style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>Min Reps</Text>
                <TextInput
                  value={editMinReps}
                  onChangeText={setEditMinReps}
                  keyboardType="number-pad"
                  className="p-3 rounded-xl text-center text-lg font-bold"
                  style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>Max Reps</Text>
                <TextInput
                  value={editMaxReps}
                  onChangeText={setEditMaxReps}
                  keyboardType="number-pad"
                  className="p-3 rounded-xl text-center text-lg font-bold"
                  style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary }}
                />
              </View>
            </View>
            <View className="mb-6">
              <Text className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>Target Weight (kg)</Text>
              <TextInput
                value={editWeight}
                onChangeText={setEditWeight}
                keyboardType="decimal-pad"
                className="p-3 rounded-xl text-lg font-bold"
                style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary }}
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
