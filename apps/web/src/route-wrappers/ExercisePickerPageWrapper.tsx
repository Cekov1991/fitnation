import { useHistory, useLocation } from 'react-router-dom';
import { ExercisePickerPage } from '../components/ExercisePickerPage';
import {
  useAddTemplateExercise,
  useSwapTemplateExercise
} from '@fit-nation/shared';

interface LocationState {
  mode?: 'add' | 'swap';
  templateId?: number;
  swapPivotId?: number;
  initialMuscleGroupIds?: number[];
}

// Exercise picker page wrapper
export default function ExercisePickerPageWrapper() {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const addTemplateExercise = useAddTemplateExercise();
  const swapTemplateExercise = useSwapTemplateExercise();

  const searchParams = new URLSearchParams(location.search);
  const mode = (searchParams.get('mode') as 'add' | 'swap') || 'add';
  const templateIdParam = searchParams.get('templateId');
  const templateId = templateIdParam ? parseInt(templateIdParam, 10) : undefined;

  const state = location.state as LocationState | undefined;
  const isSwap = mode === 'swap' && state?.swapPivotId != null;
  const swapPivotId = state?.swapPivotId;

  const handleClose = () => {
    // Go back so the picker is removed from history; pushing the workout URL
    // would leave the picker in the stack and make "Back" on the workout page reopen it.
    history.goBack();
  };

  const handleSelectExercise = async (exercise: { id: number; name: string }) => {
    if (!templateId) {
      history.goBack();
      return;
    }

    try {
      if (isSwap && swapPivotId != null) {
        // PATCH .../exercises/{pivot}/swap changes exercise_id on the existing
        // pivot row and touches nothing else, so sets/reps/target_weight and
        // the row's position are preserved by construction.
        //
        // This replaced a remove + add + refetch + update + reorder sequence,
        // which existed only because POST .../exercises ignores everything but
        // exercise_id and appends. That sequence had four failure points
        // between the delete and the restore — an error partway through lost
        // the user's pivot data outright — and it round-tripped target_weight
        // back through the unit-conversion boundary for a swap that never
        // needed to touch a weight at all.
        await swapTemplateExercise.mutateAsync({
          templateId,
          pivotId: swapPivotId,
          data: { exercise_id: exercise.id }
        });
      } else {
        // Add: append new exercise
        await addTemplateExercise.mutateAsync({
          templateId,
          data: { exercise_id: exercise.id }
        });
      }

      // Pop the picker so we're back on the existing workout entry; Back from workout then goes to Plans
      history.goBack();
    } catch (error) {
      console.error('Failed to add/swap exercise:', error);
    }
  };

  const isLoading = addTemplateExercise.isPending || swapTemplateExercise.isPending;

  return (
    <ExercisePickerPage
      mode={mode}
      onClose={handleClose}
      onSelectExercise={handleSelectExercise}
      isLoading={isLoading}
      initialMuscleGroupIds={mode === 'swap' ? state?.initialMuscleGroupIds : undefined}
    />
  );
}
