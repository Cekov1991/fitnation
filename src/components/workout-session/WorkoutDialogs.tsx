import { ExercisePickerPage } from '../ExercisePickerPage';
import { ConfirmDialog } from '../ui';
import { ExerciseOptionsMenu } from './ExerciseOptionsMenu';
import { SetOptionsMenu } from './SetOptionsMenu';
import type { Set } from './types';

interface WorkoutDialogsProps {
  showExerciseMenu: boolean;
  setShowExerciseMenu: (v: boolean) => void;
  showSetMenu: boolean;
  setShowSetMenu: (v: boolean) => void;
  selectedSet: Set | null;
  selectedSetId: string | null;
  setSelectedSetId: (id: string | null) => void;
  isSelectedSetLast: boolean;
  showExercisePicker: boolean;
  setShowExercisePicker: (v: boolean) => void;
  exercisePickerMode: 'add' | 'swap';
  showCancelConfirm: boolean;
  setShowCancelConfirm: (v: boolean) => void;
  showFinishConfirm: boolean;
  setShowFinishConfirm: (v: boolean) => void;
  onViewExercise: () => void;
  onSwapExercise: () => void;
  onRemoveExercise: () => Promise<void>;
  onSelectExercise: (exercise: { id: number; name: string; restTime: string; muscleGroups: string[]; imageUrl: string }) => Promise<void>;
  onEditSetFromMenu: () => void;
  onRemoveSetFromMenu: () => void;
  onCancelWorkoutConfirm: () => Promise<void>;
  onFinishWorkoutConfirm: () => Promise<void>;
  isSwapLoading: boolean;
  isRemoveExerciseLoading: boolean;
  isRemoveSetLoading: boolean;
  isCancelLoading: boolean;
  isCompleteLoading: boolean;
  isAddExerciseLoading: boolean;
}

export function WorkoutDialogs({
  showExerciseMenu,
  setShowExerciseMenu,
  showSetMenu,
  setShowSetMenu,
  selectedSet,
  selectedSetId,
  setSelectedSetId,
  isSelectedSetLast,
  showExercisePicker,
  setShowExercisePicker,
  exercisePickerMode,
  showCancelConfirm,
  setShowCancelConfirm,
  showFinishConfirm,
  setShowFinishConfirm,
  onViewExercise,
  onSwapExercise,
  onRemoveExercise,
  onSelectExercise,
  onEditSetFromMenu,
  onRemoveSetFromMenu,
  onCancelWorkoutConfirm,
  onFinishWorkoutConfirm,
  isSwapLoading,
  isRemoveExerciseLoading,
  isRemoveSetLoading,
  isCancelLoading,
  isCompleteLoading,
  isAddExerciseLoading,
}: WorkoutDialogsProps) {
  return (
    <>
      {/* Menus */}
      <ExerciseOptionsMenu
        isOpen={showExerciseMenu}
        onClose={() => setShowExerciseMenu(false)}
        onViewExercise={onViewExercise}
        onSwapExercise={onSwapExercise}
        onRemoveExercise={onRemoveExercise}
        isSwapLoading={isSwapLoading}
        isRemoveLoading={isRemoveExerciseLoading}
      />

      <SetOptionsMenu
        isOpen={showSetMenu}
        selectedSet={selectedSet || null}
        onClose={() => {
          setShowSetMenu(false);
          setSelectedSetId(null);
        }}
        onEditSet={onEditSetFromMenu}
        onRemoveSet={onRemoveSetFromMenu}
        isRemoveLoading={isRemoveSetLoading}
        isLastSet={isSelectedSetLast}
      />

      {/* Exercise Picker */}
      {showExercisePicker && (
        <ExercisePickerPage
          mode={exercisePickerMode}
          onClose={() => setShowExercisePicker(false)}
          onSelectExercise={onSelectExercise}
          isLoading={isAddExerciseLoading}
        />
      )}

      {/* Cancel Workout Confirmation */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={onCancelWorkoutConfirm}
        title="Cancel Workout"
        message="Are you sure you want to cancel this workout? All progress will be lost."
        confirmText="Cancel Workout"
        variant="danger"
        isLoading={isCancelLoading}
      />

      {/* Finish Workout Confirmation */}
      <ConfirmDialog
        isOpen={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        onConfirm={onFinishWorkoutConfirm}
        title="Finish Workout"
        message="Great job! Ready to complete this workout and save your progress?"
        confirmText="Complete Workout"
        variant="success"
        isLoading={isCompleteLoading}
      />
    </>
  );
}
