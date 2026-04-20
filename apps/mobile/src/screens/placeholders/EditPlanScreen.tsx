import { useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { planSchema, usePlan, useUpdatePlan, useDeletePlan } from '@fit-nation/shared'
import type { PlanFormData } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { FormField } from '../../components/ui/FormField'
import { Button } from '../../components/ui/Button'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ArrowLeft, Trash2 } from 'lucide-react-native'
import type { AppScreenProps } from '../../navigation/types'

type Props = AppScreenProps<'EditPlan'>

export function EditPlanScreen({ route, navigation }: Props) {
  const { planId } = route.params
  const { colors } = useTheme()
  const { data: plan, isLoading } = usePlan(planId)
  const updatePlan = useUpdatePlan()
  const deletePlan = useDeletePlan()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: '', description: '', is_active: false },
  })

  const isActive = watch('is_active')

  useEffect(() => {
    if (plan) {
      reset({
        name: plan.name,
        description: plan.description || '',
        is_active: plan.is_active,
      })
    }
  }, [plan, reset])

  async function onSubmit(data: PlanFormData) {
    try {
      await updatePlan.mutateAsync({
        planId,
        data: { name: data.name, description: data.description, is_active: data.is_active },
      })
      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save plan')
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan?.name}"? This will also delete all workouts in this plan.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan.mutateAsync(planId)
              navigation.goBack()
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete plan')
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
          <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
            Edit Plan
          </Text>
        </View>

        {isLoading ? (
          <>
            <SkeletonBox height={60} className="mb-4" />
            <SkeletonBox height={100} className="mb-4" />
            <SkeletonBox height={90} className="mb-4" />
          </>
        ) : (
          <>
            <FormField
              control={control}
              name="name"
              label="Plan Name *"
              placeholder="e.g., Bulking Plan"
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

            {/* Active Plan Toggle */}
            <View
              className="rounded-2xl p-5 mb-6"
              style={{ backgroundColor: colors.bgSurface }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                  Active Plan
                </Text>
                <TouchableOpacity
                  onPress={() => setValue('is_active', !isActive)}
                  className="w-14 h-8 rounded-full"
                  style={{ backgroundColor: isActive ? colors.success : colors.bgElevated }}
                >
                  <View
                    className="absolute top-1 w-6 h-6 rounded-full"
                    style={{
                      backgroundColor: colors.textPrimary,
                      transform: [{ translateX: isActive ? 24 : 2 }],
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 2,
                      elevation: 3,
                    }}
                  />
                </TouchableOpacity>
              </View>
              <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                Active plans are highlighted and used as the default when creating workouts.
              </Text>
            </View>

            <Button
              label={isSubmitting ? 'Saving...' : 'SAVE CHANGES'}
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            />

            {/* Delete Plan */}
            <TouchableOpacity
              onPress={confirmDelete}
              className="flex-row items-center justify-center gap-2 mt-4 py-4 rounded-2xl"
              style={{ backgroundColor: `${colors.error}15` }}
            >
              <Trash2 size={18} color={colors.error} />
              <Text className="font-semibold" style={{ color: colors.error }}>
                Delete Plan
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
