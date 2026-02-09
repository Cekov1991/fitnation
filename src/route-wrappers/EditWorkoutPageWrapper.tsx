import { useHistory, useLocation, useParams } from 'react-router-dom';
import { AddWorkoutPage } from '../components/AddWorkoutPage';
import { usePlans, useTemplate, useUpdateTemplate } from '../hooks/useApi';
import { dayNameToIndex, type DayName } from '../constants';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Edit workout page wrapper
export default function EditWorkoutPageWrapper() {
  const history = useHistory();
  const location = useLocation<{ templateId?: number; plan: string; name: string; description: string; daysOfWeek: string[] }>();
  const { templateId } = useParams<{ templateId: string }>();
  const { data: plans = [] } = usePlans();
  const { data: template } = useTemplate(parseInt(templateId));
  const updateTemplate = useUpdateTemplate();
  const currentPage = useCurrentNavPage();
  const templateIdNum = parseInt(templateId);

  // Get data from API (preferred) or route state as fallback while loading
  // Always prefer API data to ensure we have the latest values
  const workoutFromApi = template ? {
    templateId: template.id,
    plan: plans.find((p: { id: number }) => p.id === template.plan_id)?.name || '',
    name: template.name,
    description: template.description || '',
    daysOfWeek: template.day_of_week !== null ? [['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][template.day_of_week]] : []
  } : null;
  const workoutFromState = location.state;

  // Prefer API data (fresh) over route state (potentially stale)
  const initialData = workoutFromApi || workoutFromState;

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

  const handleSwap = async (data: { currentWorkoutDay: string; targetDay: string; targetWorkoutId: number }) => {
    const id = parseInt(templateId);
    if (!id) return;

    try {
      // Get the day indices
      const currentDayIndex = data.currentWorkoutDay 
        ? dayNameToIndex(data.currentWorkoutDay as DayName)
        : null;
      const targetDayIndex = dayNameToIndex(data.targetDay as DayName);

      // Find the target workout to get its name (required by backend)
      const targetWorkout = plans
        .flatMap((p: { workout_templates?: { id: number; name: string }[] }) => p.workout_templates || [])
        .find((t: { id: number }) => t.id === data.targetWorkoutId);
      
      if (!targetWorkout) {
        console.error('Target workout not found');
        return;
      }

      // Update the target workout to take the current workout's day (or unassign if no current day)
      await updateTemplate.mutateAsync({
        templateId: data.targetWorkoutId,
        data: {
          name: targetWorkout.name,
          day_of_week: currentDayIndex !== null && currentDayIndex !== -1 ? currentDayIndex : undefined
        }
      });

      // Update the current workout to take the target day
      await updateTemplate.mutateAsync({
        templateId: id,
        data: {
          name: initialData?.name || template?.name || '',
          day_of_week: targetDayIndex !== -1 ? targetDayIndex : undefined
        }
      });
    } catch (error) {
      console.error('Failed to swap workouts:', error);
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
      <AddWorkoutPage 
        mode="edit" 
        templateId={templateIdNum}
        initialData={initialData} 
        onBack={handleBack} 
        onSubmit={handleSubmit} 
        onSwap={handleSwap}
        isLoading={updateTemplate.isPending}
      />
    </AuthenticatedLayout>
  );
}
