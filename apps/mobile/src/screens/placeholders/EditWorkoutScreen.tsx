import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTemplate, useUpdateTemplate, useDeleteTemplate } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { FormField } from '../../components/ui/FormField'
import { Button, BUTTON, useButtonContentColor } from '../../components/ui/Button'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { SCREEN } from '../../constants/layout'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Trash2, Settings2 } from 'lucide-react-native'
import { showToast } from '../../lib/toast'
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
  const secondaryColor = useButtonContentColor('secondary')
  const destructiveColor = useButtonContentColor('destructive')
  const { data: template, isLoading } = useTemplate(templateId)
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const [deleteVisible, setDeleteVisible] = useState(false)

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
      showToast(e?.message || 'Failed to save workout', 'error')
    }
  }

  async function performDelete() {
    try {
      await deleteTemplate.mutateAsync(templateId)
      navigation.goBack()
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete workout', 'error')
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottom }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Edit Workout" onBack={() => navigation.goBack()} titleLines={1} />

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
              label={isSubmitting ? 'Saving...' : 'Save Changes'}
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            />

            <Button
              label="Manage Exercises"
              variant="secondary"
              icon={<Settings2 size={BUTTON.md.icon} color={secondaryColor} />}
              style={{ marginTop: 16 }}
              onPress={() => navigation.navigate('ManageExercises', { templateId })}
            />

            <Button
              label="Delete Workout"
              variant="destructive"
              icon={<Trash2 size={BUTTON.md.icon} color={destructiveColor} />}
              style={{ marginTop: 12 }}
              onPress={() => setDeleteVisible(true)}
            />
          </>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        title="Delete Workout"
        message={`Are you sure you want to delete "${template?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={performDelete}
      />
    </SafeAreaView>
  )
}
