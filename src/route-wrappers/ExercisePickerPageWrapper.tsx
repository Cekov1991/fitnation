import { useHistory, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ExercisePickerPage } from '../components/ExercisePickerPage';
import {
  useAddTemplateExercise,
  useRemoveTemplateExercise,
  useReorderTemplateExercises
} from '../hooks/useApi';
import type { WorkoutTemplateResource } from '../types/api';

interface LocationState {
  mode?: 'add' | 'swap';
  templateId?: number;
  swapPivotId?: number;
  swapOrderIndex?: number;
  pivotData?: { target_sets?: number; target_reps?: number; target_weight?: number };
}

// Exercise picker page wrapper
export default function ExercisePickerPageWrapper() {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const queryClient = useQueryClient();
  const addTemplateExercise = useAddTemplateExercise();
  const removeTemplateExercise = useRemoveTemplateExercise();
  const reorderExercises = useReorderTemplateExercises();

  const searchParams = new URLSearchParams(location.search);
  const mode = (searchParams.get('mode') as 'add' | 'swap') || 'add';
  const templateIdParam = searchParams.get('templateId');
  const templateId = templateIdParam ? parseInt(templateIdParam, 10) : undefined;

  const state = location.state as LocationState | undefined;
  const isSwap = mode === 'swap' && state?.swapPivotId != null && state?.swapOrderIndex != null;
  const swapPivotId = state?.swapPivotId;
  const swapOrderIndex = state?.swapOrderIndex ?? 0;
  const pivotData = state?.pivotData;

  const handleClose = () => {
    if (templateId) {
      history.push(`/workouts/${templateId}/exercises`);
    } else {
      history.goBack();
    }
  };

  const handleSelectExercise = async (exercise: { id: number; name: string }) => {
    if (!templateId) {
      history.goBack();
      return;
    }

    try {
      if (isSwap && swapPivotId != null) {
        // Swap: remove old, add new with same pivot data, then reorder to preserve position
        await removeTemplateExercise.mutateAsync({
          templateId,
          pivotId: swapPivotId
        });

        await addTemplateExercise.mutateAsync({
          templateId,
          data: {
            exercise_id: exercise.id,
            target_sets: pivotData?.target_sets ?? 3,
            target_reps: pivotData?.target_reps ?? 10,
            target_weight: pivotData?.target_weight ?? 0
          }
        });

        // Refetch template to get the new pivot id, then reorder so new exercise is at swapOrderIndex
        await queryClient.refetchQueries({ queryKey: ['templates', templateId] });
        const template = queryClient.getQueryData<WorkoutTemplateResource>(['templates', templateId]);

        const exercises = template?.exercises ?? [];
        const newExerciseEntry = exercises.find((ex: { id: number }) => ex.id === exercise.id);
        const newPivotId = newExerciseEntry?.pivot?.id;

        if (newPivotId != null && exercises.length > 0) {
          const currentOrder = exercises.map((ex: { pivot: { id: number } }) => ex.pivot.id);
          const newOrder = [...currentOrder];
          const fromIndex = newOrder.indexOf(newPivotId);
          if (fromIndex !== -1 && fromIndex !== swapOrderIndex) {
            newOrder.splice(fromIndex, 1);
            newOrder.splice(swapOrderIndex, 0, newPivotId);
            await reorderExercises.mutateAsync({
              templateId,
              order: newOrder
            });
          }
        }
      } else {
        // Add: append new exercise
        await addTemplateExercise.mutateAsync({
          templateId,
          data: { exercise_id: exercise.id }
        });
      }

      history.push(`/workouts/${templateId}/exercises`);
    } catch (error) {
      console.error('Failed to add/swap exercise:', error);
    }
  };

  const isLoading =
    addTemplateExercise.isPending ||
    removeTemplateExercise.isPending ||
    reorderExercises.isPending;

  return (
    <ExercisePickerPage
      mode={mode}
      onClose={handleClose}
      onSelectExercise={handleSelectExercise}
      isLoading={isLoading}
    />
  );
}
