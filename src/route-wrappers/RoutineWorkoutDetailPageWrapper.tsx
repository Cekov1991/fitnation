import { useHistory, useParams, useLocation } from 'react-router-dom';
import { RoutineWorkoutDetailPage } from '../components/plans/RoutineWorkoutDetailPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

export default function RoutineWorkoutDetailPageWrapper() {
  const history = useHistory();
  const { routineId, workoutId } = useParams<{ routineId: string; workoutId: string }>();
  const location = useLocation<{ from?: string }>();
  const currentPage = useCurrentNavPage();

  const handleBack = () => {
    history.push(location.state?.from ?? `/routines/${routineId}`);
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <RoutineWorkoutDetailPage
        routineId={Number(routineId)}
        workoutId={Number(workoutId)}
        onBack={handleBack}
      />
    </AuthenticatedLayout>
  );
}
