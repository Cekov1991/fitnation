import { useHistory, useParams } from 'react-router-dom';
import { BrowsableRoutineDetailPage } from '../components/plans/BrowsableRoutineDetailPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

export default function BrowsableRoutineDetailPageWrapper() {
  const history = useHistory();
  const { routineId } = useParams<{ routineId: string }>();
  const currentPage = useCurrentNavPage();

  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.replace('/plans?type=customPlans');
    }
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
