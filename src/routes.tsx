import React, { useMemo } from 'react';
import { Route, Switch, useLocation, useHistory, useParams } from 'react-router-dom';
import { IonApp, useIonRouter } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { LoginPage } from './components/LoginPage';
import { ProfilePage } from './components/ProfilePage';
import { PlansPage } from './components/PlansPage';
import { CreatePlanPage } from './components/CreatePlanPage';
import { AddWorkoutPage } from './components/AddWorkoutPage';
import { EditWorkoutPage } from './components/EditWorkoutPage';
import { ExercisePickerPage } from './components/ExercisePickerPage';
import { ExerciseDetailPage } from './components/ExerciseDetailPage';
import { WorkoutSessionPage } from './components/workout-session';
import { DashboardPage } from './components/DashboardPage';
import { AuthGuard } from './components/AuthGuard';
import { BottomNav } from './components/BottomNav';
import { BackgroundGradients } from './components/BackgroundGradients';
import { useAuth } from './hooks/useAuth';
import { 
  useCreatePlan, 
  useUpdatePlan, 
  usePlans, 
  useCreateTemplate, 
  useUpdateTemplate,
  useTemplate,
  useAddTemplateExercise,
  useTodayWorkout
} from './hooks/useApi';
import { dayNameToIndex, type DayName } from './constants';

/**
 * Phase 2: Individual page routes
 * 
 * Using Switch instead of IonRouterOutlet to avoid z-index stacking context issues
 * with fixed elements like BottomNav and modals.
 * 
 * Once all pages are migrated, we can switch back to IonRouterOutlet for
 * native page transitions.
 */

// Common layout wrapper for authenticated pages
function AuthenticatedLayout({ children, currentPage }: { children: React.ReactNode; currentPage: 'dashboard' | 'plans' | 'progress' | 'profile' }) {
  return (
    <div 
      className="min-h-screen w-full"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-primary)',
        '--selection-bg': 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
      } as React.CSSProperties & { '--selection-bg': string }}
    >
      {children}
      <BottomNav currentPage={currentPage} />
    </div>
  );
}

// Helper hook to get current nav page from URL
function useCurrentNavPage(): 'dashboard' | 'plans' | 'progress' | 'profile' {
  const location = useLocation();
  const path = location.pathname;
  if (path === '/' || path === '/dashboard') return 'dashboard';
  if (path.startsWith('/plans') || path.startsWith('/workouts') || 
      path.startsWith('/exercises') || path.startsWith('/session')) return 'plans';
  if (path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/progress')) return 'progress';
  return 'dashboard';
}

// Profile page wrapper that handles logout
function ProfilePageWrapper() {
  const { logout } = useAuth();
  const currentPage = useCurrentNavPage();
  
  const handleLogout = async () => {
    await logout();
    // After logout, AuthGuard will redirect to /login
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <BackgroundGradients />
      <ProfilePage onLogout={handleLogout} />
    </AuthenticatedLayout>
  );
}

// Plans page wrapper with router-based navigation
function PlansPageWrapper() {
  const history = useHistory();
  const currentPage = useCurrentNavPage();

  const handleNavigateToCreate = () => {
    history.push('/plans/create');
  };

  const handleNavigateToEdit = (plan: { id: number; name: string; description: string; isActive: boolean }) => {
    // Pass plan data via route state
    history.push(`/plans/${plan.id}/edit`, plan);
  };

  const handleNavigateToAddWorkout = (planName?: string) => {
    const url = planName ? `/workouts/create?plan=${encodeURIComponent(planName)}` : '/workouts/create';
    history.push(url);
  };

  const handleNavigateToEditWorkout = (workout: { templateId?: number; plan: string; name: string; description: string; daysOfWeek: string[] }) => {
    if (workout.templateId) {
      history.push(`/workouts/${workout.templateId}/edit`, workout);
    }
  };

  const handleNavigateToManageExercises = (workout: { templateId: number; name: string; description?: string }) => {
    history.push(`/workouts/${workout.templateId}/exercises`, workout);
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <PlansPage
        onNavigateToCreate={handleNavigateToCreate}
        onNavigateToEdit={handleNavigateToEdit}
        onNavigateToAddWorkout={handleNavigateToAddWorkout}
        onNavigateToEditWorkout={handleNavigateToEditWorkout}
        onNavigateToManageExercises={handleNavigateToManageExercises}
      />
    </AuthenticatedLayout>
  );
}

// Create plan page wrapper
function CreatePlanPageWrapper() {
  const history = useHistory();
  const createPlan = useCreatePlan();
  const currentPage = useCurrentNavPage();

  const handleBack = () => {
    history.goBack();
  };

  const handleSubmit = async (data: { name: string; description: string; isActive: boolean }) => {
    try {
      await createPlan.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        is_active: data.isActive
      });
      history.push('/plans');
    } catch (error) {
      console.error('Failed to create plan:', error);
    }
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <CreatePlanPage mode="create" onBack={handleBack} onSubmit={handleSubmit} />
    </AuthenticatedLayout>
  );
}

