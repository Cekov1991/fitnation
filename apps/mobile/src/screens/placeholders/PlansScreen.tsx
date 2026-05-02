import { useState, useMemo } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Plus, Dumbbell, MoreVertical, ChevronRight, Calendar, CheckCircle, Edit, PlusCircle, Trash2, Play, Settings, XCircle } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import {
  usePlans,
  usePrograms,
  useProgramLibrary,
  useBrowsableRoutines,
  useDeletePlan,
  useDeleteTemplate,
  useUpdatePlan,
  useUpdateProgram,
  useDeleteProgram,
  useStartSession,
} from '@fit-nation/shared'
import type {
  PlanResource,
  WorkoutTemplateResource,
  RoutinePlanResource,
  ProgramResource,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { GradientText } from '../../components/ui/GradientText'
import { PlanTypeSwitcher, type PlanType } from '../../components/ui/PlanTypeSwitcher'
import { ActionSheet } from '../../components/ui/ActionSheet'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation/types'

type Nav = NativeStackNavigationProp<AppStackParamList>

export function PlansScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<Nav>()
  const [activeTab, setActiveTab] = useState<PlanType>('programs')
  const [planSheet, setPlanSheet] = useState<PlanResource | null>(null)
  const [workoutSheet, setWorkoutSheet] = useState<WorkoutTemplateResource | null>(null)
  const [programSheet, setProgramSheet] = useState<ProgramResource | null>(null)
  const [planToDelete, setPlanToDelete] = useState<PlanResource | null>(null)
  const [workoutToDelete, setWorkoutToDelete] = useState<WorkoutTemplateResource | null>(null)
  const [programToDelete, setProgramToDelete] = useState<ProgramResource | null>(null)

  // ── Data ──
  const { data: plans = [], isLoading: isPlansLoading } = usePlans()
  const { data: programs = [], isLoading: isProgramsLoading } = usePrograms()
  const { data: libraryPrograms = [] } = useProgramLibrary()
  const { data: browsableRoutines = [] } = useBrowsableRoutines()
  const deletePlan = useDeletePlan()
  const deleteTemplate = useDeleteTemplate()
  const updatePlan = useUpdatePlan()
  const updateProgram = useUpdateProgram()
  const deleteProgram = useDeleteProgram()
  const startSession = useStartSession()

  // ── Custom Plans ──
  const activePlan = useMemo(
    () => plans.find((p: PlanResource) => p.is_active) || null,
    [plans],
  )
  const allOtherPlans = useMemo(
    () => plans.filter((p: PlanResource) => !p.is_active),
    [plans],
  )

  // ── Programs ──
  const hasNonAutoPrograms = useMemo(
    () => programs.some((p: ProgramResource) => !p.is_auto_generated),
    [programs],
  )
  const showProgramsTab = hasNonAutoPrograms || libraryPrograms.length > 0
  // Mirror web: if Programs tab is hidden, force custom plans
  const effectiveTab: PlanType = showProgramsTab ? activeTab : 'customPlans'

  const visiblePrograms = useMemo(
    () => programs.filter((p: ProgramResource) => !p.is_auto_generated),
    [programs],
  )
  const activeProgram = useMemo(
    () => visiblePrograms.find((p: ProgramResource) => p.is_active) || null,
    [visiblePrograms],
  )
  const inactivePrograms = useMemo(
    () => visiblePrograms.filter((p: ProgramResource) => !p.is_active),
    [visiblePrograms],
  )

  // ── Helpers ──
  const sortedWorkouts = (templates: WorkoutTemplateResource[] | null | undefined) => {
    if (!templates) return []
    return [...templates].sort((a, b) => {
      if (a.day_of_week === null && b.day_of_week === null) return 0
      if (a.day_of_week === null) return 1
      if (b.day_of_week === null) return -1
      return a.day_of_week - b.day_of_week
    })
  }

  // ── Handlers ──
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

  const handleTogglePlanActive = async (plan: PlanResource) => {
    try {
      await updatePlan.mutateAsync({
        planId: plan.id,
        data: { name: plan.name, description: plan.description || '', is_active: !plan.is_active },
      })
    } catch (e) {
      console.error('Toggle plan failed', e)
    }
  }

  const handleDeletePlan = async (plan: PlanResource) => {
    try {
      await deletePlan.mutateAsync(plan.id)
    } catch (e) {
      console.error('Delete plan failed', e)
    }
  }

  const handleDeleteWorkout = async (template: WorkoutTemplateResource) => {
    try {
      await deleteTemplate.mutateAsync(template.id)
    } catch (e) {
      console.error('Delete workout failed', e)
    }
  }

  const handleToggleProgramActive = async (program: ProgramResource) => {
    try {
      await updateProgram.mutateAsync({
        programId: program.id,
        data: { is_active: !program.is_active },
      })
    } catch (e) {
      console.error('Toggle program failed', e)
    }
  }

  const handleDeleteProgram = async (program: ProgramResource) => {
    try {
      await deleteProgram.mutateAsync(program.id)
    } catch (e) {
      console.error('Delete program failed', e)
    }
  }

  const planSheetActions = useMemo(() => {
    if (!planSheet) return []
    return [
      {
        label: planSheet.is_active ? 'Deactivate' : 'Set as Active',
        description: planSheet.is_active ? 'Remove from active rotation' : 'Make this your current plan',
        icon: planSheet.is_active ? XCircle : CheckCircle,
        iconColor: planSheet.is_active ? colors.warning : colors.success,
        onPress: () => handleTogglePlanActive(planSheet),
      },
      {
        label: 'Edit Plan',
        description: 'Rename or update plan details',
        icon: Edit,
        onPress: () => navigation.navigate('EditPlan', { planId: planSheet.id }),
      },
      {
        label: 'Add Workout',
        description: 'Create a new workout in this plan',
        icon: PlusCircle,
        onPress: () => navigation.navigate('CreateWorkout'),
      },
      {
        label: 'Delete Plan',
        description: 'Permanently remove this plan',
        icon: Trash2,
        destructive: true,
        onPress: () => setPlanToDelete(planSheet),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planSheet])

  const workoutSheetActions = useMemo(() => {
    if (!workoutSheet) return []
    return [
      {
        label: 'Start Workout',
        description: 'Begin a live session now',
        icon: Play,
        iconColor: colors.success,
        onPress: () => handleStartWorkout(workoutSheet.id),
      },
      {
        label: 'Manage Exercises',
        description: 'Add, remove or reorder exercises',
        icon: Settings,
        onPress: () =>
          navigation.navigate('ManageExercises', { templateId: workoutSheet.id }),
      },
      {
        label: 'Edit Workout',
        description: 'Rename or update workout details',
        icon: Edit,
        onPress: () =>
          navigation.navigate('EditWorkout', { templateId: workoutSheet.id }),
      },
      {
        label: 'Delete Workout',
        description: 'Permanently remove this workout',
        icon: Trash2,
        destructive: true,
        onPress: () => setWorkoutToDelete(workoutSheet),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutSheet])

  const programSheetActions = useMemo(() => {
    if (!programSheet) return []
    return [
      {
        label: programSheet.is_active ? 'Deactivate' : 'Set as Active',
        description: programSheet.is_active ? 'Remove from active rotation' : 'Make this your current program',
        icon: programSheet.is_active ? XCircle : CheckCircle,
        iconColor: programSheet.is_active ? colors.warning : colors.success,
        onPress: () => handleToggleProgramActive(programSheet),
      },
      {
        label: 'Delete Program',
        description: 'Permanently remove this program',
        icon: Trash2,
        destructive: true,
        onPress: () => setProgramToDelete(programSheet),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programSheet])

  // ── Render: workout row ──
  const renderWorkoutRow = (template: WorkoutTemplateResource) => (
    <TouchableOpacity
      key={template.id}
      onPress={() => navigation.navigate('ManageExercises', { templateId: template.id })}
      style={[styles.workoutRow, { backgroundColor: colors.bgElevated }]}
    >
      <View style={styles.workoutRowLeft}>
        <View style={[styles.workoutIcon, { backgroundColor: `${colors.primary}18` }]}>
          <Dumbbell size={15} color={colors.primary} />
        </View>
        <Text
          style={[styles.workoutName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {template.name}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => setWorkoutSheet(template)}
        style={[styles.moreBtn, { backgroundColor: colors.bgSurface }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MoreVertical size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  // ── Render: program card ──
  const renderProgramCard = (program: ProgramResource, isActive: boolean) => (
    <View
      key={program.id}
      style={[styles.programCard, { borderColor: colors.bgElevated }]}
    >
      <LinearGradient
        colors={[colors.bgElevated, colors.bgSurface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.programCardGradient}
      >
        {/* Cover image */}
        {program.cover_image ? (
          <View style={styles.coverImageContainer}>
            <Image
              source={{ uri: program.cover_image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <View style={styles.coverImageOverlay} />
          </View>
        ) : null}

        <View style={styles.programCardBody}>
          {/* Header row */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.programName, { color: colors.textPrimary }]}>
                {program.name}
              </Text>
              <Text style={[styles.programDescription, { color: colors.textSecondary }]}>
                {program.description || 'Structured program from your library'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setProgramSheet(program)}
              style={[styles.moreBtn, { backgroundColor: colors.bgBase }]}
            >
              <MoreVertical size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {program.duration_weeks ? (
              <View style={styles.metaItem}>
                <Calendar size={12} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {program.duration_weeks} WEEKS
                </Text>
              </View>
            ) : null}
            {isActive && (
              <View style={[styles.activeBadge, { backgroundColor: `${colors.success}20` }]}>
                <Text style={[styles.activeBadgeText, { color: colors.success }]}>ACTIVE</Text>
              </View>
            )}
          </View>

          {/* View details button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ProgramDetail', { programId: program.id })}
            style={[styles.viewDetailsBtn, { backgroundColor: colors.bgBase }]}
          >
            <Text style={[styles.viewDetailsBtnText, { color: colors.primary }]}>
              View Program Details
            </Text>
            <ChevronRight size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  )

  // ── Main render ──
  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.bgBase }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <GradientText style={styles.headerTitle}>Plans</GradientText>
          {effectiveTab === 'customPlans' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('CreatePlan')}
              style={[styles.addBtn, { backgroundColor: `${colors.primary}22` }]}
            >
              <Plus size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Plan Type Switcher — only rendered when Programs tab is relevant */}
        {showProgramsTab && (
          <PlanTypeSwitcher
            activeType={effectiveTab}
            onTypeChange={setActiveTab}
            showPrograms
          />
        )}

        {/* ── Custom Plans Tab ── */}
        {effectiveTab === 'customPlans' && (
          <>
            {isPlansLoading ? (
              <>
                <SkeletonBox height={200} style={styles.skeleton} />
                <SkeletonBox height={120} style={styles.skeleton} />
                <SkeletonBox height={120} style={styles.skeleton} />
              </>
            ) : (
              <>
                {/* Active Plan — only shown when one exists */}
                {activePlan && (
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionLabel, { color: colors.primary }]}>
                      Active Plan
                    </Text>
                    <LinearGradient
                      colors={[colors.bgElevated, colors.bgSurface]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.activePlanCard}
                    >
                      {/* Card header */}
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardHeaderText}>
                          <Text style={[styles.activePlanName, { color: colors.textPrimary }]}>
                            {activePlan.name}
                          </Text>
                          {activePlan.description ? (
                            <Text
                              style={[styles.activePlanDesc, { color: colors.textSecondary }]}
                            >
                              {activePlan.description}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => setPlanSheet(activePlan)}
                          style={[styles.moreBtn, { backgroundColor: colors.bgBase }]}
                        >
                          <MoreVertical size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>

                      {/* Meta row */}
                      <View style={styles.metaRow}>
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                          {sortedWorkouts(activePlan.workout_templates).length} WORKOUT
                          {sortedWorkouts(activePlan.workout_templates).length !== 1 ? 'S' : ''}
                        </Text>
                        <View
                          style={[
                            styles.activeBadge,
                            { backgroundColor: `${colors.success}20` },
                          ]}
                        >
                          <Text style={[styles.activeBadgeText, { color: colors.success }]}>
                            ACTIVE
                          </Text>
                        </View>
                      </View>

                      {/* Divider */}
                      <View
                        style={[styles.divider, { backgroundColor: colors.bgBase }]}
                      />

                      {/* Workout list */}
                      {sortedWorkouts(activePlan.workout_templates).length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                          No workouts in this plan yet.
                        </Text>
                      ) : (
                        sortedWorkouts(activePlan.workout_templates).map(renderWorkoutRow)
                      )}
                    </LinearGradient>
                  </View>
                )}

                {/* All Plans */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  All Plans
                </Text>

                {allOtherPlans.length === 0 ? (
                  <Text style={[styles.emptyLargeText, { color: colors.textMuted }]}>
                    No other plans yet.
                  </Text>
                ) : (
                  allOtherPlans.map((plan: PlanResource) => {
                    const workouts = sortedWorkouts(plan.workout_templates)
                    return (
                      <View
                        key={plan.id}
                        style={[styles.planCard, { backgroundColor: colors.bgSurface }]}
                      >
                        <View style={styles.cardHeaderRow}>
                          <Text
                            style={[styles.planCardName, { color: colors.textPrimary }]}
                            numberOfLines={1}
                          >
                            {plan.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setPlanSheet(plan)}
                            style={[styles.moreBtn, { backgroundColor: colors.bgElevated }]}
                          >
                            <MoreVertical size={18} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.bgElevated }]} />

                        {workouts.length === 0 ? (
                          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            No workout templates in this plan.
                          </Text>
                        ) : (
                          workouts.map(renderWorkoutRow)
                        )}
                      </View>
                    )
                  })
                )}

                {/* Recommended Workouts carousel */}
                {browsableRoutines.length > 0 && (
                  <View style={styles.carouselSection}>
                    <Text style={[styles.carouselTitle, { color: colors.primary }]}>
                      Recommended Workouts
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.carouselContent}
                    >
                      {browsableRoutines.map((routine: RoutinePlanResource) => (
                        <TouchableOpacity
                          key={routine.id}
                          onPress={() =>
                            navigation.navigate('RoutineDetail', { routineId: routine.id })
                          }
                          style={[styles.routineCard, { backgroundColor: colors.bgSurface }]}
                        >
                          {/* Cover image */}
                          <View style={styles.routineCover}>
                            {routine.cover_image ? (
                              <>
                                <Image
                                  source={{ uri: routine.cover_image }}
                                  style={StyleSheet.absoluteFill}
                                  contentFit="cover"
                                />
                                <LinearGradient
                                  colors={['transparent', 'rgba(0,0,0,0.5)']}
                                  style={StyleSheet.absoluteFill}
                                />
                              </>
                            ) : (
                              <LinearGradient
                                colors={[colors.bgElevated, colors.bgSurface]}
                                start={{ x: 0.3, y: 0 }}
                                end={{ x: 0.7, y: 1 }}
                                style={styles.routineCoverPlaceholder}
                              >
                                <Dumbbell size={40} color={colors.textMuted} />
                              </LinearGradient>
                            )}
                          </View>
                          {/* Info */}
                          <View style={styles.routineInfo}>
                            <Text
                              style={[styles.routineName, { color: colors.textPrimary }]}
                              numberOfLines={1}
                            >
                              {routine.name}
                            </Text>
                            <Text style={[styles.routineCount, { color: colors.textSecondary }]}>
                              {routine.workout_templates?.length ?? 0}{' '}
                              {(routine.workout_templates?.length ?? 0) === 1
                                ? 'workout'
                                : 'workouts'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Plan action sheet */}
        <ActionSheet
          visible={!!planSheet}
          onClose={() => setPlanSheet(null)}
          title={planSheet?.name}
          actions={planSheetActions}
        />

        {/* Workout action sheet */}
        <ActionSheet
          visible={!!workoutSheet}
          onClose={() => setWorkoutSheet(null)}
          title={workoutSheet?.name}
          actions={workoutSheetActions}
        />

        {/* Program action sheet */}
        <ActionSheet
          visible={!!programSheet}
          onClose={() => setProgramSheet(null)}
          title={programSheet?.name}
          actions={programSheetActions}
        />

        {/* Delete plan confirmation */}
        <ConfirmDialog
          visible={!!planToDelete}
          onClose={() => setPlanToDelete(null)}
          title="Delete Plan"
          message={
            planToDelete
              ? `Are you sure you want to delete "${planToDelete.name}"? This will also delete all workouts in this plan. This action cannot be undone.`
              : ''
          }
          confirmLabel="Delete"
          destructive
          onConfirm={() => planToDelete && handleDeletePlan(planToDelete)}
        />

        {/* Delete workout confirmation */}
        <ConfirmDialog
          visible={!!workoutToDelete}
          onClose={() => setWorkoutToDelete(null)}
          title="Delete Workout"
          message={
            workoutToDelete
              ? `Are you sure you want to delete "${workoutToDelete.name}"? This action cannot be undone.`
              : ''
          }
          confirmLabel="Delete"
          destructive
          onConfirm={() => workoutToDelete && handleDeleteWorkout(workoutToDelete)}
        />

        {/* Delete program confirmation */}
        <ConfirmDialog
          visible={!!programToDelete}
          onClose={() => setProgramToDelete(null)}
          title="Delete Program"
          message={
            programToDelete
              ? `Are you sure you want to delete "${programToDelete.name}"? This action cannot be undone.`
              : ''
          }
          confirmLabel="Delete"
          destructive
          onConfirm={() => programToDelete && handleDeleteProgram(programToDelete)}
        />

        {/* ── Programs Tab ── */}
        {effectiveTab === 'programs' && (
          <>
            {isProgramsLoading ? (
              <>
                <SkeletonBox height={260} style={styles.skeleton} />
                <SkeletonBox height={200} style={styles.skeleton} />
              </>
            ) : (
              <>
                {/* Active Program — only shown when one exists */}
                {activeProgram && (
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionLabel, { color: colors.primary }]}>
                      Active Program
                    </Text>
                    {renderProgramCard(activeProgram, true)}
                  </View>
                )}

                {/* All Programs */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  All Programs
                </Text>

                {inactivePrograms.length === 0 ? (
                  <Text style={[styles.emptyLargeText, { color: colors.textMuted }]}>
                    No other programs yet.
                  </Text>
                ) : (
                  inactivePrograms.map((prog: ProgramResource) =>
                    renderProgramCard(prog, false),
                  )
                )}

                {/* Browse Library button */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('ProgramLibrary')}
                  style={styles.browseLibraryBtn}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.secondary, colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.browseLibraryGradient}
                  >
                    <Plus size={20} color="#fff" />
                    <Text style={styles.browseLibraryText}>BROWSE LIBRARY</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section labels
  sectionContainer: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  // Skeleton
  skeleton: {
    marginBottom: 16,
  },

  // Shared card elements
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '500',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyLargeText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },

  // Active plan card
  activePlanCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  activePlanName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  activePlanDesc: {
    fontSize: 14,
    lineHeight: 20,
  },

  // All Plans cards
  planCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  planCardName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },

  // Workout row
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  workoutRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  workoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Recommended Workouts carousel
  carouselSection: {
    marginTop: 32,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  carouselContent: {
    gap: 12,
    paddingBottom: 8,
  },
  routineCard: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  routineCover: {
    height: 112,
    overflow: 'hidden',
  },
  routineCoverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineInfo: {
    padding: 12,
  },
  routineName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  routineCount: {
    fontSize: 12,
  },

  // Program cards
  programCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  programCardGradient: {
    borderRadius: 24,
  },
  coverImageContainer: {
    height: 140,
    overflow: 'hidden',
  },
  coverImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  programCardBody: {
    padding: 24,
  },
  programName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  viewDetailsBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Browse Library button
  browseLibraryBtn: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  browseLibraryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  browseLibraryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
})
