import { useHistory, useLocation, useParams } from 'react-router-dom';
import { ExerciseDetailPage } from '../components/ExerciseDetailPage';

// Exercise detail page wrapper
export default function ExerciseDetailPageWrapper() {
  const history = useHistory();
  const location = useLocation<{
    from?: string;
    sessionId?: string;
    initialActiveTab?: 'guidance' | 'performance';
  }>();
  const { exerciseName } = useParams<{ exerciseName: string }>();

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
    <ExerciseDetailPage
      exerciseName={decodeURIComponent(exerciseName)}
      onBack={handleBack}
      initialActiveTab={location.state?.initialActiveTab}
    />
  );
}
