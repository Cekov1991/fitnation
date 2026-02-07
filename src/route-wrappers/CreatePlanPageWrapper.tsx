import { useHistory } from 'react-router-dom';
import { CreatePlanPage } from '../components/CreatePlanPage';
import { useCreatePlan } from '../hooks/useApi';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Create plan page wrapper
export default function CreatePlanPageWrapper() {
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
      <CreatePlanPage mode="create" onBack={handleBack} onSubmit={handleSubmit} isLoading={createPlan.isPending} />
    </AuthenticatedLayout>
  );
}
