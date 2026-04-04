import { useHistory, useParams } from 'react-router-dom';
import { BrowsableRoutineDetailPage } from '../components/plans/BrowsableRoutineDetailPage';

export default function BrowsableRoutineDetailPageWrapper() {
  const history = useHistory();
  const { routineId } = useParams<{ routineId: string }>();

  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.replace('/plans?type=customPlans');
    }
  };

  return (
    <BrowsableRoutineDetailPage
      routineId={Number(routineId)}
      onBack={handleBack}
    />
  );
}
