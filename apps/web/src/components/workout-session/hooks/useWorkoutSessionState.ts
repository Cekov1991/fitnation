import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession, useLogSet, useUpdateSet, useCompleteSession, useCancelSession, useDeleteSet, useAddSessionExercise, useRemoveSessionExercise, useSwapSessionExercise, useUpdateSessionExercise, useWeightUnit, isProvisionalSetLogId, persistedSetLogId, removeSet, sessionTotals, type SessionTotals, type WeightUnit, queryKeys } from '@fit-nation/shared';
import { exercisesApi } from '@fit-nation/shared';
import { showToast } from '../../../lib/toast';
import { useWorkoutTimer } from './useWorkoutTimer';
import { useExerciseIndex } from './useExerciseIndex';
import type { SessionDialogs } from './useSessionDialogs';
import type { RestTimerHandle } from './useRestTimer';
import { mapSessionToExercises } from '../utils';
import type { Exercise, Set } from '../types';
import type { NewPrResource } from '@fit-nation/shared';

interface UseWorkoutSessionStateProps {
  sessionId: number;
  onBack: () => void;
  onFinish: () => void;
  onViewExerciseDetail: (
    exerciseName: string,
    options?: { initialActiveTab?: 'guidance' | 'performance' }
  ) => void;
  initialExerciseName?: string | null;
  /** The page owns the dialogs and the rest timer; the hook drives them. */
  dialogs: SessionDialogs;
  restTimer: RestTimerHandle;
}

interface UseWorkoutSessionStateReturn {
  // Core data
  exercises: Exercise[];
  currentExercise: Exercise | undefined;
  currentExerciseIndex: number;
  isLoading: boolean;
  formattedDuration: string;
  allExercisesCompleted: boolean;
  /** From the shared read model; the summary screen renders these. */
  sessionTotals: SessionTotals;
  weightUnit: WeightUnit;

  // Set logging
  currentSet: Set | undefined;
  completedSetsCount: number;
  editingWeight: number | null;
  editingReps: number | null;
  setEditingWeight: (w: number | null) => void;
  setEditingReps: (r: number | null) => void;
  handleDidIt: () => Promise<void>;
  handleStartTimer: () => void;
  isLoggingSet: boolean;

  // Set editing
  editingSetId: string | null;
  handleSaveEdit: () => Promise<void>;
  handleCancelEdit: () => void;

  // Exercise navigation
  handleSwitchExercise: (index: number) => void;

  // Set management
  handleAddSet: () => Promise<void>;
  handleEditSetFromMenu: () => void;
  handleRemoveSetFromMenu: () => void;

  // Exercise management
  handleSelectExercise: (exercise: { id: number; name: string; restTime: string; muscleGroups: string[]; imageUrl: string }) => Promise<void>;
  handleRemoveExercise: () => Promise<void>;
  handleViewExercise: () => void;
  swapMuscleGroupIds: number[];

  // Set menu context (the dialogs themselves live in useSessionDialogs)
  selectedSet: Set | null;
  canEditSet: boolean;
  canRemoveSet: boolean;

  // Session actions
  handleFinishWorkoutConfirm: () => Promise<void>;
  handleCancelWorkoutConfirm: () => Promise<void>;
  showSummary: boolean;
  handleSummaryDismiss: () => void;
  sessionNewPrs: NewPrResource[];

  // Loading states (for UI)
  isCancelLoading: boolean;
  isAddExerciseLoading: boolean;
  isSwapExerciseLoading: boolean;
  isRemoveExerciseLoading: boolean;
  isRemoveSetLoading: boolean;
  isCompleteLoading: boolean;
}

