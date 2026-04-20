import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePlans, useCreateTemplate } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { FormField } from '../../components/ui/FormField'
import { Button } from '../../components/ui/Button'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ArrowLeft, ChevronDown } from 'lucide-react-native'
import { useState } from 'react'
import type { AppScreenProps } from '../../navigation/types'
import type { PlanResource } from '@fit-nation/shared'

const workoutFormSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
})
type WorkoutFormData = z.infer<typeof workoutFormSchema>

type Props = AppScreenProps<'CreateWorkout'>

export function CreateWorkoutScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { data: plans = [], isLoading: isPlansLoading } = usePlans()
  const createTemplate = useCreateTemplate()
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [selectedPlanName, setSelectedPlanName] = useState<string>('')

  const activePlan = (plans as PlanResource[]).find((p) => p.is_active)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: { name: '', description: '' },
  })

  const planId = selectedPlanId ?? activePlan?.id ?? null

  async function onSubmit(data: WorkoutFormData) {
    if (!planId) {
      Alert.alert('Select a Plan', 'Please select a plan first.')
      return
    }
    try {
      const result = await createTemplate.mutateAsync({
        plan_id: planId,
        name: data.name,
        description: data.description,
      })
      const templateId = (result as any)?.data?.id ?? (result as any)?.id
      if (templateId) {
        navigation.replace('ManageExercises', { templateId })
      } else {
        navigation.goBack()
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create workout')
    }
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
          <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
            Create Workout
          </Text>
        </View>

        {/* Plan Selector */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
            Plan *
          </Text>
          {isPlansLoading ? (
            <SkeletonBox height={52} />
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setPlanDropdownOpen(!planDropdownOpen)}
                className="flex-row items-center justify-between px-4 py-4 rounded-xl"
                style={{ backgroundColor: colors.bgElevated }}
              >
                <Text
                  style={{
                    color: planId ? colors.textPrimary : colors.textMuted,
                    fontSize: 16,
                  }}
                >
                  {selectedPlanName || activePlan?.name || 'Select a plan'}
                </Text>
                <ChevronDown
                  size={20}
                  color={colors.textSecondary}
                  style={{ transform: [{ rotate: planDropdownOpen ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {planDropdownOpen && (plans as PlanResource[]).length > 0 && (
                <View
                  className="mt-1 rounded-2xl overflow-hidden"
                  style={{ backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.bgSurface }}
                >
                  {(plans as PlanResource[]).map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => {
                        setSelectedPlanId(p.id)
                        setSelectedPlanName(p.name)
                        setPlanDropdownOpen(false)
                      }}
                      className="px-5 py-3"
                      style={{
                        backgroundColor:
                          (selectedPlanId ?? activePlan?.id) === p.id
                            ? `${colors.primary}18`
                            : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          color:
                            (selectedPlanId ?? activePlan?.id) === p.id
                              ? colors.primary
                              : colors.textPrimary,
                          fontSize: 15,
                        }}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

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
          label={isSubmitting ? 'Creating...' : 'CREATE WORKOUT'}
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
