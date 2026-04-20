import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTemplate, useUpdateTemplate, useDeleteTemplate } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { FormField } from '../../components/ui/FormField'
import { Button } from '../../components/ui/Button'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ArrowLeft, Trash2, Settings2 } from 'lucide-react-native'
import type { AppScreenProps } from '../../navigation/types'

const workoutFormSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
})
type WorkoutFormData = z.infer<typeof workoutFormSchema>

type Props = AppScreenProps<'EditWorkout'>

export function EditWorkoutScreen({ route, navigation }: Props) {
  const { templateId } = route.params
  const { colors } = useTheme()
  const { data: template, isLoading } = useTemplate(templateId)
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        description: template.description || '',
      })
    }
  }, [template, reset])

  async function onSubmit(data: WorkoutFormData) {
    try {
      await updateTemplate.mutateAsync({
        templateId,
        data: { name: data.name, description: data.description },
      })
      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save workout')
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${template?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTemplate.mutateAsync(templateId)
              navigation.goBack()
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete workout')
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center gap-4 pt-6 mb-8">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.bgElevated }}
          >
            <ArrowLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold flex-1" style={{ color: colors.primary }} numberOfLines={1}>
            Edit Workout
          </Text>
        </View>

        {isLoading ? (
          <>
            <SkeletonBox height={60} className="mb-4" />
            <SkeletonBox height={100} className="mb-4" />
          </>
        ) : (
          <>
            <FormField
              control={control}
              name="name"
              label="Workout Name *"
              placeholder="e.g., Push Day"
              error={errors.name?.message}
            />
            <FormField
              control={control}
              name="description"
              label="Description"
              placeholder="Optional description"
              multiline
              error={errors.description?.message}
            />

            <Button
              label={isSubmitting ? 'Saving...' : 'SAVE CHANGES'}
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            />

            {/* Manage Exercises Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ManageExercises', { templateId })}
              className="flex-row items-center justify-center gap-2 mt-4 py-4 rounded-2xl"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Settings2 size={18} color={colors.primary} />
              <Text className="font-semibold" style={{ color: colors.primary }}>
                Manage Exercises
              </Text>
            </TouchableOpacity>

            {/* Delete Workout */}
            <TouchableOpacity
              onPress={confirmDelete}
              className="flex-row items-center justify-center gap-2 mt-3 py-4 rounded-2xl"
              style={{ backgroundColor: `${colors.error}15` }}
            >
              <Trash2 size={18} color={colors.error} />
              <Text className="font-semibold" style={{ color: colors.error }}>
                Delete Workout
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
