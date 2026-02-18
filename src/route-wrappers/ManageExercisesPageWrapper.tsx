import { useHistory, useLocation, useParams } from 'react-router-dom';
import { EditWorkoutPage } from '../components/EditWorkoutPage';
import type { SwapExerciseContext } from '../utils/swapExercise';
import { useTemplate } from '../hooks/useApi';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Manage exercises page wrapper
export default function ManageExercisesPageWrapper() {
  const history = useHistory();
  const location = useLocation<{ templateId?: number; name?: string; description?: string; returnPath?: string }>();
  const { templateId } = useParams<{ templateId: string }>();
  const { data: template } = useTemplate(parseInt(templateId));
  const currentPage = useCurrentNavPage();

  // Get workout info from state or API
  const workoutFromState = location.state;
  const workoutName = workoutFromState?.name || template?.name || `Workout #${templateId}`;
  const workoutDescription = workoutFromState?.description || template?.description;

  const handleBack = () => {
    // Use returnPath from location state if provided, otherwise go back in history, fallback to /plans
    if (location.state?.returnPath) {
      history.push(location.state.returnPath);
    } else {
      // Try to go back, but if that fails or we're at the start, go to plans
      if (history.length > 1) {
        history.goBack();
      } else {
        history.push('/plans');
      }
    }
  };

  const handleAddExercise = () => {
    history.push(`/exercises/pick?mode=add&templateId=${templateId}`);
  };

  const handleSwapExercise = (context: SwapExerciseContext) => {
    history.push(`/exercises/pick?mode=swap&templateId=${templateId}`, {
      mode: 'swap',
      templateId: parseInt(templateId),
      swapPivotId: context.pivotId,
      swapOrderIndex: context.orderIndex,
      pivotData: {
        target_sets: context.target_sets,
        target_reps: context.target_reps,
        target_weight: context.target_weight
      }
    });
  };

  const handleViewExerciseDetail = (exerciseName: string) => {
    history.push(`/exercises/${encodeURIComponent(exerciseName)}?from=workout&templateId=${templateId}`);
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <EditWorkoutPage
        templateId={parseInt(templateId)}
        workoutName={workoutName}
        workoutDescription={workoutDescription}
        onBack={handleBack}
        onAddExercise={handleAddExercise}
        onSwapExercise={handleSwapExercise}
        onViewExerciseDetail={handleViewExerciseDetail}
      />
    </AuthenticatedLayout>
  );
}
