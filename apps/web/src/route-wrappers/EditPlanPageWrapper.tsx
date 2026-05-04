import { useHistory, useLocation, useParams } from 'react-router-dom';
import { CreatePlanPage } from '../components/CreatePlanPage';
import { usePlans, useUpdatePlan } from '@fit-nation/shared';

// Edit plan page wrapper
export default function EditPlanPageWrapper() {
  const history = useHistory();
  const location = useLocation<{ id: number; name: string; description: string; isActive: boolean }>();
  const { planId } = useParams<{ planId: string }>();
  const { data: plans = [] } = usePlans();
  const updatePlan = useUpdatePlan();

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
      history.push('/plans?type=customPlans');
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  if (!initialData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: 'var(--color-text-secondary)' }}>Loading plan...</div>
      </div>
    );
  }

  return (
    <CreatePlanPage mode="edit" initialData={initialData} onBack={handleBack} onSubmit={handleSubmit} isLoading={updatePlan.isPending} />
  );
}
