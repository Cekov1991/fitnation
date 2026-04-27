import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { planSchema, useCreatePlan } from '@fit-nation/shared'
import type { PlanFormData } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { FormField } from '../../components/ui/FormField'
import { Button } from '../../components/ui/Button'
import { ArrowLeft } from 'lucide-react-native'
import { GradientText } from '../../components/ui/GradientText'
import type { AppScreenProps } from '../../navigation/types'

type Props = AppScreenProps<'CreatePlan'>

export function CreatePlanScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const createPlan = useCreatePlan()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: '', description: '', is_active: false },
  })

  const isActive = watch('is_active')

  async function onSubmit(data: PlanFormData) {
    try {
      await createPlan.mutateAsync({
        name: data.name,
        description: data.description,
        is_active: data.is_active,
      })
      navigation.navigate('Tabs', { screen: 'Plans' })
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create plan')
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
          <GradientText style={{ fontSize: 30, fontWeight: '700' }}>
            Create Plan
          </GradientText>
        </View>

        {/* Form Fields */}
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
          label={isSubmitting ? 'Creating...' : 'CREATE PLAN'}
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
