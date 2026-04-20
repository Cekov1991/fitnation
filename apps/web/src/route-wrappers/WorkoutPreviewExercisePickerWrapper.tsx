import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ExercisePickerPage } from '../components/ExercisePickerPage';
import {
  useAddSessionExercise,
  useRemoveSessionExercise,
  useReorderSessionExercises
} from '../hooks/useApi';

interface LocationState {
  swapExerciseId?: number;
  swapOrderIndex?: number;
  pivotData?: { target_sets?: number; min_target_reps?: number; max_target_reps?: number; target_weight?: number };
  initialMuscleGroupIds?: number[];
}

export default function WorkoutPreviewExercisePickerWrapper() {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();
  const addExercise = useAddSessionExercise();
  const removeExercise = useRemoveSessionExercise();
  const reorderSessionExercises = useReorderSessionExercises();

  const searchParams = new URLSearchParams(location.search);
  const mode = (searchParams.get('mode') as 'add' | 'swap') || 'add';
  const sessionIdNum = sessionId ? Number(sessionId) : undefined;

  const state = location.state as LocationState | undefined;
  const swapExerciseId = state?.swapExerciseId;
  const swapOrderIndex = state?.swapOrderIndex ?? -1;
  const pivotData = state?.pivotData;

  const isSwap = mode === 'swap' && swapExerciseId != null;

  const handleClose = () => {
    history.goBack();
  };

  const handleSelectExercise = async (exercise: {
    id: number;
    name: string;
    restTime: string;
    muscleGroups: string[];
    imageUrl: string;
  }) => {
    if (!sessionIdNum) {
      history.goBack();
      return;
    }

    try {
      if (mode === 'add') {
        await addExercise.mutateAsync({
          sessionId: sessionIdNum,
          data: {
            exercise_id: exercise.id,
            target_sets: 3,
            min_target_reps: 8,
            max_target_reps: 12,
            target_weight: 0
          }
        });
      } else if (isSwap && swapExerciseId != null) {
        await removeExercise.mutateAsync({
          sessionId: sessionIdNum,
          exerciseId: swapExerciseId
        });
        await addExercise.mutateAsync({
          sessionId: sessionIdNum,
          data: {
            exercise_id: exercise.id,
            order: swapOrderIndex >= 0 ? swapOrderIndex : undefined,
            target_sets: pivotData?.target_sets ?? 3,
            min_target_reps: pivotData?.min_target_reps ?? 8,
            max_target_reps: pivotData?.max_target_reps ?? 12,
            target_weight: pivotData?.target_weight ?? 0
          }
        });

        if (swapOrderIndex >= 0) {
          await queryClient.refetchQueries({ queryKey: ['sessions', sessionIdNum] });
          const session = queryClient.getQueryData<{
            exercises?: Array<{ session_exercise: { id: number; exercise_id: number } }>;
          }>(['sessions', sessionIdNum]);
          const sessionExercises = session?.exercises ?? [];
          const newEntry = sessionExercises.find(
            (ex) => ex.session_exercise.exercise_id === exercise.id
          );
          const newSessionExerciseId = newEntry?.session_exercise.id;
          const currentOrder = sessionExercises.map((ex) => ex.session_exercise.id);

          if (newSessionExerciseId != null && currentOrder.length > 1) {
            const newIndex = currentOrder.indexOf(newSessionExerciseId);
            if (newIndex !== -1 && newIndex !== swapOrderIndex) {
              const reorderIds = [...currentOrder];
              reorderIds.splice(newIndex, 1);
              reorderIds.splice(swapOrderIndex, 0, newSessionExerciseId);
              await reorderSessionExercises.mutateAsync({
                sessionId: sessionIdNum,
                exerciseIds: reorderIds
              });
            }
          }
        }
      }

      history.goBack();
    } catch (error) {
      console.error('Failed to add/swap exercise:', error);
    }
  };

  const isLoading =
    addExercise.isPending || removeExercise.isPending || reorderSessionExercises.isPending;

  return (
    <div className="h-screen w-full overflow-y-auto">
      <ExercisePickerPage
        mode={mode}
        onClose={handleClose}
        onSelectExercise={handleSelectExercise}
        isLoading={isLoading}
        initialMuscleGroupIds={mode === 'swap' ? state?.initialMuscleGroupIds : undefined}
      />
    </div>
  );
}
