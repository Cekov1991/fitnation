import { useHistory, useLocation } from 'react-router-dom';
import { AddWorkoutPage } from '../components/AddWorkoutPage';
import { usePlans, useCreateTemplate } from '../hooks/useApi';
import { dayNameToIndex, type DayName } from '../constants';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Create workout page wrapper
export default function CreateWorkoutPageWrapper() {
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
      <AddWorkoutPage mode="create" planName={planName} onBack={handleBack} onSubmit={handleSubmit} isLoading={createTemplate.isPending} />
    </AuthenticatedLayout>
  );
}
