import { useHistory, useLocation, useParams } from 'react-router-dom';
import { ExercisePickerPage } from '../components/ExercisePickerPage';
import {
  useAddSessionExercise,
  useSwapSessionExercise
} from '@fit-nation/shared';

interface LocationState {
  swapExerciseId?: number;
  initialMuscleGroupIds?: number[];
}

export default function WorkoutPreviewExercisePickerWrapper() {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const { sessionId } = useParams<{ sessionId: string }>();
  const addExercise = useAddSessionExercise();
  const swapExercise = useSwapSessionExercise();

  const searchParams = new URLSearchParams(location.search);
  const mode = (searchParams.get('mode') as 'add' | 'swap') || 'add';
  const sessionIdNum = sessionId ? Number(sessionId) : undefined;

  const state = location.state as LocationState | undefined;
  const swapExerciseId = state?.swapExerciseId;

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
        // PATCH .../exercises/{sessionExercise}/swap changes exercise_id on the
        // existing row and nothing else, so sets/reps and the row's position
        // survive by construction.
        //
        // This replaced a remove + add + refetch + reorder sequence that only
        // existed because POST .../exercises appends with default targets. That
        // sequence could leave the session mangled if any step after the delete
        // failed, and it re-sent a target_weight through the unit-conversion
        // boundary — pointless here, since a Session Target Weight is recomputed
        // on every read from the user's latest completed session rather than
        // taken from what we wrote.
        await swapExercise.mutateAsync({
          sessionId: sessionIdNum,
          exerciseId: swapExerciseId,
          data: { exercise_id: exercise.id }
        });
      }

      history.goBack();
    } catch (error) {
      console.error('Failed to add/swap exercise:', error);
    }
  };

  const isLoading = addExercise.isPending || swapExercise.isPending;

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