// Edit plan page wrapper
function EditPlanPageWrapper() {
  const history = useHistory();
  const location = useLocation<{ id: number; name: string; description: string; isActive: boolean }>();
  const { planId } = useParams<{ planId: string }>();
  const { data: plans = [] } = usePlans();
  const updatePlan = useUpdatePlan();
  const currentPage = useCurrentNavPage();

  // Get plan data from route state or fetch from API
  const planFromState = location.state;
  const planFromApi = plans.find((p: { id: number }) => p.id === parseInt(planId));
  
  const initialData = planFromState || (planFromApi ? {
    id: planFromApi.id,
    name: planFromApi.name,
    description: planFromApi.description || '',
    isActive: planFromApi.is_active
  } : null);

  const handleBack = () => {
    history.goBack();
  };

  const handleSubmit = async (data: { name: string; description: string; isActive: boolean }) => {
    const id = planFromState?.id || parseInt(planId);
    if (!id) {
      console.error('Cannot update plan: plan ID is missing');
      return;
    }
    try {
      await updatePlan.mutateAsync({
        planId: id,
        data: {
          name: data.name,
          description: data.description || undefined,
          is_active: data.isActive
        }
      });
      history.push('/plans');
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  if (!initialData) {
    return (
      <AuthenticatedLayout currentPage={currentPage}>
        <div className="min-h-screen flex items-center justify-center">
          <div style={{ color: 'var(--color-text-secondary)' }}>Loading plan...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <CreatePlanPage mode="edit" initialData={initialData} onBack={handleBack} onSubmit={handleSubmit} />
    </AuthenticatedLayout>
  );
}

// Create workout page wrapper
function CreateWorkoutPageWrapper() {
  const history = useHistory();
  const location = useLocation();
  const { data: plans = [] } = usePlans();
  const createTemplate = useCreateTemplate();
  const currentPage = useCurrentNavPage();

  // Get plan name from query params
  const searchParams = new URLSearchParams(location.search);
  const planName = searchParams.get('plan') || undefined;

  const handleBack = () => {
    history.goBack();
  };

  const handleSubmit = async (data: { plan: string; name: string; description: string; daysOfWeek: string[] }) => {
    try {
      const plan = plans.find((p: { name: string }) => p.name === data.plan);
      if (!plan) {
        console.error('Plan not found:', data.plan);
        return;
      }

      const dayOfWeek = data.daysOfWeek.length > 0 
        ? dayNameToIndex(data.daysOfWeek[0] as DayName)
        : undefined;

      const response = await createTemplate.mutateAsync({
        plan_id: plan.id,
        name: data.name,
        description: data.description || undefined,
        day_of_week: dayOfWeek !== undefined && dayOfWeek !== -1 ? dayOfWeek : undefined
      });

      const templateId = response?.data?.id || response?.id;
      
      if (templateId) {
        // Navigate to manage exercises for the new workout
        history.push(`/workouts/${templateId}/exercises`, { 
          templateId, 
          name: data.name, 
          description: data.description 
        });
      }
    } catch (error) {
      console.error('Failed to create workout:', error);
    }
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <AddWorkoutPage mode="create" planName={planName} onBack={handleBack} onSubmit={handleSubmit} />
    </AuthenticatedLayout>
  );
}

// Edit workout page wrapper
function EditWorkoutPageWrapper() {
  const history = useHistory();
  const location = useLocation<{ templateId?: number; plan: string; name: string; description: string; daysOfWeek: string[] }>();
  const { templateId } = useParams<{ templateId: string }>();
  const { data: plans = [] } = usePlans();
  const { data: template } = useTemplate(parseInt(templateId));
  const updateTemplate = useUpdateTemplate();
  const currentPage = useCurrentNavPage();

  // Get data from route state or API
  const workoutFromState = location.state;
  const workoutFromApi = template ? {
    templateId: template.id,
    plan: plans.find((p: { id: number }) => p.id === template.plan_id)?.name || '',
    name: template.name,
    description: template.description || '',
    daysOfWeek: template.day_of_week !== null ? [['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][template.day_of_week]] : []
  } : null;

  const initialData = workoutFromState || workoutFromApi;

  const handleBack = () => {
    history.goBack();
  };

  const handleSubmit = async (data: { plan: string; name: string; description: string; daysOfWeek: string[] }) => {
    const id = parseInt(templateId);
    if (!id) return;

    try {
      const plan = plans.find((p: { name: string }) => p.name === data.plan);
      if (!plan) return;

      const dayOfWeek = data.daysOfWeek.length > 0 
        ? dayNameToIndex(data.daysOfWeek[0] as DayName)
        : undefined;

      await updateTemplate.mutateAsync({
        templateId: id,
        data: {
          plan_id: plan.id,
          name: data.name,
          description: data.description || undefined,
          day_of_week: dayOfWeek !== undefined && dayOfWeek !== -1 ? dayOfWeek : undefined
        }
      });

      history.push('/plans');
    } catch (error) {
      console.error('Failed to update workout:', error);
    }
  };

  if (!initialData) {
    return (
      <AuthenticatedLayout currentPage={currentPage}>
        <div className="min-h-screen flex items-center justify-center">
          <div style={{ color: 'var(--color-text-secondary)' }}>Loading workout...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <AddWorkoutPage mode="edit" initialData={initialData} onBack={handleBack} onSubmit={handleSubmit} />
    </AuthenticatedLayout>
  );
}

// Manage exercises page wrapper
function ManageExercisesPageWrapper() {
  const history = useHistory();
  const location = useLocation<{ templateId?: number; name?: string; description?: string }>();
  const { templateId } = useParams<{ templateId: string }>();
  const { data: template } = useTemplate(parseInt(templateId));
  const currentPage = useCurrentNavPage();

  // Get workout info from state or API
  const workoutFromState = location.state;
  const workoutName = workoutFromState?.name || template?.name || `Workout #${templateId}`;
  const workoutDescription = workoutFromState?.description || template?.description;

  const handleBack = () => {
    history.push('/plans');
  };

  const handleAddExercise = () => {
    history.push(`/exercises/pick?mode=add&templateId=${templateId}`);
  };

  const handleSwapExercise = () => {
    history.push(`/exercises/pick?mode=swap&templateId=${templateId}`);
  };

  const handleViewExerciseDetail = (exerciseName: string) => {
    history.push(`/exercises/${encodeURIComponent(exerciseName)}?from=workout&templateId=${templateId}`);
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <EditWorkoutPage
        templateId={parseInt(templateId)}
        workoutName={workoutName}
        workoutDescription={workoutDescription}
        onBack={handleBack}
        onAddExercise={handleAddExercise}
        onSwapExercise={handleSwapExercise}
        onViewExerciseDetail={handleViewExerciseDetail}
      />
    </AuthenticatedLayout>
  );
}

// Exercise picker page wrapper
function ExercisePickerPageWrapper() {
  const history = useHistory();
  const location = useLocation();
  const addTemplateExercise = useAddTemplateExercise();
  
  // Get mode and templateId from query params
  const searchParams = new URLSearchParams(location.search);
  const mode = (searchParams.get('mode') as 'add' | 'swap') || 'add';
  const templateId = searchParams.get('templateId');

  const handleClose = () => {
    history.goBack();
  };

  const handleSelectExercise = async (exercise: { id: number; name: string }) => {
    if (templateId) {
      try {
        await addTemplateExercise.mutateAsync({
          templateId: parseInt(templateId),
          data: { exercise_id: exercise.id }
        });
        history.goBack();
      } catch (error) {
        console.error('Failed to add exercise:', error);
      }
    } else {
      history.goBack();
    }
  };

  return (
    <ExercisePickerPage
      mode={mode}
      onClose={handleClose}
      onSelectExercise={handleSelectExercise}
    />
  );
}

// Exercise detail page wrapper
function ExerciseDetailPageWrapper() {
  const history = useHistory();
  const { exerciseName } = useParams<{ exerciseName: string }>();
  const currentPage = useCurrentNavPage();

  const handleBack = () => {
    history.goBack();
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <ExerciseDetailPage 
        exerciseName={decodeURIComponent(exerciseName)} 
        onBack={handleBack} 
      />
    </AuthenticatedLayout>
  );
}

// Dashboard page wrapper
function DashboardPageWrapper() {
  const currentPage = useCurrentNavPage();

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <DashboardPage />
    </AuthenticatedLayout>
  );
}

// Workout session page wrapper
function WorkoutSessionPageWrapper() {
  const history = useHistory();
  const router = useIonRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: todayWorkout, refetch: refetchTodayWorkout } = useTodayWorkout();
  const currentPage = useCurrentNavPage();

  // Get workout name from todayWorkout or use default
  const workoutName = useMemo(() => {
    if (todayWorkout?.session?.id === parseInt(sessionId)) {
      return todayWorkout?.template?.name || 'Workout Session';
    }
    return 'Workout Session';
  }, [todayWorkout, sessionId]);

  const handleBack = () => {
    router.push('/', 'back', 'pop');
    refetchTodayWorkout();
  };

  const handleFinish = () => {
    router.push('/', 'back', 'pop');
    refetchTodayWorkout();
  };

  const handleViewExerciseDetail = (exerciseName: string) => {
    router.push(`/session/${sessionId}/exercise/${encodeURIComponent(exerciseName)}`, 'forward', 'push');
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <WorkoutSessionPage
        sessionId={parseInt(sessionId)}
        workoutName={workoutName}
        onBack={handleBack}
        onFinish={handleFinish}
        onViewExerciseDetail={handleViewExerciseDetail}
      />
    </AuthenticatedLayout>
  );
}

// Workout session exercise detail page wrapper
function WorkoutSessionExerciseDetailPageWrapper() {
  const history = useHistory();
  const { sessionId, exerciseName } = useParams<{ sessionId: string; exerciseName: string }>();
  const currentPage = useCurrentNavPage();

  const handleBack = () => {
    history.goBack();
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <ExerciseDetailPage 
        exerciseName={decodeURIComponent(exerciseName)} 
        onBack={handleBack} 
      />
    </AuthenticatedLayout>
  );
}

export function AppRoutes() {
  return (
    <IonApp>
      <IonReactRouter>
        <Switch>
          {/* Login route - public */}
          <Route exact path="/login">
            <LoginPage />
          </Route>

          {/* Profile page - migrated to router */}
          <Route exact path="/profile">
            <AuthGuard>
              <ProfilePageWrapper />
            </AuthGuard>
          </Route>

          {/* Plans routes - migrated to router */}
          <Route exact path="/plans">
            <AuthGuard>
              <PlansPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/plans/create">
            <AuthGuard>
              <CreatePlanPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/plans/:planId/edit">
            <AuthGuard>
              <EditPlanPageWrapper />
            </AuthGuard>
          </Route>

          {/* Workout routes - migrated to router */}
          <Route exact path="/workouts/create">
            <AuthGuard>
              <CreateWorkoutPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/workouts/:templateId/edit">
            <AuthGuard>
              <EditWorkoutPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/workouts/:templateId/exercises">
            <AuthGuard>
              <ManageExercisesPageWrapper />
            </AuthGuard>
          </Route>

          {/* Exercise routes - migrated to router */}
          <Route exact path="/exercises/pick">
            <AuthGuard>
              <ExercisePickerPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/exercises/:exerciseName">
            <AuthGuard>
              <ExerciseDetailPageWrapper />
            </AuthGuard>
          </Route>

          {/* Dashboard route - migrated to router */}
          <Route exact path="/">
            <AuthGuard>
              <DashboardPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/dashboard">
            <AuthGuard>
              <DashboardPageWrapper />
            </AuthGuard>
          </Route>

          {/* Workout session routes - migrated to router */}
          <Route exact path="/session/:sessionId">
            <AuthGuard>
              <WorkoutSessionPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/session/:sessionId/exercise/:exerciseName">
            <AuthGuard>
              <WorkoutSessionExerciseDetailPageWrapper />
            </AuthGuard>
          </Route>
        </Switch>
      </IonReactRouter>
    </IonApp>
  );
}
