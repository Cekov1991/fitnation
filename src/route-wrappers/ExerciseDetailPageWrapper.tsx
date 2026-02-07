import { useHistory, useLocation, useParams } from 'react-router-dom';
import { ExerciseDetailPage } from '../components/ExerciseDetailPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Exercise detail page wrapper
export default function ExerciseDetailPageWrapper() {
  const history = useHistory();
  const location = useLocation<{ from?: string; sessionId?: string }>();
  const { exerciseName } = useParams<{ exerciseName: string }>();
  const currentPage = useCurrentNavPage();

  const handleBack = () => {
    const state = location.state;
    if (state?.from === 'preview' && state?.sessionId) {
      // Return to preview page
      history.push(`/generate-workout/preview/${state.sessionId}`);
    } else {
      history.goBack();
    }
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <ExerciseDetailPage 
        exerciseName={decodeURIComponent(exerciseName)} 
        onBack={handleBack} 
      />
    </AuthenticatedLayout>
  );
}
