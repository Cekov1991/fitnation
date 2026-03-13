import { useHistory, useParams, useLocation } from 'react-router-dom';
import { ProgramDetailPage } from '../components/plans/ProgramDetailPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

export default function ProgramDetailPageWrapper() {
  const history = useHistory();
  const { programId } = useParams<{ programId: string }>();
  const location = useLocation<{ from?: string }>();
  const currentPage = useCurrentNavPage();

  const handleBack = () => {
    history.push(location.state?.from ?? '/plans?type=programs');
  };

  const handleNavigateToWorkout = (templateId: number) => {
    history.push(`/workouts/${templateId}/exercises`);
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <ProgramDetailPage
        programId={Number(programId)}
        onBack={handleBack}
        onNavigateToWorkout={handleNavigateToWorkout}
      />
    </AuthenticatedLayout>
  );
}
