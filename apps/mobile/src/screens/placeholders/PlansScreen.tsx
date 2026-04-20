import { useState, useMemo } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Plus, Dumbbell, MoreVertical, ChevronRight } from 'lucide-react-native'
import {
  usePlans,
  usePrograms,
  useBrowsableRoutines,
  useDeletePlan,
  useUpdatePlan,
  useStartSession,
} from '@fit-nation/shared'
import type { PlanResource, WorkoutTemplateResource, RoutinePlanResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation/types'

type Nav = NativeStackNavigationProp<AppStackParamList>
type PlansTab = 'customPlans' | 'programs'

export function PlansScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<Nav>()
  const [activeTab, setActiveTab] = useState<PlansTab>('customPlans')

  const { data: plans = [], isLoading: isPlansLoading, refetch: refetchPlans } = usePlans()
  const { data: programs = [], isLoading: isProgramsLoading } = usePrograms()
  const { data: browsableRoutines = [] } = useBrowsableRoutines()
  const deletePlan = useDeletePlan()
  const updatePlan = useUpdatePlan()
  const startSession = useStartSession()

  const activePlan = useMemo(
    () => plans.find((p: PlanResource) => p.is_active) || null,
    [plans]
  )
  const allOtherPlans = useMemo(
    () => plans.filter((p: PlanResource) => !p.is_active),
    [plans]
  )

  const sortedWorkouts = (templates: WorkoutTemplateResource[] | undefined) => {
    if (!templates) return []
    return [...templates].sort((a, b) => {
      if (a.day_of_week === null && b.day_of_week === null) return 0
      if (a.day_of_week === null) return 1
      if (b.day_of_week === null) return -1
      return a.day_of_week - b.day_of_week
    })
  }

  const showPlanActionSheet = (plan: PlanResource) => {
    const options = [
      plan.is_active ? 'Deactivate' : 'Set as Active',
      'Edit Plan',
      'Add Workout',
      'Delete Plan',
      'Cancel',
    ]
    const destructiveIndex = 3
    const cancelIndex = 4

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: destructiveIndex,
          cancelButtonIndex: cancelIndex,
          title: plan.name,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) handleToggleActive(plan)
          else if (buttonIndex === 1) navigation.navigate('EditPlan', { planId: plan.id })
          else if (buttonIndex === 2) navigation.navigate('CreateWorkout')
          else if (buttonIndex === 3) confirmDeletePlan(plan)
        }
      )
    } else {
      Alert.alert(plan.name, 'Choose an action', [
        {
          text: plan.is_active ? 'Deactivate' : 'Set as Active',
          onPress: () => handleToggleActive(plan),
        },
        { text: 'Edit Plan', onPress: () => navigation.navigate('EditPlan', { planId: plan.id }) },
        { text: 'Add Workout', onPress: () => navigation.navigate('CreateWorkout') },
        { text: 'Delete Plan', style: 'destructive', onPress: () => confirmDeletePlan(plan) },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  const showWorkoutActionSheet = (template: WorkoutTemplateResource, planName: string) => {
    const options = ['Start Workout', 'Manage Exercises', 'Edit Workout', 'Cancel']
    const cancelIndex = 3
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, title: template.name },
        (buttonIndex) => {
          if (buttonIndex === 0) handleStartWorkout(template.id)
          else if (buttonIndex === 1)
            navigation.navigate('ManageExercises', { templateId: template.id })
          else if (buttonIndex === 2)
            navigation.navigate('EditWorkout', { templateId: template.id })
        }
      )
    } else {
      Alert.alert(template.name, 'Choose an action', [
        { text: 'Start Workout', onPress: () => handleStartWorkout(template.id) },
        {
          text: 'Manage Exercises',
          onPress: () => navigation.navigate('ManageExercises', { templateId: template.id }),
        },
        {
          text: 'Edit Workout',
          onPress: () => navigation.navigate('EditWorkout', { templateId: template.id }),
        },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  const handleToggleActive = async (plan: PlanResource) => {
    try {
      await updatePlan.mutateAsync({
        planId: plan.id,
        data: { name: plan.name, description: plan.description || '', is_active: !plan.is_active },
      })
    } catch (e) {
      console.error('Toggle plan failed', e)
    }
  }

  const confirmDeletePlan = (plan: PlanResource) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"? This will also delete all workouts in this plan.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan.mutateAsync(plan.id)
            } catch (e) {
              console.error('Delete plan failed', e)
            }
          },
        },
      ]
    )
  }

  const handleStartWorkout = async (templateId: number) => {
    try {
      const response = await startSession.mutateAsync(templateId)
      const session = (response as any).data?.session || (response as any).data
      if (session?.id) {
        navigation.navigate('WorkoutSession', { sessionId: String(session.id) })
      }
    } catch (e) {
      console.error('Start workout failed', e)
    }
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between pt-8 pb-6">
          <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
            Plans
          </Text>
          {activeTab === 'customPlans' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('CreatePlan')}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: `${colors.primary}22` }}
            >
              <Plus size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Segment Switcher */}
        <View
          className="flex-row rounded-full p-1 mb-6"
          style={{ backgroundColor: colors.segmentTrack }}
        >
          {(['customPlans', 'programs'] as PlansTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 rounded-full py-3 items-center"
              style={{
                backgroundColor: activeTab === tab ? colors.segmentActive : 'transparent',
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: activeTab === tab ? colors.textPrimary : colors.textSecondary }}
              >
                {tab === 'customPlans' ? 'Custom Plans' : 'Programs'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Custom Plans Tab ── */}
        {activeTab === 'customPlans' && (
          <>
            {isPlansLoading ? (
              <>
                <SkeletonBox height={160} className="mb-4" />
                <SkeletonBox height={100} className="mb-4" />
                <SkeletonBox height={100} className="mb-4" />
              </>
            ) : (
              <>
                {/* Active Plan */}
                {activePlan ? (
                  <View className="mb-6">
                    <Text
                      className="text-xs font-bold uppercase tracking-wider mb-3"
                      style={{ color: colors.primary }}
                    >
                      Active Plan
                    </Text>
                    <View
                      className="rounded-3xl p-6"
                      style={{ backgroundColor: colors.bgSurface }}
                    >
                      <View className="flex-row items-start justify-between mb-4">
                        <View className="flex-1 mr-3">
                          <Text
                            className="text-xl font-bold mb-2"
                            style={{ color: colors.textPrimary }}
                          >
                            {activePlan.name}
                          </Text>
                          {activePlan.description ? (
                            <Text
                              className="text-sm leading-relaxed"
                              style={{ color: colors.textSecondary }}
                            >
                              {activePlan.description}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => showPlanActionSheet(activePlan)}
                          className="w-9 h-9 rounded-full items-center justify-center"
                          style={{ backgroundColor: colors.bgElevated }}
                        >
                          <MoreVertical size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>

                      <View className="flex-row items-center gap-4 mb-4">
                        <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
                          {sortedWorkouts(activePlan.workout_templates).length} WORKOUT
                          {sortedWorkouts(activePlan.workout_templates).length !== 1 ? 'S' : ''}
                        </Text>
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.success}20` }}>
                          <Text className="text-xs font-medium" style={{ color: colors.success }}>
                            ACTIVE
                          </Text>
                        </View>
                      </View>

                      <View
                        className="h-px mb-4"
                        style={{ backgroundColor: colors.bgElevated }}
                      />

                      {sortedWorkouts(activePlan.workout_templates).length === 0 ? (
                        <Text
                          className="text-sm text-center py-3"
                          style={{ color: colors.textMuted }}
                        >
                          No workouts in this plan yet.
                        </Text>
                      ) : (
                        sortedWorkouts(activePlan.workout_templates).map((template) => (
                          <TouchableOpacity
                            key={template.id}
                            onPress={() =>
                              navigation.navigate('ManageExercises', { templateId: template.id })
                            }
                            className="flex-row items-center justify-between p-4 rounded-xl mb-2"
                            style={{ backgroundColor: colors.bgElevated }}
                          >
                            <View className="flex-row items-center gap-3 flex-1">
                              <View
                                className="w-8 h-8 rounded-lg items-center justify-center"
                                style={{ backgroundColor: `${colors.primary}18` }}
                              >
                                <Dumbbell size={15} color={colors.primary} />
                              </View>
                              <Text
                                className="text-sm font-medium flex-1"
                                style={{ color: colors.textPrimary }}
                                numberOfLines={1}
                              >
                                {template.name}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => showWorkoutActionSheet(template, activePlan.name)}
                              className="w-8 h-8 rounded-full items-center justify-center"
                              style={{ backgroundColor: colors.bgSurface }}
                            >
                              <MoreVertical size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  </View>
                ) : (
                  <View
                    className="rounded-2xl p-6 mb-6 items-center"
                    style={{ backgroundColor: colors.bgSurface }}
                  >
                    <Text className="font-semibold mb-3" style={{ color: colors.textSecondary }}>
                      No active plan
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('CreatePlan')}
                      className="flex-row items-center gap-2 px-4 py-2 rounded-xl"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Plus size={16} color="#fff" />
                      <Text className="font-semibold text-white text-sm">Create Plan</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* All Other Plans */}
                <Text
                  className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: colors.textSecondary }}
                >
                  All Plans
                </Text>

                {allOtherPlans.length === 0 ? (
                  <Text className="text-sm text-center py-6" style={{ color: colors.textMuted }}>
                    No other plans yet.
                  </Text>
                ) : (
                  allOtherPlans.map((plan: PlanResource) => (
                    <View
                      key={plan.id}
                      className="rounded-2xl p-5 mb-3"
                      style={{ backgroundColor: colors.bgSurface }}
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <Text
                          className="text-base font-bold flex-1 mr-2"
                          style={{ color: colors.textPrimary }}
                          numberOfLines={1}
                        >
                          {plan.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => showPlanActionSheet(plan)}
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: colors.bgElevated }}
                        >
                          <MoreVertical size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-xs" style={{ color: colors.textMuted }}>
                        {(plan.workout_templates?.length ?? 0)} workout
                        {(plan.workout_templates?.length ?? 0) !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  ))
                )}

                {/* Recommended routines */}
                {browsableRoutines.length > 0 && (
                  <View className="mt-6">
                    <Text
                      className="text-base font-bold mb-3"
                      style={{ color: colors.primary }}
                    >
                      Recommended Workouts
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
                    >
                      {browsableRoutines.map((routine: RoutinePlanResource) => (
                        <TouchableOpacity
                          key={routine.id}
                          onPress={() =>
                            navigation.navigate('RoutineDetail', { routineId: routine.id })
                          }
                          className="w-44 rounded-2xl p-4"
                          style={{ backgroundColor: colors.bgSurface }}
                        >
                          <Text
                            className="font-bold text-sm mb-1"
                            style={{ color: colors.textPrimary }}
                            numberOfLines={1}
                          >
                            {routine.name}
                          </Text>
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            {routine.workout_templates?.length ?? 0} workouts
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* ── Programs Tab ── */}
        {activeTab === 'programs' && (
          <>
            {isProgramsLoading ? (
              <>
                <SkeletonBox height={100} className="mb-3" />
                <SkeletonBox height={100} className="mb-3" />
              </>
            ) : programs.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-base mb-2" style={{ color: colors.textSecondary }}>
                  No programs yet
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ProgramLibrary')}
                  className="px-5 py-3 rounded-xl"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="font-semibold text-white">Browse Program Library</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {programs.map((prog: any) => (
                  <TouchableOpacity
                    key={prog.id}
                    onPress={() => navigation.navigate('ProgramDetail', { programId: prog.id })}
                    className="rounded-2xl p-5 mb-3 flex-row items-center"
                    style={{ backgroundColor: colors.bgSurface }}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text
                          className="text-base font-bold"
                          style={{ color: colors.textPrimary }}
                          numberOfLines={1}
                        >
                          {prog.name}
                        </Text>
                        {prog.is_active && (
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${colors.success}20` }}
                          >
                            <Text className="text-xs font-medium" style={{ color: colors.success }}>
                              Active
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs" style={{ color: colors.textMuted }}>
                        {prog.duration_weeks
                          ? `${prog.duration_weeks} weeks`
                          : `${prog.workout_templates?.length ?? 0} workouts`}
                        {prog.progress_percentage != null
                          ? ` • ${prog.progress_percentage}% done`
                          : ''}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  onPress={() => navigation.navigate('ProgramLibrary')}
                  className="py-4 rounded-2xl items-center mt-2"
                  style={{
                    backgroundColor: colors.bgSurface,
                    borderWidth: 1,
                    borderColor: `${colors.primary}30`,
                  }}
                >
                  <Text className="font-semibold" style={{ color: colors.primary }}>
                    Browse Program Library
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
