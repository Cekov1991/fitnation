import { WorkoutHeader } from './WorkoutHeader';
import { ExerciseNavTabs } from './ExerciseNavTabs';
import { ExerciseContent } from './ExerciseContent';
import { FinishWorkoutButton } from './FinishWorkoutButton';
import { WorkoutSummaryScreen } from './WorkoutSummaryScreen';
import { ExerciseOptionsMenu } from './ExerciseOptionsMenu';
import { SetOptionsMenu } from './SetOptionsMenu';
import { ExercisePickerPage } from '../ExercisePickerPage';
import { ConfirmDialog } from '../ui';
import { useWorkoutSessionState } from './hooks/useWorkoutSessionState';
import { useSessionDialogs } from './hooks/useSessionDialogs';
import { useRestTimer } from './hooks/useRestTimer';
import { getExerciseCompletionStatus } from './utils';
import { showToast } from '../../lib/toast';

interface WorkoutSessionPageProps {
  sessionId: number;
  workoutName: string;
  onBack: () => void;
  onFinish: () => void;
  onViewExerciseDetail: (
    exerciseName: string,
    options?: { initialActiveTab?: 'guidance' | 'performance' }
  ) => void;
  initialExerciseName?: string | null;
}

/**
 * The session screen composes three owners (0030): the dialogs' open state,
 * the rest timer, and the session state that drives them. Each child gets what
 * it renders and nothing else — the 32-prop pass-through is gone.
 */
export function WorkoutSessionPage({
  sessionId,
  onBack,
  onFinish,
  onViewExerciseDetail,
  initialExerciseName
}: WorkoutSessionPageProps) {
  const dialogs = useSessionDialogs();
  const restTimer = useRestTimer({
    onComplete: () => {
      // Something fires when the rest runs out; there was nothing before.
      showToast('Rest over — next set.', 'info');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(200);
    }
  });
  const state = useWorkoutSessionState({
    sessionId,
    onBack,
    onFinish,
    onViewExerciseDetail,
    initialExerciseName,
    dialogs,
    restTimer
  });

  if (state.isLoading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading session...</div>
      </div>
    );
  }

  if (state.showSummary) {
    return (
      <WorkoutSummaryScreen
        exercises={state.exercises}
        totals={state.sessionTotals}
        formattedDuration={state.formattedDuration}
        onDone={state.handleSummaryDismiss}
        newPrs={state.sessionNewPrs}
        weightUnit={state.weightUnit}
      />
    );
  }

  return (
    <div
      className="min-h-screen w-full pb-32"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <main className="relative z-10 max-w-md mx-auto">
        <WorkoutHeader
          formattedDuration={state.formattedDuration}
          onFinish={() => dialogs.setShowFinishConfirm(true)}
          onCancel={() => dialogs.setShowCancelConfirm(true)}
          isCancelLoading={state.isCancelLoading}
        />

        <ExerciseNavTabs
          exercises={state.exercises}
          currentIndex={state.currentExerciseIndex}
          onSelectExercise={state.handleSwitchExercise}
          getCompletionStatus={getExerciseCompletionStatus}
          onAddExercise={() => dialogs.openExercisePicker('add')}
        />

        <ExerciseContent
          exercises={state.exercises}
          currentExercise={state.currentExercise}
          currentSet={state.currentSet}
          editingSetId={state.editingSetId}
          editingWeight={state.editingWeight}
          editingReps={state.editingReps}
          setEditingWeight={state.setEditingWeight}
          setEditingReps={state.setEditingReps}
          restTimer={restTimer}
          onAddExercise={() => dialogs.openExercisePicker('add')}
          onOpenSetMenu={dialogs.openSetMenu}
          onAddSet={state.handleAddSet}
          onLogSet={state.handleDidIt}
          onStartTimer={state.handleStartTimer}
          onSaveEdit={state.handleSaveEdit}
          onCancelEdit={state.handleCancelEdit}
          onViewExerciseDetail={onViewExerciseDetail}
          onOpenExerciseMenu={() => dialogs.setShowExerciseMenu(true)}
          isAddSetLoading={false}
          isLogSetLoading={state.isLoggingSet}
          weightUnit={state.weightUnit}
        />
      </main>

      <FinishWorkoutButton
        allExercisesCompleted={state.allExercisesCompleted}
        onFinish={() => dialogs.setShowFinishConfirm(true)}
      />

      <ExerciseOptionsMenu
        isOpen={dialogs.showExerciseMenu}
        onClose={() => dialogs.setShowExerciseMenu(false)}
        onViewExercise={state.handleViewExercise}
        onSwapExercise={() => dialogs.openExercisePicker('swap')}
        onRemoveExercise={state.handleRemoveExercise}
        isSwapLoading={state.isSwapExerciseLoading}
        isRemoveLoading={state.isRemoveExerciseLoading}
      />

      <SetOptionsMenu
        isOpen={dialogs.showSetMenu}
        selectedSet={state.selectedSet}
        onClose={dialogs.closeSetMenu}
        onEditSet={state.handleEditSetFromMenu}
        onRemoveSet={state.handleRemoveSetFromMenu}
        isRemoveLoading={state.isRemoveSetLoading}
        canEditSet={state.canEditSet}
        canRemoveSet={state.canRemoveSet}
      />

      {dialogs.showExercisePicker && (
        <ExercisePickerPage
          mode={dialogs.exercisePickerMode}
          onClose={() => dialogs.setShowExercisePicker(false)}
          onSelectExercise={state.handleSelectExercise}
          isLoading={state.isAddExerciseLoading || state.isSwapExerciseLoading}
          initialMuscleGroupIds={dialogs.exercisePickerMode === 'swap' ? state.swapMuscleGroupIds : undefined}
        />
      )}

      <ConfirmDialog
        isOpen={dialogs.showCancelConfirm}
        onClose={() => dialogs.setShowCancelConfirm(false)}
        onConfirm={state.handleCancelWorkoutConfirm}
        title="Cancel Workout"
        message="Are you sure you want to cancel this workout? All progress will be lost."
        confirmText="Cancel Workout"
        variant="danger"
        isLoading={state.isCancelLoading}
      />

      <ConfirmDialog
        isOpen={dialogs.showFinishConfirm}
        onClose={() => dialogs.setShowFinishConfirm(false)}
        onConfirm={state.handleFinishWorkoutConfirm}
        title="Finish Workout"
        message="Great job! Ready to complete this workout and save your progress?"
        confirmText="Complete Workout"
        variant="success"
        isLoading={state.isCompleteLoading}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
