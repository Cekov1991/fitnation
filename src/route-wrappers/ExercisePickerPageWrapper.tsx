import { useHistory, useLocation } from 'react-router-dom';
import { ExercisePickerPage } from '../components/ExercisePickerPage';
import { useAddTemplateExercise } from '../hooks/useApi';

// Exercise picker page wrapper
export default function ExercisePickerPageWrapper() {
  const history = useHistory();
  const location = useLocation();
  const addTemplateExercise = useAddTemplateExercise();
  
  // Get mode and templateId from query params
  const searchParams = new URLSearchParams(location.search);
  const mode = (searchParams.get('mode') as 'add' | 'swap') || 'add';
  const templateId = searchParams.get('templateId');

  const handleClose = () => {
    // Navigate back to the workout edit page if we have a templateId, otherwise just go back
    if (templateId) {
      history.push(`/workouts/${templateId}/exercises`);
    } else {
      history.goBack();
    }
  };

  const handleSelectExercise = async (exercise: { id: number; name: string }) => {
    if (templateId) {
      try {
        await addTemplateExercise.mutateAsync({
          templateId: parseInt(templateId),
          data: { exercise_id: exercise.id }
        });
        // Navigate back to the workout edit page after successfully adding exercise
        history.push(`/workouts/${templateId}/exercises`);
      } catch (error) {
        console.error('Failed to add exercise:', error);
      }
    } else {
      history.goBack();
    }
  };

  return (
    <ExercisePickerPage
      mode={mode}
      onClose={handleClose}
      onSelectExercise={handleSelectExercise}
      isLoading={addTemplateExercise.isPending}
    />
  );
}
