import { useHistory, useParams } from 'react-router-dom';
import { ProgramDetailPage } from '../components/plans/ProgramDetailPage';

export default function ProgramDetailPageWrapper() {
  const history = useHistory();
  const { programId } = useParams<{ programId: string }>();

  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.replace('/plans?type=programs');
    }
  };

  const handleNavigateToWorkout = (templateId: number) => {
    history.push(`/workouts/${templateId}/exercises`);
  };

  return (
    <ProgramDetailPage
      programId={Number(programId)}
      onBack={handleBack}
      onNavigateToWorkout={handleNavigateToWorkout}
    />
  );
}
