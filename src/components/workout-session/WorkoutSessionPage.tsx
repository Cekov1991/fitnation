import { WorkoutHeader } from './WorkoutHeader';
import { ExerciseNavTabs } from './ExerciseNavTabs';
import { ExerciseContent } from './ExerciseContent';
import { FinishWorkoutButton } from './FinishWorkoutButton';
import { WorkoutDialogs } from './WorkoutDialogs';
import { useWorkoutSessionState } from './hooks/useWorkoutSessionState';
import { getExerciseCompletionStatus } from './utils';

interface WorkoutSessionPageProps {
  sessionId: number;
  workoutName: string;
  onBack: () => void;
  onFinish: () => void;
  onViewExerciseDetail: (exerciseName: string) => void;
  initialExerciseName?: string | null;
}

export function WorkoutSessionPage({
  sessionId,
  onBack,
  onFinish,
  onViewExerciseDetail,
  initialExerciseName
}: WorkoutSessionPageProps) {
  const state = useWorkoutSessionState({
          sessionId,
    onBack,
    onFinish,
    onViewExerciseDetail,
    initialExerciseName
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

  return (
      <div 
        className="min-h-screen w-full pb-32"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <main className="relative z-10 max-w-md mx-auto">
          <WorkoutHeader
          formattedDuration={state.formattedDuration}
          onFinish={state.handleFinishWorkout}
          onCancel={state.handleCancelWorkoutClick}
          isCancelLoading={state.isCancelLoading}
          />

          <ExerciseNavTabs
          exercises={state.exercises}
          currentIndex={state.currentExerciseIndex}
          onSelectExercise={state.handleSwitchExercise}
            getCompletionStatus={getExerciseCompletionStatus}
          onAddExercise={state.handleAddExercise}
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
          isRestTimerActive={state.isRestTimerActive}
          restTimerSeconds={state.restTimerSeconds}
          setIsRestTimerActive={state.setIsRestTimerActive}
          onAddExercise={state.handleAddExercise}
          onOpenSetMenu={state.handleOpenSetMenu}
          onAddSet={state.handleAddSet}
          onLogSet={state.handleDidIt}
          onStartTimer={state.handleStartTimer}
          onSaveEdit={state.handleSaveEdit}
          onCancelEdit={state.handleCancelEdit}
          onViewExerciseDetail={onViewExerciseDetail}
          onOpenExerciseMenu={() => state.setShowExerciseMenu(true)}
          isAddSetLoading={false}
        />
      </main>

      <FinishWorkoutButton
        allExercisesCompleted={state.allExercisesCompleted}
        onFinish={state.handleFinishWorkout}
      />

      <WorkoutDialogs
        showExerciseMenu={state.showExerciseMenu}
        setShowExerciseMenu={state.setShowExerciseMenu}
        showSetMenu={state.showSetMenu}
        setShowSetMenu={state.setShowSetMenu}
        selectedSet={state.selectedSet}
        selectedSetId={state.selectedSetId}
        setSelectedSetId={state.setSelectedSetId}
        isSelectedSetLast={state.isSelectedSetLast}
        showExercisePicker={state.showExercisePicker}
        setShowExercisePicker={state.setShowExercisePicker}
        exercisePickerMode={state.exercisePickerMode}
        showCancelConfirm={state.showCancelConfirm}
        setShowCancelConfirm={state.setShowCancelConfirm}
        showFinishConfirm={state.showFinishConfirm}
        setShowFinishConfirm={state.setShowFinishConfirm}
        onViewExercise={state.handleViewExercise}
        onSwapExercise={state.handleSwapExercise}
        onRemoveExercise={state.handleRemoveExercise}
        onSelectExercise={state.handleSelectExercise}
        onEditSetFromMenu={state.handleEditSetFromMenu}
        onRemoveSetFromMenu={state.handleRemoveSetFromMenu}
        onCancelWorkoutConfirm={state.handleCancelWorkoutConfirm}
        onFinishWorkoutConfirm={state.handleFinishWorkoutConfirm}
        isSwapLoading={state.isAddExerciseLoading}
        isRemoveExerciseLoading={state.isRemoveExerciseLoading}
        isRemoveSetLoading={state.isRemoveSetLoading}
        isCancelLoading={state.isCancelLoading}
        isCompleteLoading={state.isCompleteLoading}
        isAddExerciseLoading={state.isAddExerciseLoading}
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
