import { useMemo } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { WorkoutSessionPage } from '../components/workout-session';
import { useTodayWorkout } from '../hooks/useApi';

// Workout session page wrapper (no BottomNav for full-screen workout experience)
export default function WorkoutSessionPageWrapper() {
  const history = useHistory();
  const location = useLocation<{ exerciseName?: string }>();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: todayWorkout, refetch: refetchTodayWorkout } = useTodayWorkout();

  // Get workout name from todayWorkout or use default
  const workoutName = useMemo(() => {
    if (todayWorkout?.session?.id === parseInt(sessionId)) {
      return todayWorkout?.template?.name || 'Workout Session';
    }
    return 'Workout Session';
  }, [todayWorkout, sessionId]);

  // Get initial exercise name from location state (when returning from detail page)
  const initialExerciseName = location.state?.exerciseName;

  const handleBack = () => {
    history.push('/');
    refetchTodayWorkout();
  };

  const handleFinish = () => {
    history.push('/');
    refetchTodayWorkout();
  };

  const handleViewExerciseDetail = (exerciseName: string) => {
    // Pass exercise name via route state to preserve active tab on back navigation
    history.push(`/session/${sessionId}/exercise/${encodeURIComponent(exerciseName)}`, {
      exerciseName
    });
  };

  return (
    <div className="h-screen w-full overflow-y-auto">
      <WorkoutSessionPage
        sessionId={parseInt(sessionId)}
        workoutName={workoutName}
        onBack={handleBack}
        onFinish={handleFinish}
        onViewExerciseDetail={handleViewExerciseDetail}
        initialExerciseName={initialExerciseName}
      />
    </div>
  );
}
