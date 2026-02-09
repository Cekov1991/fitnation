import { useHistory, useParams } from 'react-router-dom';
import { ExerciseDetailPage } from '../components/ExerciseDetailPage';

// Workout session exercise detail page wrapper (no BottomNav for full-screen workout experience)
export default function WorkoutSessionExerciseDetailPageWrapper() {
  const history = useHistory();
  const { sessionId, exerciseName } = useParams<{ sessionId: string; exerciseName: string }>();

  const handleBack = () => {
    // Pass exercise name back via state to preserve active tab
    const decodedExerciseName = decodeURIComponent(exerciseName);
    history.push(`/session/${sessionId}`, {
      exerciseName: decodedExerciseName
    });
  };

  return (
    <div className="h-screen w-full overflow-y-auto">
      <ExerciseDetailPage 
        exerciseName={decodeURIComponent(exerciseName)} 
        onBack={handleBack} 
      />
    </div>
  );
}
