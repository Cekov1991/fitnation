import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { IonApp, IonPage, IonContent } from '@ionic/react';
import { Dumbbell, TrendingUp, TrendingDown } from 'lucide-react';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { MetricCard } from './components/MetricCard';
import { BottomNav } from './components/BottomNav';
import { BackgroundGradients } from './components/BackgroundGradients';
import { StrengthScoreModal } from './components/StrengthScoreModal';
import { BalanceModal } from './components/BalanceModal';
import { WeeklyProgressModal } from './components/WeeklyProgressModal';
import { WorkoutSelectionModal } from './components/WorkoutSelectionModal';
import { PlansPage } from './components/PlansPage';
import { CreatePlanPage } from './components/CreatePlanPage';
import { AddWorkoutPage } from './components/AddWorkoutPage';
import { EditWorkoutPage } from './components/EditWorkoutPage';
import { ExercisePickerPage } from './components/ExercisePickerPage';
import { ExerciseDetailPage } from './components/ExerciseDetailPage';
import { WorkoutSessionPage } from './components/WorkoutSessionPage';
import { ProfilePage } from './components/ProfilePage';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './hooks/useAuth';
import { useBranding } from './hooks/useBranding';
import { useFitnessMetrics, useStartSession, useCreatePlan, useUpdatePlan, useCreateTemplate, useUpdateTemplate, usePlans, useAddTemplateExercise, useTodayWorkout } from './hooks/useApi';
type Page = 'dashboard' | 'plans' | 'progress' | 'profile' | 'create-plan' | 'edit-plan' | 'add-workout' | 'edit-workout' | 'manage-exercises' | 'pick-exercise' | 'exercise-detail' | 'workout-session' | 'workout-session-exercise-detail';
export function App() {
  const { user, loading, logout } = useAuth();
  const { logo, partnerName } = useBranding();
  const {
    data: metrics
  } = useFitnessMetrics();
  const { data: todayWorkout, refetch: refetchTodayWorkout } = useTodayWorkout();
  const startSession = useStartSession();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const { data: plans = [] } = usePlans();
  const addTemplateExercise = useAddTemplateExercise();

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isStrengthModalOpen, setIsStrengthModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<{
    id: number;
    name: string;
    description: string;
    isActive: boolean;
  } | null>(null);
  const [selectedPlanForWorkout, setSelectedPlanForWorkout] = useState<string | undefined>(undefined);
  const [editingWorkout, setEditingWorkout] = useState<{
    templateId?: number;
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  } | null>(null);
  const [currentWorkoutForExercises, setCurrentWorkoutForExercises] = useState<{
    templateId: number;
    name: string;
    description?: string;
  } | null>(null);
  const [exercisePickerMode, setExercisePickerMode] = useState<'add' | 'swap'>('add');
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
  const [activeWorkoutName, setActiveWorkoutName] = useState<string>('');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const handleCreatePlan = async (data: {
    name: string;
    description: string;
    isActive: boolean;
  }) => {
    try {
      await createPlan.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        is_active: data.isActive
      });
      // Navigate back to plans page after successful creation
      setCurrentPage('plans');
    } catch (error) {
      console.error('Failed to create plan:', error);
      // Don't navigate away if mutation fails
    }
  };
  const handleUpdatePlan = async (data: {
    name: string;
    description: string;
    isActive: boolean;
  }) => {
    if (!editingPlan?.id) {
      console.error('Cannot update plan: plan ID is missing');
      return;
    }
    try {
      await updatePlan.mutateAsync({
        planId: editingPlan.id,
        data: {
          name: data.name,
          description: data.description || undefined,
          is_active: data.isActive
        }
      });
      // Clear editing state and navigate back to plans page after successful update
      setEditingPlan(null);
      setCurrentPage('plans');
    } catch (error) {
      console.error('Failed to update plan:', error);
      // Don't navigate away if mutation fails
    }
  };
  const handleCreateWorkout = async (data: {
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  }) => {
    try {
      // Find plan by name to get plan_id
      const plan = plans.find(p => p.name === data.plan);
      if (!plan) {
        console.error('Plan not found:', data.plan);
        return;
      }

      // Convert daysOfWeek array to day_of_week number (0-6, Monday-Sunday)
      // API only accepts one day, so we'll take the first selected day
      const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayOfWeek = data.daysOfWeek.length > 0 
        ? DAY_NAMES.indexOf(data.daysOfWeek[0])
        : undefined;

      const response = await createTemplate.mutateAsync({
        plan_id: plan.id,
        name: data.name,
        description: data.description || undefined,
        day_of_week: dayOfWeek !== -1 ? dayOfWeek : undefined
      });

      // Get the created template ID from response
      // Response structure: { data: WorkoutTemplateResource } or WorkoutTemplateResource
      const templateId = response?.data?.id || response?.id;
      
      if (templateId) {
        // Navigate to manage exercises for the new workout
        setCurrentWorkoutForExercises({
          templateId,
          name: data.name,
          description: data.description
        });
        setCurrentPage('manage-exercises');
      } else {
        console.error('Failed to get template ID from create response');
      }
    } catch (error) {
      console.error('Failed to create workout:', error);
      // Don't navigate away if mutation fails
    }
  };
  const handleUpdateWorkout = async (data: {
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  }) => {
    if (!editingWorkout?.templateId) {
      console.error('Cannot update workout: template ID is missing');
      return;
    }
    try {
      // Find plan by name to get plan_id
      const plan = plans.find(p => p.name === data.plan);
      if (!plan) {
        console.error('Plan not found:', data.plan);
        return;
      }

      // Convert daysOfWeek array to day_of_week number (0-6, Monday-Sunday)
      // API only accepts one day, so we'll take the first selected day
      const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayOfWeek = data.daysOfWeek.length > 0 
        ? DAY_NAMES.indexOf(data.daysOfWeek[0])
        : undefined;

      await updateTemplate.mutateAsync({
        templateId: editingWorkout.templateId,
        data: {
          plan_id: plan.id,
          name: data.name,
          description: data.description || undefined,
          day_of_week: dayOfWeek !== -1 ? dayOfWeek : undefined
        }
      });

      // Clear editing state and navigate back to plans page after successful update
      setEditingWorkout(null);
      setCurrentPage('plans');
    } catch (error) {
      console.error('Failed to update workout:', error);
      // Don't navigate away if mutation fails
    }
  };
  const handleNavigateToCreatePlan = () => {
    setCurrentPage('create-plan');
  };
  const handleNavigateToEditPlan = (plan: {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
  }) => {
    setEditingPlan(plan);
    setCurrentPage('edit-plan');
  };
  const handleNavigateToAddWorkout = (planName?: string) => {
    setSelectedPlanForWorkout(planName);
    setCurrentPage('add-workout');
  };
  const handleNavigateToEditWorkout = (workout: {
    templateId?: number;
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  }) => {
    setEditingWorkout(workout);
    setCurrentPage('edit-workout');
  };
  const handleNavigateToManageExercises = (workout: {
    templateId: number;
    name: string;
    description?: string;
  }) => {
    setCurrentWorkoutForExercises(workout);
    setCurrentPage('manage-exercises');
  };
  const handleAddExercise = () => {
    setExercisePickerMode('add');
    setCurrentPage('pick-exercise');
  };
  const handleSwapExercise = () => {
    setExercisePickerMode('swap');
    setCurrentPage('pick-exercise');
  };
  const handleSelectExercise = async (exercise: { id: number; name: string }) => {
    if (!currentWorkoutForExercises?.templateId) {
      console.error('Cannot add exercise: template ID is missing');
      return;
    }

    try {
      if (exercisePickerMode === 'add') {
        // Add exercise to the workout template
        await addTemplateExercise.mutateAsync({
          templateId: currentWorkoutForExercises.templateId,
          data: {
            exercise_id: exercise.id
            // Default values for sets/reps/weight can be added here if needed
          }
        });
        // Navigate back to manage exercises page (the hook will invalidate the cache)
        setCurrentPage('manage-exercises');
      } else if (exercisePickerMode === 'swap') {
        // For swap, we need to know which exercise to replace
        // This would require additional state to track the exercise being swapped
        // For now, we'll just add it (user can remove the old one manually)
        // TODO: Implement proper swap functionality
        await addTemplateExercise.mutateAsync({
          templateId: currentWorkoutForExercises.templateId,
          data: {
            exercise_id: exercise.id
          }
        });
        setCurrentPage('manage-exercises');
      }
    } catch (error) {
      console.error('Failed to add exercise:', error);
      // Don't navigate away if mutation fails
    }
  };
  const handleViewExerciseDetail = (exerciseName: string) => {
    setSelectedExerciseName(exerciseName);
    setCurrentPage('exercise-detail');
  };
  const handleViewExerciseDetailFromSession = (exerciseName: string) => {
    setSelectedExerciseName(exerciseName);
    setCurrentPage('workout-session-exercise-detail');
  };
  const handleStartWorkoutClick = () => {
    const ongoingSession = todayWorkout?.session;
    if (ongoingSession?.id) {
      // Navigate directly to existing session
      setActiveSessionId(ongoingSession.id);
      // Get workout name from template or use default
      const workoutName = todayWorkout?.template?.name || 'Workout Session';
      setActiveWorkoutName(workoutName);
      setCurrentPage('workout-session');
    } else {
      // Open workout selection modal
      setIsWorkoutModalOpen(true);
    }
  };
  const handleSelectTemplate = async (templateId: number | null, templateName: string) => {
    setIsWorkoutModalOpen(false);
    try {
      const response = await startSession.mutateAsync(templateId || undefined);
      // Response structure: { data: { session: WorkoutSessionResource } } or { data: WorkoutSessionResource }
      const session = response.data?.session || response.data;
      if (session?.id) {
        setActiveSessionId(session.id);
        setActiveWorkoutName(templateName);
        setCurrentPage('workout-session');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };
  const handleFinishWorkout = () => {
    setActiveSessionId(null);
    setActiveWorkoutName('');
    setCurrentPage('dashboard');
    // Refetch today's workout after finishing to update the button
    refetchTodayWorkout();
  };
  const handleLogout = async () => {
    await logout();
  };
  const handleBackToPlans = () => {
    setCurrentPage('plans');
    setEditingPlan(null);
    setSelectedPlanForWorkout(undefined);
    setEditingWorkout(null);
    setCurrentWorkoutForExercises(null);
  };
  const handleBackToManageExercises = () => {
    setCurrentPage('manage-exercises');
  };
  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    // Refetch today's workout to check for ongoing sessions
    refetchTodayWorkout();
  };
  const handleBackToWorkoutSession = () => {
    setCurrentPage('workout-session');
  };
  const getBottomNavPage = () => {
    if (['create-plan', 'edit-plan', 'add-workout', 'edit-workout', 'manage-exercises', 'pick-exercise', 'exercise-detail', 'workout-session', 'workout-session-exercise-detail'].includes(currentPage)) {
      return 'plans';
    }
    return currentPage;
  };
  const strengthScoreValue = useMemo(() => {
    if (!metrics?.strength_score) return '--';
    return `${metrics.strength_score.current}`;
  }, [metrics]);

  const strengthScoreSubtitle = useMemo(() => {
    if (!metrics?.strength_score) return undefined;
    return `${metrics.strength_score.level} • +${metrics.strength_score.recent_gain}`;
  }, [metrics]);

  const balanceValue = useMemo(() => {
    if (!metrics?.strength_balance) return '--';
    return `${metrics.strength_balance.percentage}%`;
  }, [metrics]);

  const balanceSubtitle = useMemo(() => {
    if (!metrics?.strength_balance) return undefined;
    const change = metrics.strength_balance.recent_change;
    const sign = change >= 0 ? '+' : '';
    return `${metrics.strength_balance.level} • ${sign}${change}%`;
  }, [metrics]);

  const weeklyValue = useMemo(() => {
    if (!metrics?.weekly_progress) return '--';
    const sign = metrics.weekly_progress.percentage >= 0 ? '+' : '';
    return `${sign}${metrics.weekly_progress.percentage}%`;
  }, [metrics]);

  const weeklySubtitle = useMemo(() => {
    if (!metrics?.weekly_progress) return undefined;
    return `${metrics.weekly_progress.current_week_workouts} workouts`;
  }, [metrics]);

  if (loading) {
    return <IonApp>
        <div 
          className="min-h-screen w-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
        </div>
      </IonApp>;
  }

  if (!user) {
    return <IonApp>
        <LoginPage />
      </IonApp>;
  }

  return <IonApp>
      <div 
        className="min-h-screen w-full"
        style={{
          backgroundColor: 'var(--color-bg-base)',
          color: 'var(--color-text-primary)',
          '--selection-bg': 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
        } as React.CSSProperties & { '--selection-bg': string }}
      >
      {currentPage === 'dashboard' && <IonPage>
          <IonContent>
            <BackgroundGradients />

            <main className="relative z-10 max-w-md mx-auto px-6 pt-8 pb-32">
              {/* Header */}
              <motion.header initial={{
            opacity: 0,
            y: -20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} className="flex flex-col items-center mb-8">
                {logo ? (
                  <img 
                    src={logo} 
                    alt={partnerName || 'Partner logo'} 
                    className="w-16 h-16 rounded-2xl shadow-lg mb-4 object-contain"
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-2xl shadow-lg mb-4 flex items-center justify-center"
                    style={{ background: 'linear-gradient(to top right, var(--color-primary), var(--color-secondary))' }}
                  >
                    <Dumbbell className="w-8 h-8" style={{ color: 'var(--color-text-primary)' }} />
                  </div>
                )}
                <h1 className="text-2xl font-bold tracking-tight text-center">
                  {partnerName || 'Fit Nation'}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Welcome back, {user?.name || 'Athlete'}
                </p>
              </motion.header>

              {/* Calendar Section */}
              <WeeklyCalendar />

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="col-span-1">
                  <MetricCard title="Strength Score" value={strengthScoreValue} icon={Dumbbell} delay={0.1} subtitle={strengthScoreSubtitle} onClick={() => setIsStrengthModalOpen(true)} />
                </div>
                <div className="col-span-1">
                  <MetricCard title="Balance" value={balanceValue} icon={TrendingUp} delay={0.2} subtitle={balanceSubtitle} onClick={() => setIsBalanceModalOpen(true)} />
                </div>
                <div className="col-span-2">
                  <MetricCard title="Weekly Progress" value={weeklyValue} icon={TrendingDown} delay={0.3} subtitle={weeklySubtitle} onClick={() => setIsProgressModalOpen(true)} />
                </div>
              </div>

              {/* CTA Button */}
              <motion.button initial={{
            opacity: 0,
            scale: 0.9
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.4,
            type: 'spring'
          }} whileHover={{
            scale: 1.02
          }} whileTap={{
            scale: 0.98
          }} onClick={handleStartWorkoutClick} className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-shadow relative overflow-hidden group"
              style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}>
                <span className="relative z-10">{todayWorkout?.session?.id ? 'Continue Workout' : 'Start Workout'}</span>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  style={{ background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))' }}
                />
              </motion.button>
            </main>
          </IonContent>
        </IonPage>}

      {currentPage === 'plans' && <PlansPage onNavigateToCreate={handleNavigateToCreatePlan} onNavigateToEdit={handleNavigateToEditPlan} onNavigateToAddWorkout={handleNavigateToAddWorkout} onNavigateToEditWorkout={handleNavigateToEditWorkout} onNavigateToManageExercises={handleNavigateToManageExercises} />}

      {currentPage === 'create-plan' && <CreatePlanPage mode="create" onBack={handleBackToPlans} onSubmit={handleCreatePlan} />}

      {currentPage === 'edit-plan' && editingPlan && <CreatePlanPage mode="edit" initialData={editingPlan} onBack={handleBackToPlans} onSubmit={handleUpdatePlan} />}

      {currentPage === 'add-workout' && <AddWorkoutPage mode="create" planName={selectedPlanForWorkout} onBack={handleBackToPlans} onSubmit={handleCreateWorkout} />}

      {currentPage === 'edit-workout' && editingWorkout && <AddWorkoutPage mode="edit" initialData={editingWorkout} onBack={handleBackToPlans} onSubmit={handleUpdateWorkout} />}

      {currentPage === 'manage-exercises' && currentWorkoutForExercises && <EditWorkoutPage templateId={currentWorkoutForExercises.templateId} workoutName={currentWorkoutForExercises.name} workoutDescription={currentWorkoutForExercises.description} onBack={handleBackToPlans} onAddExercise={handleAddExercise} onSwapExercise={handleSwapExercise} onViewExerciseDetail={handleViewExerciseDetail} />}

      {currentPage === 'pick-exercise' && <ExercisePickerPage mode={exercisePickerMode} onClose={handleBackToManageExercises} onSelectExercise={handleSelectExercise} />}

      {currentPage === 'exercise-detail' && <ExerciseDetailPage exerciseName={selectedExerciseName} onBack={handleBackToManageExercises} />}

      {currentPage === 'workout-session' && activeSessionId && <WorkoutSessionPage sessionId={activeSessionId} workoutName={activeWorkoutName} onBack={handleBackToDashboard} onFinish={handleFinishWorkout} onViewExerciseDetail={handleViewExerciseDetailFromSession} />}

      {currentPage === 'workout-session-exercise-detail' && <ExerciseDetailPage exerciseName={selectedExerciseName} onBack={handleBackToWorkoutSession} />}

      {currentPage === 'profile' && <ProfilePage onLogout={handleLogout} />}

      <BottomNav currentPage={getBottomNavPage()} onPageChange={setCurrentPage} />

      {/* Modals */}
      <StrengthScoreModal isOpen={isStrengthModalOpen} onClose={() => setIsStrengthModalOpen(false)} />
      <BalanceModal isOpen={isBalanceModalOpen} onClose={() => setIsBalanceModalOpen(false)} />
      <WeeklyProgressModal isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} />
      <WorkoutSelectionModal isOpen={isWorkoutModalOpen} onClose={() => setIsWorkoutModalOpen(false)} onSelectTemplate={handleSelectTemplate} />
      </div>
    </IonApp>;
}