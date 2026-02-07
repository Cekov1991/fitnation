import { useHistory } from 'react-router-dom';
import { PlansPage } from '../components/PlansPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Plans page wrapper with router-based navigation
export default function PlansPageWrapper() {
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
