import { useHistory, useParams, useLocation } from 'react-router-dom';
import { BrowsableRoutineDetailPage } from '../components/plans/BrowsableRoutineDetailPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

export default function BrowsableRoutineDetailPageWrapper() {
  const history = useHistory();
  const { routineId } = useParams<{ routineId: string }>();
  const location = useLocation<{ from?: string }>();
  const currentPage = useCurrentNavPage();

  const handleBack = () => {
    history.push(location.state?.from ?? '/plans?type=customPlans');
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <BrowsableRoutineDetailPage
        routineId={Number(routineId)}
        onBack={handleBack}
      />
    </AuthenticatedLayout>
  );
}