export function useWorkoutSessionState({
  sessionId,
  onBack,
  onFinish,
  onViewExerciseDetail,
  initialExerciseName,
  dialogs,
  restTimer
}: UseWorkoutSessionStateProps): UseWorkoutSessionStateReturn {
  const { data: sessionData, isLoading } = useSession(sessionId);
  const weightUnit = useWeightUnit();
  const queryClient = useQueryClient();
  const logSet = useLogSet();
  const updateSet = useUpdateSet();
  const completeSession = useCompleteSession();
  const cancelSession = useCancelSession();
  const deleteSet = useDeleteSet();
  const addSessionExercise = useAddSessionExercise();
  const removeSessionExercise = useRemoveSessionExercise();
  const updateSessionExercise = useUpdateSessionExercise();
  const swapSessionExercise = useSwapSessionExercise();

  const exercises = useMemo<Exercise[]>(() => mapSessionToExercises(sessionData), [sessionData]);
  
  // One owner for which exercise is on screen: the initial index, following adds and removals, the delayed advance.
  const exerciseIndex = useExerciseIndex(exercises, initialExerciseName);
  const currentExerciseIndex = exerciseIndex.index;

  // Prefetch exercise history for all exercises when session loads
  useEffect(() => {
    if (exercises.length > 0) {
      exercises.forEach((exercise) => {
        if (exercise.exerciseId) {
          queryClient.prefetchQuery({
            queryKey: queryKeys.exercises.history(exercise.exerciseId, { limit: 10 }),
            queryFn: async () => {
              const response = await exercisesApi.getExerciseHistory(exercise.exerciseId, { limit: 10 });
              return response.data;
            },
          });
        }
      });
    }
  }, [exercises, queryClient]);

  const [editingWeight, setEditingWeight] = useState<number | null>(null);
  const [editingReps, setEditingReps] = useState<number | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionNewPrs, setSessionNewPrs] = useState<NewPrResource[]>([]);
  
  // Stop timer when summary is shown or session is completed
  const { formattedDuration } = useWorkoutTimer(
    showSummary || sessionData?.completed_at ? undefined : sessionData?.performed_at
  );
  
  const currentExercise = exercises[currentExerciseIndex];
  const currentSet = currentExercise?.sets.find(s => !s.completed);
  const completedSetsCount = currentExercise?.sets.filter(s => s.completed).length || 0;
  const selectedSet = dialogs.selectedSetId && currentExercise
    ? (currentExercise.sets.find(s => s.id === dialogs.selectedSetId) ?? null)
    : null;
  // A set logged optimistically carries a negative id until the server replies.
  // Edit and remove both address the server by that id, so neither is offered
  // for the one request's worth of time in which the row is still provisional.
  const isSelectedSetProvisional = isProvisionalSetLogId(selectedSet?.setLogId);
  const canEditSet = selectedSet?.completed === true && !isSelectedSetProvisional;
  const canRemoveSet =
    selectedSet != null && (currentExercise?.sets.length ?? 0) > 1 && !isSelectedSetProvisional;
  const allExercisesCompleted = exercises.every(ex => ex.sets.every(s => s.completed));
  const totals = useMemo(() => sessionTotals(sessionData), [sessionData]);

  // Reset editing values when current set changes (use null to show placeholders)
  useEffect(() => {
    if (currentSet && !editingSetId) {
      setEditingWeight(null);
      setEditingReps(null);
    }
  }, [currentSet?.id, editingSetId, currentSet]);

  const handleDidIt = async () => {
    if (currentSet && currentExercise) {
      const setNumber = currentExercise.sets.findIndex(s => s.id === currentSet.id) + 1;
      // Use entered values, or fall back to defaults from currentSet
      const weightToLog = editingWeight ?? currentSet.weight;
      const repsToLog = editingReps ?? currentSet.reps;
      
      try {
        await logSet.mutateAsync({
          sessionId,
          data: {
            workout_session_exercise_id: currentExercise.sessionExerciseId,
            exercise_id: currentExercise.exerciseId,
            set_number: setNumber,
            weight: weightToLog,
            reps: repsToLog
          }
        });
        
        // Rest starts when a set is logged, as it does on mobile; before this the
        // only trigger on web was the manual button (docs/specs/0011 item 2).
        restTimer.start(currentExercise.restSeconds);
        // Auto-advance to next exercise if all sets completed
        if (completedSetsCount + 1 === currentExercise.sets.length && currentExerciseIndex < exercises.length - 1) {
          exerciseIndex.advanceSoon(currentExerciseIndex + 1);
        }
      } catch (error) {
        console.error('Failed to log set:', error);
        showToast("Couldn't save that set. Check your connection and try again.", 'error');
      }
    }
  };

  const handleStartTimer = () => {
    restTimer.start(currentExercise?.restSeconds);
  };

  const handleSaveEdit = async () => {
    if (editingSetId && editingWeight !== null && editingReps !== null && currentExercise) {
      const set = currentExercise.sets.find(s => s.id === editingSetId);
      const setLogId = persistedSetLogId(set?.setLogId);
      if (setLogId) {
        try {
          await updateSet.mutateAsync({
            sessionId,
            setLogId,
            data: {
              weight: editingWeight,
              reps: editingReps
            }
          });
          setEditingSetId(null);
        } catch (error) {
          console.error('Failed to update set:', error);
          showToast("Couldn't update the set.", 'error');
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingSetId(null);
    if (currentSet) {
      setEditingWeight(currentSet.weight);
      setEditingReps(currentSet.reps);
    }
  };

  const handleSwitchExercise = (index: number) => {
    exerciseIndex.select(index);
    setEditingSetId(null);
  };

  const handleFinish = async () => {
    try {
      const result = await completeSession.mutateAsync({
        sessionId,
        notes: undefined
      });
      setSessionNewPrs(result.new_prs ?? []);
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to complete session:', error);
      showToast("Couldn't finish the workout. Your sets are saved — try again.", 'error');
    }
  };

  const handleSummaryDismiss = () => {
    setShowSummary(false);
    onFinish();
  };

  const handleAddSet = async () => {
    if (!currentExercise) return;
    try {
      await updateSessionExercise.mutateAsync({
        sessionId,
        exerciseId: currentExercise.sessionExerciseId,
        data: { target_sets: currentExercise.targetSets + 1 }
      });
    } catch (error) {
      console.error('Failed to add set:', error);
      showToast("Couldn't change the number of sets.", 'error');
    }
  };

  const handleRemoveSet = async (setId: string) => {
    if (!currentExercise) return;
    
    const set = currentExercise.sets.find(s => s.id === setId);
    if (!set) return;

    // Check if it's the last set
    if (currentExercise.sets.length <= 1) {
      showToast('Remove the exercise instead of the last set.', 'error');
      return;
    }

    // One owner for the two writes and their compensation (0026 / 0006).
    const outcome = await removeSet(
      {
        deleteSet: vars => deleteSet.mutateAsync(vars),
        updateSessionExercise: vars => updateSessionExercise.mutateAsync(vars),
        resyncSession: id => queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) })
      },
      {
        sessionId,
        sessionExerciseId: currentExercise.sessionExerciseId,
        setLogId: set.completed ? persistedSetLogId(set.setLogId) : null,
        targetSets: currentExercise.targetSets
      }
    );
    // Closed either way: on failure the row count is simply unchanged, which the list shows.
    dialogs.closeSetMenu();
    if (!outcome.ok) {
      console.error('Failed to remove set:', outcome.error);
      showToast(
        outcome.failed === 'delete' ? "Couldn't remove that set." : "Couldn't change the number of sets.",
        'error'
      );
    }
  };

  const handleEditSetFromMenu = () => {
    if (selectedSet) {
      setEditingSetId(selectedSet.id);
      setEditingWeight(selectedSet.weight);
      setEditingReps(selectedSet.reps);
    }
    dialogs.closeSetMenu();
  };

  const handleRemoveSetFromMenu = () => {
    if (dialogs.selectedSetId) {
      handleRemoveSet(dialogs.selectedSetId);
    }
  };

  const handleSelectExercise = async (exercise: { id: number; name: string; restTime: string; muscleGroups: string[]; imageUrl: string }) => {
    if (dialogs.exercisePickerMode === 'add') {
      exerciseIndex.expectAddition(true);
      try {
        await addSessionExercise.mutateAsync({
          sessionId,
          data: {
            exercise_id: exercise.id,
            target_sets: 3,
            min_target_reps: 8,
            max_target_reps: 12,
            target_weight: 0
          }
        });
        dialogs.setShowExercisePicker(false);
      } catch (error) {
        console.error('Failed to add exercise:', error);
        showToast("Couldn't add that exercise.", 'error');
        exerciseIndex.expectAddition(false);
      }
    } else if (dialogs.exercisePickerMode === 'swap') {
      if (!currentExercise) return;
      // PATCH .../exercises/{sessionExercise}/swap changes exercise_id on the
      // existing row and nothing else, so logged sets, targets and the row's
      // position survive by construction — the index we are on stays valid.
      //
      // This replaced a remove + add + refetch + reorder sequence with no
      // rollback: a failure after the remove lost the exercise and its logged
      // sets outright (0014). Both picker wrappers made the same move earlier.
      try {
        await swapSessionExercise.mutateAsync({
          sessionId,
          exerciseId: currentExercise.sessionExerciseId,
          data: { exercise_id: exercise.id }
        });
        dialogs.setShowExercisePicker(false);
        dialogs.setShowExerciseMenu(false);
      } catch (error) {
        // The session is untouched on failure; the picker stays open for a retry.
        console.error('Failed to swap exercise:', error);
        showToast("Couldn't swap that exercise. Nothing was changed.", 'error');
      }
    }
  };

  const handleRemoveExercise = async () => {
    if (!currentExercise) return;
    
    if (exercises.length <= 1) {
      showToast('The workout needs at least one exercise.', 'error');
      return;
    }

    try {
      await removeSessionExercise.mutateAsync({
        sessionId,
        exerciseId: currentExercise.sessionExerciseId
      });
      dialogs.setShowExerciseMenu(false);
      // The index follows the list: useExerciseIndex clamps it once the exercise is gone.
    } catch (error) {
      console.error('Failed to remove exercise:', error);
      showToast("Couldn't remove that exercise.", 'error');
    }
  };

  const handleViewExercise = () => {
    dialogs.setShowExerciseMenu(false);
    onViewExerciseDetail(currentExercise.name);
  };

  const handleFinishWorkoutConfirm = async () => {
    dialogs.setShowFinishConfirm(false);
    await handleFinish();
  };

  const handleCancelWorkoutConfirm = async () => {
    try {
      await cancelSession.mutateAsync(sessionId);
      queryClient.setQueryData(queryKeys.sessions.today(), (old: any) => {
        if (!old) {
          return { template: null, session: null };
        }
        return {
          ...old,
          template: null,
          session: null,
        };
      });
      dialogs.setShowCancelConfirm(false);
      onBack();
    } catch (error) {
      console.error('Failed to cancel session:', error);
      showToast("Couldn't cancel the workout.", 'error');
    }
  };

  return {
    // Core data
    exercises,
    currentExercise,
    currentExerciseIndex,
    isLoading,
    formattedDuration,
    allExercisesCompleted,
    sessionTotals: totals,
    weightUnit,

    // Set logging
    currentSet,
    completedSetsCount,
    editingWeight,
    editingReps,
    setEditingWeight,
    setEditingReps,
    handleDidIt,
    handleStartTimer,
    isLoggingSet: logSet.isPending,

    // Set editing
    editingSetId,
    handleSaveEdit,
    handleCancelEdit,

    // Exercise navigation
    handleSwitchExercise,

    // Set management
    handleAddSet,
    handleEditSetFromMenu,
    handleRemoveSetFromMenu,

    // Exercise management
    handleSelectExercise,
    handleRemoveExercise,
    handleViewExercise,
    swapMuscleGroupIds: currentExercise?.primaryMuscleGroupIds ?? [],

    // Set menu context
    selectedSet,
    canEditSet,
    canRemoveSet,

    // Session actions
    handleFinishWorkoutConfirm,
    handleCancelWorkoutConfirm,
    showSummary,
    handleSummaryDismiss,
    sessionNewPrs,

    // Loading states
    isCancelLoading: cancelSession.isPending,
    isAddExerciseLoading: addSessionExercise.isPending,
    isSwapExerciseLoading: swapSessionExercise.isPending,
    isRemoveExerciseLoading: removeSessionExercise.isPending,
    isRemoveSetLoading: deleteSet.isPending || updateSessionExercise.isPending,
    isCompleteLoading: completeSession.isPending,
  };
}
